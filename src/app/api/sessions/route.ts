import { Prisma, SessionStatus, SessionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/Backend/auth";
import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { bookingLimiter, generalLimiter } from "@/Backend/lib/ratelimit";
import { db } from "@/Backend/server/db";
import {
  createSessionBooking,
  sessionListInclude,
} from "@/Backend/server/sessions";
import { createSessionSchema } from "@/Backend/validations/session";

const listSessionsQuerySchema = z.object({
  status: z.nativeEnum(SessionStatus).optional(),
  type: z.nativeEnum(SessionType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10).default(10),
});

export const GET = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();

  const denied = await applyRateLimit(generalLimiter, getRateLimitId(request, session?.user?.id));
  if (denied) return denied;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  if (session.user.role !== "STUDENT" && session.user.role !== "MENTOR") {
    return NextResponse.json({ error: "Only students and mentors can access sessions" }, { status: 403 });
  }

  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsedQuery = listSessionsQuerySchema.safeParse(query);

  if (!parsedQuery.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        issues: parsedQuery.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { status, type, page, limit } = parsedQuery.data;
  const where: Prisma.SessionWhereInput = {
    ...(status ? { status } : {}),
    ...(type ? { type } : {}),
    ...(session.user.role === "STUDENT"
      ? { studentId: session.user.id }
      : { mentorId: session.user.id }),
  };

  const [total, sessions] = await Promise.all([
    db.session.count({ where }),
    db.session.findMany({
      where,
      include: sessionListInclude,
      orderBy: {
        scheduledAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    data: sessions,
    page,
    pageSize: limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}, "/api/sessions");

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();

  const denied = await applyRateLimit(bookingLimiter, getRateLimitId(request, session?.user?.id));
  if (denied) return denied;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can book sessions" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsedBody = createSessionSchema.safeParse(payload);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid session payload",
        issues: parsedBody.error.flatten(),
      },
      { status: 400 },
    );
  }

  const result = await createSessionBooking({
    studentId: session.user.id,
    input: parsedBody.data,
  });

  return NextResponse.json(
    result.requiresPayment
      ? {
          sessionId: result.session.id,
          requiresPayment: true,
          payment: result.paymentOrder,
          session: result.session,
        }
      : {
          confirmed: true,
          session: result.session,
        },
    { status: 201 },
  );
}, "/api/sessions");

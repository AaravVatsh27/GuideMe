import { Prisma, SessionStatus, SessionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { bookingLimiter, generalLimiter } from "@/Backend/lib/ratelimit";
import { db } from "@/Backend/server/db";
import {
  createSessionBooking,
  sessionListInclude,
  toSessionListView,
  toSessionView,
} from "@/Backend/server/sessions";
import { createSessionSchema } from "@/Backend/validations/session";
import { defineRoute } from "@/Backend/lib/define-route";

const listSessionsQuerySchema = z.object({
  status: z.enum(SessionStatus).optional(),
  type: z.enum(SessionType).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(10).default(10),
});

export const GET = defineRoute(
  { roles: ["STUDENT", "MENTOR"], forbiddenMessage: "Only students and mentors can access sessions", rateLimit: generalLimiter },
  async (request: Request, _context, { session }) => {
  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsedQuery = listSessionsQuerySchema.safeParse(query);

  if (!parsedQuery.success) {
    return apiErrorResponse("Invalid query parameters", 400, z.flattenError(parsedQuery.error));
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
    data: sessions.map((record) => toSessionListView(record, session.user.id)),
    page,
    pageSize: limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}, "/api/sessions");

export const POST = defineRoute(
  { roles: ["STUDENT"], forbiddenMessage: "Only students can book sessions", rateLimit: bookingLimiter },
  async (request: Request, _context, { session }) => {
  const payload = await request.json().catch(() => null);
  const parsedBody = createSessionSchema.safeParse(payload);

  if (!parsedBody.success) {
    return apiErrorResponse("Invalid session payload", 400, z.flattenError(parsedBody.error));
  }

  const result = await createSessionBooking({
    studentId: session.user.id,
    input: parsedBody.data,
  });
  const sessionView = toSessionView(result.session, session.user.id);

  return NextResponse.json(
    result.requiresPayment
      ? {
          sessionId: result.session.id,
          requiresPayment: true,
          payment: result.paymentOrder,
          session: sessionView,
        }
      : {
          confirmed: true,
          session: sessionView,
        },
    { status: 201 },
  );
}, "/api/sessions");

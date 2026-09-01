import { PayoutStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/Backend/auth";
import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { generalLimiter } from "@/Backend/lib/ratelimit";
import { db } from "@/Backend/server/db";

const listPayoutsQuerySchema = z.object({
  status: z.nativeEnum(PayoutStatus).optional(),
  mentorId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();

  const denied = await applyRateLimit(generalLimiter, getRateLimitId(request, session?.user?.id));
  if (denied) return denied;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  if (session.user.role !== "MENTOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Only mentors and admins can view payouts" }, { status: 403 });
  }

  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = listPayoutsQuerySchema.safeParse(query);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { status, mentorId, sessionId, page, limit } = parsed.data;

  const where: Prisma.PayoutWhereInput = {
    ...(status ? { status } : {}),
    ...(session.user.role === "ADMIN" && mentorId ? { mentorId } : {}),
    ...(session.user.role === "ADMIN" && sessionId ? { sessionId } : {}),
    ...(session.user.role === "MENTOR" ? { mentorId: session.user.id } : {}),
  };

  const [total, payouts] = await Promise.all([
    db.payout.count({ where }),
    db.payout.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        mentor: { select: { id: true, name: true, email: true } },
        session: {
          select: {
            id: true,
            type: true,
            scheduledAt: true,
            durationMinutes: true,
            price: true,
            student: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    data: payouts,
    page,
    pageSize: limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
}, "/api/payouts");

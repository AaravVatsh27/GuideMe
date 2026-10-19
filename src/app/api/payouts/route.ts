import { PayoutStatus, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { generalLimiter } from "@/Backend/lib/ratelimit";
import { db } from "@/Backend/server/db";
import { defineRoute } from "@/Backend/lib/define-route";

const listPayoutsQuerySchema = z.object({
  status: z.enum(PayoutStatus).optional(),
  mentorId: z.uuid().optional(),
  sessionId: z.uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const GET = defineRoute(
  { roles: ["MENTOR", "ADMIN"], forbiddenMessage: "Only mentors and admins can view payouts", rateLimit: generalLimiter },
  async (request: Request, _context, { session }) => {
  const query = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = listPayoutsQuerySchema.safeParse(query);

  if (!parsed.success) {
    return apiErrorResponse("Invalid query parameters", 400, z.flattenError(parsed.error));
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
            pricePaise: true,
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

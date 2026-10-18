import { PayoutStatus, SessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { log } from "@/Backend/lib/logger";
import { generalLimiter } from "@/Backend/lib/ratelimit";
import { extractRequestIp } from "@/Backend/server/admin";
import { db } from "@/Backend/server/db";
import { sendPayoutConfirmation } from "@/Backend/server/resend";
import { defineRoute } from "@/Backend/lib/define-route";

const processPayoutsSchema = z.object({
  payoutIds: z.array(z.string().uuid()).min(1).max(50),
  transactionId: z.string().trim().min(3).max(100),
  upiId: z.string().trim().min(5).max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const POST = defineRoute(
  { roles: ["ADMIN"], forbiddenMessage: "Admin access required", rateLimit: generalLimiter },
  async (request: Request, _context, { session, metadata }) => {
  const payload = await request.json().catch(() => null);
  const parsed = processPayoutsSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Invalid payload", 400, parsed.error.flatten());
  }

  const { payoutIds, transactionId, upiId, notes } = parsed.data;
  const now = new Date();
  const ipAddress = extractRequestIp(request);

  // Only pay out pending payouts for sessions that actually took place
  const payouts = await db.payout.findMany({
    where: {
      id: { in: payoutIds },
      status: PayoutStatus.PENDING,
      session: { status: SessionStatus.COMPLETED },
    },
    include: {
      mentor: { select: { id: true, name: true, email: true } },
      session: {
        select: {
          id: true,
          type: true,
          scheduledAt: true,
          durationMinutes: true,
          price: true,
          meetingLink: true,
        },
      },
    },
  });

  if (payouts.length === 0) {
    return apiErrorResponse("No pending payouts for completed sessions found for the given IDs", 404);
  }

  const skipped = payoutIds.filter((id) => !payouts.find((p) => p.id === id));

  // TODO: Replace manual settlement with Razorpay Route/Cashfree auto-payout integration.
  // Mark all as PAID in one transaction
  await db.$transaction(async (tx) => {
    const { count } = await tx.payout.updateMany({
      where: { id: { in: payouts.map((p) => p.id) }, status: PayoutStatus.PENDING },
      data: {
        status: PayoutStatus.PAID,
        transactionId,
        upiId: upiId ?? null,
        processedAt: now,
      },
    });

    // Another request processed some of these payouts in the meantime; abort rather than
    // send duplicate confirmations.
    if (count !== payouts.length) {
      throw Object.assign(new Error("Some payouts were already processed. Refresh and try again."), {
        status: 409,
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "BATCH_PAYOUTS_PROCESSED",
        entityType: "Payout",
        entityId: payouts.map((p) => p.id).join(","),
        ipAddress,
        metadata: {
          count: payouts.length,
          transactionId,
          upiId,
          notes,
          totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
        },
      },
    });
  });

  // Fire confirmation emails — don't block response
  const emailPromises = payouts.map((payout) =>
    sendPayoutConfirmation(
      {
        id: payout.id,
        amount: payout.amount,
        status: PayoutStatus.PAID,
        createdAt: payout.createdAt,
        processedAt: now,
        transactionId,
        upiId: upiId ?? payout.upiId ?? null,
        sessionCount: 1,
        periodStart: payout.session.scheduledAt,
        periodEnd: payout.session.scheduledAt,
      },
      payout.mentor,
    ).catch((err) =>
      log.error("Payout confirmation email failed", err, {
        requestId: metadata.requestId,
        route: "/api/payouts/process",
        userId: metadata.userId,
        payoutId: payout.id,
      }),
    ),
  );

  Promise.allSettled(emailPromises);

  return NextResponse.json({
    success: true,
    processed: payouts.length,
    skipped: skipped.length,
    skippedIds: skipped,
    totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
  });
}, "/api/payouts/process");

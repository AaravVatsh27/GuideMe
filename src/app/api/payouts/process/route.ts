import { PayoutStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/lib/api-helpers";
import { log } from "@/lib/logger";
import { generalLimiter } from "@/lib/ratelimit";
import { extractRequestIp } from "@/server/admin";
import { db } from "@/server/db";
import { sendPayoutConfirmation } from "@/server/resend";

const processPayoutsSchema = z.object({
  payoutIds: z.array(z.string().uuid()).min(1).max(50).optional(),
  transactionId: z.string().trim().min(3).max(100),
  upiId: z.string().trim().min(5).max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();

  const denied = await applyRateLimit(generalLimiter, getRateLimitId(request, session?.user?.id));
  if (denied) return denied;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = processPayoutsSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { payoutIds, transactionId, upiId, notes } = parsed.data;
  const now = new Date();
  const ipAddress = extractRequestIp(request);

  // Fetch all pending payouts
  const payouts = await db.payout.findMany({
    where: {
      status: PayoutStatus.PENDING,
      ...(payoutIds ? { id: { in: payoutIds } } : {}),
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
    return NextResponse.json(
      { error: "No pending payouts found for the given IDs" },
      { status: 404 },
    );
  }

  const skipped = payoutIds
    ? payoutIds.filter((id) => !payouts.find((p) => p.id === id))
    : [];

  // TODO: Replace manual settlement with Razorpay Route/Cashfree auto-payout integration.
  // Mark all as PAID in one transaction
  await db.$transaction(async (tx) => {
    await tx.payout.updateMany({
      where: { id: { in: payouts.map((p) => p.id) } },
      data: {
        status: PayoutStatus.PAID,
        transactionId,
        upiId: upiId ?? null,
        processedAt: now,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "BATCH_PAYOUTS_PROCESSED",
        entityType: "Payout",
        entityId: (payoutIds ?? payouts.map((p) => p.id)).join(","),
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

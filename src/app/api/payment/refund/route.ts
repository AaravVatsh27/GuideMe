import { PaymentStatus, SessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/lib/api-helpers";
import { cacheDel, cacheDelPattern, cacheKeys } from "@/lib/cache";
import { log } from "@/lib/logger";
import { paymentLimiter } from "@/lib/ratelimit";
import { extractRequestIp } from "@/server/admin";
import { db } from "@/server/db";
import { createRefund } from "@/server/razorpay";
import { sendRefundConfirmationEmail } from "@/server/resend";

const refundSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
  reason: z.string().trim().min(10).max(280),
});

function isSystemRequest(request: Request) {
  const configuredSecret = process.env.GUIDEME_SYSTEM_SECRET?.trim();

  if (!configuredSecret) {
    return false;
  }

  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const headerToken = request.headers.get("x-guideme-system-secret")?.trim();

  return bearerToken === configuredSecret || headerToken === configuredSecret;
}

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();
  const systemRequest = isSystemRequest(request);

  const denied = await applyRateLimit(paymentLimiter, getRateLimitId(request, session?.user?.id));
  if (denied) return denied;

  if (!systemRequest && !session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session?.user?.id);

  if (!systemRequest && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin or system access required" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = refundSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { sessionId, reason } = parsed.data;
  const ipAddress = extractRequestIp(request);

  const payment = await db.payment.findUnique({
    where: { sessionId },
    include: {
      session: {
        select: { id: true, status: true, price: true, studentId: true, mentorId: true },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found for this session" }, { status: 404 });
  }

  if (payment.status !== PaymentStatus.CAPTURED) {
    return NextResponse.json(
      { error: `Cannot refund a payment with status: ${payment.status}` },
      { status: 409 },
    );
  }

  if (!payment.razorpayPaymentId) {
    return NextResponse.json({ error: "No captured payment ID on record" }, { status: 409 });
  }

  if (
    payment.refundStatus === PaymentStatus.REFUNDED ||
    payment.refundStatus === PaymentStatus.PARTIALLY_REFUNDED
  ) {
    return NextResponse.json({ error: "Payment is already refunded" }, { status: 409 });
  }

  const refund = await createRefund(payment.razorpayPaymentId, payment.amount);
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { sessionId },
      data: {
        refundId: refund.id,
        refundAmount: payment.amount,
        refundedAt: now,
        refundStatus: PaymentStatus.REFUNDED,
        status: PaymentStatus.REFUNDED,
      },
    });

    if (payment.session.status === SessionStatus.SCHEDULED) {
      await tx.session.update({
        where: { id: sessionId },
        data: { status: SessionStatus.CANCELLED },
      });
    }

    await tx.payout.deleteMany({ where: { sessionId } });

    await tx.auditLog.create({
      data: {
        userId: systemRequest ? null : session?.user?.id ?? null,
        action: "MANUAL_REFUND_ISSUED",
        entityType: "Payment",
        entityId: payment.id,
        ipAddress,
        metadata: {
          refundId: refund.id,
          amount: payment.amount,
          reason,
        },
      },
    });
  });

  sendRefundConfirmationEmail({
    student: payment.user,
    sessionId,
    refundAmount: payment.amount,
    reason,
  }).catch((err) =>
    log.error("Refund confirmation email failed", err, {
      requestId: metadata.requestId,
      route: "/api/payment/refund",
      userId: metadata.userId,
      sessionId,
    }),
  );
  Promise.allSettled([
    cacheDel(cacheKeys.session(sessionId)),
    cacheDelPattern(cacheKeys.availabilityPattern(payment.session.mentorId)),
  ]).catch(() => {});

  return NextResponse.json({
    success: true,
    refundId: refund.id,
    amount: payment.amount,
  });
}, "/api/payment/refund");

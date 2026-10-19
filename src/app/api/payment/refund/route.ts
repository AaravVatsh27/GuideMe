import { PaymentStatus, PayoutStatus, SessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { cacheDel, cacheDelPattern, cacheKeys } from "@/Backend/lib/cache";
import { log } from "@/Backend/lib/logger";
import { paymentLimiter } from "@/Backend/lib/ratelimit";
import { extractRequestIp } from "@/Backend/server/admin";
import { db } from "@/Backend/server/db";
import { createRefund } from "@/Backend/server/razorpay";
import { sendRefundConfirmationEmail } from "@/Backend/server/resend";
import { defineRoute } from "@/Backend/lib/define-route";
import { timingSafeEqual } from "node:crypto";

const refundSchema = z.object({
  sessionId: z.uuid("sessionId must be a valid UUID"),
  reason: z.string().trim().min(10).max(280),
});

function secretsMatch(candidate: string | undefined, secret: string) {
  if (!candidate) {
    return false;
  }

  const left = Buffer.from(candidate);
  const right = Buffer.from(secret);
  return left.length === right.length && timingSafeEqual(left, right);
}

function isSystemRequest(request: Request) {
  const configuredSecret = process.env.GUIDEME_SYSTEM_SECRET?.trim();

  if (!configuredSecret) {
    return false;
  }

  const bearerToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const headerToken = request.headers.get("x-guideme-system-secret")?.trim();

  return secretsMatch(bearerToken, configuredSecret) || secretsMatch(headerToken, configuredSecret);
}

// Called by admins from the panel, or by internal jobs with the system secret,
// so auth is optional here and checked below.
export const POST = defineRoute(
  { auth: "optional", rateLimit: paymentLimiter },
  async (request: Request, _context, { session, metadata }) => {
  const systemRequest = isSystemRequest(request);

  if (!systemRequest && !session) {
    return apiErrorResponse("Unauthorized", 401);
  }

  if (!systemRequest && session?.user?.role !== "ADMIN") {
    return apiErrorResponse("Admin or system access required", 403);
  }

  const payload = await request.json().catch(() => null);
  const parsed = refundSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Invalid payload", 400, z.flattenError(parsed.error));
  }

  const { sessionId, reason } = parsed.data;
  const ipAddress = extractRequestIp(request);

  const payment = await db.payment.findUnique({
    where: { sessionId },
    include: {
      session: {
        select: {
          id: true,
          status: true,
          price: true,
          studentId: true,
          mentorId: true,
          payout: { select: { id: true, status: true, amount: true } },
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  if (!payment) {
    return apiErrorResponse("Payment not found for this session", 404);
  }

  if (payment.status !== PaymentStatus.CAPTURED) {
    return apiErrorResponse(`Cannot refund a payment with status: ${payment.status}`, 409);
  }

  if (!payment.razorpayPaymentId) {
    return apiErrorResponse("No captured payment ID on record", 409);
  }

  if (
    payment.refundStatus === PaymentStatus.REFUNDED ||
    payment.refundStatus === PaymentStatus.PARTIALLY_REFUNDED
  ) {
    return apiErrorResponse("Payment is already refunded", 409);
  }

  const existingPayout = payment.session.payout;
  const payoutAlreadyPaid = existingPayout?.status === PayoutStatus.PAID;

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

    // Only cancel payouts that have not been sent. A payout already PAID to the mentor
    // stays on record so the books still show the money that left the platform.
    await tx.payout.deleteMany({
      where: {
        sessionId,
        status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] },
      },
    });

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
          payoutAlreadyPaid: payoutAlreadyPaid
            ? { payoutId: existingPayout?.id, amount: existingPayout?.amount }
            : null,
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
    payoutAlreadyPaid,
  });
}, "/api/payment/refund");

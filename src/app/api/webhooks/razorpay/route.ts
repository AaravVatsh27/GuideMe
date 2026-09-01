import {
  NotificationType,
  PaymentStatus,
  PayoutStatus,
  SessionStatus,
} from "@prisma/client";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { cacheDel, cacheDelPattern, cacheKeys } from "@/Backend/lib/cache";
import { log } from "@/Backend/lib/logger";
import { PLATFORM_CUT } from "@/Backend/server/constants";
import { db } from "@/Backend/server/db";
import { sendBookingConfirmation, sendPaymentFailureEmail, sendRefundConfirmationEmail } from "@/Backend/server/resend";

function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    return false;
  }

  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signature, "utf8");

  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentCaptured(payload: any, requestId: string) {
  const paymentId: string = payload.payment?.entity?.id;
  const orderId: string = payload.payment?.entity?.order_id;
  const amountPaise: number = payload.payment?.entity?.amount;

  if (!paymentId || !orderId) return;

  const payment = await db.payment.findFirst({
    where: { razorpayOrderId: orderId },
    include: {
      session: {
        include: {
          student: {
            select: {
              id: true,
              name: true,
              email: true,
              studentProfile: {
                select: {
                  class: true,
                  confusionType: true,
                  confusionTypes: true,
                },
              },
            },
          },
          mentor: {
            select: {
              id: true,
              name: true,
              email: true,
              mentorProfile: {
                select: {
                  college: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!payment || payment.status === PaymentStatus.CAPTURED) return;

  if (
    payment.session.status === SessionStatus.CANCELLED ||
    payment.session.status === SessionStatus.NO_SHOW ||
    payment.session.status === SessionStatus.COMPLETED
  ) {
    return;
  }

  const platformCut = Math.round(payment.amount * PLATFORM_CUT);
  const mentorEarning = payment.amount - platformCut;
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        razorpayPaymentId: paymentId,
        status: PaymentStatus.CAPTURED,
        paidAt: now,
        metadata: {
          ...((payment.metadata as Record<string, unknown>) ?? {}),
          razorpayAmountSubunits: amountPaise,
        },
      },
    });

    await tx.session.update({
      where: { id: payment.sessionId },
      data: { status: SessionStatus.SCHEDULED, platformCut, mentorEarning },
    });

    await tx.payout.upsert({
      where: { sessionId: payment.sessionId },
      create: {
        mentorId: payment.session.mentorId,
        sessionId: payment.sessionId,
        amount: mentorEarning,
        status: PayoutStatus.PENDING,
        scheduledAt: payment.session.scheduledAt,
      },
      update: {
        amount: mentorEarning,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "PAYMENT_CAPTURED_WEBHOOK",
        entityType: "Payment",
        entityId: payment.id,
        metadata: { orderId, paymentId },
      },
    });
  });

  sendBookingConfirmation(
    payment.session,
    payment.session.student,
    payment.session.mentor,
  ).catch((err) =>
    log.error("Razorpay booking confirmation email failed", err, {
      requestId,
      route: "/api/webhooks/razorpay",
      paymentId,
      sessionId: payment.sessionId,
    }),
  );
  cacheDel(cacheKeys.session(payment.sessionId)).catch(() => {});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(payload: any, requestId: string) {
  const orderId: string = payload.payment?.entity?.order_id;
  if (!orderId) return;

  const payment = await db.payment.findFirst({
    where: { razorpayOrderId: orderId },
    include: {
      session: {
        include: { student: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!payment || payment.status !== PaymentStatus.PENDING) return;

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.FAILED },
    });

    await tx.notification.create({
      data: {
        userId: payment.session.studentId,
        type: NotificationType.SYSTEM,
        title: "Payment failed",
        body: "Your payment could not be completed. Please retry your booking payment.",
        link: `/session/${payment.sessionId}`,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "PAYMENT_FAILED_WEBHOOK",
        entityType: "Payment",
        entityId: payment.id,
        metadata: { orderId },
      },
    });
  });

  sendPaymentFailureEmail({
    student: payment.session.student,
    sessionId: payment.sessionId,
  }).catch((err) =>
    log.error("Razorpay payment failure email failed", err, {
      requestId,
      route: "/api/webhooks/razorpay",
      orderId,
      sessionId: payment.sessionId,
    }),
  );
  cacheDel(cacheKeys.session(payment.sessionId)).catch(() => {});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRefundCreated(payload: any) {
  const refundId: string = payload.refund?.entity?.id;
  const paymentId: string = payload.refund?.entity?.payment_id;
  const amountPaise: number = payload.refund?.entity?.amount;

  if (!refundId || !paymentId) return;

  const payment = await db.payment.findFirst({ where: { razorpayPaymentId: paymentId } });
  if (!payment) return;

  await db.payment.update({
    where: { id: payment.id },
    data: {
      refundId,
      refundAmount: Math.round(amountPaise / 100),
      refundStatus: PaymentStatus.PARTIALLY_REFUNDED,
    },
  });

  cacheDel(cacheKeys.session(payment.sessionId)).catch(() => {});
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRefundProcessed(payload: any, requestId: string) {
  const refundId: string = payload.refund?.entity?.id;
  const paymentId: string = payload.refund?.entity?.payment_id;
  const amountPaise: number = payload.refund?.entity?.amount;

  if (!refundId || !paymentId) return;

  const payment = await db.payment.findFirst({
    where: { razorpayPaymentId: paymentId },
    include: {
      session: {
        select: {
          studentId: true,
          mentorId: true,
          student: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });
  if (!payment) return;

  const isFullRefund = Math.round(amountPaise / 100) >= payment.amount;

  const refundAmount = Math.round(amountPaise / 100);

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        refundId,
        refundAmount,
        refundedAt: new Date(),
        refundStatus: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
        status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
      },
    });

    if (isFullRefund) {
      await tx.payout.deleteMany({
        where: {
          sessionId: payment.sessionId,
          status: {
            in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING],
          },
        },
      });
    }

    await tx.notification.create({
      data: {
        userId: payment.session.studentId,
        type: NotificationType.SYSTEM,
        title: "Refund processed",
        body: `Your refund of INR ${refundAmount} has been processed.`,
        link: `/session/${payment.sessionId}`,
      },
    });
  });

  sendRefundConfirmationEmail({
    student: payment.session.student,
    sessionId: payment.sessionId,
    refundAmount,
  }).catch((err) =>
    log.error("Razorpay refund email failed", err, {
      requestId,
      route: "/api/webhooks/razorpay",
      refundId,
      sessionId: payment.sessionId,
    }),
  );
  Promise.allSettled([
    cacheDel(cacheKeys.session(payment.sessionId)),
    cacheDelPattern(cacheKeys.availabilityPattern(payment.session.mentorId)),
  ]).catch(() => {});
}

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const signature =
    request.headers.get("x-razorpay-signature") ??
    request.headers.get("Razorpay-Signature") ??
    "";
  const body = await request.text();

  if (!verifyWebhookSignature(body, signature)) {
    log.warn("Razorpay webhook signature verification failed", {
      requestId: metadata.requestId,
      route: "/api/webhooks/razorpay",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body) as { event: string; payload: unknown };

  switch (event.event) {
    case "payment.captured":
      await handlePaymentCaptured(event.payload, metadata.requestId);
      break;
    case "payment.failed":
      await handlePaymentFailed(event.payload, metadata.requestId);
      break;
    case "refund.created":
      await handleRefundCreated(event.payload);
      break;
    case "refund.processed":
      await handleRefundProcessed(event.payload, metadata.requestId);
      break;
    default:
      // Unhandled event — acknowledge silently
      break;
  }

  return NextResponse.json({ received: true });
}, "/api/webhooks/razorpay");

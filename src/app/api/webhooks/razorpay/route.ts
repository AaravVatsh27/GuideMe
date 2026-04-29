import { PaymentStatus, PayoutStatus } from "@prisma/client";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { PLATFORM_CUT } from "@/server/constants";
import { db } from "@/server/db";
import { sendBookingConfirmation } from "@/server/resend";

function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    console.warn("[webhook/razorpay] RAZORPAY_WEBHOOK_SECRET not set — skipping verification");
    return false;
  }

  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(signature, "utf8");

  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentCaptured(payload: any) {
  const paymentId: string = payload.payment?.entity?.id;
  const orderId: string = payload.payment?.entity?.order_id;
  const amountPaise: number = payload.payment?.entity?.amount;

  if (!paymentId || !orderId) return;

  const payment = await db.payment.findFirst({
    where: { razorpayOrderId: orderId },
    include: {
      session: {
        include: {
          student: { select: { id: true, name: true, email: true } },
          mentor: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!payment || payment.status === PaymentStatus.CAPTURED) return;

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
      data: { platformCut, mentorEarning },
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
      update: {},
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
  ).catch((err) => console.error("[webhook/razorpay] email error", err));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handlePaymentFailed(payload: any) {
  const orderId: string = payload.payment?.entity?.order_id;
  if (!orderId) return;

  const payment = await db.payment.findFirst({ where: { razorpayOrderId: orderId } });
  if (!payment || payment.status !== PaymentStatus.PENDING) return;

  await db.payment.update({
    where: { id: payment.id },
    data: { status: PaymentStatus.FAILED },
  });

  await db.auditLog.create({
    data: {
      action: "PAYMENT_FAILED_WEBHOOK",
      entityType: "Payment",
      entityId: payment.id,
      metadata: { orderId },
    },
  });
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleRefundProcessed(payload: any) {
  const refundId: string = payload.refund?.entity?.id;
  const paymentId: string = payload.refund?.entity?.payment_id;
  const amountPaise: number = payload.refund?.entity?.amount;

  if (!refundId || !paymentId) return;

  const payment = await db.payment.findFirst({ where: { razorpayPaymentId: paymentId } });
  if (!payment) return;

  const isFullRefund = Math.round(amountPaise / 100) >= payment.amount;

  await db.payment.update({
    where: { id: payment.id },
    data: {
      refundId,
      refundAmount: Math.round(amountPaise / 100),
      refundedAt: new Date(),
      refundStatus: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
      status: isFullRefund ? PaymentStatus.REFUNDED : PaymentStatus.PARTIALLY_REFUNDED,
    },
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const body = await request.text();

  if (!verifyWebhookSignature(body, signature)) {
    console.warn("[webhook/razorpay] Invalid webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event: string; payload: unknown };

  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    switch (event.event) {
      case "payment.captured":
        await handlePaymentCaptured(event.payload);
        break;
      case "payment.failed":
        await handlePaymentFailed(event.payload);
        break;
      case "refund.created":
        await handleRefundCreated(event.payload);
        break;
      case "refund.processed":
        await handleRefundProcessed(event.payload);
        break;
      default:
        // Unhandled event — acknowledge silently
        break;
    }
  } catch (error) {
    console.error("[webhook/razorpay] Handler error", error);
    // Return 200 so Razorpay doesn't retry — log to fix later
    return NextResponse.json({ received: true, error: "Handler failed" });
  }

  return NextResponse.json({ received: true });
}

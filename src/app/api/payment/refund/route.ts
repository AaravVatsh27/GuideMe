import { PaymentStatus, SessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { createRefund } from "@/server/razorpay";

const refundSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
  reason: z.string().trim().min(10).max(280),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
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

  try {
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
          userId: session.user.id,
          action: "MANUAL_REFUND_ISSUED",
          entityType: "Payment",
          entityId: payment.id,
          metadata: {
            refundId: refund.id,
            amount: payment.amount,
            reason,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      refundId: refund.id,
      amount: payment.amount,
    });
  } catch (error) {
    console.error("[payment/refund]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

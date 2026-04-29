import { NotificationType, PaymentStatus, PayoutStatus, SessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { PLATFORM_CUT } from "@/server/constants";
import { db } from "@/server/db";
import { verifyPaymentSignature } from "@/server/razorpay";
import { sendBookingConfirmation } from "@/server/resend";

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().trim().min(1),
  razorpayPaymentId: z.string().trim().min(1),
  razorpaySignature: z.string().trim().min(1),
  sessionId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can verify payments" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = verifyPaymentSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, sessionId } = parsed.data;

  const isValid = verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

  if (!isValid) {
    console.warn("[payment/verify] Invalid signature attempt", {
      sessionId,
      userId: session.user.id,
      razorpayOrderId,
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PAYMENT_SIGNATURE_INVALID",
        entityType: "Payment",
        entityId: sessionId,
        metadata: { razorpayOrderId, razorpayPaymentId },
      },
    });

    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }

  try {
    const bookingSession = await db.session.findUnique({
      where: { id: sessionId },
      include: {
        payment: true,
        student: { select: { id: true, name: true, email: true } },
        mentor: { select: { id: true, name: true, email: true } },
      },
    });

    if (!bookingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (bookingSession.studentId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!bookingSession.payment) {
      return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
    }

    // Already captured — idempotent response
    if (bookingSession.payment.status === PaymentStatus.CAPTURED) {
      return NextResponse.json({ success: true, sessionId });
    }

    const platformCut = Math.round(bookingSession.price * PLATFORM_CUT);
    const mentorEarning = bookingSession.price - platformCut;
    const now = new Date();

    await db.$transaction(async (tx) => {
      await tx.payment.update({
        where: { sessionId },
        data: {
          razorpayPaymentId,
          status: PaymentStatus.CAPTURED,
          paidAt: now,
        },
      });

      await tx.session.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.SCHEDULED,
          platformCut,
          mentorEarning,
        },
      });

      // Create pending payout for mentor
      await tx.payout.upsert({
        where: { sessionId },
        create: {
          mentorId: bookingSession.mentorId,
          sessionId,
          amount: mentorEarning,
          status: PayoutStatus.PENDING,
          scheduledAt: bookingSession.scheduledAt,
        },
        update: {},
      });

      // Notify both participants
      await tx.notification.createMany({
        data: [
          {
            userId: bookingSession.studentId,
            type: NotificationType.PAYMENT_RECEIVED,
            title: "Payment confirmed",
            body: `Your session with ${bookingSession.mentor.name} is confirmed.`,
            link: `/session/${sessionId}`,
          },
          {
            userId: bookingSession.mentorId,
            type: NotificationType.SESSION_BOOKED,
            title: "New booking",
            body: `${bookingSession.student.name} has booked and paid for a session with you.`,
            link: `/session/${sessionId}`,
          },
        ],
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PAYMENT_CAPTURED",
          entityType: "Payment",
          entityId: sessionId,
          metadata: { razorpayOrderId, razorpayPaymentId, amount: bookingSession.price },
        },
      });
    });

    // Send booking confirmation email (fire-and-forget)
    sendBookingConfirmation(
      bookingSession,
      bookingSession.student,
      bookingSession.mentor,
    ).catch((err) => console.error("[payment/verify] email error", err));

    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error("[payment/verify]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

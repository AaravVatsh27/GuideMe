import {
  NotificationType,
  PaymentStatus,
  PayoutStatus,
  SessionStatus,
  SessionType,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/Backend/auth";
import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { cacheDel, cacheKeys } from "@/Backend/lib/cache";
import { log } from "@/Backend/lib/logger";
import { paymentLimiter } from "@/Backend/lib/ratelimit";
import { PLATFORM_CUT } from "@/Backend/server/constants";
import { db } from "@/Backend/server/db";
import { verifyPaymentSignature } from "@/Backend/server/razorpay";
import { sendBookingConfirmation } from "@/Backend/server/resend";

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().trim().min(1),
  razorpayPaymentId: z.string().trim().min(1),
  razorpaySignature: z.string().trim().min(1),
  sessionId: z.string().uuid(),
});

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();

  const denied = await applyRateLimit(paymentLimiter, getRateLimitId(request, session?.user?.id));
  if (denied) return denied;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

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
    log.warn("Invalid payment signature attempt", {
      requestId: metadata.requestId,
      route: "/api/payment/verify",
      userId: metadata.userId,
      sessionId,
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

  const bookingSession = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      payment: true,
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

  if (bookingSession.type !== SessionType.PAID) {
    return NextResponse.json({ error: "Only paid sessions can be verified" }, { status: 400 });
  }

  if (
    bookingSession.status === SessionStatus.CANCELLED ||
    bookingSession.status === SessionStatus.NO_SHOW ||
    bookingSession.status === SessionStatus.COMPLETED
  ) {
    return NextResponse.json(
      { error: `Cannot verify payment for a ${bookingSession.status.toLowerCase()} session` },
      { status: 409 },
    );
  }

  if (bookingSession.payment.razorpayOrderId !== razorpayOrderId) {
    return NextResponse.json({ error: "Order does not match payment record" }, { status: 409 });
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

    await tx.payout.upsert({
      where: { sessionId },
      create: {
        mentorId: bookingSession.mentorId,
        sessionId,
        amount: mentorEarning,
        status: PayoutStatus.PENDING,
        scheduledAt: bookingSession.scheduledAt,
      },
      update: {
        amount: mentorEarning,
      },
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
  ).catch((err) =>
    log.error("Booking confirmation email failed", err, {
      requestId: metadata.requestId,
      route: "/api/payment/verify",
      userId: metadata.userId,
      sessionId,
    }),
  );
  cacheDel(cacheKeys.session(sessionId)).catch(() => {});

  return NextResponse.json({ success: true, sessionId });
}, "/api/payment/verify");

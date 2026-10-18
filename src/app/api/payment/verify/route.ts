import {
  NotificationType,
  PaymentStatus,
  PayoutStatus,
  SessionStatus,
  SessionType,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { cacheDel, cacheKeys } from "@/Backend/lib/cache";
import { log } from "@/Backend/lib/logger";
import { paymentLimiter } from "@/Backend/lib/ratelimit";
import { PLATFORM_CUT } from "@/shared/constants";
import { db } from "@/Backend/server/db";
import { verifyPaymentSignature } from "@/Backend/server/razorpay";
import { refundPaymentForClosedSession, releaseBookingIfSlotLost } from "@/Backend/server/sessions";
import { sendBookingConfirmation } from "@/Backend/server/resend";
import { defineRoute } from "@/Backend/lib/define-route";

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().trim().min(1),
  razorpayPaymentId: z.string().trim().min(1),
  razorpaySignature: z.string().trim().min(1),
  sessionId: z.string().uuid(),
});

export const POST = defineRoute(
  { roles: ["STUDENT"], forbiddenMessage: "Only students can verify payments", rateLimit: paymentLimiter },
  async (request: Request, _context, { session, metadata }) => {
  const payload = await request.json().catch(() => null);
  const parsed = verifyPaymentSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Invalid payload", 400, parsed.error.flatten());
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

    return apiErrorResponse("Payment verification failed", 400);
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
    return apiErrorResponse("Session not found", 404);
  }

  if (bookingSession.studentId !== session.user.id) {
    return apiErrorResponse("Forbidden", 403);
  }

  if (!bookingSession.payment) {
    return apiErrorResponse("Payment record not found", 404);
  }

  if (bookingSession.type !== SessionType.PAID) {
    return apiErrorResponse("Only paid sessions can be verified", 400);
  }

  if (
    (bookingSession.status === SessionStatus.CANCELLED ||
      bookingSession.status === SessionStatus.NO_SHOW) &&
    bookingSession.payment?.razorpayOrderId === razorpayOrderId &&
    (await refundPaymentForClosedSession({ sessionId, razorpayPaymentId }))
  ) {
    return apiErrorResponse("This booking was cancelled before your payment completed. A full refund has been issued.", 409);
  }

  if (
    bookingSession.status === SessionStatus.CANCELLED ||
    bookingSession.status === SessionStatus.NO_SHOW ||
    bookingSession.status === SessionStatus.COMPLETED
  ) {
    return apiErrorResponse(`Cannot verify payment for a ${bookingSession.status.toLowerCase()} session`, 409);
  }

  if (bookingSession.payment.razorpayOrderId !== razorpayOrderId) {
    return apiErrorResponse("Order does not match payment record", 409);
  }

  // Already captured — idempotent response
  if (bookingSession.payment.status === PaymentStatus.CAPTURED) {
    return NextResponse.json({ success: true, sessionId });
  }

  if (await releaseBookingIfSlotLost({ sessionId, razorpayPaymentId })) {
    return apiErrorResponse("This slot was booked by someone else before your payment completed. A full refund has been issued.", 409);
  }

  const platformCut = Math.round(bookingSession.price * PLATFORM_CUT);
  const mentorEarning = bookingSession.price - platformCut;
  const now = new Date();

  const captured = await db.$transaction(async (tx) => {
    // Only the first of this route and the payment webhook to get here records the capture;
    // the other sees count 0 and skips, so notifications and emails go out once.
    const { count } = await tx.payment.updateMany({
      where: {
        sessionId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] },
      },
      data: {
        razorpayPaymentId,
        status: PaymentStatus.CAPTURED,
        paidAt: now,
      },
    });

    if (count === 0) {
      return false;
    }

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

    return true;
  });

  if (!captured) {
    return NextResponse.json({ success: true, sessionId });
  }

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

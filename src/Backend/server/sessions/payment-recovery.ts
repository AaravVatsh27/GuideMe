/** Unpaid holds that expired and payments that arrive after a booking can no longer be honoured. */

import { NotificationType, PaymentStatus, SessionStatus } from "@prisma/client";
import { db } from "@/Backend/server/db";
import { createRefund } from "@/Backend/server/razorpay";

import { isBookingHoldExpired } from "./rules";
import { invalidateSessionCaches } from "./shared";
import { hasConflict } from "./slots";

/**
 * Cancels a paid booking whose unpaid hold has expired, freeing its slot.
 * Called before a new payment order is issued so students cannot pay for a stale hold.
 */
export async function expireUnpaidBooking(sessionId: string) {
  const session = await db.session.findUnique({
    where: { id: sessionId },
    select: { mentorId: true },
  });

  if (!session) {
    return;
  }

  await db.$transaction(async (tx) => {
    const { count } = await tx.session.updateMany({
      where: { id: sessionId, status: SessionStatus.SCHEDULED },
      data: {
        status: SessionStatus.CANCELLED,
        cancellationReason: "Payment was not completed in time",
        cancelledAt: new Date(),
      },
    });

    if (count === 0) {
      return;
    }

    await tx.booking.deleteMany({ where: { sessionId } });
    await tx.payment.updateMany({
      where: { sessionId, status: PaymentStatus.PENDING },
      data: { status: PaymentStatus.FAILED },
    });
    await tx.auditLog.create({
      data: {
        action: "SESSION_HOLD_EXPIRED",
        entityType: "Session",
        entityId: sessionId,
      },
    });
  });

  invalidateSessionCaches(sessionId, session.mentorId);
}

/**
 * Handles a payment captured after the booking's unpaid hold expired. If another booking
 * has taken the slot in the meantime, the payment is refunded in full and this booking is
 * cancelled. Returns true when the booking was released (or is already being released).
 */
export async function releaseBookingIfSlotLost(input: {
  sessionId: string;
  razorpayPaymentId: string;
}) {
  const session = await db.session.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      type: true,
      status: true,
      createdAt: true,
      scheduledAt: true,
      durationMinutes: true,
      pricePaise: true,
      mentorId: true,
      studentId: true,
      payment: { select: { status: true } },
    },
  });

  if (!session || !isBookingHoldExpired(session, session.payment?.status)) {
    return false;
  }

  const [mentorTaken, studentTaken] = await Promise.all([
    hasConflict(db, "mentorId", session.mentorId, session, session.id),
    hasConflict(db, "studentId", session.studentId, session, session.id),
  ]);

  if (!mentorTaken && !studentTaken) {
    return false;
  }

  return refundUnrecordedBookingPayment({
    session,
    razorpayPaymentId: input.razorpayPaymentId,
    reason: "The slot was booked by someone else before your payment completed",
    auditAction: "SESSION_SLOT_LOST_REFUNDED",
    cancelSession: true,
  });
}

/**
 * Handles a payment captured for a session that was already cancelled or marked no-show
 * (for example, the student cancelled or the hold expired while checkout was still open).
 * The money is refunded in full. Returns true when the payment was (or is being) refunded.
 */
export async function refundPaymentForClosedSession(input: {
  sessionId: string;
  razorpayPaymentId: string;
}) {
  const session = await db.session.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      status: true,
      pricePaise: true,
      mentorId: true,
      studentId: true,
    },
  });

  if (
    !session ||
    (session.status !== SessionStatus.CANCELLED && session.status !== SessionStatus.NO_SHOW)
  ) {
    return false;
  }

  return refundUnrecordedBookingPayment({
    session,
    razorpayPaymentId: input.razorpayPaymentId,
    reason: "Your payment completed after this booking was cancelled",
    auditAction: "CLOSED_SESSION_PAYMENT_REFUNDED",
    cancelSession: false,
  });
}

/**
 * Refunds a captured payment that was never recorded as captured, records the refund, and
 * optionally cancels the booking. A conditional claim on the payment row ensures that a
 * concurrent webhook and verify call refund only once.
 */
async function refundUnrecordedBookingPayment(input: {
  session: { id: string; pricePaise: number; studentId: string; mentorId: string };
  razorpayPaymentId: string;
  reason: string;
  auditAction: string;
  cancelSession: boolean;
}) {
  const { session, razorpayPaymentId, reason, auditAction, cancelSession } = input;

  const claim = await db.payment.updateMany({
    where: {
      sessionId: session.id,
      refundStatus: null,
      status: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] },
    },
    data: { refundStatus: PaymentStatus.PENDING, razorpayPaymentId },
  });

  if (claim.count === 0) {
    return true;
  }

  const refund = await createRefund(razorpayPaymentId, session.pricePaise);
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { sessionId: session.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundStatus: PaymentStatus.REFUNDED,
        refundId: refund.id,
        refundAmountPaise: session.pricePaise,
        refundedAt: now,
        paidAt: now,
      },
    });

    if (cancelSession) {
      await tx.session.update({
        where: { id: session.id },
        data: {
          status: SessionStatus.CANCELLED,
          cancellationReason: reason,
          cancelledAt: now,
        },
      });

      await tx.booking.deleteMany({ where: { sessionId: session.id } });
    }

    await tx.notification.create({
      data: {
        userId: session.studentId,
        type: NotificationType.SYSTEM,
        title: "Payment refunded",
        body: `${reason}. A full refund has been issued.`,
        link: `/session/${session.id}`,
      },
    });

    await tx.auditLog.create({
      data: {
        action: auditAction,
        entityType: "Session",
        entityId: session.id,
        metadata: { refundId: refund.id, amountPaise: session.pricePaise },
      },
    });
  });

  invalidateSessionCaches(session.id, session.mentorId);
  return true;
}

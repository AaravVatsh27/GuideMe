/** Creating a booking: availability and conflict checks, video room, payment order. */

import { randomUUID } from "node:crypto";
import { PaymentStatus, SessionStatus, SessionType } from "@prisma/client";
import { addMinutes } from "date-fns";
import { DEFAULT_CURRENCY, MAX_UNPAID_BOOKING_HOLDS, UNPAID_BOOKING_HOLD_MINUTES } from "@/shared/constants";
import { createDailyRoom } from "@/Backend/server/daily";
import { db } from "@/Backend/server/db";
import { createOrder } from "@/Backend/server/razorpay";
import { sendBookingConfirmation } from "@/Backend/server/resend";

import { createBookingNotifications } from "./notifications";
import { buildSessionReceipt, calculateSessionAmounts, getBookingHoldCutoff } from "./rules";
import { CreateSessionBookingInput, SessionApiError, asEmailParticipant, findSessionDetailsOrThrow, invalidateSessionCaches, safelySend } from "./shared";
import { ensureNoConflict, findMatchingAvailability, lockBookingParticipants } from "./slots";

export async function createSessionBooking({
  studentId,
  input,
}: CreateSessionBookingInput) {
  const [student, mentor] = await Promise.all([
    db.user.findUnique({
      where: {
        id: studentId,
      },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          studentProfile: {
            select: {
              class: true,
              confusionType: true,
              confusionTypes: true,
            },
          },
        },
      }),
    db.user.findUnique({
      where: {
        id: input.mentorId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isActive: true,
          mentorProfile: {
            select: {
              isAvailable: true,
              isActive: true,
              priceMin: true,
              priceMax: true,
              college: true,
            },
          },
        },
      }),
  ]);

  if (!student || student.role !== "STUDENT") {
    throw new SessionApiError("Student account not found", 404);
  }

  if (!mentor || mentor.role !== "MENTOR" || !mentor.isActive || !mentor.mentorProfile) {
    throw new SessionApiError("Mentor not found", 404);
  }

  if (!mentor.mentorProfile.isAvailable || !mentor.mentorProfile.isActive) {
    throw new SessionApiError("Mentor is not currently available for bookings", 409);
  }

  if (input.type === SessionType.PAID) {
    const expectedPrice =
      input.durationMinutes === 30
        ? mentor.mentorProfile.priceMin
        : mentor.mentorProfile.priceMax;

    if (expectedPrice === null || input.price !== expectedPrice) {
      throw new SessionApiError("Requested price does not match mentor pricing", 400);
    }
  }

  const matchedAvailability = await findMatchingAvailability(
    mentor.id,
    input.scheduledAt,
    input.durationMinutes,
    input.availabilityId,
  );

  if (!matchedAvailability) {
    throw new SessionApiError("Mentor is not available at the requested slot", 409);
  }

  const requestedSlot = {
    scheduledAt: input.scheduledAt,
    durationMinutes: input.durationMinutes,
  };

  // Early checks so we don't create a video room or payment order for a slot that is taken.
  // They are repeated under a lock inside the transaction below.
  await Promise.all([
    ensureNoConflict(db, "studentId", studentId, requestedSlot, "Student"),
    ensureNoConflict(db, "mentorId", mentor.id, requestedSlot, "Mentor"),
  ]);

  if (input.type === SessionType.PAID) {
    const unpaidHolds = await db.session.count({
      where: {
        studentId,
        type: SessionType.PAID,
        status: SessionStatus.SCHEDULED,
        createdAt: { gte: getBookingHoldCutoff() },
        payment: { is: { status: { not: PaymentStatus.CAPTURED } } },
      },
    });

    if (unpaidHolds >= MAX_UNPAID_BOOKING_HOLDS) {
      throw new SessionApiError(
        "Please complete payment for your pending bookings before booking another session",
        429,
      );
    }
  }

  if (input.type === SessionType.INTRO) {
    const priorIntroCount = await db.session.count({
      where: {
        studentId,
        mentorId: mentor.id,
        type: SessionType.INTRO,
        status: {
          not: SessionStatus.CANCELLED,
        },
      },
    });

    if (priorIntroCount > 0) {
      throw new SessionApiError(
        "Student has already booked an intro session with this mentor",
        409,
      );
    }
  }

  const sessionId = randomUUID();
  const room = await createDailyRoom({
    sessionId,
    startsAt: input.scheduledAt,
    durationMinutes: input.durationMinutes,
  });
  const order =
    input.type === SessionType.PAID
      ? await createOrder(input.price, DEFAULT_CURRENCY, buildSessionReceipt(sessionId), {
          sessionId,
          studentId,
          mentorId: mentor.id,
          type: input.type,
        })
      : null;
  const amounts = calculateSessionAmounts(input.type, input.price);

  await db.$transaction(async (tx) => {
    await lockBookingParticipants(tx, mentor.id, studentId);
    await ensureNoConflict(tx, "studentId", studentId, requestedSlot, "Student");
    await ensureNoConflict(tx, "mentorId", mentor.id, requestedSlot, "Mentor");

    await tx.session.create({
      data: {
        id: sessionId,
        studentId,
        mentorId: mentor.id,
        type: input.type,
        status: SessionStatus.SCHEDULED,
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
        price: input.price,
        platformCut: amounts.platformCut,
        mentorEarning: amounts.mentorEarning,
        meetingLink: room.meetingLink,
        meetingRoomId: room.roomId,
      },
    });

    await tx.booking.create({
      data: {
        availabilityId: matchedAvailability.id,
        sessionId,
        expiresAt: order ? addMinutes(new Date(), UNPAID_BOOKING_HOLD_MINUTES) : null,
      },
    });

    if (input.notes?.trim()) {
      await tx.sessionNote.create({
        data: {
          sessionId,
          authorId: studentId,
          content: input.notes.trim(),
        },
      });
    }

    if (order) {
      await tx.payment.create({
        data: {
          sessionId,
          userId: studentId,
          razorpayOrderId: order.id,
          amount: input.price,
          currency: DEFAULT_CURRENCY,
          status: PaymentStatus.PENDING,
          metadata: {
            razorpayAmountSubunits: order.amount,
            mentorId: mentor.id,
            scheduledAt: input.scheduledAt.toISOString(),
          },
        },
      });
    } else {
      await createBookingNotifications(tx, sessionId, studentId, mentor.id);
    }

    await tx.auditLog.create({
      data: {
        userId: studentId,
        action: "SESSION_BOOKED",
        entityType: "Session",
        entityId: sessionId,
        metadata: {
          mentorId: mentor.id,
          sessionType: input.type,
        },
      },
    });
  });

  const session = await findSessionDetailsOrThrow(sessionId);
  invalidateSessionCaches(sessionId, mentor.id);

  if (input.type === SessionType.INTRO) {
    await safelySend(
      sendBookingConfirmation(
        session,
        asEmailParticipant(student),
        asEmailParticipant(mentor),
      ),
    );
  }

  return {
    session,
    requiresPayment: input.type === SessionType.PAID,
    paymentOrder: order
      ? {
          orderId: order.id,
          amount: order.amount,
          currency: DEFAULT_CURRENCY,
        }
      : null,
  };
}

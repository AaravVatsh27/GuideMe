/** Which sessions occupy a time slot, conflict checks and the booking lock. */

import { PaymentStatus, Prisma, SessionStatus, SessionType } from "@prisma/client";
import { addMinutes } from "date-fns";
import { db } from "@/Backend/server/db";

import { fitsAvailability, getBookingHoldCutoff, sessionsOverlap } from "./rules";
import { ACTIVE_SESSION_STATUSES, DbClient, SessionApiError } from "./shared";

/**
 * Cancels unpaid holds that have expired and overlap the requested slot, for the mentor or
 * the student. The database refuses two active sessions in the same slot, so an expired
 * hold that the cleanup job hasn't released yet must be cleared before booking over it.
 */
export async function releaseExpiredOverlappingHolds(
  tx: Prisma.TransactionClient,
  mentorId: string,
  studentId: string,
  requested: { scheduledAt: Date; durationMinutes: number },
) {
  const candidates = await tx.session.findMany({
    where: {
      status: SessionStatus.SCHEDULED,
      type: SessionType.PAID,
      createdAt: { lt: getBookingHoldCutoff() },
      payment: { is: { status: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] } } },
      OR: [{ mentorId }, { studentId }],
      scheduledAt: {
        gte: addMinutes(requested.scheduledAt, -180),
        lt: addMinutes(requested.scheduledAt, requested.durationMinutes),
      },
    },
    select: { id: true, scheduledAt: true, durationMinutes: true },
  });

  const expiredIds = candidates
    .filter((session) => sessionsOverlap(session, requested))
    .map((session) => session.id);

  if (expiredIds.length === 0) {
    return;
  }

  await tx.session.updateMany({
    where: { id: { in: expiredIds } },
    data: {
      status: SessionStatus.CANCELLED,
      cancellationReason: "Payment was not completed in time",
      cancelledAt: new Date(),
    },
  });
  await tx.booking.deleteMany({ where: { sessionId: { in: expiredIds } } });
  await tx.payment.updateMany({
    where: { sessionId: { in: expiredIds }, status: PaymentStatus.PENDING },
    data: { status: PaymentStatus.FAILED },
  });
}

/**
 * Sessions that occupy their time slot: active intro sessions, paid sessions whose
 * payment is captured, and paid sessions still inside their unpaid hold window.
 */
export function slotHoldingSessionWhere(now = new Date()): Prisma.SessionWhereInput {
  return {
    status: {
      in: [...ACTIVE_SESSION_STATUSES],
    },
    OR: [
      { type: SessionType.INTRO },
      { createdAt: { gte: getBookingHoldCutoff(now) } },
      { payment: { is: { status: PaymentStatus.CAPTURED } } },
    ],
  };
}

export async function hasConflict(
  client: DbClient,
  userField: "studentId" | "mentorId",
  userId: string,
  requested: {
    scheduledAt: Date;
    durationMinutes: number;
  },
  excludeSessionId?: string,
) {
  const where: Prisma.SessionWhereInput = {
    ...slotHoldingSessionWhere(),
    scheduledAt: {
      gte: addMinutes(requested.scheduledAt, -180),
      lt: addMinutes(requested.scheduledAt, requested.durationMinutes),
    },
    ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
  };

  if (userField === "studentId") {
    where.studentId = userId;
  } else {
    where.mentorId = userId;
  }

  const conflicts = await client.session.findMany({
    where,
    select: {
      id: true,
      scheduledAt: true,
      durationMinutes: true,
    },
  });

  return conflicts.some((session) => sessionsOverlap(session, requested));
}

export async function ensureNoConflict(
  client: DbClient,
  userField: "studentId" | "mentorId",
  userId: string,
  requested: {
    scheduledAt: Date;
    durationMinutes: number;
  },
  label: string,
) {
  if (await hasConflict(client, userField, userId, requested)) {
    throw new SessionApiError(`${label} already has a conflicting session`, 409);
  }
}

/**
 * Serialises bookings for the same mentor and student until the transaction ends,
 * so two concurrent requests cannot both pass the conflict check.
 * Mentor locks are always taken before student locks to avoid deadlocks.
 */
export async function lockBookingParticipants(
  tx: Prisma.TransactionClient,
  mentorId: string,
  studentId: string,
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`session-slot:mentor:${mentorId}`}::text))`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`session-slot:student:${studentId}`}::text))`;
}

export async function findMatchingAvailability(
  mentorId: string,
  scheduledAt: Date,
  durationMinutes: number,
  availabilityId?: string,
) {
  const availabilities = await db.availability.findMany({
    where: {
      mentorId,
      isActive: true,
      ...(availabilityId ? { id: availabilityId } : {}),
    },
    select: {
      id: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      timezone: true,
      specificDate: true,
      isRecurring: true,
    },
  });

  return (
    availabilities.find((availability) =>
      fitsAvailability(availability, scheduledAt, durationMinutes),
    ) ?? null
  );
}

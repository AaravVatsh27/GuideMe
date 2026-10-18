import { randomUUID } from "node:crypto";

import {
  NotificationType,
  PaymentStatus,
  PayoutStatus,
  Prisma,
  SessionStatus,
  SessionType,
} from "@prisma/client";
import { addMinutes } from "date-fns";

import { generateClaudeSessionSummary } from "@/Backend/server/openai";
import {
  DEFAULT_CURRENCY,
  MAX_UNPAID_BOOKING_HOLDS,
  NO_SHOW_REPORT_GRACE_MINUTES,
  NO_SHOW_REPORT_WINDOW_HOURS,
  PLATFORM_CUT,
  SESSION_JOIN_EARLY_WINDOW_MINUTES,
  UNPAID_BOOKING_HOLD_MINUTES,
} from "@/shared/constants";
import { createDailyRoom } from "@/Backend/server/daily";
import { db } from "@/Backend/server/db";
import { createOrder, createRefund } from "@/Backend/server/razorpay";
import {
  sendBookingConfirmation,
  sendReviewRequestEmail,
  sendSessionCancellationEmails,
  sendSessionCompletionEmails,
} from "@/Backend/server/resend";
import type { CreateSessionInput } from "@/Backend/validations/session";
import { cacheDel, cacheDelPattern, cacheKeys } from "@/Backend/lib/cache";
import { log } from "@/Backend/lib/logger";
import { getAppUrl } from "@/Backend/lib/env";

type CreateSessionBookingInput = {
  studentId: string;
  input: CreateSessionInput;
};

type CancelSessionInput = {
  sessionId: string;
  actorId: string;
  reason: string;
  noShow?: boolean;
  /** Admin actions skip the participant and no-show timing checks. */
  asAdmin?: boolean;
};

type StartSessionInput = {
  sessionId: string;
  actorId?: string;
  startedAt?: Date;
};

type CompleteSessionInput = {
  sessionId: string;
  actorId?: string;
  transcript?: string;
  endedAt?: Date;
};

type AvailabilityRecord = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  specificDate: Date | null;
  isRecurring: boolean;
};

function invalidateSessionCaches(sessionId: string, mentorId?: string) {
  const invalidations: Promise<unknown>[] = [cacheDel(cacheKeys.session(sessionId))];

  if (mentorId) {
    invalidations.push(cacheDelPattern(cacheKeys.availabilityPattern(mentorId)));
  }

  Promise.allSettled(invalidations).catch(() => {});
}

type CancellationOutcome = {
  refundPercent: number;
  refundAmount: number;
  status: SessionStatus;
};

const ACTIVE_SESSION_STATUSES = [SessionStatus.SCHEDULED, SessionStatus.ONGOING] as const;
const DAY_OF_WEEK_BY_LABEL: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const sessionParticipantSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  mentorProfile: {
    select: {
      headline: true,
      college: true,
      tier: true,
      priceMin: true,
      priceMax: true,
    },
  },
  studentProfile: {
    select: {
      class: true,
      stream: true,
      targetExam: true,
      languagePreference: true,
    },
  },
});

export const sessionListInclude = Prisma.validator<Prisma.SessionInclude>()({
  mentor: {
    select: sessionParticipantSelect,
  },
  student: {
    select: sessionParticipantSelect,
  },
  payment: {
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      paidAt: true,
      refundAmount: true,
      refundStatus: true,
    },
  },
});

export const sessionDetailsInclude = Prisma.validator<Prisma.SessionInclude>()({
  mentor: {
    select: sessionParticipantSelect,
  },
  student: {
    select: sessionParticipantSelect,
  },
  cancelledByUser: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  payment: true,
  payout: true,
  booking: {
    include: {
      availability: {
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          timezone: true,
          specificDate: true,
          isRecurring: true,
        },
      },
    },
  },
  notes: {
    orderBy: {
      createdAt: "asc",
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      },
    },
  },
  messages: {
    orderBy: {
      createdAt: "asc",
    },
    take: 20,
    select: {
      id: true,
      content: true,
      createdAt: true,
      sender: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
  review: {
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      mentor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  },
});

export type SessionListRecord = Prisma.SessionGetPayload<{
  include: typeof sessionListInclude;
}>;

export type SessionDetailsRecord = Prisma.SessionGetPayload<{
  include: typeof sessionDetailsInclude;
}>;

export class SessionApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "SessionApiError";
  }
}

function getSessionTimeRange(session: {
  scheduledAt: Date;
  durationMinutes: number;
}) {
  return {
    startsAt: session.scheduledAt,
    endsAt: addMinutes(session.scheduledAt, session.durationMinutes),
  };
}

function sessionsOverlap(
  left: { scheduledAt: Date; durationMinutes: number },
  right: { scheduledAt: Date; durationMinutes: number },
) {
  const leftRange = getSessionTimeRange(left);
  const rightRange = getSessionTimeRange(right);

  return leftRange.startsAt < rightRange.endsAt && rightRange.startsAt < leftRange.endsAt;
}

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }

    return acc;
  }, {});
  const weekday = parts.weekday;

  if (!weekday || !(weekday in DAY_OF_WEEK_BY_LABEL)) {
    throw new SessionApiError(`Unsupported weekday value for timezone ${timeZone}`, 500);
  }

  return {
    dayOfWeek: DAY_OF_WEEK_BY_LABEL[weekday],
    timeValue: `${parts.hour}:${parts.minute}`,
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

function fitsAvailability(
  availability: AvailabilityRecord,
  scheduledAt: Date,
  durationMinutes: number,
) {
  const start = getZonedParts(scheduledAt, availability.timezone);
  const end = getZonedParts(addMinutes(scheduledAt, durationMinutes), availability.timezone);

  if (start.dateKey !== end.dateKey) {
    return false;
  }

  if (availability.isRecurring) {
    if (start.dayOfWeek !== availability.dayOfWeek) {
      return false;
    }
  } else if (
    availability.specificDate &&
    availability.specificDate.toISOString().slice(0, 10) !== start.dateKey
  ) {
    return false;
  }

  return (
    start.timeValue >= availability.startTime && end.timeValue <= availability.endTime
  );
}

function calculateSessionAmounts(type: SessionType, price: number) {
  if (type === SessionType.INTRO || price === 0) {
    return {
      platformCut: 0,
      mentorEarning: 0,
    };
  }

  const platformCut = Math.round(price * PLATFORM_CUT);

  return {
    platformCut,
    mentorEarning: price - platformCut,
  };
}

function buildSessionReceipt(sessionId: string) {
  return `gm-${sessionId.replaceAll("-", "").slice(0, 18)}`;
}

function buildAbsoluteUrl(pathname: string) {
  return new URL(pathname, getAppUrl()).toString();
}

function isParticipant(session: { studentId: string; mentorId: string }, userId: string) {
  return session.studentId === userId || session.mentorId === userId;
}

function ensureMentorControlsSession(
  session: { mentorId: string },
  actorId: string | undefined,
  action: "start" | "complete",
) {
  if (!actorId) {
    return;
  }

  if (actorId !== session.mentorId) {
    throw new SessionApiError(`Only the mentor can ${action} this session`, 403);
  }
}

/**
 * Checks against the server clock and returns the start time to record.
 * A client-supplied startedAt is only used when it falls between the earliest
 * allowed start and now.
 */
function resolveSessionStartAt(
  session: { scheduledAt: Date },
  startedAt?: Date,
) {
  const now = new Date();
  const earliestAllowedStart = addMinutes(
    session.scheduledAt,
    -SESSION_JOIN_EARLY_WINDOW_MINUTES,
  );

  if (now < earliestAllowedStart) {
    throw new SessionApiError(
      "Sessions can only be started shortly before the scheduled time",
      409,
      {
        earliestAllowedStart,
      },
    );
  }

  return startedAt && startedAt >= earliestAllowedStart && startedAt <= now ? startedAt : now;
}

/**
 * Checks against the server clock and returns the end time to record.
 * A client-supplied endedAt is only used when it falls between the start time and now.
 */
function resolveSessionEndAt(
  session: { scheduledAt: Date },
  endedAt?: Date,
) {
  const now = new Date();

  if (now < session.scheduledAt) {
    throw new SessionApiError("Sessions cannot be completed before they begin", 409);
  }

  return endedAt && endedAt >= session.scheduledAt && endedAt <= now ? endedAt : now;
}

function ensureNoShowCanBeReported(session: {
  status: SessionStatus;
  startedAt: Date | null;
  scheduledAt: Date;
  durationMinutes: number;
}) {
  if (session.status !== SessionStatus.SCHEDULED || session.startedAt) {
    throw new SessionApiError("A no-show cannot be reported for a session that has started", 409);
  }

  const now = new Date();
  const opensAt = addMinutes(session.scheduledAt, NO_SHOW_REPORT_GRACE_MINUTES);
  const closesAt = addMinutes(
    session.scheduledAt,
    session.durationMinutes + NO_SHOW_REPORT_WINDOW_HOURS * 60,
  );

  if (now < opensAt) {
    throw new SessionApiError(
      `A no-show can be reported ${NO_SHOW_REPORT_GRACE_MINUTES} minutes after the scheduled start`,
      409,
      { opensAt },
    );
  }

  if (now > closesAt) {
    throw new SessionApiError("The window for reporting a no-show has closed", 409);
  }
}

async function findSessionDetailsOrThrow(sessionId: string) {
  const session = await db.session.findUnique({
    where: {
      id: sessionId,
    },
    include: sessionDetailsInclude,
  });

  if (!session) {
    throw new SessionApiError("Session not found", 404);
  }

  return session;
}

type DbClient = Prisma.TransactionClient | typeof db;

export function getBookingHoldCutoff(now = new Date()) {
  return addMinutes(now, -UNPAID_BOOKING_HOLD_MINUTES);
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

async function hasConflict(
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

async function ensureNoConflict(
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
async function lockBookingParticipants(
  tx: Prisma.TransactionClient,
  mentorId: string,
  studentId: string,
) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`session-slot:mentor:${mentorId}`}::text))`;
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`session-slot:student:${studentId}`}::text))`;
}

async function findMatchingAvailability(
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

async function createBookingNotifications(
  tx: Prisma.TransactionClient,
  sessionId: string,
  studentId: string,
  mentorId: string,
) {
  await tx.notification.createMany({
    data: [
      {
        userId: studentId,
        type: NotificationType.SESSION_BOOKED,
        title: "Session confirmed",
        body: "Your intro session has been confirmed.",
        link: `/session/${sessionId}`,
      },
      {
        userId: mentorId,
        type: NotificationType.SESSION_BOOKED,
        title: "New intro booking",
        body: "A student booked an intro session with you.",
        link: `/session/${sessionId}`,
      },
    ],
  });
}

async function createCancellationNotifications(
  tx: Prisma.TransactionClient,
  sessionId: string,
  studentId: string,
  mentorId: string,
  reason: string,
  status: SessionStatus,
) {
  const title =
    status === SessionStatus.NO_SHOW ? "Mentor no-show recorded" : "Session cancelled";

  await tx.notification.createMany({
    data: [
      {
        userId: studentId,
        type: NotificationType.SYSTEM,
        title,
        body: reason,
        link: `/session/${sessionId}`,
      },
      {
        userId: mentorId,
        type: NotificationType.SYSTEM,
        title,
        body: reason,
        link: `/session/${sessionId}`,
      },
    ],
  });
}

async function createCompletionNotifications(
  tx: Prisma.TransactionClient,
  sessionId: string,
  studentId: string,
  mentorId: string,
) {
  await tx.notification.createMany({
    data: [
      {
        userId: studentId,
        type: NotificationType.SESSION_COMPLETED,
        title: "Session completed",
        body: "Your session is complete. Please leave a review for your mentor.",
        link: `/session/${sessionId}`,
      },
      {
        userId: mentorId,
        type: NotificationType.SESSION_COMPLETED,
        title: "Session completed",
        body: "Your session has been marked complete and the payout is queued.",
        link: `/session/${sessionId}`,
      },
    ],
  });
}

async function safelySend<T>(promise: Promise<T>) {
  try {
    await promise;
  } catch (error) {
    log.error("Session side-effect delivery failed", error, {
      requestId: "system",
      route: "sessions",
    });
  }
}

function asEmailParticipant<T extends { name: string; email: string }>(participant: T) {
  return participant;
}

function calculateCancellationOutcome(
  session: {
    mentorId: string;
    scheduledAt: Date;
    type: SessionType;
    price: number;
  },
  actorId: string,
  noShow?: boolean,
): CancellationOutcome {
  if (session.type === SessionType.INTRO || session.price === 0) {
    return {
      refundPercent: 0,
      refundAmount: 0,
      status: noShow ? SessionStatus.NO_SHOW : SessionStatus.CANCELLED,
    };
  }

  if (noShow) {
    return {
      refundPercent: 100,
      refundAmount: session.price,
      status: SessionStatus.NO_SHOW,
    };
  }

  if (actorId === session.mentorId) {
    return {
      refundPercent: 100,
      refundAmount: session.price,
      status: SessionStatus.CANCELLED,
    };
  }

  const millisecondsUntilSession = session.scheduledAt.getTime() - Date.now();
  const hoursUntilSession = millisecondsUntilSession / (60 * 60 * 1000);

  if (hoursUntilSession > 24) {
    return {
      refundPercent: 100,
      refundAmount: session.price,
      status: SessionStatus.CANCELLED,
    };
  }

  if (hoursUntilSession >= 12) {
    return {
      refundPercent: 50,
      refundAmount: Math.round(session.price * 0.5),
      status: SessionStatus.CANCELLED,
    };
  }

  return {
    refundPercent: 0,
    refundAmount: 0,
    status: SessionStatus.CANCELLED,
  };
}

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

export async function cancelSessionById({
  sessionId,
  actorId,
  reason,
  noShow,
  asAdmin = false,
}: CancelSessionInput) {
  const session = await findSessionDetailsOrThrow(sessionId);

  if (!asAdmin && !isParticipant(session, actorId)) {
    throw new SessionApiError("You do not have access to this session", 403);
  }

  if (session.status === SessionStatus.COMPLETED) {
    throw new SessionApiError("Completed sessions cannot be cancelled", 409);
  }

  if (session.status === SessionStatus.CANCELLED || session.status === SessionStatus.NO_SHOW) {
    return {
      session,
      refundAmount: session.payment?.refundAmount ?? 0,
      refundPercent:
        session.payment?.refundStatus === PaymentStatus.REFUNDED
          ? 100
          : session.payment?.refundStatus === PaymentStatus.PARTIALLY_REFUNDED
            ? 50
            : 0,
      refundId: session.payment?.refundId ?? null,
    };
  }

  if (noShow && !asAdmin) {
    if (actorId !== session.studentId) {
      throw new SessionApiError("Only the student can report a mentor no-show", 403);
    }

    ensureNoShowCanBeReported(session);
  }

  const outcome = calculateCancellationOutcome(session, actorId, noShow);
  const now = new Date();
  let refundId: string | null = null;

  if (
    outcome.refundAmount > 0 &&
    session.payment?.razorpayPaymentId &&
    session.payment.status === PaymentStatus.CAPTURED
  ) {
    const refund = await createRefund(session.payment.razorpayPaymentId, outcome.refundAmount);
    refundId = refund.id;
  }

  await db.$transaction(async (tx) => {
    await tx.session.update({
      where: {
        id: sessionId,
      },
      data: {
        status: outcome.status,
        cancelledBy: actorId,
        cancellationReason: reason,
        cancelledAt: now,
        endedAt: outcome.status === SessionStatus.NO_SHOW ? now : undefined,
      },
    });

    await tx.booking.deleteMany({
      where: {
        sessionId,
      },
    });

    await tx.payout.deleteMany({
      where: {
        sessionId,
        status: {
          in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING],
        },
      },
    });

    if (session.payment) {
      const paymentUpdate: Prisma.PaymentUncheckedUpdateInput = {};

      if (refundId) {
        paymentUpdate.refundId = refundId;
        paymentUpdate.refundAmount = outcome.refundAmount;
        paymentUpdate.refundedAt = now;
        paymentUpdate.refundStatus =
          outcome.refundPercent === 100
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED;
        paymentUpdate.status =
          outcome.refundPercent === 100
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIALLY_REFUNDED;
      } else if (session.payment.status === PaymentStatus.PENDING) {
        paymentUpdate.status = PaymentStatus.FAILED;
      }

      if (Object.keys(paymentUpdate).length > 0) {
        await tx.payment.update({
          where: {
            sessionId,
          },
          data: paymentUpdate,
        });
      }
    }

    await createCancellationNotifications(
      tx,
      sessionId,
      session.studentId,
      session.mentorId,
      reason,
      outcome.status,
    );

    await tx.auditLog.create({
      data: {
        userId: actorId,
        action: outcome.status === SessionStatus.NO_SHOW ? "MENTOR_NO_SHOW" : "SESSION_CANCELLED",
        entityType: "Session",
        entityId: sessionId,
        metadata: {
          refundPercent: outcome.refundPercent,
          refundAmount: outcome.refundAmount,
        },
      },
    });
  });

  invalidateSessionCaches(sessionId, session.mentorId);
  const updatedSession = await findSessionDetailsOrThrow(sessionId);
  const cancelledByName = asAdmin
    ? "GuideMe support"
    : actorId === session.mentorId
      ? session.mentor.name
      : session.student.name;

  await safelySend(
    sendSessionCancellationEmails(
      updatedSession,
      asEmailParticipant(session.student),
      asEmailParticipant(session.mentor),
      {
        cancelledByName,
        reason,
        refundAmount: outcome.refundAmount,
        isNoShow: outcome.status === SessionStatus.NO_SHOW,
      },
    ),
  );

  return {
    session: updatedSession,
    refundAmount: outcome.refundAmount,
    refundPercent: outcome.refundPercent,
    refundId,
  };
}

export async function markSessionStarted({
  sessionId,
  actorId,
  startedAt,
}: StartSessionInput) {
  const session = await findSessionDetailsOrThrow(sessionId);

  ensureMentorControlsSession(session, actorId, "start");

  if (
    session.status === SessionStatus.CANCELLED ||
    session.status === SessionStatus.COMPLETED ||
    session.status === SessionStatus.NO_SHOW
  ) {
    throw new SessionApiError("This session cannot be started", 409);
  }

  if (
    session.type === SessionType.PAID &&
    session.payment?.status !== PaymentStatus.CAPTURED
  ) {
    throw new SessionApiError("Paid sessions can only start after payment is captured", 409);
  }

  if (session.status === SessionStatus.ONGOING) {
    return session;
  }

  const effectiveStartedAt = resolveSessionStartAt(session, startedAt);

  await db.session.update({
    where: {
      id: sessionId,
    },
    data: {
      status: SessionStatus.ONGOING,
      startedAt: session.startedAt ?? effectiveStartedAt,
    },
  });

  invalidateSessionCaches(sessionId);
  return findSessionDetailsOrThrow(sessionId);
}

export async function completeSessionById({
  sessionId,
  actorId,
  transcript,
  endedAt,
}: CompleteSessionInput) {
  const session = await findSessionDetailsOrThrow(sessionId);

  ensureMentorControlsSession(session, actorId, "complete");

  if (session.status === SessionStatus.COMPLETED) {
    return session;
  }

  if (session.status === SessionStatus.CANCELLED || session.status === SessionStatus.NO_SHOW) {
    throw new SessionApiError("Cancelled sessions cannot be completed", 409);
  }

  if (
    session.type === SessionType.PAID &&
    session.payment?.status !== PaymentStatus.CAPTURED
  ) {
    throw new SessionApiError("Paid sessions can only complete after payment is captured", 409);
  }

  const completedAt = resolveSessionEndAt(session, endedAt);

  const reviewLink = buildAbsoluteUrl(`/session/${sessionId}?review=1`);
  const summary =
    session.aiSummary ??
    (await generateClaudeSessionSummary({
      sessionId,
      sessionType: session.type,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      studentName: session.student.name,
      mentorName: session.mentor.name,
      transcript: transcript?.trim() || null,
      noteLines: session.notes
        .map((note) => note.content.trim())
        .filter(Boolean)
        .slice(0, 8),
      messageLines: session.messages
        .map((message) => `${message.sender.name}: ${message.content.trim()}`)
        .filter(Boolean)
        .slice(-12),
    }));

  await db.$transaction(async (tx) => {
    await tx.session.update({
      where: {
        id: sessionId,
      },
      data: {
        status: SessionStatus.COMPLETED,
        startedAt: session.startedAt ?? session.scheduledAt,
        endedAt: session.endedAt ?? completedAt,
        aiSummary: summary,
      },
    });

    const existingPayout = await tx.payout.findUnique({
      where: {
        sessionId,
      },
    });

    if (!existingPayout) {
      await tx.payout.create({
        data: {
          mentorId: session.mentorId,
          sessionId,
          amount: session.mentorEarning,
          status: PayoutStatus.PENDING,
          scheduledAt: completedAt,
        },
      });
    }

    await tx.mentorProfile.updateMany({
      where: {
        userId: session.mentorId,
      },
      data: {
        totalSessions: {
          increment: 1,
        },
      },
    });
    await createCompletionNotifications(tx, sessionId, session.studentId, session.mentorId);

    await tx.auditLog.create({
      data: {
        userId: actorId ?? session.mentorId,
        action: "SESSION_COMPLETED",
        entityType: "Session",
        entityId: sessionId,
      },
    });
  });

  invalidateSessionCaches(sessionId);
  const updatedSession = await findSessionDetailsOrThrow(sessionId);

  await Promise.allSettled([
    safelySend(
      sendSessionCompletionEmails(
        updatedSession,
        asEmailParticipant(session.student),
        asEmailParticipant(session.mentor),
        summary,
      ),
    ),
    safelySend(
      sendReviewRequestEmail(
        updatedSession,
        asEmailParticipant(session.student),
        asEmailParticipant(session.mentor),
        reviewLink,
      ),
    ),
  ]);

  return updatedSession;
}

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

export function isBookingHoldExpired(
  session: { type: SessionType; createdAt: Date },
  paymentStatus: PaymentStatus | null | undefined,
) {
  return (
    session.type === SessionType.PAID &&
    paymentStatus !== PaymentStatus.CAPTURED &&
    session.createdAt < getBookingHoldCutoff()
  );
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
      price: true,
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
      price: true,
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
  session: { id: string; price: number; studentId: string; mentorId: string };
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

  const refund = await createRefund(razorpayPaymentId, session.price);
  const now = new Date();

  await db.$transaction(async (tx) => {
    await tx.payment.update({
      where: { sessionId: session.id },
      data: {
        status: PaymentStatus.REFUNDED,
        refundStatus: PaymentStatus.REFUNDED,
        refundId: refund.id,
        refundAmount: session.price,
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
        metadata: { refundId: refund.id, amount: session.price },
      },
    });
  });

  invalidateSessionCaches(session.id, session.mentorId);
  return true;
}

function withEmailVisibleTo<T extends { id: string; email: string }>(user: T, viewerId: string): T {
  return user.id === viewerId ? user : { ...user, email: "" };
}

/**
 * Shapes a session list record for one participant, hiding the other participant's email.
 */
export function toSessionListView(session: SessionListRecord, viewerId: string) {
  return {
    ...session,
    mentor: withEmailVisibleTo(session.mentor, viewerId),
    student: withEmailVisibleTo(session.student, viewerId),
  };
}

/**
 * Shapes a session details record for one participant: hides the other participant's
 * email, internal payment identifiers, and payout details unless the viewer is the mentor.
 */
export function toSessionView(session: SessionDetailsRecord, viewerId: string) {
  const { payment, payout, ...rest } = session;

  return {
    ...rest,
    mentor: withEmailVisibleTo(session.mentor, viewerId),
    student: withEmailVisibleTo(session.student, viewerId),
    cancelledByUser: session.cancelledByUser
      ? withEmailVisibleTo(session.cancelledByUser, viewerId)
      : null,
    notes: session.notes.map((note) => ({
      ...note,
      author: withEmailVisibleTo(note.author, viewerId),
    })),
    review: session.review
      ? {
          ...session.review,
          student: withEmailVisibleTo(session.review.student, viewerId),
          mentor: withEmailVisibleTo(session.review.mentor, viewerId),
        }
      : null,
    payment: payment
      ? {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paidAt: payment.paidAt,
          refundAmount: payment.refundAmount,
          refundStatus: payment.refundStatus,
          refundedAt: payment.refundedAt,
        }
      : null,
    payout:
      payout && viewerId === session.mentorId
        ? {
            id: payout.id,
            amount: payout.amount,
            status: payout.status,
            scheduledAt: payout.scheduledAt,
            processedAt: payout.processedAt,
            transactionId: payout.transactionId,
          }
        : null,
  };
}

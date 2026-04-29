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

import { generateClaudeSessionSummary } from "@/lib/claude";
import { DEFAULT_CURRENCY, PLATFORM_CUT } from "@/lib/constants";
import { createDailyRoom } from "@/lib/daily";
import { db } from "@/lib/db";
import { createOrder, createRefund } from "@/lib/razorpay";
import {
  sendBookingConfirmation,
  sendReviewRequestEmail,
  sendSessionCancellationEmails,
  sendSessionCompletionEmails,
} from "@/lib/resend";
import type { CreateSessionInput } from "@/lib/validations/session";

type CreateSessionBookingInput = {
  studentId: string;
  input: CreateSessionInput;
};

type CancelSessionInput = {
  sessionId: string;
  actorId: string;
  reason: string;
  noShow?: boolean;
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
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    "http://localhost:3000";

  return new URL(pathname, baseUrl).toString();
}

function isParticipant(session: { studentId: string; mentorId: string }, userId: string) {
  return session.studentId === userId || session.mentorId === userId;
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

async function ensureNoConflict(
  userField: "studentId" | "mentorId",
  userId: string,
  requested: {
    scheduledAt: Date;
    durationMinutes: number;
  },
  label: string,
) {
  const where: Prisma.SessionWhereInput = {
    status: {
      in: [...ACTIVE_SESSION_STATUSES],
    },
    scheduledAt: {
      gte: addMinutes(requested.scheduledAt, -180),
      lt: addMinutes(requested.scheduledAt, requested.durationMinutes),
    },
  };

  if (userField === "studentId") {
    where.studentId = userId;
  } else {
    where.mentorId = userId;
  }

  const conflicts = await db.session.findMany({
    where,
    select: {
      id: true,
      scheduledAt: true,
      durationMinutes: true,
    },
  });

  const hasConflict = conflicts.some((session) =>
    sessionsOverlap(session, requested),
  );

  if (hasConflict) {
    throw new SessionApiError(`${label} already has a conflicting session`, 409);
  }
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
    console.error(error);
  }
}

function asEmailParticipant(participant: { name: string; email: string }) {
  return {
    name: participant.name,
    email: participant.email,
  };
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

  await Promise.all([
    ensureNoConflict(
      "studentId",
      studentId,
      {
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
      },
      "Student",
    ),
    ensureNoConflict(
      "mentorId",
      mentor.id,
      {
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes,
      },
      "Mentor",
    ),
  ]);

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
          amount: input.price,
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
}: CancelSessionInput) {
  const session = await findSessionDetailsOrThrow(sessionId);

  if (!isParticipant(session, actorId)) {
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

  if (noShow && actorId !== session.studentId) {
    throw new SessionApiError("Only the student can report a mentor no-show", 403);
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

  const updatedSession = await findSessionDetailsOrThrow(sessionId);
  const canceller =
    actorId === session.mentorId ? session.mentor : session.student;

  await safelySend(
    sendSessionCancellationEmails(
      updatedSession,
      asEmailParticipant(session.student),
      asEmailParticipant(session.mentor),
      {
        cancelledByName: canceller.name,
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

  if (actorId && !isParticipant(session, actorId)) {
    throw new SessionApiError("You do not have access to this session", 403);
  }

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

  await db.session.update({
    where: {
      id: sessionId,
    },
    data: {
      status: SessionStatus.ONGOING,
      startedAt: startedAt ?? session.startedAt ?? new Date(),
    },
  });

  return findSessionDetailsOrThrow(sessionId);
}

export async function completeSessionById({
  sessionId,
  actorId,
  transcript,
  endedAt,
}: CompleteSessionInput) {
  const session = await findSessionDetailsOrThrow(sessionId);

  if (actorId && !isParticipant(session, actorId)) {
    throw new SessionApiError("You do not have access to this session", 403);
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
  const completedAt = endedAt ?? new Date();
  const sessionWasAlreadyCompleted = session.status === SessionStatus.COMPLETED;

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

    if (!sessionWasAlreadyCompleted) {
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
    }
  });

  const updatedSession = await findSessionDetailsOrThrow(sessionId);

  if (!sessionWasAlreadyCompleted) {
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
  }

  return updatedSession;
}

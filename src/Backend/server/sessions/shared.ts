/** Types, Prisma includes and small helpers used across the session modules. */

import { Prisma, SessionStatus } from "@prisma/client";
import { db } from "@/Backend/server/db";
import type { CreateSessionInput } from "@/Backend/validations/session";
import { cacheDel, cacheDelPattern, cacheKeys } from "@/Backend/lib/cache";
import { log } from "@/Backend/lib/logger";

export type CreateSessionBookingInput = {
  studentId: string;
  input: CreateSessionInput;
};

export type CancelSessionInput = {
  sessionId: string;
  actorId: string;
  reason: string;
  noShow?: boolean;
  /** Admin actions skip the participant and no-show timing checks. */
  asAdmin?: boolean;
};

export type StartSessionInput = {
  sessionId: string;
  actorId?: string;
  startedAt?: Date;
};

export type CompleteSessionInput = {
  sessionId: string;
  actorId?: string;
  transcript?: string;
  endedAt?: Date;
};

export type AvailabilityRecord = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  specificDate: Date | null;
  isRecurring: boolean;
};

export function invalidateSessionCaches(sessionId: string, mentorId?: string) {
  const invalidations: Promise<unknown>[] = [cacheDel(cacheKeys.session(sessionId))];

  if (mentorId) {
    invalidations.push(cacheDelPattern(cacheKeys.availabilityPattern(mentorId)));
  }

  Promise.allSettled(invalidations).catch(() => {});
}

export type CancellationOutcome = {
  refundPercent: number;
  refundAmount: number;
  status: SessionStatus;
};

export const ACTIVE_SESSION_STATUSES = [SessionStatus.SCHEDULED, SessionStatus.ONGOING] as const;

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

export function isParticipant(session: { studentId: string; mentorId: string }, userId: string) {
  return session.studentId === userId || session.mentorId === userId;
}

export async function findSessionDetailsOrThrow(sessionId: string) {
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

export type DbClient = Prisma.TransactionClient | typeof db;

export async function safelySend<T>(promise: Promise<T>) {
  try {
    await promise;
  } catch (error) {
    log.error("Session side-effect delivery failed", error, {
      requestId: "system",
      route: "sessions",
    });
  }
}

export function asEmailParticipant<T extends { name: string; email: string }>(participant: T) {
  return participant;
}

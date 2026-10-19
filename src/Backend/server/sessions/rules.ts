/** Pure session rules (time windows, pricing, cancellation and refund policy). No database access, so they are easy to unit test. */

import { PaymentStatus, SessionStatus, SessionType } from "@prisma/client";
import { addMinutes } from "date-fns";
import { NO_SHOW_REPORT_GRACE_MINUTES, NO_SHOW_REPORT_WINDOW_HOURS, PLATFORM_CUT, SESSION_JOIN_EARLY_WINDOW_MINUTES, UNPAID_BOOKING_HOLD_MINUTES } from "@/shared/constants";
import { getAppUrl } from "@/Backend/lib/env";

import { AvailabilityRecord, CancellationOutcome, SessionApiError } from "./shared";

const DAY_OF_WEEK_BY_LABEL: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getSessionTimeRange(session: {
  scheduledAt: Date;
  durationMinutes: number;
}) {
  return {
    startsAt: session.scheduledAt,
    endsAt: addMinutes(session.scheduledAt, session.durationMinutes),
  };
}

export function sessionsOverlap(
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

export function fitsAvailability(
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

export function calculateSessionAmounts(type: SessionType, price: number) {
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

export function buildSessionReceipt(sessionId: string) {
  return `gm-${sessionId.replaceAll("-", "").slice(0, 18)}`;
}

export function buildAbsoluteUrl(pathname: string) {
  return new URL(pathname, getAppUrl()).toString();
}

export function ensureMentorControlsSession(
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
export function resolveSessionStartAt(
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
export function resolveSessionEndAt(
  session: { scheduledAt: Date },
  endedAt?: Date,
) {
  const now = new Date();

  if (now < session.scheduledAt) {
    throw new SessionApiError("Sessions cannot be completed before they begin", 409);
  }

  return endedAt && endedAt >= session.scheduledAt && endedAt <= now ? endedAt : now;
}

export function ensureNoShowCanBeReported(session: {
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

export function calculateCancellationOutcome(
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

export function getBookingHoldCutoff(now = new Date()) {
  return addMinutes(now, -UNPAID_BOOKING_HOLD_MINUTES);
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

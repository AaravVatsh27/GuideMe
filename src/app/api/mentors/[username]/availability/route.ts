import { addDays, addMinutes } from "date-fns";
import { NextResponse } from "next/server";

import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { cacheGet, cacheKeys, cacheSet, cacheTtl } from "@/Backend/lib/cache";
import { generalLimiter } from "@/Backend/lib/ratelimit";
import { DEFAULT_TIMEZONE, SESSION_DURATIONS } from "@/Backend/server/constants";
import { db } from "@/Backend/server/db";
import { slotHoldingSessionWhere } from "@/Backend/server/sessions";

type RouteParams = { params: Promise<{ username: string }> };

type SlotsByDate = Record<string, Set<string>>;
type AvailabilityResponse = Array<{
  date: string;
  slots: string[];
}>;

// The booking page reads slot dates and times as IST, so labels are always produced in IST.
const IST_TIMEZONE = "Asia/Kolkata";
const LOOKAHEAD_DAYS = 14;
const SLOT_STEP_MINUTES = 60;
// A slot is offered only if the shortest paid session fits before the window ends.
const MIN_SLOT_MINUTES = SESSION_DURATIONS[0];
// Look back this far for sessions that started earlier but still overlap upcoming slots.
const BOOKED_LOOKBACK_MINUTES = 180;

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const formatterCache = new Map<string, Intl.DateTimeFormat>();

function resolveTimeZone(timeZone: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

function getZonedParts(date: Date, timeZone: string) {
  let formatter = formatterCache.get(timeZone);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    formatterCache.set(timeZone, formatter);
  }

  const parts: Record<string, string> = {};

  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") {
      parts[part.type] = part.value;
    }
  }

  return {
    dateKey: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    dayOfWeek: WEEKDAY_INDEX[parts.weekday] ?? 0,
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return asUtc - Math.floor(date.getTime() / 1000) * 1000;
}

/** Converts a wall-clock date and time in `timeZone` to the matching instant. */
function zonedTimeToDate(dateKey: string, time: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute);

  const firstGuess = wallClockAsUtc - getTimeZoneOffsetMs(new Date(wallClockAsUtc), timeZone);
  const offsetAtGuess = getTimeZoneOffsetMs(new Date(firstGuess), timeZone);

  return new Date(wallClockAsUtc - offsetAtGuess);
}

export const GET = withApiErrorHandling(async (request: Request, context: RouteParams) => {
  const { username } = await context.params;

  const denied = await applyRateLimit(generalLimiter, getRateLimitId(request));
  if (denied) return denied;

  if (!username || username.length < 2) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const mentor = await db.user.findFirst({
    where: {
      role: "MENTOR",
      isActive: true,
      deletedAt: null,
      onboardingComplete: true,
      mentorProfile: {
        is: {
          username,
          isActive: true,
          isAvailable: true,
          isVerified: true,
        },
      },
    },
    select: { id: true },
  });

  if (!mentor) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  const now = new Date();
  // Keyed by today's IST date only; client input never becomes part of the cache key.
  const cacheKey = cacheKeys.availability(mentor.id, getZonedParts(now, IST_TIMEZONE).dateKey);
  const cached = await cacheGet<AvailabilityResponse>(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  const horizon = addDays(now, LOOKAHEAD_DAYS);
  const [availabilities, bookedSessions] = await Promise.all([
    db.availability.findMany({
      where: {
        mentorId: mentor.id,
        isActive: true,
        OR: [{ isRecurring: true }, { specificDate: { gte: addDays(now, -1), lte: horizon } }],
      },
      select: {
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        timezone: true,
        isRecurring: true,
        specificDate: true,
      },
    }),
    db.session.findMany({
      where: {
        ...slotHoldingSessionWhere(now),
        mentorId: mentor.id,
        scheduledAt: { gte: addMinutes(now, -BOOKED_LOOKBACK_MINUTES), lte: horizon },
      },
      select: {
        scheduledAt: true,
        durationMinutes: true,
      },
    }),
  ]);

  const bookedRanges = bookedSessions.map((session) => ({
    start: session.scheduledAt.getTime(),
    end: addMinutes(session.scheduledAt, session.durationMinutes).getTime(),
  }));

  const isBooked = (slotStart: Date) => {
    const start = slotStart.getTime();
    const end = addMinutes(slotStart, MIN_SLOT_MINUTES).getTime();
    return bookedRanges.some((range) => start < range.end && range.start < end);
  };

  const slotsByDate: SlotsByDate = {};

  for (const availability of availabilities) {
    const timeZone = resolveTimeZone(availability.timezone);
    const specificDateKey = availability.specificDate?.toISOString().slice(0, 10) ?? null;

    // One extra day so windows that begin before "now" in a timezone behind IST are covered.
    for (let dayOffset = -1; dayOffset <= LOOKAHEAD_DAYS; dayOffset += 1) {
      const localDay = getZonedParts(addDays(now, dayOffset), timeZone);
      const matches = availability.isRecurring
        ? availability.dayOfWeek === localDay.dayOfWeek
        : specificDateKey === localDay.dateKey;

      if (!matches) {
        continue;
      }

      const windowStart = zonedTimeToDate(localDay.dateKey, availability.startTime, timeZone);
      const windowEnd = zonedTimeToDate(localDay.dateKey, availability.endTime, timeZone);

      for (
        let slotStart = windowStart;
        addMinutes(slotStart, MIN_SLOT_MINUTES) <= windowEnd;
        slotStart = addMinutes(slotStart, SLOT_STEP_MINUTES)
      ) {
        if (slotStart <= now || slotStart > horizon || isBooked(slotStart)) {
          continue;
        }

        const label = getZonedParts(slotStart, IST_TIMEZONE);
        (slotsByDate[label.dateKey] ??= new Set()).add(label.time);
      }
    }
  }

  const response: AvailabilityResponse = Object.keys(slotsByDate)
    .sort()
    .map((date) => ({
      date,
      slots: Array.from(slotsByDate[date]).sort(),
    }));

  cacheSet(cacheKey, response, cacheTtl.mentorAvailability).catch(() => {});

  return NextResponse.json(response);
}, "/api/mentors/[username]/availability");

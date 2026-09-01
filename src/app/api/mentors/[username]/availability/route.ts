import { addDays } from "date-fns";
import { NextResponse } from "next/server";

import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { cacheGet, cacheKeys, cacheSet, cacheTtl } from "@/Backend/lib/cache";
import { generalLimiter } from "@/Backend/lib/ratelimit";
import { db } from "@/Backend/server/db";

type RouteParams = { params: Promise<{ username: string }> };

type SlotsByDate = Record<string, string[]>;
type AvailabilityResponse = Array<{
  date: string;
  slots: string[];
}>;

const IST_TIMEZONE = "Asia/Kolkata";

function getIstDateString(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getIstTimeString(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function getIstHour(date: Date) {
  return Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: IST_TIMEZONE,
      hour: "2-digit",
      hour12: false,
    }).format(date),
  );
}

function getIstDayOfWeek(date: Date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    weekday: "short",
  }).format(date);
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return weekdayMap[weekday] ?? date.getDay();
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

  const cacheDate = new URL(request.url).searchParams.get("date")?.trim() || getIstDateString(new Date());
  const cacheKey = cacheKeys.availability(mentor.id, cacheDate);
  const cached = await cacheGet<AvailabilityResponse>(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  const now = new Date();
  const endDate = addDays(now, 14);
  const [availabilities, bookedSessions] = await Promise.all([
    db.availability.findMany({
      where: {
        mentorId: mentor.id,
        isActive: true,
        OR: [{ isRecurring: true }, { specificDate: { gte: now, lte: endDate } }],
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isRecurring: true,
        specificDate: true,
      },
    }),
    db.session.findMany({
      where: {
        mentorId: mentor.id,
        status: { in: ["SCHEDULED", "ONGOING"] },
        scheduledAt: { gte: now, lte: endDate },
      },
      select: {
        scheduledAt: true,
      },
    }),
  ]);

  const bookedSet = new Set<string>();

  for (const session of bookedSessions) {
    bookedSet.add(`${getIstDateString(session.scheduledAt)}|${getIstTimeString(session.scheduledAt)}`);
  }

  const slotsByDate: SlotsByDate = {};

  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const date = addDays(now, dayOffset);
    const dateStr = getIstDateString(date);
    const dayOfWeek = getIstDayOfWeek(date);
    const daySlots: string[] = [];

    for (const availability of availabilities) {
      const isRecurringMatch = availability.isRecurring && availability.dayOfWeek === dayOfWeek;
      const isSpecificDateMatch =
        availability.specificDate !== null &&
        getIstDateString(availability.specificDate) === dateStr;

      if (!isRecurringMatch && !isSpecificDateMatch) {
        continue;
      }

      const startHour = Number.parseInt(availability.startTime.split(":")[0] ?? "0", 10);
      const endHour = Number.parseInt(availability.endTime.split(":")[0] ?? "0", 10);

      for (let hour = startHour; hour < endHour; hour += 1) {
        const slot = `${hour.toString().padStart(2, "0")}:00`;

        if (dayOffset === 0 && hour <= getIstHour(now)) {
          continue;
        }

        if (bookedSet.has(`${dateStr}|${slot}`)) {
          continue;
        }

        if (!daySlots.includes(slot)) {
          daySlots.push(slot);
        }
      }
    }

    if (daySlots.length > 0) {
      daySlots.sort();
      slotsByDate[dateStr] = daySlots;
    }
  }

  const response = Object.entries(slotsByDate).map(([date, slots]) => ({
    date,
    slots,
  }));

  cacheSet(cacheKey, response, cacheTtl.mentorAvailability).catch(() => {});

  return NextResponse.json(response);
}, "/api/mentors/[username]/availability");

import { addDays, format } from "date-fns";
import { NextResponse } from "next/server";

import { db } from "@/server/db";

type RouteParams = { params: Promise<{ username: string }> };

type SlotsByDate = Record<string, string[]>;

export async function GET(_request: Request, context: RouteParams) {
  const { username } = await context.params;

  if (!username || username.length < 2) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  try {
    const mentor = await db.mentorProfile.findUnique({
      where: { username },
      select: { userId: true },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const now = new Date();
    const endDate = addDays(now, 14);

    // Fetch active availability slots
    const availabilities = await db.availability.findMany({
      where: {
        mentorId: mentor.userId,
        isActive: true,
        OR: [
          { isRecurring: true },
          { specificDate: { gte: now, lte: endDate } },
        ],
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isRecurring: true,
        specificDate: true,
        timezone: true,
      },
    });

    // Fetch booked sessions in the next 14 days
    const bookedSessions = await db.session.findMany({
      where: {
        mentorId: mentor.userId,
        status: { in: ["SCHEDULED", "ONGOING"] },
        scheduledAt: { gte: now, lte: endDate },
      },
      select: {
        scheduledAt: true,
        durationMinutes: true,
      },
    });

    // Build booked time set — key is "YYYY-MM-DD|HH:00"
    const bookedSet = new Set<string>();
    for (const session of bookedSessions) {
      const dateStr = format(session.scheduledAt, "yyyy-MM-dd");
      const hour = session.scheduledAt.getHours();
      // Mark each hour slot covered by the session as booked
      const slotsNeeded = Math.ceil(session.durationMinutes / 60);
      for (let i = 0; i < slotsNeeded; i++) {
        const slotHour = (hour + i).toString().padStart(2, "0");
        bookedSet.add(`${dateStr}|${slotHour}:00`);
      }
    }

    // Generate available slots for next 14 days
    const slotsByDate: SlotsByDate = {};

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const date = addDays(now, dayOffset);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat

      const daySlots: string[] = [];

      for (const avail of availabilities) {
        const isMatch =
          avail.isRecurring && avail.dayOfWeek === dayOfWeek
            ? true
            : avail.specificDate
              ? format(avail.specificDate, "yyyy-MM-dd") === dateStr
              : false;

        if (!isMatch) continue;

        // Expand slot range into individual hour slots
        const startHour = parseInt(avail.startTime.split(":")[0], 10);
        const endHour = parseInt(avail.endTime.split(":")[0], 10);

        for (let h = startHour; h < endHour; h++) {
          const slot = `${h.toString().padStart(2, "0")}:00`;
          const key = `${dateStr}|${slot}`;

          // Skip past slots for today
          if (dayOffset === 0 && h <= now.getHours()) continue;

          // Skip booked slots
          if (bookedSet.has(key)) continue;

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

    const result = Object.entries(slotsByDate).map(([date, slots]) => ({
      date,
      slots,
    }));

    return NextResponse.json({
      mentor: username,
      daysAhead: 14,
      timezone: availabilities[0]?.timezone ?? "Asia/Kolkata",
      availability: result,
    });
  } catch (error) {
    console.error("[mentors/availability]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

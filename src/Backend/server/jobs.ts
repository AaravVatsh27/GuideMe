import { NotificationType, PaymentStatus, SessionStatus, SessionType } from "@prisma/client";
import { addMinutes, subDays } from "date-fns";

import { getAppUrl } from "@/Backend/lib/env";
import { log } from "@/Backend/lib/logger";
import { db } from "@/Backend/server/db";
import { sendSessionReminder } from "@/Backend/server/resend";
import { expireUnpaidBooking, getBookingHoldCutoff } from "@/Backend/server/sessions";

/**
 * Scheduled jobs, run by /api/cron/[job]. Each job is safe to run again: work that is
 * already done is skipped, so a retried or overlapping run doesn't repeat it.
 */

// Remind participants when their session starts within this window.
const REMINDER_LEAD_MINUTES = 60;
// Read notifications older than this are deleted. Audit logs are kept.
const NOTIFICATION_RETENTION_DAYS = 180;
const BATCH_SIZE = 100;

/** Sends a reminder (email + in-app notification) about an hour before each session. */
export async function sendUpcomingSessionReminders() {
  const now = new Date();
  const sessions = await db.session.findMany({
    where: {
      status: SessionStatus.SCHEDULED,
      scheduledAt: { gt: now, lte: addMinutes(now, REMINDER_LEAD_MINUTES) },
      OR: [
        { type: SessionType.INTRO },
        { payment: { is: { status: PaymentStatus.CAPTURED } } },
      ],
    },
    select: {
      id: true,
      type: true,
      scheduledAt: true,
      durationMinutes: true,
      pricePaise: true,
      studentId: true,
      mentorId: true,
      student: { select: { name: true, email: true } },
      mentor: { select: { name: true, email: true } },
    },
    take: BATCH_SIZE,
  });

  let sent = 0;

  for (const session of sessions) {
    const link = `/session/${session.id}`;
    const alreadyReminded = await db.notification.findFirst({
      where: { type: NotificationType.SESSION_REMINDER, link },
      select: { id: true },
    });

    if (alreadyReminded) {
      continue;
    }

    await db.notification.createMany({
      data: [session.studentId, session.mentorId].map((userId) => ({
        userId,
        type: NotificationType.SESSION_REMINDER,
        title: "Your session starts soon",
        body: "Join a few minutes early so you can start on time.",
        link,
      })),
    });

    // The email links to the session page, which issues a meeting token; the raw room
    // URL would not let anyone in because the room is private.
    const emailSession = { ...session, meetingLink: `${getAppUrl()}${link}` };
    const results = await Promise.allSettled([
      sendSessionReminder(emailSession, session.student),
      sendSessionReminder(emailSession, session.mentor),
    ]);

    for (const result of results) {
      if (result.status === "rejected") {
        log.error("Session reminder email failed", result.reason, {
          requestId: "cron",
          route: "jobs.sendUpcomingSessionReminders",
          sessionId: session.id,
        });
      }
    }

    sent += 1;
  }

  return { checked: sessions.length, reminded: sent };
}

/** Cancels paid bookings whose unpaid hold expired, so they stop showing as scheduled. */
export async function releaseExpiredHolds() {
  const expired = await db.session.findMany({
    where: {
      type: SessionType.PAID,
      status: SessionStatus.SCHEDULED,
      createdAt: { lt: getBookingHoldCutoff() },
      payment: { is: { status: { in: [PaymentStatus.PENDING, PaymentStatus.FAILED] } } },
    },
    select: { id: true },
    take: BATCH_SIZE,
  });

  for (const session of expired) {
    await expireUnpaidBooking(session.id);
  }

  return { released: expired.length };
}

/** Deletes data that is no longer useful: used-up sign-in tokens and old read notifications. */
export async function cleanUpOldRecords() {
  const now = new Date();
  const [tokens, notifications] = await Promise.all([
    db.verificationToken.deleteMany({ where: { expires: { lt: now } } }),
    db.notification.deleteMany({
      where: { isRead: true, createdAt: { lt: subDays(now, NOTIFICATION_RETENTION_DAYS) } },
    }),
  ]);

  return { expiredTokens: tokens.count, oldNotifications: notifications.count };
}

export const JOBS = {
  "session-reminders": sendUpcomingSessionReminders,
  "expire-holds": releaseExpiredHolds,
  cleanup: cleanUpOldRecords,
} as const;

export type JobName = keyof typeof JOBS;

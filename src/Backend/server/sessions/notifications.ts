/** In-app notifications written alongside session changes. */

import { NotificationType, Prisma, SessionStatus } from "@prisma/client";

export async function createBookingNotifications(
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

export async function createCancellationNotifications(
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

export async function createCompletionNotifications(
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

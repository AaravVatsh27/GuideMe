/** Cancelling, starting and completing sessions, including refunds and payouts. */

import { PaymentStatus, PayoutStatus, Prisma, SessionStatus, SessionType } from "@prisma/client";
import { generateClaudeSessionSummary } from "@/Backend/server/openai";
import { db } from "@/Backend/server/db";
import { createRefund } from "@/Backend/server/razorpay";
import { sendReviewRequestEmail, sendSessionCancellationEmails, sendSessionCompletionEmails } from "@/Backend/server/resend";

import { createCancellationNotifications, createCompletionNotifications } from "./notifications";
import { buildAbsoluteUrl, calculateCancellationOutcome, ensureMentorControlsSession, ensureNoShowCanBeReported, resolveSessionEndAt, resolveSessionStartAt } from "./rules";
import { CancelSessionInput, CompleteSessionInput, SessionApiError, StartSessionInput, asEmailParticipant, findSessionDetailsOrThrow, invalidateSessionCaches, isParticipant, safelySend } from "./shared";
import { recalculateMentorStats } from "@/Backend/server/mentor-state";

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

    await recalculateMentorStats(tx, session.mentorId);
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

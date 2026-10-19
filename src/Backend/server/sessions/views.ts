/** Shaping session records for the participant who is viewing them. */


import { SessionDetailsRecord, SessionListRecord } from "./shared";

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
          amountPaise: payment.amountPaise,
          currency: payment.currency,
          status: payment.status,
          paidAt: payment.paidAt,
          refundAmountPaise: payment.refundAmountPaise,
          refundStatus: payment.refundStatus,
          refundedAt: payment.refundedAt,
        }
      : null,
    payout:
      payout && viewerId === session.mentorId
        ? {
            id: payout.id,
            amountPaise: payout.amountPaise,
            status: payout.status,
            scheduledAt: payout.scheduledAt,
            processedAt: payout.processedAt,
            transactionId: payout.transactionId,
          }
        : null,
  };
}

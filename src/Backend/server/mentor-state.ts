import { type MentorTier, type Prisma, SessionStatus, VerificationStatus } from "@prisma/client";

/**
 * The one place that changes a mentor's verification state and their stored stats.
 *
 * Verification lives in two places, MentorVerification.status (the review record) and
 * MentorProfile.isVerified (used by every public query). They are always written together
 * here so they can't drift apart. Ratings and session counts are recalculated from the
 * underlying rows instead of being incremented, so they stay correct after retries.
 */

type Tx = Prisma.TransactionClient;

type VerificationChange =
  | { status: "APPROVED"; reviewerId: string; tier: MentorTier }
  | { status: "REJECTED"; reviewerId: string; reason: string }
  | { status: "PENDING" };

export async function setMentorVerification(tx: Tx, mentorId: string, change: VerificationChange) {
  const now = new Date();
  const approved = change.status === "APPROVED";

  await tx.mentorProfile.update({
    where: { userId: mentorId },
    data: {
      isVerified: approved,
      ...(change.status === "APPROVED" ? { isActive: true, tier: change.tier } : {}),
      ...(change.status === "REJECTED" ? { isActive: false } : {}),
    },
  });

  if (approved) {
    await tx.user.update({ where: { id: mentorId }, data: { isActive: true } });
  }

  const review =
    change.status === "PENDING"
      ? { reviewedBy: null, reviewedAt: null, rejectionReason: null, collegeIdUrl: null, submittedAt: now }
      : {
          reviewedBy: change.reviewerId,
          reviewedAt: now,
          rejectionReason: change.status === "REJECTED" ? change.reason : null,
        };

  await tx.mentorVerification.upsert({
    where: { mentorId },
    create: { mentorId, status: VerificationStatus[change.status], submittedAt: now, ...review },
    update: { status: VerificationStatus[change.status], ...review },
  });
}

/** Recalculates totalSessions, avgRating and totalReviews from sessions and reviews. */
export async function recalculateMentorStats(tx: Tx, mentorId: string) {
  const [completedSessions, reviews] = await Promise.all([
    tx.session.count({ where: { mentorId, status: SessionStatus.COMPLETED } }),
    tx.review.aggregate({
      where: { mentorId },
      _avg: { rating: true },
      _count: { _all: true },
    }),
  ]);

  const stats = {
    totalSessions: completedSessions,
    avgRating: Number((reviews._avg.rating ?? 0).toFixed(2)),
    totalReviews: reviews._count._all,
  };

  await tx.mentorProfile.updateMany({ where: { userId: mentorId }, data: stats });

  return stats;
}

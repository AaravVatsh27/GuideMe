import { NotificationType, Role } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { db } from "@/Backend/server/db";
import { defineRoute } from "@/Backend/lib/define-route";

const flagReviewSchema = z.object({
  reason: z.string().trim().min(5).max(280).optional(),
});

export const POST = defineRoute(
  { roles: ["MENTOR"], forbiddenMessage: "Only mentors can flag reviews" },
  async (request: Request, context: { params: { reviewId: string } }, { session }) => {
  const payload = await request.json().catch(() => ({}));
  const parsed = flagReviewSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Invalid payload", 400, z.flattenError(parsed.error));
  }

  const review = await db.review.findUnique({
    where: { id: context.params.reviewId },
    select: {
      id: true,
      mentorId: true,
      studentId: true,
      sessionId: true,
      rating: true,
      reviewText: true,
    },
  });

  if (!review) {
    return apiErrorResponse("Review not found", 404);
  }

  if (review.mentorId !== session.user.id) {
    return apiErrorResponse("Forbidden", 403);
  }

  const admins = await db.user.findMany({
    where: {
      role: Role.ADMIN,
      isActive: true,
    },
    select: { id: true },
  });

  const notificationBody = parsed.data.reason
    ? `${session.user.name ?? "A mentor"} flagged a review for moderation: ${parsed.data.reason}`
    : `${session.user.name ?? "A mentor"} flagged a review for moderation.`;

  await db.$transaction(async (tx) => {
    if (admins.length > 0) {
      await tx.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: NotificationType.SYSTEM,
          title: "Review flagged by mentor",
          body: notificationBody,
          link: "/admin",
        })),
      });
    }

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "MENTOR_REVIEW_FLAGGED",
        entityType: "Review",
        entityId: review.id,
        metadata: {
          reviewId: review.id,
          sessionId: review.sessionId,
          studentId: review.studentId,
          rating: review.rating,
          reviewText: review.reviewText,
          reason: parsed.data.reason ?? null,
        },
      },
    });
  });

  return NextResponse.json({ success: true });
}, "/api/reviews/[reviewId]/flag");

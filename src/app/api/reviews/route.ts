import { NotificationType, Role, SessionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { cacheDel, cacheDelPattern, cacheKeys } from "@/Backend/lib/cache";
import { generalLimiter } from "@/Backend/lib/ratelimit";
import { invalidateAllMatchingCaches } from "@/Backend/server/matching";
import { db } from "@/Backend/server/db";
import { createReviewSchema } from "@/Backend/validations/review";
import { defineRoute } from "@/Backend/lib/define-route";

type ReviewCreateResponse = {
  review: {
    id: string;
    sessionId: string;
    mentorId: string;
    studentId: string;
    rating: number;
    reviewText: string | null;
    tags: string[];
    wouldRebook: boolean;
    isPublic: boolean;
    createdAt: Date;
  };
  mentorStats: {
    avgRating: number;
    totalReviews: number;
  };
};

export const POST = defineRoute(
  { roles: ["STUDENT"], forbiddenMessage: "Only students can submit reviews", rateLimit: generalLimiter },
  async (request: Request, _context, { session }) => {
  const payload = await request.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Invalid review payload", 400, parsed.error.flatten());
  }

  const sessionRecord = await db.session.findUnique({
    where: { id: parsed.data.sessionId },
    select: {
      id: true,
      status: true,
      studentId: true,
      mentorId: true,
      review: {
        select: {
          id: true,
        },
      },
      student: {
        select: {
          name: true,
        },
      },
      mentor: {
        select: {
          id: true,
          name: true,
          role: true,
          mentorProfile: {
            select: {
              username: true,
            },
          },
        },
      },
    },
  });

  if (!sessionRecord) {
    return apiErrorResponse("Session not found", 404);
  }

  if (sessionRecord.studentId !== session.user.id) {
    return apiErrorResponse("Forbidden", 403);
  }

  if (sessionRecord.mentor.role !== Role.MENTOR) {
    return apiErrorResponse("Invalid mentor session", 409);
  }

  if (sessionRecord.status !== SessionStatus.COMPLETED) {
    return apiErrorResponse("Reviews can only be submitted after a session is completed", 409);
  }

  if (sessionRecord.review) {
    return apiErrorResponse("A review already exists for this session", 409);
  }

  const created = await db.$transaction(async (tx) => {
    const review = await tx.review.create({
      data: {
        sessionId: parsed.data.sessionId,
        studentId: session.user.id,
        mentorId: sessionRecord.mentorId,
        rating: parsed.data.rating,
        reviewText: parsed.data.reviewText ?? null,
        tags: parsed.data.tags,
        wouldRebook: parsed.data.wouldRebook,
        isPublic: parsed.data.isPublic,
      },
      select: {
        id: true,
        sessionId: true,
        mentorId: true,
        studentId: true,
        rating: true,
        reviewText: true,
        tags: true,
        wouldRebook: true,
        isPublic: true,
        createdAt: true,
      },
    });

    const aggregates = await tx.review.aggregate({
      where: {
        mentorId: sessionRecord.mentorId,
      },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    });

    const avgRating = Number((aggregates._avg.rating ?? 0).toFixed(2));
    const totalReviews = aggregates._count._all;

    await tx.mentorProfile.update({
      where: {
        userId: sessionRecord.mentorId,
      },
      data: {
        avgRating,
        totalReviews,
      },
    });

    await tx.notification.create({
      data: {
        userId: sessionRecord.mentorId,
        type: NotificationType.NEW_REVIEW,
        title: "New review received",
        body: `${sessionRecord.student.name} left a ${parsed.data.rating}/5 review for your session.`,
        link: "/dashboard/mentor/reviews",
      },
    });

    await tx.auditLog.create({
      data: {
        userId: session.user.id,
        action: "REVIEW_CREATED",
        entityType: "Review",
        entityId: review.id,
        metadata: {
          sessionId: parsed.data.sessionId,
          mentorId: sessionRecord.mentorId,
          rating: parsed.data.rating,
          wouldRebook: parsed.data.wouldRebook,
          isPublic: parsed.data.isPublic,
          tags: parsed.data.tags,
        },
      },
    });

    return {
      review,
      mentorStats: {
        avgRating,
        totalReviews,
      },
    } satisfies ReviewCreateResponse;
  });

  const invalidations: Promise<unknown>[] = [
    cacheDel(cacheKeys.session(parsed.data.sessionId)),
    cacheDelPattern(cacheKeys.searchPattern),
    invalidateAllMatchingCaches(),
  ];

  if (sessionRecord.mentor.mentorProfile?.username) {
    invalidations.push(cacheDel(cacheKeys.mentorProfile(sessionRecord.mentor.mentorProfile.username)));
  }

  Promise.allSettled(invalidations).catch(() => {});

  if (sessionRecord.mentor.mentorProfile?.username) {
    revalidatePath(`/mentor/${sessionRecord.mentor.mentorProfile.username}`);
  }
  revalidatePath("/find-mentor");

  return NextResponse.json(created, { status: 201 });
}, "/api/reviews");

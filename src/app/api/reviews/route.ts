import { NotificationType, Role, SessionStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { auth } from "@/Backend/auth";
import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { cacheDel, cacheDelPattern, cacheKeys } from "@/Backend/lib/cache";
import { generalLimiter } from "@/Backend/lib/ratelimit";
import { invalidateAllMatchingCaches } from "@/Backend/server/matching";
import { db } from "@/Backend/server/db";
import { createReviewSchema } from "@/Backend/validations/review";

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

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();

  const denied = await applyRateLimit(generalLimiter, getRateLimitId(request, session?.user?.id));
  if (denied) return denied;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  if (session.user.role !== Role.STUDENT) {
    return NextResponse.json({ error: "Only students can submit reviews" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid review payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
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
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (sessionRecord.studentId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (sessionRecord.mentor.role !== Role.MENTOR) {
    return NextResponse.json({ error: "Invalid mentor session" }, { status: 409 });
  }

  if (sessionRecord.status !== SessionStatus.COMPLETED) {
    return NextResponse.json(
      { error: "Reviews can only be submitted after a session is completed" },
      { status: 409 },
    );
  }

  if (sessionRecord.review) {
    return NextResponse.json({ error: "A review already exists for this session" }, { status: 409 });
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

import { SessionStatus, SessionType } from "@prisma/client";
import { NextResponse } from "next/server";

import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/lib/api-helpers";
import { generalLimiter } from "@/lib/ratelimit";
import { cacheGet, cacheKeys, cacheSet, cacheTtl } from "@/lib/cache";
import { db } from "@/server/db";

type RouteParams = { params: Promise<{ username: string }> };

type MentorProfileResponse = {
  id: string;
  name: string;
  image: string | null;
  memberSince: Date;
  profile: {
    username: string;
    college: string | null;
    degree: string | null;
    branch: string | null;
    yearOfStudy: number | null;
    expectedGraduationYear: number | null;
    tier: string;
    headline: string | null;
    bio: string | null;
    examsCleared: string[];
    examYears: unknown;
    specialisations: string[];
    priceMin: number | null;
    priceMax: number | null;
    avgRating: number;
    totalReviews: number;
    totalSessions: number;
    responseRate: number;
    linkedinUrl: string | null;
    introVideoUrl: string | null;
    isVerified: boolean;
    profileViews: number;
  } | null;
  exams: string[];
  specialisations: string[];
  availability: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isRecurring: boolean;
    specificDate: Date | null;
    timezone: string;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    reviewText: string | null;
    tags: string[];
    wouldRebook: boolean;
    createdAt: Date;
    student: {
      name: string;
      image: string | null;
    };
  }>;
  stats: {
    totalSessions: number;
    totalReviews: number;
    avgRating: number;
    responseRate: number;
    introSessions: number;
    paidSessions: number;
    profileViews: number;
  };
};

function bumpProfileViews(data: MentorProfileResponse) {
  const nextProfileViews = (data.profile?.profileViews ?? data.stats.profileViews ?? 0) + 1;

  return {
    ...data,
    profile: data.profile
      ? {
          ...data.profile,
          profileViews: nextProfileViews,
        }
      : data.profile,
    stats: {
      ...data.stats,
      profileViews: nextProfileViews,
    },
  } satisfies MentorProfileResponse;
}

function persistProfileViewIncrement(
  username: string,
  cacheKey: string,
  data: MentorProfileResponse,
) {
  const writes: Promise<unknown>[] = [
    db.mentorProfile.update({
      where: { username },
      data: { profileViews: { increment: 1 } },
    }),
    cacheSet(cacheKey, data, cacheTtl.mentorProfile),
  ];

  Promise.allSettled(writes).catch(() => {});
}

export const GET = withApiErrorHandling(async (request: Request, context: RouteParams) => {
  const { username } = await context.params;

  const denied = await applyRateLimit(generalLimiter, getRateLimitId(request));
  if (denied) return denied;

  if (!username || username.length < 2) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const cacheKey = cacheKeys.mentorProfile(username);
  const cached = await cacheGet<MentorProfileResponse>(cacheKey);

  if (cached) {
    const data = bumpProfileViews(cached);
    persistProfileViewIncrement(username, cacheKey, data);
    return NextResponse.json({ ...data, cached: true });
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
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      mentorProfile: {
        select: {
          username: true,
          college: true,
          degree: true,
          branch: true,
          yearOfStudy: true,
          expectedGraduationYear: true,
          tier: true,
          headline: true,
          bio: true,
          examsCleared: true,
          examYears: true,
          specialisations: true,
          priceMin: true,
          priceMax: true,
          avgRating: true,
          totalReviews: true,
          totalSessions: true,
          responseRate: true,
          linkedinUrl: true,
          introVideoUrl: true,
          isVerified: true,
          profileViews: true,
        },
      },
      availabilities: {
        where: { isActive: true },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isRecurring: true,
          specificDate: true,
          timezone: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
      reviewsReceived: {
        where: { isPublic: true },
        select: {
          id: true,
          rating: true,
          reviewText: true,
          tags: true,
          wouldRebook: true,
          createdAt: true,
          student: {
            select: { name: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!mentor) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  const completedSessionsByType = await db.session.groupBy({
    by: ["type"],
    where: {
      mentorId: mentor.id,
      status: SessionStatus.COMPLETED,
    },
    _count: { _all: true },
  });

  const introSessions =
    completedSessionsByType.find((row) => row.type === SessionType.INTRO)?._count._all ?? 0;
  const paidSessions =
    completedSessionsByType.find((row) => row.type === SessionType.PAID)?._count._all ?? 0;
  const nextProfileViews = (mentor.mentorProfile?.profileViews ?? 0) + 1;
  const data = {
    id: mentor.id,
    name: mentor.name,
    image: mentor.image,
    memberSince: mentor.createdAt,
    profile: mentor.mentorProfile
      ? {
          ...mentor.mentorProfile,
          profileViews: nextProfileViews,
        }
      : null,
    exams: mentor.mentorProfile?.examsCleared ?? [],
    specialisations: mentor.mentorProfile?.specialisations ?? [],
    availability: mentor.availabilities,
    reviews: mentor.reviewsReceived,
    stats: {
      totalSessions: mentor.mentorProfile?.totalSessions ?? introSessions + paidSessions,
      totalReviews: mentor.mentorProfile?.totalReviews ?? mentor.reviewsReceived.length,
      avgRating: mentor.mentorProfile?.avgRating ?? 0,
      responseRate: mentor.mentorProfile?.responseRate ?? 0,
      introSessions,
      paidSessions,
      profileViews: nextProfileViews,
    },
  } satisfies MentorProfileResponse;

  persistProfileViewIncrement(username, cacheKey, data);
  return NextResponse.json(data);
}, "/api/mentors/[username]");

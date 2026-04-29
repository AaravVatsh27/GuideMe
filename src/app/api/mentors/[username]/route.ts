import { NextResponse } from "next/server";

import { db } from "@/server/db";
import { getRedis } from "@/server/redis";

const MENTOR_PROFILE_CACHE_PREFIX = "mentor:profile";
const MENTOR_PROFILE_CACHE_TTL = 60 * 60; // 1 hour

type RouteParams = { params: Promise<{ username: string }> };

export async function GET(_request: Request, context: RouteParams) {
  const { username } = await context.params;

  if (!username || username.length < 2) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  // Try Redis cache
  const redis = getRedis();
  const cacheKey = `${MENTOR_PROFILE_CACHE_PREFIX}:${username}`;

  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        const data = typeof cached === "string" ? JSON.parse(cached) : cached;
        return NextResponse.json({ ...data, cached: true });
      }
    } catch {
      // cache miss
    }
  }

  try {
    const mentor = await db.user.findFirst({
      where: {
        role: "MENTOR",
        isActive: true,
        deletedAt: null,
        mentorProfile: { is: { username, isActive: true } },
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
        _count: {
          select: {
            mentorSessions: true,
            reviewsReceived: true,
          },
        },
      },
    });

    if (!mentor) {
      return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
    }

    const data = {
      id: mentor.id,
      name: mentor.name,
      image: mentor.image,
      memberSince: mentor.createdAt,
      profile: mentor.mentorProfile,
      availability: mentor.availabilities,
      reviews: mentor.reviewsReceived,
      stats: {
        totalSessions: mentor._count.mentorSessions,
        totalReviews: mentor._count.reviewsReceived,
        avgRating: mentor.mentorProfile?.avgRating ?? 0,
        responseRate: mentor.mentorProfile?.responseRate ?? 0,
        profileViews: (mentor.mentorProfile?.profileViews ?? 0) + 1,
      },
    };

    // Cache result
    if (redis) {
      redis.set(cacheKey, JSON.stringify(data), { ex: MENTOR_PROFILE_CACHE_TTL }).catch(() => {});
    }

    // Increment profileViews (fire-and-forget)
    db.mentorProfile
      .update({
        where: { username },
        data: { profileViews: { increment: 1 } },
      })
      .catch(() => {});

    return NextResponse.json(data);
  } catch (error) {
    console.error("[mentors/profile]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

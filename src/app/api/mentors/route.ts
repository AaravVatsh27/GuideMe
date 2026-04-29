import { MentorTier, Prisma, Stream, TargetExam } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/server/db";
import { getRedis } from "@/server/redis";

const MENTOR_LIST_CACHE_PREFIX = "mentors:list";
const MENTOR_LIST_CACHE_TTL = 60 * 5; // 5 minutes

const searchQuerySchema = z.object({
  q: z.string().trim().max(120).optional(),
  stream: z.nativeEnum(Stream).optional(),
  exam: z.nativeEnum(TargetExam).optional(),
  tier: z.nativeEnum(MentorTier).optional(),
  priceMin: z.coerce.number().int().min(0).optional(),
  priceMax: z.coerce.number().int().max(9999).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  availableThisWeek: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  forClass: z.enum(["school", "ug"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

function buildCacheKey(query: Record<string, string>) {
  const sorted = Object.entries(query)
    .filter(([, v]) => v !== "")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `${MENTOR_LIST_CACHE_PREFIX}:${sorted || "all"}`;
}

/**
 * Map TargetExam enum to mentor examsCleared strings.
 */
function mapTargetExamToExams(exam: TargetExam): string[] {
  switch (exam) {
    case "JEE":
      return ["JEE_MAINS", "JEE_ADVANCED"];
    case "UPSC":
      return ["UPSC_PRELIMS"];
    case "OTHER":
    case "UNDECIDED":
      return [];
    default:
      return [exam];
  }
}

export async function GET(request: Request) {
  const rawQuery = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = searchQuerySchema.safeParse(rawQuery);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { q, stream, exam, tier, priceMin, priceMax, minRating, availableThisWeek, forClass, page, limit } =
    parsed.data;

  // Try Redis cache
  const redis = getRedis();
  const cacheKey = buildCacheKey(rawQuery);

  if (redis) {
    try {
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        const data = typeof cached === "string" ? JSON.parse(cached) : cached;
        return NextResponse.json({ ...data, cached: true });
      }
    } catch {
      // cache miss — continue
    }
  }

  // Build Prisma where clause
  const where: Prisma.UserWhereInput = {
    role: "MENTOR",
    isActive: true,
    deletedAt: null,
    onboardingComplete: true,
    mentorProfile: {
      is: {
        isVerified: true,
        isActive: true,
        isAvailable: true,
        ...(tier ? { tier } : {}),
        ...(priceMin !== undefined ? { priceMin: { gte: priceMin } } : {}),
        ...(priceMax !== undefined ? { priceMax: { lte: priceMax } } : {}),
        ...(minRating !== undefined ? { avgRating: { gte: minRating } } : {}),
        ...(exam
          ? { examsCleared: { hasSome: mapTargetExamToExams(exam) } }
          : {}),
        ...(stream
          ? {
              OR: [
                { specialisations: { hasSome: [stream] } },
                { examsCleared: { hasSome: mapTargetExamToExams(exam ?? ("OTHER" as TargetExam)) } },
              ],
            }
          : {}),
      },
    },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
            { mentorProfile: { is: { college: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
            { mentorProfile: { is: { headline: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
            { mentorProfile: { is: { branch: { contains: q, mode: Prisma.QueryMode.insensitive } } } },
          ],
        }
      : {}),
  };

  // forClass filter — school mentors are early-year, UG mentors are later-year
  if (forClass === "school") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (where.mentorProfile as any).is = {
      ...(where.mentorProfile as any).is,
      yearOfStudy: { in: [1, 2] },
    };
  } else if (forClass === "ug") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (where.mentorProfile as any).is = {
      ...(where.mentorProfile as any).is,
      yearOfStudy: { gte: 3 },
    };
  }

  try {
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const availabilityWhere = availableThisWeek
      ? {
          isActive: true,
          OR: [
            { isRecurring: true },
            { specificDate: { gte: now, lte: nextWeek } },
          ],
        }
      : { isActive: true };

    const [total, mentors] = await Promise.all([
      db.user.count({ where }),
      db.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          image: true,
          mentorProfile: {
            select: {
              username: true,
              college: true,
              degree: true,
              branch: true,
              yearOfStudy: true,
              tier: true,
              headline: true,
              bio: true,
              examsCleared: true,
              specialisations: true,
              priceMin: true,
              priceMax: true,
              avgRating: true,
              totalReviews: true,
              totalSessions: true,
              responseRate: true,
              linkedinUrl: true,
            },
          },
          availabilities: {
            where: availabilityWhere,
            select: {
              dayOfWeek: true,
              startTime: true,
              endTime: true,
            },
            take: 5,
          },
        },
        orderBy: [
          { mentorProfile: { avgRating: "desc" } },
          { mentorProfile: { totalReviews: "desc" } },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    // Filter by availableThisWeek on the app side if needed
    const results = availableThisWeek
      ? mentors.filter((m) => m.availabilities.length > 0)
      : mentors;

    const data = results.map((m) => ({
      id: m.id,
      name: m.name,
      image: m.image,
      username: m.mentorProfile?.username,
      college: m.mentorProfile?.college,
      degree: m.mentorProfile?.degree,
      branch: m.mentorProfile?.branch,
      yearOfStudy: m.mentorProfile?.yearOfStudy,
      tier: m.mentorProfile?.tier,
      headline: m.mentorProfile?.headline,
      bio: m.mentorProfile?.bio,
      examsCleared: m.mentorProfile?.examsCleared,
      specialisations: m.mentorProfile?.specialisations,
      priceMin: m.mentorProfile?.priceMin,
      priceMax: m.mentorProfile?.priceMax,
      avgRating: m.mentorProfile?.avgRating,
      totalReviews: m.mentorProfile?.totalReviews,
      totalSessions: m.mentorProfile?.totalSessions,
      responseRate: m.mentorProfile?.responseRate,
      linkedinUrl: m.mentorProfile?.linkedinUrl,
      availableThisWeek: m.availabilities.length > 0,
    }));

    const response = {
      data,
      page,
      pageSize: limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };

    // Cache result
    if (redis) {
      redis.set(cacheKey, JSON.stringify(response), { ex: MENTOR_LIST_CACHE_TTL }).catch(() => {});
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[mentors] list error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

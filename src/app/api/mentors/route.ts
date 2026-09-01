import { createHash } from "node:crypto";
import { MentorTier, Prisma, Stream, TargetExam } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/Backend/server/db";
import {
  EXAM_OPTIONS,
  HELP_TOPIC_OPTIONS,
  getExamLabel,
  getHelpTopicLabel,
} from "@/Backend/server/mentor-onboarding";
import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { searchLimiter } from "@/Backend/lib/ratelimit";
import { cacheGet, cacheKeys, cacheSet, cacheTtl } from "@/Backend/lib/cache";

const SCHOOL_MENTOR_YEARS = [1, 2] as const;
const UG_MENTOR_YEARS = [3, 4, 5, 6] as const;

const STREAM_FILTERS: Partial<
  Record<Stream, { exams: string[]; specialisations: string[] }>
> = {
  SCIENCE_PCM: {
    exams: ["JEE_MAINS", "JEE_ADVANCED", "CUET"],
    specialisations: [
      "JEE_PREP_STRATEGY",
      "ENGINEERING_BRANCH_SELECTION",
      "COLLEGE_SELECTION",
      "STREAM_SELECTION",
      "SUBJECT_COMBINATIONS",
      "STUDY_PLANNING",
    ],
  },
  SCIENCE_PCB: {
    exams: ["NEET", "CUET"],
    specialisations: [
      "NEET_PREP_STRATEGY",
      "COLLEGE_SELECTION",
      "STREAM_SELECTION",
      "SUBJECT_COMBINATIONS",
      "STUDY_PLANNING",
    ],
  },
  COMMERCE: {
    exams: ["CA_FOUNDATION", "CA_INTER", "CAT", "CUET"],
    specialisations: [
      "CA_COMMERCE_PATH",
      "COLLEGE_SELECTION",
      "MBA_PREPARATION",
      "STUDY_PLANNING",
    ],
  },
  ARTS: {
    exams: ["CLAT", "CUET", "UPSC_PRELIMS"],
    specialisations: [
      "SUBJECT_COMBINATIONS",
      "COLLEGE_SELECTION",
      "STREAM_SELECTION",
      "CAREER_SWITCHING",
      "STUDY_PLANNING",
    ],
  },
  ENGINEERING: {
    exams: ["GATE", "CAT", "GRE"],
    specialisations: [
      "PLACEMENT_PREPARATION",
      "INTERNSHIP_GUIDANCE",
      "MBA_PREPARATION",
      "MS_ABROAD",
      "CAREER_SWITCHING",
      "STUDY_PLANNING",
    ],
  },
  MEDICAL: {
    exams: ["NEET", "GRE"],
    specialisations: [
      "NEET_PREP_STRATEGY",
      "MS_ABROAD",
      "CAREER_SWITCHING",
      "STUDY_PLANNING",
    ],
  },
  LAW: {
    exams: ["CLAT", "CUET"],
    specialisations: ["COLLEGE_SELECTION", "CAREER_SWITCHING", "STUDY_PLANNING"],
  },
  MANAGEMENT: {
    exams: ["CAT", "XAT", "GMAT"],
    specialisations: [
      "MBA_PREPARATION",
      "PLACEMENT_PREPARATION",
      "INTERNSHIP_GUIDANCE",
      "CAREER_SWITCHING",
    ],
  },
  HIGHER_STUDIES: {
    exams: ["GRE", "GMAT", "GATE", "CAT"],
    specialisations: ["MS_ABROAD", "MBA_PREPARATION", "STUDY_PLANNING", "CAREER_SWITCHING"],
  },
  PLACEMENTS: {
    exams: ["CAT"],
    specialisations: [
      "PLACEMENT_PREPARATION",
      "INTERNSHIP_GUIDANCE",
      "CAREER_SWITCHING",
      "STUDY_PLANNING",
      "MBA_PREPARATION",
    ],
  },
  COMPETITIVE_EXAMS: {
    exams: [
      "JEE_MAINS",
      "JEE_ADVANCED",
      "NEET",
      "CA_FOUNDATION",
      "CA_INTER",
      "CLAT",
      "GATE",
      "CAT",
      "XAT",
      "GRE",
      "GMAT",
      "UPSC_PRELIMS",
      "NDA",
      "CUET",
    ],
    specialisations: [
      "JEE_PREP_STRATEGY",
      "NEET_PREP_STRATEGY",
      "CA_COMMERCE_PATH",
      "MBA_PREPARATION",
      "MS_ABROAD",
      "STUDY_PLANNING",
    ],
  },
  SKILL_BUILDING: {
    exams: [],
    specialisations: [
      "INTERNSHIP_GUIDANCE",
      "PLACEMENT_PREPARATION",
      "CAREER_SWITCHING",
      "STUDY_PLANNING",
    ],
  },
  ENTREPRENEURSHIP: {
    exams: ["CAT"],
    specialisations: ["CAREER_SWITCHING", "PLACEMENT_PREPARATION", "INTERNSHIP_GUIDANCE"],
  },
  UNDECIDED: {
    exams: [],
    specialisations: [
      "STREAM_SELECTION",
      "COLLEGE_SELECTION",
      "SUBJECT_COMBINATIONS",
      "STUDY_PLANNING",
    ],
  },
};

const EXAM_SEARCH_INDEX = EXAM_OPTIONS.map((option) => ({
  value: option.value,
  searchText: `${option.value} ${option.label}`.toLowerCase().replaceAll("_", " "),
}));

const SPECIALISATION_SEARCH_INDEX = HELP_TOPIC_OPTIONS.map((option) => ({
  value: option.value,
  searchText: `${option.value} ${option.label}`.toLowerCase().replaceAll("_", " "),
}));

const searchQuerySchema = z
  .object({
    q: z.string().trim().max(120).optional(),
    stream: z.nativeEnum(Stream).optional(),
    exam: z.nativeEnum(TargetExam).optional(),
    tier: z.nativeEnum(MentorTier).optional(),
    priceMin: z.coerce.number().int().min(0).optional(),
    priceMax: z.coerce.number().int().max(9999).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    availableThisWeek: z
      .enum(["true", "false"])
      .transform((value) => value === "true")
      .optional(),
    forClass: z.enum(["school", "ug"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(20).default(10),
  })
  .refine(
    (value) =>
      value.priceMin === undefined ||
      value.priceMax === undefined ||
      value.priceMin <= value.priceMax,
    {
      message: "priceMin must be less than or equal to priceMax",
      path: ["priceMax"],
    },
  );

type MentorSearchResponse = {
  data: unknown[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

function buildCacheKey(query: Record<string, string>) {
  const sorted = Object.entries(query)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  const hash = createHash("sha256")
    .update(sorted || "all")
    .digest("hex")
    .slice(0, 20);

  return cacheKeys.search(hash);
}

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

function normalizeSearchValue(value: string | null | undefined) {
  return value
    ?.trim()
    .toLowerCase()
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ") ?? "";
}

function getSearchSignals(query?: string) {
  const normalized = normalizeSearchValue(query);

  if (!normalized) {
    return { exams: [] as string[], specialisations: [] as string[] };
  }

  return {
    exams: EXAM_SEARCH_INDEX.filter((entry) => entry.searchText.includes(normalized)).map(
      (entry) => entry.value,
    ),
    specialisations: SPECIALISATION_SEARCH_INDEX.filter((entry) =>
      entry.searchText.includes(normalized),
    ).map((entry) => entry.value),
  };
}

function getStreamFilters(stream?: Stream) {
  return stream ? STREAM_FILTERS[stream] ?? { exams: [], specialisations: [] } : null;
}

function scoreTextMatch(
  query: string | undefined,
  values: Array<string | null | undefined>,
  weight: number,
) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return 0;
  }

  const normalizedValues = values.map((value) => normalizeSearchValue(value)).filter(Boolean);

  if (normalizedValues.some((value) => value === normalizedQuery)) {
    return weight;
  }

  if (normalizedValues.some((value) => value.startsWith(normalizedQuery))) {
    return weight * 0.85;
  }

  if (normalizedValues.some((value) => value.includes(normalizedQuery))) {
    return weight * 0.7;
  }

  return 0;
}

function computeRelevanceScore(input: {
  q?: string;
  name?: string | null;
  username?: string | null;
  college?: string | null;
  headline?: string | null;
  branch?: string | null;
  examsCleared?: string[] | null;
  specialisations?: string[] | null;
  avgRating?: number | null;
  totalReviews?: number | null;
  availableThisWeek: boolean;
}) {
  const {
    q,
    name = "",
    username = "",
    college = "",
    headline = "",
    branch = "",
    examsCleared,
    specialisations,
    avgRating,
    totalReviews,
    availableThisWeek,
  } = input;
  const normalizedExams = examsCleared ?? [];
  const normalizedSpecialisations = specialisations ?? [];
  const normalizedAvgRating = avgRating ?? 0;
  const normalizedTotalReviews = totalReviews ?? 0;

  const examLabels = normalizedExams.map((exam) => `${exam} ${getExamLabel(exam)}`);
  const specialisationLabels = normalizedSpecialisations.map(
    (specialisation) => `${specialisation} ${getHelpTopicLabel(specialisation)}`,
  );

  let score = 0;
  score += scoreTextMatch(q, [name, username], 40);
  score += scoreTextMatch(q, [college], 30);
  score += scoreTextMatch(q, [headline, branch], 18);
  score += scoreTextMatch(q, examLabels, 25);
  score += scoreTextMatch(q, specialisationLabels, 15);
  score += normalizedAvgRating * 8;
  score += Math.min(normalizedTotalReviews, 50) * 0.25;

  if (availableThisWeek) {
    score += 8;
  }

  return Number(score.toFixed(2));
}

export const GET = withApiErrorHandling(async (request: Request) => {
  const rawQuery = Object.fromEntries(new URL(request.url).searchParams.entries());

  const denied = await applyRateLimit(searchLimiter, getRateLimitId(request));
  if (denied) return denied;
  const parsed = searchQuerySchema.safeParse(rawQuery);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const {
    q,
    stream,
    exam,
    tier,
    priceMin,
    priceMax,
    minRating,
    availableThisWeek,
    forClass,
    page,
    limit,
  } = parsed.data;
  const streamFilters = getStreamFilters(stream);
  const searchSignals = getSearchSignals(q);

  const cacheKey = buildCacheKey(rawQuery);
  const cached = await cacheGet<MentorSearchResponse>(cacheKey);

  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  const mentorProfileWhere: Prisma.MentorProfileWhereInput = {
    isVerified: true,
    isActive: true,
    isAvailable: true,
    ...(tier ? { tier } : {}),
    ...(priceMin !== undefined ? { priceMax: { gte: priceMin } } : {}),
    ...(priceMax !== undefined ? { priceMin: { lte: priceMax } } : {}),
    ...(minRating !== undefined ? { avgRating: { gte: minRating } } : {}),
    ...(exam ? { examsCleared: { hasSome: mapTargetExamToExams(exam) } } : {}),
    ...(forClass === "school"
      ? { yearOfStudy: { in: [...SCHOOL_MENTOR_YEARS] } }
      : forClass === "ug"
        ? { yearOfStudy: { in: [...UG_MENTOR_YEARS] } }
        : {}),
  };

  if (streamFilters && (streamFilters.exams.length > 0 || streamFilters.specialisations.length > 0)) {
    mentorProfileWhere.OR = [
      ...(streamFilters.exams.length > 0
        ? [{ examsCleared: { hasSome: streamFilters.exams } }]
        : []),
      ...(streamFilters.specialisations.length > 0
        ? [{ specialisations: { hasSome: streamFilters.specialisations } }]
        : []),
    ];
  }

  const where: Prisma.UserWhereInput = {
    role: "MENTOR",
    isActive: true,
    deletedAt: null,
    onboardingComplete: true,
    mentorProfile: { is: mentorProfileWhere },
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: Prisma.QueryMode.insensitive } },
            {
              mentorProfile: {
                is: { username: { contains: q, mode: Prisma.QueryMode.insensitive } },
              },
            },
            {
              mentorProfile: {
                is: { college: { contains: q, mode: Prisma.QueryMode.insensitive } },
              },
            },
            {
              mentorProfile: {
                is: { headline: { contains: q, mode: Prisma.QueryMode.insensitive } },
              },
            },
            {
              mentorProfile: {
                is: { branch: { contains: q, mode: Prisma.QueryMode.insensitive } },
              },
            },
            ...(searchSignals.exams.length > 0
              ? [{ mentorProfile: { is: { examsCleared: { hasSome: searchSignals.exams } } } }]
              : []),
            ...(searchSignals.specialisations.length > 0
              ? [
                  {
                    mentorProfile: {
                      is: {
                        specialisations: { hasSome: searchSignals.specialisations },
                      },
                    },
                  },
                ]
              : []),
          ],
        }
      : {}),
  };

  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  const mentors = await db.user.findMany({
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
        where: {
          isActive: true,
          OR: [{ isRecurring: true }, { specificDate: { gte: now, lte: nextWeek } }],
        },
        select: {
          id: true,
        },
      },
    },
  });

  const sorted = mentors
    .filter((mentor) => !availableThisWeek || mentor.availabilities.length > 0)
    .map((mentor) => {
      const isAvailableThisWeek = mentor.availabilities.length > 0;
      const relevanceScore = computeRelevanceScore({
        q,
        name: mentor.name,
        username: mentor.mentorProfile?.username,
        college: mentor.mentorProfile?.college,
        headline: mentor.mentorProfile?.headline,
        branch: mentor.mentorProfile?.branch,
        examsCleared: mentor.mentorProfile?.examsCleared,
        specialisations: mentor.mentorProfile?.specialisations,
        avgRating: mentor.mentorProfile?.avgRating,
        totalReviews: mentor.mentorProfile?.totalReviews,
        availableThisWeek: isAvailableThisWeek,
      });

      return {
        id: mentor.id,
        name: mentor.name,
        image: mentor.image,
        username: mentor.mentorProfile?.username,
        college: mentor.mentorProfile?.college,
        degree: mentor.mentorProfile?.degree,
        branch: mentor.mentorProfile?.branch,
        yearOfStudy: mentor.mentorProfile?.yearOfStudy,
        tier: mentor.mentorProfile?.tier,
        headline: mentor.mentorProfile?.headline,
        bio: mentor.mentorProfile?.bio,
        examsCleared: mentor.mentorProfile?.examsCleared,
        specialisations: mentor.mentorProfile?.specialisations,
        priceMin: mentor.mentorProfile?.priceMin,
        priceMax: mentor.mentorProfile?.priceMax,
        avgRating: mentor.mentorProfile?.avgRating,
        totalReviews: mentor.mentorProfile?.totalReviews,
        totalSessions: mentor.mentorProfile?.totalSessions,
        responseRate: mentor.mentorProfile?.responseRate,
        linkedinUrl: mentor.mentorProfile?.linkedinUrl,
        availableThisWeek: isAvailableThisWeek,
        relevanceScore,
      };
    })
    .sort((left, right) => {
      if (right.relevanceScore !== left.relevanceScore) {
        return right.relevanceScore - left.relevanceScore;
      }

      return (right.avgRating ?? 0) - (left.avgRating ?? 0);
    });

  const total = sorted.length;
  const data = sorted.slice((page - 1) * limit, (page - 1) * limit + limit);
  const response = {
    data,
    page,
    pageSize: limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };

  cacheSet(cacheKey, response, cacheTtl.searchResults).catch(() => {});

  return NextResponse.json(response);
}, "/api/mentors");

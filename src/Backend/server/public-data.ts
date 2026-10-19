import { db } from "@/Backend/server/db";
import { Prisma, type MentorTier } from "@prisma/client";
import { addDays, startOfDay } from "date-fns";
import { rupeesToPaise } from "@/shared/money";
import { FREE_INTRO_DURATION } from "@/shared/constants";

export type PublicMentorCard = {
  id: string;
  name: string;
  firstName: string;
  image: string | null;
  username: string | null;
  college: string | null;
  degree: string | null;
  headline: string | null;
  tier: string | null;
  yearOfStudy: number | null;
  yearLabel: string;
  priceMinPaise: number | null;
  priceMaxPaise: number | null;
  avgRating: number;
  totalReviews: number;
  totalSessions: number;
  examLabels: string[];
  topicLabels: string[];
  availableThisWeek: boolean;
};

export type MentorDirectoryResult = {
  mentors: PublicMentorCard[];
  total: number;
  totalAvailableThisWeek: number;
};

export type PlatformSnapshot = {
  totalMentors: number;
  minPricePaise: number;
  maxPricePaise: number;
  searchLinks: { label: string; query: string }[];
  // Add these back
  totalStudents: number;
  completedSessions: number;
  featuredMentors: PublicMentorCard[];
  reviewSpotlights: PublicReviewSpotlight[];
  introMinutes: number; // Also needed for homepage
  averagePaidSessionPricePaise: number;
  /** Average of public review ratings; 0 when there are none. */
  averageRating: number;
  totalPublicReviews: number;
  /** Distinct colleges of verified mentors, most common first. */
  mentorColleges: string[];
};

export type MentorFilters = {
  query?: string;
  stream?: string;
  exam?: string;
  tier?: string;
  /** Whole rupees, as typed in the find-mentor filters. */
  priceMax?: number;
  available?: boolean;
  forClass?: "school" | "ug";
  limit?: number;
};

// ── Helpers ────────────────────────────────────────────────────────────

function buildYearLabel(college: string | null, year: number | null): string {
  const yearMap: Record<number, string> = {
    1: "Year 1", 2: "Year 2", 3: "Year 3", 4: "Year 4",
    5: "Masters Year 1", 6: "Masters Year 2",
  };
  const parts = [college, year ? yearMap[year] : null].filter(Boolean);
  return parts.join(" · ") || "GuideMe Mentor";
}

function examToLabel(raw: string): string {
  const map: Record<string, string> = {
    JEE: "JEE Mains", JEE_ADVANCED: "JEE Advanced", NEET: "NEET",
    CA_FOUNDATION: "CA Foundation", CA_INTER: "CA Inter", CLAT: "CLAT",
    GATE: "GATE", CAT: "CAT", XAT: "XAT", GMAT: "GMAT", GRE: "GRE",
    UPSC: "UPSC", NDA: "NDA", CUET: "CUET",
  };
  return map[raw] ?? raw.replace(/_/g, " ");
}

function streamToExams(stream: string): string[] {
  const map: Record<string, string[]> = {
    SCIENCE_PCM: ["JEE", "JEE_ADVANCED", "NDA", "CUET"],
    SCIENCE_PCB: ["NEET", "CUET"],
    COMMERCE: ["CA_FOUNDATION", "CA_INTER", "CAT", "CLAT", "CUET"],
    ARTS: ["CLAT", "UPSC", "CUET"],
    ENGINEERING: ["GATE", "GRE", "CAT"],
    MANAGEMENT: ["CAT", "XAT", "GMAT", "GRE"],
  };
  return map[stream] ?? [];
}

function checkAvailableThisWeek(
  availability: { isActive: boolean; isRecurring: boolean; specificDate: Date | null }[]
): boolean {
  const now = startOfDay(new Date());
  const weekEnd = addDays(now, 7);
  return availability.some(
    (a) =>
      a.isActive &&
      (a.isRecurring ||
        (a.specificDate !== null && a.specificDate >= now && a.specificDate <= weekEnd))
  );
}

// ── Real platform stats ────────────────────────────────────────────────

/** Average rating and count of public reviews, for trust badges. */
export async function getPublicReviewStats() {
  try {
    const result = await db.review.aggregate({
      where: { isPublic: true },
      _avg: { rating: true },
      _count: { _all: true },
    });

    return {
      averageRating: Number((result._avg.rating ?? 0).toFixed(1)),
      totalPublicReviews: result._count._all,
    };
  } catch {
    return { averageRating: 0, totalPublicReviews: 0 };
  }
}

/** Students who finished onboarding, for "students joined" badges. */
export async function getPublicStudentCount() {
  try {
    return await db.studentProfile.count({
      where: { user: { onboardingComplete: true, deletedAt: null, isActive: true } },
    });
  } catch {
    return 0;
  }
}

/** Verified, active mentors. */
export async function getVerifiedMentorCount() {
  try {
    return await db.mentorProfile.count({ where: { isVerified: true, isActive: true } });
  } catch {
    return 0;
  }
}

async function getVerifiedMentorColleges(limit = 8) {
  try {
    const rows = await db.mentorProfile.groupBy({
      by: ["college"],
      where: { isVerified: true, isActive: true, college: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { college: "desc" } },
      take: limit,
    });

    return rows.map((row) => row.college).filter((college): college is string => Boolean(college));
  } catch {
    return [];
  }
}

// ── Platform snapshot ──────────────────────────────────────────────────

const EMPTY_PLATFORM_SNAPSHOT: PlatformSnapshot = {
  totalMentors: 0,
  minPricePaise: 0,
  maxPricePaise: 0,
  searchLinks: [],
  totalStudents: 0,
  completedSessions: 0,
  featuredMentors: [],
  reviewSpotlights: [],
  averagePaidSessionPricePaise: 0,
  introMinutes: FREE_INTRO_DURATION,
  averageRating: 0,
  totalPublicReviews: 0,
  mentorColleges: [],
};

export async function getPublicPlatformSnapshot(): Promise<PlatformSnapshot> {
  try {
    const [
      countResult,
      priceResult,
      allExams,
      totalStudents,
      completedSessions,
      featuredMentorsRaw,
      reviewSpotlights,
      paymentAggregate,
    ] = await Promise.allSettled([
      // existing: total verified mentors
      db.mentorProfile.count({ where: { isVerified: true, isActive: true } }),

      // existing: pricePaise range
      db.mentorProfile.aggregate({
        where: { isVerified: true, isActive: true },
        _min: { priceMinPaise: true },
        _max: { priceMaxPaise: true },
      }),

      // existing: exams for search links
      db.mentorProfile
        .findMany({
          where: { isVerified: true, isActive: true },
          select: { examsCleared: true },
        })
        .then((rows) => rows.flatMap((r) => r.examsCleared)),

      // new: total students onboarded
      db.studentProfile.count({
        where: {
          user: {
            onboardingComplete: true,
            deletedAt: null,
            isActive: true,
          },
        },
      }),

      // new: total completed sessions
      db.session.count({
        where: { status: "COMPLETED" },
      }),

      // new: top 3 featured mentors for homepage hero
      db.mentorProfile.findMany({
        where: { isVerified: true, isActive: true },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              availabilities: {
                where: { isActive: true },
                select: { isRecurring: true, specificDate: true, isActive: true },
              },
            },
          },
        },
        orderBy: [
          { avgRating: "desc" },
          { totalSessions: "desc" },
        ],
        take: 3,
      }),

      // Restored: for testimonials
      getPublicReviewSpotlights(3),

      // Restored: for pricing bands
      db.payment.aggregate({
        where: { status: "CAPTURED" },
        _avg: { amountPaise: true },
      }),
    ]);

    const [reviewStats, mentorColleges] = await Promise.all([
      getPublicReviewStats(),
      getVerifiedMentorColleges(),
    ]);
    const totalMentors = countResult.status === "fulfilled" ? countResult.value : 0;
    const priceBounds =
      priceResult.status === "fulfilled"
        ? priceResult.value
        : { _min: { priceMinPaise: null }, _max: { priceMaxPaise: null } };
    const flattenedExams = allExams.status === "fulfilled" ? allExams.value : [];
    const totalStudentsCount =
      totalStudents.status === "fulfilled" ? totalStudents.value : 0;
    const completedSessionCount =
      completedSessions.status === "fulfilled" ? completedSessions.value : 0;
    const featuredMentorsRows =
      featuredMentorsRaw.status === "fulfilled" ? featuredMentorsRaw.value : [];
    const publicReviewSpotlights =
      reviewSpotlights.status === "fulfilled" ? reviewSpotlights.value : [];
    const averagePayment =
      paymentAggregate.status === "fulfilled"
        ? paymentAggregate.value
        : { _avg: { amountPaise: null } };

    // existing: build search links from exam frequency
    const freq: Record<string, number> = {};
    for (const exam of flattenedExams) {
      freq[exam] = (freq[exam] ?? 0) + 1;
    }

    const searchLinks = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([exam]) => ({ label: examToLabel(exam), query: examToLabel(exam) }));

    // map featured mentors to PublicMentorCard shape
    const featuredMentors: PublicMentorCard[] = featuredMentorsRows.map((m) => {
      const name = m.user?.name ?? "GuideMe Mentor";
      return {
        id: m.userId,
        name,
        firstName: name.split(" ")[0] ?? name,
        image: m.user?.image ?? null,
        username: m.username,
        college: m.college,
        degree: m.degree, // Restored for homepage compatibility
        headline: m.headline,
        tier: m.tier,
        yearOfStudy: m.yearOfStudy,
        yearLabel: buildYearLabel(m.college, m.yearOfStudy),
        priceMinPaise: m.priceMinPaise,
        priceMaxPaise: m.priceMaxPaise,
        avgRating: m.avgRating ?? 0,
        totalReviews: m.totalReviews ?? 0,
        totalSessions: m.totalSessions ?? 0,
        examLabels: (m.examsCleared ?? []).map(examToLabel),
        topicLabels: m.specialisations ?? [],
        availableThisWeek: checkAvailableThisWeek(m.user?.availabilities ?? []),
      };
    });

    return {
      totalMentors,
      minPricePaise: priceBounds._min.priceMinPaise ?? 0,
      maxPricePaise: priceBounds._max.priceMaxPaise ?? 0,
      searchLinks,
      totalStudents: totalStudentsCount,
      completedSessions: completedSessionCount,
      featuredMentors,
      reviewSpotlights: publicReviewSpotlights,
      averagePaidSessionPricePaise: Math.round(averagePayment._avg.amountPaise ?? 0),
      introMinutes: FREE_INTRO_DURATION,
      averageRating: reviewStats.averageRating,
      totalPublicReviews: reviewStats.totalPublicReviews,
      mentorColleges,
    };
  } catch {
    return EMPTY_PLATFORM_SNAPSHOT;
  }
}




// ── Mentor directory ───────────────────────────────────────────────────

export async function getPublicMentorDirectory(
  filters: MentorFilters = {}
): Promise<MentorDirectoryResult> {
  const {
    query, stream, exam, tier,
    priceMax, available, forClass, limit = 12,
  } = filters;

  try {
    const baseWhere: Prisma.MentorProfileWhereInput = {
      isVerified: true,
      isActive: true,
    };

    if (query) {
      baseWhere.OR = [
        { headline: { contains: query, mode: "insensitive" } },
        { college: { contains: query, mode: "insensitive" } },
        { examsCleared: { has: query } },
        { specialisations: { has: query } },
        { user: { name: { contains: query, mode: "insensitive" } } },
      ];
    }

    if (stream) {
      const relatedExams = streamToExams(stream);
      if (relatedExams.length > 0) {
        baseWhere.examsCleared = { hasSome: relatedExams };
      }
    }

    if (exam) baseWhere.examsCleared = { has: exam };
    if (tier) baseWhere.tier = tier as MentorTier;
    if (priceMax) baseWhere.priceMinPaise = { lte: rupeesToPaise(priceMax) };
    if (forClass === "school") baseWhere.yearOfStudy = { in: [1, 2] };
    if (forClass === "ug") baseWhere.yearOfStudy = { in: [5, 6] };

    const now = startOfDay(new Date());
    const weekEnd = addDays(now, 7);
    const availabilityFilter: Prisma.AvailabilityListRelationFilter = {
      some: {
        isActive: true,
        OR: [
          { isRecurring: true },
          { specificDate: { gte: now, lte: weekEnd } },
        ],
      },
    };

    const availableThisWeekWhere: Prisma.MentorProfileWhereInput = {
      AND: [
        baseWhere,
        {
          user: {
            availabilities: availabilityFilter,
          },
        },
      ],
    };

    const where = available ? availableThisWeekWhere : baseWhere;

    const [total, totalAvailableThisWeek, rawMentors] = await Promise.all([
      db.mentorProfile.count({ where }),

      db.mentorProfile.count({
        where: availableThisWeekWhere,
      }),

      db.mentorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              availabilities: {
                where: { isActive: true },
                select: { isRecurring: true, specificDate: true, isActive: true },
              },
            },
          },
        },
        orderBy: [
          { tier: "desc" }, // Changed from isVerified to tier as isVerified is in where
          { avgRating: "desc" },
          { totalSessions: "desc" },
        ],
        take: limit,
      }),
    ]);

    const mentors: PublicMentorCard[] = rawMentors.map((m) => {
      const name = m.user?.name ?? "GuideMe Mentor";
      return {
        id: m.userId,
        name,
        firstName: name.split(" ")[0] ?? name,
        image: m.user?.image ?? null,
        username: m.username,
        college: m.college,
        degree: m.degree,
        headline: m.headline,
        tier: m.tier,
        yearOfStudy: m.yearOfStudy,
        yearLabel: buildYearLabel(m.college, m.yearOfStudy),
        priceMinPaise: m.priceMinPaise,
        priceMaxPaise: m.priceMaxPaise,
        avgRating: m.avgRating ?? 0,
        totalReviews: m.totalReviews ?? 0,
        totalSessions: m.totalSessions ?? 0,
        examLabels: (m.examsCleared ?? []).map(examToLabel),
        topicLabels: m.specialisations ?? [],
        availableThisWeek: checkAvailableThisWeek(m.user?.availabilities ?? []),
      };
    });

    return { mentors, total, totalAvailableThisWeek };
  } catch {
    return { mentors: [], total: 0, totalAvailableThisWeek: 0 };
  }
}

// ── Restored exports (used in homepage and auth pages) ─────────────────

export type PublicReviewSpotlight = {
  id: string;
  studentFirstName: string;
  studentCity: string | null;
  mentorName: string;
  mentorCollege: string | null;
  rating: number;
  reviewText: string | null;
  wouldRebook: boolean;
  createdAt: Date;
};

// Re-export PlatformSnapshot under the old name so homepage doesn't break
export type { PlatformSnapshot as PublicPlatformSnapshot };

export async function getPublicReviewSpotlights(
  limit = 6
): Promise<PublicReviewSpotlight[]> {
  try {
    const reviews = await db.review.findMany({
      where: {
        isPublic: true,
        reviewText: { not: null },
        rating: { gte: 4 },
      },
      include: {
        student: {
          select: {
            name: true,
            studentProfile: { select: { city: true } },
          },
        },
        mentor: {
          select: {
            name: true,
            mentorProfile: { select: { college: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return reviews.map((review) => {
      const studentName = review.student?.name ?? "Student";
      return {
        id: review.id,
        studentFirstName: studentName.split(" ")[0] ?? studentName,
        studentCity: review.student?.studentProfile?.city ?? null,
        mentorName: review.mentor?.name ?? "Mentor",
        mentorCollege: review.mentor?.mentorProfile?.college ?? null,
        rating: review.rating,
        reviewText: review.reviewText ?? null,
        wouldRebook: review.wouldRebook ?? false,
        createdAt: review.createdAt,
      };
    });
  } catch {
    return [];
  }
}

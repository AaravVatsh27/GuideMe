import { db } from "@/server/db";
import { Prisma } from "@prisma/client";
import { addDays, startOfDay } from "date-fns";

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
  priceMin: number | null;
  priceMax: number | null;
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
  minPrice: number;
  maxPrice: number;
  searchLinks: { label: string; query: string }[];
  // Add these back
  totalStudents: number;
  completedSessions: number;
  featuredMentors: PublicMentorCard[];
  reviewSpotlights: PublicReviewSpotlight[];
  introMinutes: number; // Also needed for homepage
  averagePaidSessionPrice: number;
};

export type MentorFilters = {
  query?: string;
  stream?: string;
  exam?: string;
  tier?: string;
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

// ── Platform snapshot ──────────────────────────────────────────────────

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
    ] = await Promise.all([
      // existing: total verified mentors
      db.mentorProfile.count({ where: { isVerified: true, isActive: true } }),

      // existing: price range
      db.mentorProfile.aggregate({
        where: { isVerified: true, isActive: true },
        _min: { priceMin: true },
        _max: { priceMax: true },
      }),

      // existing: exams for search links
      db.mentorProfile
        .findMany({
          where: { isVerified: true, isActive: true },
          select: { examsCleared: true },
        })
        .then((rows) => rows.flatMap((r) => r.examsCleared)),

      // new: total students onboarded
      db.studentProfile.count(),

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
        _avg: { amount: true },
      }),
    ]);

    // existing: build search links from exam frequency
    const freq: Record<string, number> = {};
    for (const e of allExams) freq[e] = (freq[e] ?? 0) + 1;

    const searchLinks = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([exam]) => ({ label: examToLabel(exam), query: examToLabel(exam) }));

    // map featured mentors to PublicMentorCard shape
    const featuredMentors: PublicMentorCard[] = featuredMentorsRaw.map((m) => {
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
        priceMin: m.priceMin,
        priceMax: m.priceMax,
        avgRating: m.avgRating ?? 0,
        totalReviews: m.totalReviews ?? 0,
        totalSessions: m.totalSessions ?? 0,
        examLabels: (m.examsCleared ?? []).map(examToLabel),
        topicLabels: m.specialisations ?? [],
        availableThisWeek: checkAvailableThisWeek(m.user?.availabilities ?? []),
      };
    });

    return {
      totalMentors: countResult,
      minPrice: priceResult._min.priceMin ?? 0,
      maxPrice: priceResult._max.priceMax ?? 0,
      searchLinks,
      totalStudents,
      completedSessions,
      featuredMentors,
      reviewSpotlights, // Restored
      averagePaidSessionPrice: Math.round(paymentAggregate._avg.amount ?? 0), // Restored
      introMinutes: 15, // Restored
    };
  } catch (error) {
    console.error("Error fetching platform snapshot:", error);
    return {
      totalMentors: 0,
      minPrice: 0,
      maxPrice: 0,
      searchLinks: [],
      totalStudents: 0,
      completedSessions: 0,
      featuredMentors: [],
      reviewSpotlights: [],
      averagePaidSessionPrice: 0,
      introMinutes: 15,
    };
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
    if (tier) baseWhere.tier = tier;
    if (priceMax) baseWhere.priceMin = { lte: priceMax };
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
        priceMin: m.priceMin,
        priceMax: m.priceMax,
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

export async function getAuthShellContent() {
  type AuthShellSnapshot = {
    totalMentors: number;
    minPrice: number;
    totalStudents: number;
    completedSessions: number;
    totalPublicReviews: number;
    spotlight: {
      reviewText: string | null;
      studentFirstName: string;
      mentorName: string;
    } | null;
  };

  const fallbackSnapshot: AuthShellSnapshot = {
    totalMentors: 0,
    minPrice: 0,
    totalStudents: 0,
    completedSessions: 0,
    totalPublicReviews: 0,
    spotlight: null,
  };

  const snapshotPromise = (async (): Promise<AuthShellSnapshot> => {
    const [
      mentorCountResult,
      minPriceResult,
      studentCountResult,
      completedSessionsResult,
      publicReviewCountResult,
      spotlightResult,
    ] = await Promise.allSettled([
      db.mentorProfile.count({
        where: { isVerified: true, isActive: true },
      }),
      db.mentorProfile.aggregate({
        where: { isVerified: true, isActive: true },
        _min: { priceMin: true },
      }),
      db.studentProfile.count(),
      db.session.count({
        where: { status: "COMPLETED" },
      }),
      db.review.count({
        where: { isPublic: true },
      }),
      db.review.findFirst({
        where: {
          isPublic: true,
          reviewText: { not: null },
          rating: { gte: 4 },
        },
        include: {
          student: {
            select: { name: true },
          },
          mentor: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const spotlightReview =
      spotlightResult.status === "fulfilled" ? spotlightResult.value : null;
    const studentName = spotlightReview?.student?.name ?? "Student";

    return {
      totalMentors:
        mentorCountResult.status === "fulfilled" ? mentorCountResult.value : 0,
      minPrice:
        minPriceResult.status === "fulfilled"
          ? minPriceResult.value._min.priceMin ?? 0
          : 0,
      totalStudents:
        studentCountResult.status === "fulfilled" ? studentCountResult.value : 0,
      completedSessions:
        completedSessionsResult.status === "fulfilled"
          ? completedSessionsResult.value
          : 0,
      totalPublicReviews:
        publicReviewCountResult.status === "fulfilled"
          ? publicReviewCountResult.value
          : 0,
      spotlight: spotlightReview
        ? {
            reviewText: spotlightReview.reviewText ?? null,
            studentFirstName: studentName.split(" ")[0] ?? studentName,
            mentorName: spotlightReview.mentor?.name ?? "Mentor",
          }
        : null,
    };
  })();

  const snapshot = await Promise.race<AuthShellSnapshot>([
    snapshotPromise,
    new Promise<AuthShellSnapshot>((resolve) => {
      setTimeout(() => resolve(fallbackSnapshot), 1800);
    }),
  ]);

  return {
    stats: [
      {
        label: "Verified mentors",
        value: snapshot.totalMentors.toLocaleString("en-IN"),
      },
      {
        label: "Starting price",
        value: snapshot.minPrice > 0 ? `₹${snapshot.minPrice}` : "Not listed",
      },
      {
        label: "Public reviews",
        value: snapshot.totalPublicReviews.toLocaleString("en-IN"),
      },
    ],
    summaryCards: [
      {
        label: "Sessions delivered",
        value: snapshot.completedSessions.toLocaleString("en-IN"),
        copy: "Total one-on-one sessions completed via GuideMe.",
      },
      {
        label: "Active students",
        value: snapshot.totalStudents.toLocaleString("en-IN"),
        copy: "Students currently navigating their career journey.",
      },
    ],
    spotlight: {
      quote:
        snapshot.spotlight?.reviewText ??
        "Recent public reviews will appear here once students choose to publish them.",
      attribution: snapshot.spotlight
        ? `${snapshot.spotlight.studentFirstName} mentored by ${snapshot.spotlight.mentorName}`
        : "GuideMe public reviews",
    },
  };
}

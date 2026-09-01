import type {
  Class,
  ConfusionType,
  MentorTier,
  Prisma,
  Stream,
  TargetExam,
} from "@prisma/client";

import { db } from "@/Backend/server/db";
import { getExamLabel, getHelpTopicLabel } from "@/Backend/server/mentor-onboarding";
import { isSchoolClass, isUGClass } from "@/Backend/server/student-onboarding";
import { cacheDel, cacheDelPattern, cacheGet, cacheKeys, cacheSet, cacheTtl } from "@/Backend/lib/cache";

const MIN_MATCH_SCORE = 30;
const MAX_MATCHES = 15;

type StudentMatchingProfile = {
  class: Class;
  stream: Stream;
  targetExam: TargetExam | null;
  confusionType: ConfusionType | null;
  confusionTypes: ConfusionType[];
};

type MentorCandidate = {
  id: string;
  name: string;
  image: string | null;
  mentorProfile: {
    college: string | null;
    degree: string | null;
    branch: string | null;
    yearOfStudy: number | null;
    expectedGraduationYear: number | null;
    tier: MentorTier;
    headline: string | null;
    bio: string | null;
    examsCleared: string[];
    examYears: Prisma.JsonValue | null;
    specialisations: string[];
    priceMin: number | null;
    priceMax: number | null;
    avgRating: number;
    totalReviews: number;
    totalSessions: number;
    responseRate: number;
    linkedinUrl: string | null;
  } | null;
  availabilities: Array<{
    id: string;
    isRecurring: boolean;
    specificDate: Date | null;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone: string;
  }>;
};

type MatchingScoreBreakdown = {
  streamAlignment: number;
  classAlignment: number;
  confusionTypeMatch: number;
  quality: number;
  recency: number;
  availability: number;
  responseRate: number;
};

type MentorMatch = {
  mentor: {
    id: string;
    name: string;
    image: string | null;
    college: string | null;
    tier: MentorTier;
    degree: string | null;
    branch: string | null;
    yearOfStudy: number | null;
    expectedGraduationYear: number | null;
    headline: string | null;
    bio: string | null;
    examsCleared: string[];
    specialisations: string[];
    priceMin: number | null;
    priceMax: number | null;
    avgRating: number;
    totalReviews: number;
    totalSessions: number;
    responseRate: number;
    linkedinUrl: string | null;
    availableThisWeek: boolean;
  };
  matchScore: number;
  matchReasons: string[];
  scoreBreakdown: MatchingScoreBreakdown;
};

export type MatchingResponse = {
  studentId: string;
  cached: boolean;
  generatedAt: string;
  matches: MentorMatch[];
};

type StreamAlignmentConfig = {
  exactExams: string[];
  relatedExams: string[];
  exactSpecialisations: string[];
  relatedSpecialisations: string[];
};

const STREAM_ALIGNMENT_CONFIG: Partial<Record<Stream, StreamAlignmentConfig>> = {
  SCIENCE_PCM: {
    exactExams: ["JEE_MAINS", "JEE_ADVANCED"],
    relatedExams: ["CUET"],
    exactSpecialisations: ["JEE_PREP_STRATEGY"],
    relatedSpecialisations: [
      "ENGINEERING_BRANCH_SELECTION",
      "COLLEGE_SELECTION",
      "STREAM_SELECTION",
      "SUBJECT_COMBINATIONS",
      "STUDY_PLANNING",
    ],
  },
  SCIENCE_PCB: {
    exactExams: ["NEET"],
    relatedExams: ["CUET"],
    exactSpecialisations: ["NEET_PREP_STRATEGY"],
    relatedSpecialisations: [
      "COLLEGE_SELECTION",
      "STREAM_SELECTION",
      "SUBJECT_COMBINATIONS",
      "STUDY_PLANNING",
    ],
  },
  COMMERCE: {
    exactExams: ["CA_FOUNDATION", "CA_INTER"],
    relatedExams: ["CAT", "CUET"],
    exactSpecialisations: ["CA_COMMERCE_PATH"],
    relatedSpecialisations: [
      "COLLEGE_SELECTION",
      "MBA_PREPARATION",
      "STUDY_PLANNING",
    ],
  },
  ARTS: {
    exactExams: ["CLAT", "CUET"],
    relatedExams: ["UPSC_PRELIMS"],
    exactSpecialisations: ["SUBJECT_COMBINATIONS"],
    relatedSpecialisations: [
      "COLLEGE_SELECTION",
      "STREAM_SELECTION",
      "CAREER_SWITCHING",
      "STUDY_PLANNING",
    ],
  },
  ENGINEERING: {
    exactExams: ["GATE"],
    relatedExams: ["CAT", "GRE"],
    exactSpecialisations: ["PLACEMENT_PREPARATION", "INTERNSHIP_GUIDANCE"],
    relatedSpecialisations: [
      "MBA_PREPARATION",
      "MS_ABROAD",
      "CAREER_SWITCHING",
      "STUDY_PLANNING",
    ],
  },
  MEDICAL: {
    exactExams: ["NEET"],
    relatedExams: ["GRE"],
    exactSpecialisations: ["NEET_PREP_STRATEGY"],
    relatedSpecialisations: ["MS_ABROAD", "CAREER_SWITCHING", "STUDY_PLANNING"],
  },
  LAW: {
    exactExams: ["CLAT"],
    relatedExams: ["CUET"],
    exactSpecialisations: ["COLLEGE_SELECTION"],
    relatedSpecialisations: ["CAREER_SWITCHING", "STUDY_PLANNING"],
  },
  MANAGEMENT: {
    exactExams: ["CAT"],
    relatedExams: ["XAT", "GMAT"],
    exactSpecialisations: ["MBA_PREPARATION"],
    relatedSpecialisations: [
      "PLACEMENT_PREPARATION",
      "INTERNSHIP_GUIDANCE",
      "CAREER_SWITCHING",
    ],
  },
  HIGHER_STUDIES: {
    exactExams: ["GRE", "GMAT", "GATE"],
    relatedExams: ["CAT"],
    exactSpecialisations: ["MS_ABROAD", "MBA_PREPARATION"],
    relatedSpecialisations: ["STUDY_PLANNING", "CAREER_SWITCHING"],
  },
  PLACEMENTS: {
    exactExams: [],
    relatedExams: ["CAT"],
    exactSpecialisations: ["PLACEMENT_PREPARATION", "INTERNSHIP_GUIDANCE"],
    relatedSpecialisations: [
      "CAREER_SWITCHING",
      "STUDY_PLANNING",
      "MBA_PREPARATION",
    ],
  },
  COMPETITIVE_EXAMS: {
    exactExams: [],
    relatedExams: [
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
    exactSpecialisations: [],
    relatedSpecialisations: [
      "JEE_PREP_STRATEGY",
      "NEET_PREP_STRATEGY",
      "CA_COMMERCE_PATH",
      "MBA_PREPARATION",
      "MS_ABROAD",
      "STUDY_PLANNING",
    ],
  },
  SKILL_BUILDING: {
    exactExams: [],
    relatedExams: [],
    exactSpecialisations: ["INTERNSHIP_GUIDANCE", "PLACEMENT_PREPARATION"],
    relatedSpecialisations: ["CAREER_SWITCHING", "STUDY_PLANNING"],
  },
  ENTREPRENEURSHIP: {
    exactExams: [],
    relatedExams: ["CAT"],
    exactSpecialisations: [],
    relatedSpecialisations: [
      "CAREER_SWITCHING",
      "PLACEMENT_PREPARATION",
      "INTERNSHIP_GUIDANCE",
    ],
  },
  UNDECIDED: {
    exactExams: [],
    relatedExams: [],
    exactSpecialisations: ["STREAM_SELECTION"],
    relatedSpecialisations: [
      "COLLEGE_SELECTION",
      "SUBJECT_COMBINATIONS",
      "STUDY_PLANNING",
    ],
  },
};

const CONFUSION_SPECIALISATION_MAP: Record<ConfusionType, string[]> = {
  STREAM_SELECTION: [
    "STREAM_SELECTION",
    "ENGINEERING_BRANCH_SELECTION",
    "SUBJECT_COMBINATIONS",
  ],
  EXAM_CHOICE: [
    "JEE_PREP_STRATEGY",
    "NEET_PREP_STRATEGY",
    "CA_COMMERCE_PATH",
    "MBA_PREPARATION",
    "MS_ABROAD",
    "STUDY_PLANNING",
  ],
  COLLEGE_SELECTION: [
    "COLLEGE_SELECTION",
    "HOSTEL_COLLEGE_LIFE",
    "ENGINEERING_BRANCH_SELECTION",
  ],
  CAREER_DIRECTION: [
    "CAREER_SWITCHING",
    "INTERNSHIP_GUIDANCE",
    "PLACEMENT_PREPARATION",
    "CA_COMMERCE_PATH",
    "MBA_PREPARATION",
    "MS_ABROAD",
  ],
  SUBJECT_COMBINATION: ["SUBJECT_COMBINATIONS", "STREAM_SELECTION"],
  COACHING_SELECTION: [
    "COACHING_SELECTION",
    "JEE_PREP_STRATEGY",
    "NEET_PREP_STRATEGY",
    "CA_COMMERCE_PATH",
  ],
  PLANNING_NEXT_TWO_YEARS: [
    "STUDY_PLANNING",
    "PLACEMENT_PREPARATION",
    "INTERNSHIP_GUIDANCE",
  ],
  POST_GRADUATION_PATH: [
    "MBA_PREPARATION",
    "MS_ABROAD",
    "PLACEMENT_PREPARATION",
    "CAREER_SWITCHING",
  ],
};

function getMatchingCacheKey(studentId: string) {
  return cacheKeys.matching(studentId);
}

function roundScore(value: number) {
  return Math.round(value * 10) / 10;
}

function titleCaseTier(tier: MentorTier) {
  return tier.charAt(0) + tier.slice(1).toLowerCase();
}

function normalizeResponseRate(value: number) {
  if (value > 0 && value <= 1) {
    return value * 100;
  }

  return value;
}

function isJsonObject(
  value: Prisma.JsonValue | null | undefined,
): value is Prisma.JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getExamYear(examYears: Prisma.JsonValue | null, exam: string) {
  if (!isJsonObject(examYears)) {
    return null;
  }

  const value = examYears[exam];
  return typeof value === "number" ? value : null;
}

function mapTargetExamToMentorExams(targetExam: TargetExam | null) {
  switch (targetExam) {
    case "JEE":
      return ["JEE_MAINS", "JEE_ADVANCED"];
    case "UPSC":
      return ["UPSC_PRELIMS"];
    case "OTHER":
    case "UNDECIDED":
    case null:
      return [];
    default:
      return [targetExam];
  }
}

function getStreamSignals(student: StudentMatchingProfile) {
  const config = STREAM_ALIGNMENT_CONFIG[student.stream] ?? {
    exactExams: [],
    relatedExams: [],
    exactSpecialisations: [],
    relatedSpecialisations: [],
  };

  const targetExamSignals = mapTargetExamToMentorExams(student.targetExam);

  return {
    exactExams: new Set([...config.exactExams, ...targetExamSignals]),
    relatedExams: new Set(config.relatedExams),
    exactSpecialisations: new Set(config.exactSpecialisations),
    relatedSpecialisations: new Set(config.relatedSpecialisations),
  };
}

function getStudentConfusionValues(student: StudentMatchingProfile) {
  if (student.confusionTypes.length > 0) {
    return student.confusionTypes;
  }

  return student.confusionType ? [student.confusionType] : [];
}

function getConfusionSpecialisationTargets(student: StudentMatchingProfile) {
  const targets = new Set<string>();

  for (const confusion of getStudentConfusionValues(student)) {
    for (const specialisation of CONFUSION_SPECIALISATION_MAP[confusion] ?? []) {
      targets.add(specialisation);
    }
  }

  return targets;
}

function getClassAlignmentScore(studentClass: Class, yearOfStudy: number | null) {
  if (!yearOfStudy) {
    return 0;
  }

  if (isSchoolClass(studentClass)) {
    return yearOfStudy === 1 || yearOfStudy === 2 ? 20 : 0;
  }

  if (isUGClass(studentClass)) {
    return yearOfStudy === 5 || yearOfStudy === 6 ? 20 : 0;
  }

  return 0;
}

function getRecencyScore(yearOfStudy: number | null) {
  if (!yearOfStudy) {
    return 0;
  }

  if (yearOfStudy === 1 || yearOfStudy === 2) {
    return 10;
  }

  if (yearOfStudy === 3 || yearOfStudy === 5) {
    return 6;
  }

  return 3;
}

function getAvailabilityScore(mentor: MentorCandidate) {
  return mentor.availabilities.length > 0 ? 5 : 0;
}

function getResponseRateScore(responseRate: number) {
  const normalized = normalizeResponseRate(responseRate);

  if (normalized > 90) {
    return 5;
  }

  if (normalized >= 70) {
    return 3;
  }

  return 1;
}

function getQualityScore(avgRating: number, totalReviews: number) {
  const boundedRating = Math.max(0, Math.min(avgRating, 5));
  const bayesianAverage =
    (boundedRating * totalReviews + 3.5 * 5) / (totalReviews + 5);

  return roundScore((bayesianAverage / 5) * 15);
}

function getStreamAlignment(
  student: StudentMatchingProfile,
  mentor: MentorCandidate,
) {
  const signals = getStreamSignals(student);
  const exams = mentor.mentorProfile?.examsCleared ?? [];
  const specialisations = mentor.mentorProfile?.specialisations ?? [];

  const exactExam = exams.find((exam) => signals.exactExams.has(exam));
  if (exactExam) {
    const year = mentor.mentorProfile?.examYears
      ? getExamYear(mentor.mentorProfile.examYears, exactExam)
      : null;

    return {
      score: 25,
      reason: year
        ? `Cracked ${getExamLabel(exactExam)} ${year}`
        : `Cracked ${getExamLabel(exactExam)}`,
    };
  }

  const exactSpecialisation = specialisations.find((value) =>
    signals.exactSpecialisations.has(value),
  );
  if (exactSpecialisation) {
    return {
      score: 25,
      reason: `Specialises in ${getHelpTopicLabel(exactSpecialisation).toLowerCase()}`,
    };
  }

  const relatedExam = exams.find((exam) => signals.relatedExams.has(exam));
  if (relatedExam) {
    return {
      score: 15,
      reason: `Relevant experience with ${getExamLabel(relatedExam)}`,
    };
  }

  const relatedSpecialisation = specialisations.find((value) =>
    signals.relatedSpecialisations.has(value),
  );
  if (relatedSpecialisation) {
    return {
      score: 15,
      reason: `Can guide ${getHelpTopicLabel(relatedSpecialisation).toLowerCase()}`,
    };
  }

  return {
    score: 0,
    reason: null,
  };
}

function getConfusionAlignment(
  student: StudentMatchingProfile,
  mentor: MentorCandidate,
) {
  const targets = getConfusionSpecialisationTargets(student);
  const matchedSpecialisations = (mentor.mentorProfile?.specialisations ?? []).filter((value) =>
    targets.has(value),
  );

  return {
    score: Math.min(matchedSpecialisations.length * 7, 20),
    matchedSpecialisations,
  };
}

function buildMatchReasons(
  mentor: MentorCandidate,
  options: {
    streamReason: string | null;
    confusionMatches: string[];
    qualityScore: number;
    availabilityScore: number;
    responseRateScore: number;
  },
) {
  const reasons: string[] = [];
  const seen = new Set<string>();

  const addReason = (reason: string | null | undefined) => {
    if (!reason || seen.has(reason)) {
      return;
    }

    seen.add(reason);
    reasons.push(reason);
  };

  addReason(options.streamReason);

  for (const specialisation of options.confusionMatches.slice(0, 2)) {
    addReason(`Specialises in ${getHelpTopicLabel(specialisation).toLowerCase()}`);
  }

  if (mentor.mentorProfile && options.qualityScore > 0 && mentor.mentorProfile.totalReviews > 0) {
    addReason(
      `${mentor.mentorProfile.avgRating.toFixed(1)} rating from ${mentor.mentorProfile.totalReviews} review${mentor.mentorProfile.totalReviews === 1 ? "" : "s"}`,
    );
  }

  if (options.availabilityScore > 0) {
    addReason("Available this week");
  }

  if (mentor.mentorProfile?.college) {
    addReason(
      `${mentor.mentorProfile.college} - ${titleCaseTier(mentor.mentorProfile.tier)} mentor`,
    );
  }

  if (options.responseRateScore >= 3 && mentor.mentorProfile) {
    addReason(
      `${Math.round(normalizeResponseRate(mentor.mentorProfile.responseRate))}% response rate`,
    );
  }

  return reasons;
}

async function fetchStudentProfile(studentId: string) {
  return db.studentProfile.findUnique({
    where: {
      userId: studentId,
    },
    select: {
      class: true,
      stream: true,
      targetExam: true,
      confusionType: true,
      confusionTypes: true,
    },
  });
}

async function fetchMentorCandidates() {
  const now = new Date();
  const nextWeek = new Date(now);
  nextWeek.setDate(now.getDate() + 7);

  return db.user.findMany({
    where: {
      role: "MENTOR",
      isActive: true,
      onboardingComplete: true,
      deletedAt: null,
      mentorProfile: {
        is: {
          isActive: true,
        },
      },
      OR: [
        {
          mentorVerification: {
            is: {
              status: "APPROVED",
            },
          },
        },
        {
          mentorProfile: {
            is: {
              isVerified: true,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      image: true,
      mentorProfile: {
        select: {
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
        },
      },
      availabilities: {
        where: {
          isActive: true,
          OR: [
            {
              isRecurring: true,
            },
            {
              specificDate: {
                gte: now,
                lte: nextWeek,
              },
            },
          ],
        },
        select: {
          id: true,
          isRecurring: true,
          specificDate: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          timezone: true,
        },
      },
    },
  });
}

function scoreMentorMatch(
  student: StudentMatchingProfile,
  mentor: MentorCandidate,
): MentorMatch | null {
  if (!mentor.mentorProfile) {
    return null;
  }

  const classAlignment = getClassAlignmentScore(
    student.class,
    mentor.mentorProfile.yearOfStudy,
  );

  if (classAlignment === 0) {
    return null;
  }

  const streamAlignment = getStreamAlignment(student, mentor);
  const confusionAlignment = getConfusionAlignment(student, mentor);
  const qualityScore = getQualityScore(
    mentor.mentorProfile.avgRating,
    mentor.mentorProfile.totalReviews,
  );
  const recencyScore = getRecencyScore(mentor.mentorProfile.yearOfStudy);
  const availabilityScore = getAvailabilityScore(mentor);
  const responseRateScore = getResponseRateScore(mentor.mentorProfile.responseRate);

  const scoreBreakdown: MatchingScoreBreakdown = {
    streamAlignment: streamAlignment.score,
    classAlignment,
    confusionTypeMatch: confusionAlignment.score,
    quality: qualityScore,
    recency: recencyScore,
    availability: availabilityScore,
    responseRate: responseRateScore,
  };

  const matchScore = roundScore(
    Object.values(scoreBreakdown).reduce((total, value) => total + value, 0),
  );

  if (matchScore < MIN_MATCH_SCORE) {
    return null;
  }

  return {
    mentor: {
      id: mentor.id,
      name: mentor.name,
      image: mentor.image,
      college: mentor.mentorProfile.college,
      tier: mentor.mentorProfile.tier,
      degree: mentor.mentorProfile.degree,
      branch: mentor.mentorProfile.branch,
      yearOfStudy: mentor.mentorProfile.yearOfStudy,
      expectedGraduationYear: mentor.mentorProfile.expectedGraduationYear,
      headline: mentor.mentorProfile.headline,
      bio: mentor.mentorProfile.bio,
      examsCleared: mentor.mentorProfile.examsCleared,
      specialisations: mentor.mentorProfile.specialisations,
      priceMin: mentor.mentorProfile.priceMin,
      priceMax: mentor.mentorProfile.priceMax,
      avgRating: mentor.mentorProfile.avgRating,
      totalReviews: mentor.mentorProfile.totalReviews,
      totalSessions: mentor.mentorProfile.totalSessions,
      responseRate: mentor.mentorProfile.responseRate,
      linkedinUrl: mentor.mentorProfile.linkedinUrl,
      availableThisWeek: availabilityScore > 0,
    },
    matchScore,
    matchReasons: buildMatchReasons(mentor, {
      streamReason: streamAlignment.reason,
      confusionMatches: confusionAlignment.matchedSpecialisations,
      qualityScore,
      availabilityScore,
      responseRateScore,
    }),
    scoreBreakdown,
  };
}

async function computeMatches(studentId: string) {
  const [student, mentors] = await Promise.all([
    fetchStudentProfile(studentId),
    fetchMentorCandidates(),
  ]);

  if (!student) {
    return null;
  }

  const matches = mentors
    .map((mentor) => scoreMentorMatch(student, mentor))
    .filter((match): match is MentorMatch => match !== null)
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, MAX_MATCHES);

  return {
    studentId,
    cached: false,
    generatedAt: new Date().toISOString(),
    matches,
  } satisfies MatchingResponse;
}

export async function getStudentMentorMatches(
  studentId: string,
  options?: {
    forceRefresh?: boolean;
  },
) {
  const cacheKey = getMatchingCacheKey(studentId);

  if (!options?.forceRefresh) {
    const cached = await cacheGet<MatchingResponse>(cacheKey);

    if (cached) {
      return {
        ...cached,
        cached: true,
      } satisfies MatchingResponse;
    }
  }

  const fresh = await computeMatches(studentId);

  if (!fresh) {
    return null;
  }

  cacheSet(cacheKey, fresh, cacheTtl.matchingResults).catch(() => {});

  return fresh;
}

export async function invalidateMatchingCacheForStudent(studentId: string) {
  await cacheDel(getMatchingCacheKey(studentId));
  return 1;
}

export async function invalidateAllMatchingCaches() {
  await cacheDelPattern(cacheKeys.matchingPattern);
  return 1;
}

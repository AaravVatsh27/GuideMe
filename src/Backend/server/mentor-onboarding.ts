import { DEFAULT_TIMEZONE, PLATFORM_CUT } from "@/Backend/server/constants";

export const MENTOR_TIER_VALUES = [
  "RISING",
  "VERIFIED",
  "ELITE",
] as const;

export const DEGREE_VALUES = [
  "B.TECH",
  "B.SC",
  "B.COM",
  "BA",
  "BBA",
  "MBBS",
  "LLB",
  "M.TECH",
  "MBA",
  "M.SC",
  "MA",
  "PHD",
  "OTHER",
] as const;

export const YEAR_OF_STUDY_VALUES = [1, 2, 3, 4, 5, 6] as const;

export const EXAM_VALUES = [
  "JEE_MAINS",
  "JEE_ADVANCED",
  "NEET",
  "CA_FOUNDATION",
  "CA_INTER",
  "CLAT",
  "GATE",
  "CAT",
  "XAT",
  "GMAT",
  "GRE",
  "UPSC_PRELIMS",
  "NDA",
  "CUET",
] as const;

export const HELP_TOPIC_VALUES = [
  "STREAM_SELECTION",
  "JEE_PREP_STRATEGY",
  "NEET_PREP_STRATEGY",
  "CA_COMMERCE_PATH",
  "COLLEGE_SELECTION",
  "HOSTEL_COLLEGE_LIFE",
  "ENGINEERING_BRANCH_SELECTION",
  "MBA_PREPARATION",
  "MS_ABROAD",
  "INTERNSHIP_GUIDANCE",
  "PLACEMENT_PREPARATION",
  "CAREER_SWITCHING",
  "STUDY_PLANNING",
  "COACHING_SELECTION",
  "SUBJECT_COMBINATIONS",
] as const;

export const PRICING_POINTS = [
  99,
  149,
  199,
  249,
  299,
  349,
  399,
  499,
  599,
] as const;

export const AVAILABILITY_DAYS = [
  { value: 0, label: "Sun", fullLabel: "Sunday" },
  { value: 1, label: "Mon", fullLabel: "Monday" },
  { value: 2, label: "Tue", fullLabel: "Tuesday" },
  { value: 3, label: "Wed", fullLabel: "Wednesday" },
  { value: 4, label: "Thu", fullLabel: "Thursday" },
  { value: 5, label: "Fri", fullLabel: "Friday" },
  { value: 6, label: "Sat", fullLabel: "Saturday" },
] as const;

export type MentorTierValue =
  (typeof MENTOR_TIER_VALUES)[number];

export type DegreeValue =
  (typeof DEGREE_VALUES)[number];

export type YearOfStudyValue =
  (typeof YEAR_OF_STUDY_VALUES)[number];

export type MentorExamValue =
  (typeof EXAM_VALUES)[number];

export type MentorHelpTopicValue =
  (typeof HELP_TOPIC_VALUES)[number];

export type MentorOnboardingStep =
  1 | 2 | 3 | 4 | 5 | 6 | 7;

export type MentorExamEntry = {
  exam: MentorExamValue;
  year?: number | null;
};

export type MentorAvailabilitySlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export type MentorOnboardingDraft = {
  /**
   * New authoritative institution reference.
   */
  institutionId?: string;

  /**
   * Legacy fields kept temporarily for compatibility.
   */
  college?: string;
  tier?: MentorTierValue;

  degree?: DegreeValue;
  branch?: string;
  yearOfStudy?: YearOfStudyValue;
  expectedGraduationYear?: number;

  exams: MentorExamEntry[];
  specialisations: MentorHelpTopicValue[];

  priceMin: number;
  priceMax: number;

  headline?: string;
  bio?: string;
  avatarUrl?: string;
  linkedinUrl?: string;

  timezone: string;
  availabilitySlots: MentorAvailabilitySlot[];
};

/**
 * Institution result used by mentor onboarding.
 *
 * This represents an actual Institution database record,
 * not a hardcoded benchmark entry.
 */
export type MentorCollegeOption = {
  id: string;
  name: string;
  shortName: string | null;
  slug: string;
  city: string | null;
  state: string | null;
  academicCategory: string;
  institutionClassification: string;
  institutionTier: string;
};

export const DEGREE_OPTIONS = [
  { value: "B.TECH", label: "B.Tech" },
  { value: "B.SC", label: "B.Sc" },
  { value: "B.COM", label: "B.Com" },
  { value: "BA", label: "BA" },
  { value: "BBA", label: "BBA" },
  { value: "MBBS", label: "MBBS" },
  { value: "LLB", label: "LLB" },
  { value: "M.TECH", label: "M.Tech" },
  { value: "MBA", label: "MBA" },
  { value: "M.SC", label: "M.Sc" },
  { value: "MA", label: "MA" },
  { value: "PHD", label: "PhD" },
  { value: "OTHER", label: "Other" },
] as const;

export const YEAR_OF_STUDY_OPTIONS = [
  { value: 1, label: "1st year" },
  { value: 2, label: "2nd year" },
  { value: 3, label: "3rd year" },
  { value: 4, label: "4th year" },
  { value: 5, label: "Masters 1st" },
  { value: 6, label: "Masters 2nd" },
] as const;

export const BRANCH_SUGGESTIONS = [
  "Computer Science and Engineering",
  "Electronics and Communication",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Chemical Engineering",
  "Biotechnology",
  "Economics",
  "Physics",
  "Mathematics",
  "Commerce",
  "Finance",
  "Marketing",
  "Medicine and Surgery",
  "Law",
  "Data Science",
  "Artificial Intelligence",
  "Business Analytics",
  "Psychology",
  "Design",
] as const;

export const EXAM_OPTIONS = [
  { value: "JEE_MAINS", label: "JEE Mains" },
  { value: "JEE_ADVANCED", label: "JEE Advanced" },
  { value: "NEET", label: "NEET" },
  { value: "CA_FOUNDATION", label: "CA Foundation" },
  { value: "CA_INTER", label: "CA Inter" },
  { value: "CLAT", label: "CLAT" },
  { value: "GATE", label: "GATE" },
  { value: "CAT", label: "CAT" },
  { value: "XAT", label: "XAT" },
  { value: "GMAT", label: "GMAT" },
  { value: "GRE", label: "GRE" },
  { value: "UPSC_PRELIMS", label: "UPSC Prelims" },
  { value: "NDA", label: "NDA" },
  { value: "CUET", label: "CUET" },
] as const;

export const HELP_TOPIC_OPTIONS = [
  {
    value: "STREAM_SELECTION",
    label: "Stream selection",
  },
  {
    value: "JEE_PREP_STRATEGY",
    label: "JEE prep strategy",
  },
  {
    value: "NEET_PREP_STRATEGY",
    label: "NEET prep strategy",
  },
  {
    value: "CA_COMMERCE_PATH",
    label: "CA/Commerce path",
  },
  {
    value: "COLLEGE_SELECTION",
    label: "College selection",
  },
  {
    value: "HOSTEL_COLLEGE_LIFE",
    label: "Hostel & college life",
  },
  {
    value: "ENGINEERING_BRANCH_SELECTION",
    label: "Engineering branch selection",
  },
  {
    value: "MBA_PREPARATION",
    label: "MBA preparation",
  },
  {
    value: "MS_ABROAD",
    label: "MS abroad",
  },
  {
    value: "INTERNSHIP_GUIDANCE",
    label: "Internship guidance",
  },
  {
    value: "PLACEMENT_PREPARATION",
    label: "Placement preparation",
  },
  {
    value: "CAREER_SWITCHING",
    label: "Career switching",
  },
  {
    value: "STUDY_PLANNING",
    label: "Study planning",
  },
  {
    value: "COACHING_SELECTION",
    label: "Coaching selection",
  },
  {
    value: "SUBJECT_COMBINATIONS",
    label: "Subject combinations",
  },
] as const;

export const EMPTY_MENTOR_DRAFT: MentorOnboardingDraft = {
  exams: [],
  specialisations: [],
  priceMin: 199,
  priceMax: calculateFortyFiveMinutePrice(199),
  timezone: DEFAULT_TIMEZONE,
  availabilitySlots: [],
};

export const AVAILABILITY_SLOTS = Array.from(
  { length: 14 },
  (_, index) => {
    const hour = index + 8;
    const nextHour = hour + 1;

    return {
      value: `${String(hour).padStart(2, "0")}:00`,
      endValue: `${String(nextHour).padStart(2, "0")}:00`,
      label: formatHour(hour),
    };
  },
);

const ELITE_MATCHERS = [
  /(^|\s)iit(\s|$)/i,
  /indian institute of technology/i,
  /(^|\s)iim(\s|$)/i,
  /indian institute of management/i,
  /aiims new delhi/i,
  /all india institute of medical sciences,? new delhi/i,
  /nlsiu/i,
  /national law school of india university/i,
  /nlu delhi/i,
] as const;

const VERIFIED_MATCHERS = [
  /(^|\s)nit(\s|$)/i,
  /national institute of technology/i,
  /(^|\s)iiit(\s|$)/i,
  /indian institute of information technology/i,
  /(^|\s)bits(\s|$)/i,
  /birla institute of technology and science/i,
  /(^|\s)aiims(\s|$)/i,
  /(^|\s)nlu(\s|$)/i,
  /nalsar/i,
  /nujs/i,
  /vellore institute of technology/i,
  /(^|\s)vit(\s|$)/i,
  /manipal/i,
  /dtu/i,
  /nsut/i,
  /jadavpur/i,
  /anna university/i,
  /srcc/i,
  /st\.? stephen/i,
  /fms/i,
  /xlri/i,
] as const;

function formatHour(hour: number) {
  const suffix = hour >= 12 ? "pm" : "am";
  const normalized =
    hour % 12 === 0 ? 12 : hour % 12;

  return `${normalized}${suffix}`;
}

export function calculateFortyFiveMinutePrice(
  price30: number,
) {
  return Math.round(price30 * 1.4);
}

export function calculateEstimatedMonthlyEarnings(
  price30: number,
) {
  const sessionsPerMonth = 12;
  const mentorShare = 1 - PLATFORM_CUT;

  return Math.round(
    price30 *
    sessionsPerMonth *
    mentorShare,
  );
}

export function buildGraduationYearOptions(
  baseYear = new Date().getFullYear(),
) {
  return Array.from(
    { length: 8 },
    (_, index) => baseYear + index,
  );
}

export function getDegreeLabel(
  value: string | null | undefined,
) {
  return (
    DEGREE_OPTIONS.find(
      (option) => option.value === value,
    )?.label ??
    value ??
    "Not set"
  );
}

export function getYearOfStudyLabel(
  value: number | null | undefined,
) {
  return (
    YEAR_OF_STUDY_OPTIONS.find(
      (option) => option.value === value,
    )?.label ?? "Not set"
  );
}

export function getExamLabel(
  value: string | null | undefined,
) {
  return (
    EXAM_OPTIONS.find(
      (option) => option.value === value,
    )?.label ??
    value ??
    "Unknown exam"
  );
}

export function getHelpTopicLabel(
  value: string | null | undefined,
) {
  return (
    HELP_TOPIC_OPTIONS.find(
      (option) => option.value === value,
    )?.label ??
    value ??
    "Unknown topic"
  );
}

export function normalizeCollegeName(
  value: string,
) {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Legacy compatibility helper.
 *
 * IMPORTANT:
 * This is no longer the source of truth for institution
 * classification.
 *
 * New onboarding code should use the Institution record's
 * `institutionTier`.
 *
 * This function remains temporarily because existing code
 * may still import it.
 */
export function detectMentorTier(
  collegeName: string,
): {
  tier: MentorTierValue;
  explanation: string;
} {
  const normalized =
    normalizeCollegeName(collegeName);

  if (
    ELITE_MATCHERS.some((matcher) =>
      matcher.test(normalized),
    )
  ) {
    return {
      tier: "ELITE",
      explanation:
        "Legacy compatibility classification. Use the selected Institution's institutionTier for the authoritative institution classification.",
    };
  }

  if (
    VERIFIED_MATCHERS.some((matcher) =>
      matcher.test(normalized),
    )
  ) {
    return {
      tier: "VERIFIED",
      explanation:
        "Legacy compatibility classification. Use the selected Institution's institutionTier for the authoritative institution classification.",
    };
  }

  return {
    tier: "RISING",
    explanation:
      "Legacy compatibility classification. Use the selected Institution's institutionTier for the authoritative institution classification.",
  };
}

export function createAvailabilityKey(
  slot: MentorAvailabilitySlot,
) {
  return `${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`;
}

export function formatAvailabilityLabel(
  slot: MentorAvailabilitySlot,
) {
  const day =
    AVAILABILITY_DAYS.find(
      (item) => item.value === slot.dayOfWeek,
    )?.label ?? "Day";

  return `${day} ${slot.startTime}-${slot.endTime}`;
}
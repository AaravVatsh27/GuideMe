import { format } from "date-fns";
import { getExamLabel } from "@/Backend/server/mentor-onboarding";
import { SCHOOL_STREAM_OPTIONS, UG_FOCUS_OPTIONS } from "@/Backend/server/student-onboarding";

const ACRONYM_LABELS: Record<string, string> = {
  AI: "AI",
  CA: "CA",
  CBSE: "CBSE",
  GMAT: "GMAT",
  GRE: "GRE",
  ICSE: "ICSE",
  IIT: "IIT",
  JEE: "JEE",
  MBA: "MBA",
  MS: "MS",
  NDA: "NDA",
  NEET: "NEET",
  NIT: "NIT",
  PCM: "PCM",
  PCB: "PCB",
  UG: "UG",
  UPSC: "UPSC",
};

export function formatCurrency(value: number | null | undefined) {
  return `INR ${(value ?? 0).toLocaleString("en-IN")}`;
}

export function formatDateTime(value: string | Date) {
  return format(new Date(value), "EEE, d MMM yyyy 'at' h:mm a");
}

export function formatShortDateTime(value: string | Date) {
  return format(new Date(value), "d MMM, h:mm a");
}

export function formatDateOnly(value: string | Date) {
  return format(new Date(value), "d MMM yyyy");
}

export function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .split("_")
    .filter(Boolean)
    .map((word) => ACRONYM_LABELS[word] ?? `${word.charAt(0)}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

export function formatActivityLabel(action: string) {
  return formatEnumLabel(action);
}

export function getInitials(name: string | null | undefined) {
  const parts = (name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "G";
  }

  return parts.map((part) => part.charAt(0).toUpperCase()).join("");
}

const CLASS_LABELS: Record<string, string> = {
  CLASS_10: "Class 10",
  CLASS_11: "Class 11",
  CLASS_12: "Class 12",
  UG_1: "UG 1",
  UG_2: "UG 2",
  UG_3: "UG 3",
  UG_4: "UG 4",
};

const MENTORSHIP_NEED_LABELS: Record<string, string> = {
  STREAM_SELECTION: "Stream selection",
  SUBJECT_SELECTION: "Subject selection",
  EXAM_PREPARATION: "Exam preparation",
  STUDY_STRATEGY: "Study strategy",
  SCHOOL_COACHING_BALANCE: "School–coaching balance",
  COLLEGE_SELECTION: "College selection",
  BRANCH_SELECTION: "Branch selection",
  COLLEGE_COMPARISON: "College comparison",
  CAREER_EXPLORATION: "Career exploration",
  COLLEGE_LIFE: "College life",
  HIGHER_STUDIES: "Higher studies",
  TIME_MANAGEMENT: "Time management",
  OTHER: "Other support",
};

const DECISION_STAGE_LABELS: Record<string, string> = {
  EXPLORING: "Exploring your options",
  SHORTLISTING: "Shortlisting options",
  COMPARING: "Comparing different paths",
  DECIDING_SOON: "Ready to make a decision",
  EXECUTION: "Executing your plan",
};

const STREAM_LABEL_MAP: Record<string, string> = (() => {
  const map: Record<string, string> = {
    UNDECIDED: "Not sure yet / Confused",
  };
  for (const option of [...SCHOOL_STREAM_OPTIONS, ...UG_FOCUS_OPTIONS]) {
    map[option.value] = option.label;
  }
  return map;
})();

type StudentProfileSubset = {
  class?: string | null;
  board?: string | null;
  stream?: string | null;
  targetExam?: string | null;
  targetExams?: string[] | null;
  mentorshipNeeds?: string[] | null;
  decisionStage?: string | null;
  currentConfusion?: string | null;
};

export function formatAcademicContext(profile: StudentProfileSubset | null | undefined): string {
  if (!profile) return "";
  const parts: string[] = [];
  if (profile.class) parts.push(CLASS_LABELS[profile.class] ?? profile.class);
  if (profile.board) parts.push(profile.board);
  if (profile.stream) parts.push(STREAM_LABEL_MAP[profile.stream] ?? profile.stream);
  return parts.join(" · ");
}

export function formatTargetExamLabel(profile: StudentProfileSubset | null | undefined): string {
  if (!profile) return "";
  const exams = (profile.targetExams ?? []).filter((value): value is string => Boolean(value));
  if (exams.length === 0 && profile.targetExam) {
    exams.push(profile.targetExam);
  }
  if (exams.length === 0) return "";
  const first = getExamLabel(exams[0]);
  if (exams.length === 1) return first;
  if (exams.length === 2) return `${first} · ${getExamLabel(exams[1])}`;
  return `${first} +${exams.length - 1}`;
}

export function formatMentorshipNeeds(
  needs: string[] | null | undefined,
  max = 3,
): string[] {
  if (!needs || needs.length === 0) return [];
  return needs
    .map((value) => MENTORSHIP_NEED_LABELS[value] ?? formatEnumLabel(value))
    .filter(Boolean)
    .slice(0, max);
}

export function formatDecisionStage(stage: string | null | undefined): string {
  if (!stage) return "";
  return DECISION_STAGE_LABELS[stage] ?? formatEnumLabel(stage);
}

export function buildHeroSubtitle(
  profile: StudentProfileSubset | null | undefined,
): string {
  if (!profile) return "Your personalized guidance dashboard.";
  const examLabel = formatTargetExamLabel(profile);
  const decisionLabel = formatDecisionStage(profile.decisionStage);
  if (decisionLabel && examLabel) {
    return `You're ${decisionLabel.toLowerCase()} with a focus on ${examLabel}.`;
  }
  if (decisionLabel) {
    return `You're ${decisionLabel.toLowerCase()}.`;
  }
  if (examLabel) {
    return `Preparing for ${examLabel}.`;
  }
  return "Your personalized guidance dashboard.";
}

export function truncateSentence(value: string, maxLength: number): string {
  if (!value) return "";
  if (value.length <= maxLength) return value;
  const sliced = value.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace > maxLength * 0.6) {
    return `${sliced.slice(0, lastSpace).trimEnd()}…`;
  }
  return `${sliced.trimEnd()}…`;
}

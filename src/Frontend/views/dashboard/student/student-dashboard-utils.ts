import { format } from "date-fns";
import { getExamLabel } from "@/Backend/server/mentor-onboarding";
import {
  BOARD_OPTIONS,
  CLASS_OPTIONS,
  SCHOOL_STREAM_OPTIONS,
  UG_FOCUS_OPTIONS,
} from "@/Backend/server/student-onboarding";

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

const ENUM_LABEL_OVERRIDES: Record<string, string> = {
  SCIENCE_PCM: "Science — PCM",
  SCIENCE_PCB: "Science — PCB",
  STREAM_SELECTION: "Stream selection",
  UNDECIDED: "Not sure yet",
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

  if (ENUM_LABEL_OVERRIDES[value]) {
    return ENUM_LABEL_OVERRIDES[value];
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

const CLASS_LABELS: Record<string, string> = Object.fromEntries(
  CLASS_OPTIONS.map((option) => [option.value, option.label]),
);

const BOARD_LABELS: Record<string, string> = Object.fromEntries(
  BOARD_OPTIONS.map((option) => [option.value, option.label]),
);

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
    UNDECIDED: "Not sure yet",
  };
  for (const option of [...SCHOOL_STREAM_OPTIONS, ...UG_FOCUS_OPTIONS]) {
    map[option.value] = option.label;
  }
  map.SCIENCE_PCM = "Science — PCM";
  map.SCIENCE_PCB = "Science — PCB";
  map.UNDECIDED = "Not sure yet";
  return map;
})();

const TARGET_EXAM_LABELS: Record<string, string> = {
  UNDECIDED: "Not sure yet",
};

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
  if (profile.class) parts.push(CLASS_LABELS[profile.class] ?? formatEnumLabel(profile.class));
  if (profile.board) parts.push(BOARD_LABELS[profile.board] ?? formatEnumLabel(profile.board));
  if (profile.stream) parts.push(STREAM_LABEL_MAP[profile.stream] ?? formatEnumLabel(profile.stream));
  return parts.join(" · ");
}

function formatTargetExamValue(value: string): string {
  const mapped = TARGET_EXAM_LABELS[value];
  if (mapped) {
    return mapped;
  }

  const examLabel = getExamLabel(value);
  return examLabel === value ? formatEnumLabel(value) : examLabel;
}

export function formatTargetExamLabel(profile: StudentProfileSubset | null | undefined): string {
  if (!profile) return "";
  const exams = (profile.targetExams ?? []).filter((value): value is string => Boolean(value));
  if (exams.length === 0 && profile.targetExam) {
    exams.push(profile.targetExam);
  }
  if (exams.length === 0) return "";
  const first = formatTargetExamValue(exams[0]);
  if (exams.length === 1) return first;
  if (exams.length === 2) return `${first} · ${formatTargetExamValue(exams[1])}`;
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
  if (examLabel === TARGET_EXAM_LABELS.UNDECIDED) {
    return "You're exploring your academic direction.";
  }
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

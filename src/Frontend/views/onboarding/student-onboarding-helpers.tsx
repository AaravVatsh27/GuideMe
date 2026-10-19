/** Draft shape, step navigation and validation for the student onboarding wizard. */

import { Atom, BookOpen, BriefcaseBusiness, Building2, CalendarRange, CircleHelp, Compass, Feather, Flag, Globe2, GraduationCap, Layers3, Map, Palette, Radar, Rocket, Route as RouteIcon, School, Shuffle, Sparkles, Stethoscope, Target, Wrench } from "lucide-react";
import { CoachingMode, DecisionStage, MentorshipNeed, SchoolingMode, TargetExam } from "@prisma/client";
import { BOARD_VALUES, CONFUSION_TYPE_VALUES, getAllowedStreamValues, getConfusionOptions, INDIAN_STATE_VALUES, LANGUAGE_VALUES, requiresBoard, STREAM_VALUES, STUDENT_CLASS_VALUES, type BoardValue, type ConfusionTypeValue, type IndianStateValue, type LanguageValue, type StreamValue, type StudentClassValue } from "@/shared/student-onboarding";

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type StudentOnboardingDraft = {
  class?: StudentClassValue;
  board?: BoardValue;
  stream?: StreamValue;
  schoolingMode?: SchoolingMode;
  coachingMode?: CoachingMode;
  targetExams: TargetExam[];
  mentorshipNeeds: MentorshipNeed[];
  decisionStage?: DecisionStage;
  currentConfusion?: string;
  confusionTypes: ConfusionTypeValue[];
  city: string;
  state?: IndianStateValue;
  languagePreference?: LanguageValue;
};

export type StoredWizardState = {
  step?: number;
  data?: Partial<StudentOnboardingDraft>;
};

export type SaveState = "idle" | "saving" | "saved" | "error";

export const TOTAL_STEPS = 7;

const MAX_CONFUSIONS = 3;

export const STEP_COPY = {
  1: "Where are you right now?",
  2: "Your academic setup",
  3: "What are you preparing for?",
  4: "What do you want help with?",
  5: "Where are you in your decision?",
  6: "What’s on your mind?",
  7: "Where are you based?",
} as const;

export const ICON_MAP = {
  atom: Atom,
  book: BookOpen,
  briefcase: BriefcaseBusiness,
  building: Building2,
  calendar: CalendarRange,
  compass: Compass,
  feather: Feather,
  flag: Flag,
  globe: Globe2,
  graduation: GraduationCap,
  help: CircleHelp,
  layers: Layers3,
  map: Map,
  palette: Palette,
  radar: Radar,
  rocket: Rocket,
  route: RouteIcon,
  school: School,
  shuffle: Shuffle,
  spark: Sparkles,
  stethoscope: Stethoscope,
  target: Target,
  wrench: Wrench,
} as const;

function getEmptyDraft(): StudentOnboardingDraft {
  return {
    targetExams: [],
    mentorshipNeeds: [],
    confusionTypes: [],
    city: "",
  };
}

function isValueInList<T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && values.includes(value as T[number]);
}

export function sanitizeDraft(
  draft: Partial<StudentOnboardingDraft> | undefined,
): StudentOnboardingDraft {
  const nextDraft = getEmptyDraft();

  if (!draft) {
    return nextDraft;
  }

  if (isValueInList(STUDENT_CLASS_VALUES, draft.class)) {
    nextDraft.class = draft.class;
  } else {
    return nextDraft;
  }

  if (requiresBoard(nextDraft.class) && isValueInList(BOARD_VALUES, draft.board)) {
    nextDraft.board = draft.board;
  }

  if (
    isValueInList(STREAM_VALUES, draft.stream) &&
    getAllowedStreamValues(nextDraft.class).includes(draft.stream)
  ) {
    nextDraft.stream = draft.stream;
  }

  const validSchoolingModes = Object.values(SchoolingMode);
  if (isValueInList(validSchoolingModes, draft.schoolingMode)) {
    nextDraft.schoolingMode = draft.schoolingMode;
  }

  const validCoachingModes = Object.values(CoachingMode);
  if (isValueInList(validCoachingModes, draft.coachingMode)) {
    nextDraft.coachingMode = draft.coachingMode;
  }

  const validTargetExams = Object.values(TargetExam);
  if (Array.isArray(draft.targetExams)) {
    nextDraft.targetExams = Array.from(
      new Set(
        draft.targetExams.filter(
          (value): value is TargetExam =>
            isValueInList(validTargetExams, value),
        ),
      ),
    );
  }

  const validMentorshipNeeds = Object.values(MentorshipNeed);
  if (Array.isArray(draft.mentorshipNeeds)) {
    nextDraft.mentorshipNeeds = Array.from(
      new Set(
        draft.mentorshipNeeds.filter(
          (value): value is MentorshipNeed =>
            isValueInList(validMentorshipNeeds, value),
        ),
      ),
    );
  }

  const validDecisionStages = Object.values(DecisionStage);
  if (isValueInList(validDecisionStages, draft.decisionStage)) {
    nextDraft.decisionStage = draft.decisionStage;
  }

  if (typeof draft.currentConfusion === "string") {
    const trimmed = draft.currentConfusion.trim();
    if (trimmed.length > 0) {
      nextDraft.currentConfusion = trimmed.slice(0, 500);
    }
  }

  const allowedConfusions = new Set(
    getConfusionOptions(nextDraft.class).map((option) => option.value),
  );

  if (Array.isArray(draft.confusionTypes)) {
    nextDraft.confusionTypes = Array.from(
      new Set(
        draft.confusionTypes.filter(
          (value): value is ConfusionTypeValue =>
            isValueInList(CONFUSION_TYPE_VALUES, value) && allowedConfusions.has(value),
        ),
      ),
    ).slice(0, MAX_CONFUSIONS);
  }

  if (typeof draft.city === "string") {
    nextDraft.city = draft.city.slice(0, 80);
  }

  if (isValueInList(INDIAN_STATE_VALUES, draft.state)) {
    nextDraft.state = draft.state;
  }

  if (isValueInList(LANGUAGE_VALUES, draft.languagePreference)) {
    nextDraft.languagePreference = draft.languagePreference;
  }

  return nextDraft;
}

export function getNextStep(step: WizardStep): WizardStep {
  return Math.min(step + 1, TOTAL_STEPS) as WizardStep;
}

export function getPreviousStep(step: WizardStep): WizardStep {
  return Math.max(step - 1, 1) as WizardStep;
}

export function normalizeStep(step: number | undefined): WizardStep {
  return (typeof step === "number" ? Math.min(Math.max(step, 1), TOTAL_STEPS) : 1) as WizardStep;
}

export function getResumeStep(savedStep: number, draft: StudentOnboardingDraft): WizardStep {
  if (savedStep <= 0) {
    return 1;
  }

  const nextSavedStep = Math.min(Math.max(savedStep, 1), TOTAL_STEPS) as WizardStep;
  const firstIncompleteStep = getFirstIncompleteStep(draft);

  return Math.min(nextSavedStep, firstIncompleteStep) as WizardStep;
}

export function getFirstIncompleteStep(draft: StudentOnboardingDraft): WizardStep {
  if (!draft.class) {
    return 1;
  }

  if (requiresBoard(draft.class) && !draft.board) {
    return 2;
  }

  if (draft.targetExams.length === 0) {
    return 3;
  }

  if (draft.mentorshipNeeds.length === 0) {
    return 4;
  }

  if (!draft.decisionStage) {
    return 5;
  }

  if (!draft.city || !draft.state || !draft.languagePreference) {
    return 7;
  }

  return 7;
}

export function isStepValid(step: WizardStep, draft: StudentOnboardingDraft) {
  switch (step) {
    case 1:
      return Boolean(draft.class);
    case 2:
      return requiresBoard(draft.class) ? Boolean(draft.board) : true;
    case 3:
      return draft.targetExams.length > 0;
    case 4:
      return draft.mentorshipNeeds.length > 0;
    case 5:
      return Boolean(draft.decisionStage);
    case 6:
      return true;
    case 7:
      return (
        draft.city.trim().length >= 2 &&
        Boolean(draft.state) &&
        Boolean(draft.languagePreference)
      );
    default:
      return false;
  }
}

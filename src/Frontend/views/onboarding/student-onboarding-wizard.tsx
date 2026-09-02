"use client";

import type { Route } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  Atom,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarRange,
  Check,
  CheckCircle2,
  CircleHelp,
  Compass,
  Feather,
  Flag,
  Globe2,
  GraduationCap,
  Layers3,
  Map,
  Palette,
  Radar,
  Rocket,
  Route as RouteIcon,
  School,
  Shuffle,
  Sparkles,
  Stethoscope,
  Target,
  Wrench,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { CoachingMode, DecisionStage, MentorshipNeed, SchoolingMode, TargetExam } from "@prisma/client";
import { toast } from "sonner";

import { DashboardAccountPanel } from "@/Frontend/views/dashboard/dashboard-account-panel";
import { Button } from "@/Frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Frontend/components/ui/card";
import { Input } from "@/Frontend/components/ui/input";
import {
  BOARD_OPTIONS,
  BOARD_VALUES,
  CLASS_OPTIONS,
  CONFUSION_TYPE_VALUES,
  getAllowedStreamValues,
  getBoardOption,
  getClassOption,
  getConfusionOptions,
  getConfusionOption,
  getIndianCitiesForState,
  getStepThreeOptions,
  getStepThreeQuestion,
  getStreamOption,
  INDIAN_STATE_VALUES,
  LANGUAGE_VALUES,
  requiresBoard,
  STREAM_VALUES,
  STUDENT_CLASS_VALUES,
  STUDENT_ONBOARDING_STORAGE_KEY,
  type BoardValue,
  type ConfusionTypeValue,
  type IndianStateValue,
  type LanguageValue,
  type StreamValue,
  type StudentClassValue,
} from "@/Backend/server/student-onboarding";
import { cn } from "@/Backend/server/utils";

type StudentOnboardingWizardProps = {
  userName: string;
  initialDraft: StudentOnboardingDraft;
  savedStep: number;
};

type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

type StudentOnboardingDraft = {
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

type StoredWizardState = {
  step?: number;
  data?: Partial<StudentOnboardingDraft>;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const TOTAL_STEPS = 7;
const MAX_CONFUSIONS = 3;
const STEP_COPY = {
  1: "Where are you right now?",
  2: "Your academic setup",
  3: "What are you preparing for?",
  4: "What do you want help with?",
  5: "Where are you in your decision?",
  6: "What’s on your mind?",
  7: "Where are you based?",
} as const;
const LOCATION_FIELD_CLASS_NAME =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-950 shadow-sm outline-none transition focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5";

const ICON_MAP = {
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

function sanitizeDraft(
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

function getNextStep(step: WizardStep, studentClass?: StudentClassValue): WizardStep {
  return Math.min(step + 1, TOTAL_STEPS) as WizardStep;
}

function getPreviousStep(step: WizardStep, studentClass?: StudentClassValue): WizardStep {
  return Math.max(step - 1, 1) as WizardStep;
}

function normalizeStep(step: number | undefined, draft: StudentOnboardingDraft): WizardStep {
  return (typeof step === "number" ? Math.min(Math.max(step, 1), TOTAL_STEPS) : 1) as WizardStep;
}

function getResumeStep(savedStep: number, draft: StudentOnboardingDraft): WizardStep {
  if (savedStep <= 0) {
    return 1;
  }

  const nextSavedStep = Math.min(Math.max(savedStep, 1), TOTAL_STEPS) as WizardStep;
  const firstIncompleteStep = getFirstIncompleteStep(draft);

  return Math.min(nextSavedStep, firstIncompleteStep) as WizardStep;
}

function getFirstIncompleteStep(draft: StudentOnboardingDraft): WizardStep {
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

function isStepValid(step: WizardStep, draft: StudentOnboardingDraft) {
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

function getProgressWidth(step: WizardStep) {
  return `${(step / TOTAL_STEPS) * 100}%`;
}

function getUserInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StudentOnboardingWizard({
  userName,
  initialDraft,
  savedStep,
}: StudentOnboardingWizardProps) {
  const sanitizedInitialDraft = sanitizeDraft(initialDraft);
  const initialResumeStep = getResumeStep(savedStep, sanitizedInitialDraft);
  const router = useRouter();
  const { data, update } = useSession();
  const [direction, setDirection] = useState(1);
  const [currentStep, setCurrentStep] = useState<WizardStep>(initialResumeStep);
  const [draft, setDraft] = useState<StudentOnboardingDraft>(sanitizedInitialDraft);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>(savedStep > 0 ? "saved" : "idle");
  const [lastSavedStep, setLastSavedStep] = useState(savedStep);
  const displayName = data?.user?.name ?? userName;
  const userEmail = data?.user?.email ?? "";
  const userImage = data?.user?.image ?? null;
  const accountInitials = getUserInitials(displayName);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(STUDENT_ONBOARDING_STORAGE_KEY);

    if (!storedValue) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(storedValue) as StoredWizardState;
      const sanitizedStoredDraft = sanitizeDraft(parsed.data);
      const restoredStep = normalizeStep(parsed.step, sanitizedStoredDraft);
      const firstIncompleteStep = getFirstIncompleteStep(sanitizedStoredDraft);
      const localResumeStep = Math.min(restoredStep, firstIncompleteStep) as WizardStep;

      if (localResumeStep >= initialResumeStep) {
        setDraft(sanitizedStoredDraft);
        setCurrentStep(localResumeStep);
      }
    } catch {
      window.localStorage.removeItem(STUDENT_ONBOARDING_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, [initialResumeStep]);

  useEffect(() => {
    if (!isHydrated || isSuccess) {
      return;
    }

    window.localStorage.setItem(
      STUDENT_ONBOARDING_STORAGE_KEY,
      JSON.stringify({
        step: currentStep,
        data: draft,
      } satisfies StoredWizardState),
    );
  }, [currentStep, draft, isHydrated, isSuccess]);

  function updateDraft(updater: (current: StudentOnboardingDraft) => StudentOnboardingDraft) {
    setDraft((current) => sanitizeDraft(updater(current)));
  }

  function getStepPayload(step: WizardStep, currentDraft: StudentOnboardingDraft) {
    switch (step) {
      case 1:
        return {
          class: currentDraft.class,
        };
      case 2:
        return {
          class: currentDraft.class,
          board: currentDraft.board,
          schoolingMode: currentDraft.schoolingMode,
          coachingMode: currentDraft.coachingMode,
        };
      case 3:
        return {
          class: currentDraft.class,
          stream: currentDraft.stream ?? "UNDECIDED",
          targetExams: currentDraft.targetExams,
        };
      case 4:
        return {
          class: currentDraft.class,
          stream: currentDraft.stream ?? "UNDECIDED",
          targetExams: currentDraft.targetExams,
          mentorshipNeeds: currentDraft.mentorshipNeeds,
          confusionTypes: currentDraft.confusionTypes,
        };
      case 5:
        return {
          class: currentDraft.class,
          board: currentDraft.board,
          stream: currentDraft.stream ?? "UNDECIDED",
          schoolingMode: currentDraft.schoolingMode,
          coachingMode: currentDraft.coachingMode,
          targetExams: currentDraft.targetExams,
          mentorshipNeeds: currentDraft.mentorshipNeeds,
          decisionStage: currentDraft.decisionStage,
        };
      case 6:
        return {
          class: currentDraft.class,
          board: currentDraft.board,
          stream: currentDraft.stream ?? "UNDECIDED",
          schoolingMode: currentDraft.schoolingMode,
          coachingMode: currentDraft.coachingMode,
          targetExams: currentDraft.targetExams,
          mentorshipNeeds: currentDraft.mentorshipNeeds,
          decisionStage: currentDraft.decisionStage,
          currentConfusion: currentDraft.currentConfusion,
        };
      case 7:
        return {
          class: currentDraft.class,
          board: currentDraft.board,
          stream: currentDraft.stream ?? "UNDECIDED",
          schoolingMode: currentDraft.schoolingMode,
          coachingMode: currentDraft.coachingMode,
          targetExams: currentDraft.targetExams,
          mentorshipNeeds: currentDraft.mentorshipNeeds,
          decisionStage: currentDraft.decisionStage,
          currentConfusion: currentDraft.currentConfusion,
          confusionTypes: currentDraft.confusionTypes,
          city: currentDraft.city.trim(),
          state: currentDraft.state,
          languagePreference: currentDraft.languagePreference,
        };
    }
  }

  async function persistStep(step: Exclude<WizardStep, 7>) {
    setSaveState("saving");

    const response = await fetch("/api/onboarding/student", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        step,
        data: getStepPayload(step, draft),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | {
          error?: string;
          issues?: unknown;
          savedStep?: number;
        }
      | null;

    if (!response.ok) {
      setSaveState("error");
      if (process.env.NODE_ENV !== "production" && payload?.issues) {
        console.error("Step validation failed:", payload.issues);
      }
      throw new Error(payload?.error ?? "We could not save this step.");
    }

    setLastSavedStep(payload?.savedStep ?? step);
    setSaveState("saved");
  }

  function handleClassSelect(value: StudentClassValue) {
    updateDraft((current) => ({
      ...current,
      class: value,
      board: requiresBoard(value) ? current.board : undefined,
    }));
  }

  function handleBoardSelect(value: BoardValue) {
    updateDraft((current) => ({
      ...current,
      board: value,
    }));
  }

  function handleStreamSelect(value: StreamValue) {
    updateDraft((current) => ({
      ...current,
      stream: value,
    }));
  }

  function handleConfusionToggle(value: ConfusionTypeValue) {
    updateDraft((current) => {
      const isSelected = current.confusionTypes.includes(value);

      if (isSelected) {
        return {
          ...current,
          confusionTypes: current.confusionTypes.filter((item) => item !== value),
        };
      }

      if (current.confusionTypes.length >= MAX_CONFUSIONS) {
        toast.error("Pick up to 3 confusion areas.");
        return current;
      }

      return {
        ...current,
        confusionTypes: [...current.confusionTypes, value],
      };
    });
  }

  async function goToNextStep() {
    if (!isStepValid(currentStep, draft)) {
      return;
    }

    if (currentStep === 7) {
      return;
    }

    try {
      await persistStep(currentStep);
      setDirection(1);
      setCurrentStep(getNextStep(currentStep, draft.class));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "We could not save this step.",
      );
    }
  }

  function goToPreviousStep() {
    setDirection(-1);
    setCurrentStep(getPreviousStep(currentStep, draft.class));
  }

  async function handleComplete() {
    if (!isStepValid(7, draft) || !draft.class || !draft.stream || !draft.state || !draft.languagePreference) {
      return;
    }

    setIsSubmitting(true);
    setSaveState("saving");

    try {
      const response = await fetch("/api/onboarding/student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          class: draft.class,
          board: requiresBoard(draft.class) ? draft.board : undefined,
          stream: draft.stream,
          schoolingMode: draft.schoolingMode,
          coachingMode: draft.coachingMode,
          targetExams: draft.targetExams,
          mentorshipNeeds: draft.mentorshipNeeds,
          decisionStage: draft.decisionStage,
          currentConfusion: draft.currentConfusion?.trim() || undefined,
          confusionTypes: draft.confusionTypes,
          city: draft.city.trim(),
          state: draft.state,
          languagePreference: draft.languagePreference,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            redirectTo?: string;
          }
        | null;

      if (!response.ok || !payload?.redirectTo) {
        throw new Error(payload?.error ?? "We could not save your onboarding details.");
      }

      await update({
        user: {
          role: "STUDENT",
          onboardingComplete: true,
        },
      });

      setLastSavedStep(5);
      setSaveState("saved");
      window.localStorage.removeItem(STUDENT_ONBOARDING_STORAGE_KEY);
      setIsSuccess(true);
      setTimeout(() => {
        router.replace(payload.redirectTo as Route);
      }, 1300);
    } catch (error) {
      setSaveState("error");
      toast.error(
        error instanceof Error ? error.message : "We could not save your onboarding details.",
      );
      setIsSubmitting(false);
    }
  }

  const classOption = getClassOption(draft.class);
  const boardOption = getBoardOption(draft.board);
  const streamOption = getStreamOption(draft.stream, draft.class);
  const confusionOptions = getConfusionOptions(draft.class);
  const canContinue = isStepValid(currentStep, draft);
  const isBusy = isSubmitting || saveState === "saving";
  const cityValue = draft.city;
  const availableCities = getIndianCitiesForState(draft.state);
  const normalizedCityValue = cityValue.trim().toLowerCase();
  const citySuggestions = availableCities
    .filter((city) =>
      normalizedCityValue.length === 0
        ? true
        : city.toLowerCase().includes(normalizedCityValue),
    )
    .slice(0, 12);
  const cityMatchesSelectedState =
    cityValue.trim().length === 0 ||
    !draft.state ||
    availableCities.some((city) => city.toLowerCase() === normalizedCityValue);

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#eef4ff_48%,_#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-3xl items-center justify-center rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_32px_120px_-48px_rgba(15,23,42,0.45)] backdrop-blur">
          <div className="space-y-4 text-center">
            <div className="mx-auto size-14 animate-pulse rounded-full bg-slate-200" />
            <div className="text-sm font-medium text-slate-500">Restoring your saved progress...</div>
          </div>
        </div>
      </main>
    );
  }

  const schoolModeOptions = Object.values(SchoolingMode);
  const coachingModeOptions = Object.values(CoachingMode);
  const targetExamOptions = Object.values(TargetExam);
  const mentorshipOptions = Object.values(MentorshipNeed);
  const decisionStageOptions = Object.values(DecisionStage);
  const stepLabel = STEP_COPY[currentStep as keyof typeof STEP_COPY];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.12),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.12),_transparent_28%),linear-gradient(135deg,_#faf5ff_0%,_#f5f3ff_42%,_#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-violet-200/80 bg-white/75 shadow-[0_30px_100px_-40px_rgba(124,58,237,0.35)] backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-violet-100 bg-white/60 px-4 py-3 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 text-sm font-bold text-white shadow-sm">
              M
            </div>
            <span className="text-lg font-semibold tracking-[-0.04em] text-slate-900">Mentra</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Saved automatically
          </div>
        </header>

        <div className="grid lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="border-b border-violet-100 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.12),_transparent_35%),linear-gradient(135deg,_#f8f4ff_0%,_#fff8fb_100%)] p-5 sm:p-7 lg:border-b-0 lg:border-r">
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-600">
                  Your journey
                </p>
                <h2 className="font-display text-3xl leading-tight font-semibold tracking-[-0.06em] text-slate-900">
                  Build your Mentra profile
                </h2>
              </div>

              <p className="text-sm leading-6 text-slate-600">
                We use a few answers to understand what you&apos;re working toward — and connect
                you with people who have relevant experience.
              </p>

              <div className="rounded-[22px] border border-violet-100 bg-white/70 p-4 shadow-[0_18px_40px_-28px_rgba(124,58,237,0.45)]">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Your profile
                </div>
                <div className="mt-4 space-y-3">
                  {[
                    "Academic",
                    "Goals",
                    "Mentorship",
                    "Context",
                  ].map((item, index) => {
                    const isActive = index === Math.min(currentStep - 1, 3);
                    return (
                      <div key={item} className="flex items-center gap-3">
                        <span
                          className={cn(
                            "inline-flex h-2.5 w-2.5 rounded-full",
                            isActive ? "bg-violet-600" : "bg-violet-200",
                          )}
                        />
                        <span
                          className={cn(
                            "text-sm font-medium",
                            isActive ? "text-slate-900" : "text-slate-500",
                          )}
                        >
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 pt-1">
                {Array.from({ length: TOTAL_STEPS }, (_, index) => {
                  const stepNumber = index + 1;
                  const isComplete = stepNumber < currentStep;
                  const isCurrent = stepNumber === currentStep;
                  return (
                    <div key={stepNumber} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold",
                          isComplete
                            ? "bg-violet-600 text-white"
                            : isCurrent
                              ? "border border-violet-300 bg-violet-50 text-violet-700"
                              : "border border-violet-100 bg-white text-slate-400",
                        )}
                      >
                        {stepNumber}
                      </div>
                      <div className="text-sm text-slate-600">
                        {STEP_COPY[stepNumber as keyof typeof STEP_COPY]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <section className="flex items-center justify-center p-4 sm:p-7 lg:p-8">
            <div className="w-full max-w-2xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-violet-600">
                  STEP {currentStep} OF {TOTAL_STEPS}
                </p>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: TOTAL_STEPS }, (_, index) => {
                    const stepNumber = index + 1 as WizardStep;
                    const active = stepNumber === currentStep;
                    const complete = stepNumber < currentStep;
                    return (
                      <span
                        key={stepNumber}
                        className={cn(
                          "h-1.5 rounded-full transition-all",
                          complete ? "w-8 bg-violet-500" : active ? "w-10 bg-violet-600" : "w-7 bg-violet-100",
                        )}
                      />
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[26px] border border-violet-100 bg-white/80 p-4 shadow-[0_24px_70px_-40px_rgba(124,58,237,0.45)] sm:p-6">
                <AnimatePresence mode="wait" custom={direction}>
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -18 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="space-y-6 py-6 text-center"
                    >
                      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-display text-3xl font-semibold tracking-[-0.06em] text-slate-900">
                          You&apos;re all set.
                        </h3>
                        <p className="text-sm leading-6 text-slate-600">
                          Your student profile is saved and we&apos;re taking you to your dashboard.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`step-${currentStep}`}
                      custom={direction}
                      initial={{ opacity: 0, x: direction > 0 ? 24 : -24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction > 0 ? -24 : 24 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                      <div className="mb-6 space-y-2">
                        <h3 className="font-display text-3xl leading-tight font-semibold tracking-[-0.06em] text-slate-900">
                          {STEP_COPY[currentStep as keyof typeof STEP_COPY]}
                        </h3>
                        <p className="text-sm leading-6 text-slate-600">
                          {currentStep === 1 && "Tell us where you are in your academic journey."}
                          {currentStep === 2 && "We use this to understand your academic setup and coaching context."}
                          {currentStep === 3 && "Select the exams you are currently working toward."}
                          {currentStep === 4 && "Choose up to 5 areas where you want mentor support."}
                          {currentStep === 5 && "This helps us understand how ready you are to act."}
                          {currentStep === 6 && "Optional — tell us what feels hardest right now."}
                          {currentStep === 7 && "A quick final profile detail to personalize recommendations."}
                        </p>
                      </div>

                      {currentStep === 1 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {CLASS_OPTIONS.map((option) => {
                            const Icon = ICON_MAP[option.icon];
                            const isActive = draft.class === option.value;
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleClassSelect(option.value)}
                                className={cn(
                                  "rounded-[22px] border p-4 text-left transition-all duration-200",
                                  isActive
                                    ? "border-violet-600 bg-violet-600 text-white shadow-[0_18px_44px_-20px_rgba(124,58,237,0.8)]"
                                    : "border-violet-100 bg-violet-50/40 text-slate-800 hover:border-violet-200 hover:bg-violet-50",
                                )}
                              >
                                <div className="flex items-start gap-3">
                                  <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", isActive ? "bg-white/14 text-white" : "bg-white text-violet-600") }>
                                    <Icon className="h-5 w-5" />
                                  </span>
                                  <div>
                                    <div className="font-display text-xl font-semibold tracking-[-0.05em]">{option.label}</div>
                                    <p className={cn("mt-2 text-sm leading-6", isActive ? "text-violet-100" : "text-slate-600")}>{option.description}</p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {currentStep === 2 ? (
                        <div className="space-y-5">
                          {requiresBoard(draft.class) ? (
                            <div className="space-y-3">
                              <div className="text-sm font-semibold text-slate-900">Board</div>
                              <div className="grid gap-3 sm:grid-cols-2">
                                {BOARD_OPTIONS.map((option) => {
                                  const isActive = draft.board === option.value;
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => handleBoardSelect(option.value)}
                                      className={cn(
                                        "rounded-[18px] border px-4 py-3 text-left text-sm transition",
                                        isActive
                                          ? "border-violet-600 bg-violet-600 text-white"
                                          : "border-violet-100 bg-violet-50/30 text-slate-700 hover:border-violet-200",
                                      )}
                                    >
                                      {option.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                          <div className="space-y-3">
                            <div className="text-sm font-semibold text-slate-900">
                              {requiresBoard(draft.class) ? "How are you currently studying?" : "How are you currently learning?"}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {schoolModeOptions.map((option) => {
                                const isActive = draft.schoolingMode === option;
                                return (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => updateDraft((current) => ({ ...current, schoolingMode: isActive ? undefined : option }))}
                                    className={cn(
                                      "rounded-[18px] border px-4 py-3 text-left text-sm transition",
                                      isActive
                                        ? "border-violet-600 bg-violet-600 text-white"
                                        : "border-violet-100 bg-violet-50/30 text-slate-700 hover:border-violet-200",
                                    )}
                                  >
                                    {option.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="text-sm font-semibold text-slate-900">
                              {requiresBoard(draft.class) ? "Are you taking coaching?" : "Is coaching part of your plan?"}
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                              {coachingModeOptions.map((option) => {
                                const isActive = draft.coachingMode === option;
                                return (
                                  <button
                                    key={option}
                                    type="button"
                                    onClick={() => updateDraft((current) => ({ ...current, coachingMode: isActive ? undefined : option }))}
                                    className={cn(
                                      "rounded-[18px] border px-4 py-3 text-left text-sm transition",
                                      isActive
                                        ? "border-violet-600 bg-violet-600 text-white"
                                        : "border-violet-100 bg-violet-50/30 text-slate-700 hover:border-violet-200",
                                    )}
                                  >
                                    {option.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {currentStep === 3 ? (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between rounded-[20px] border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm text-slate-700">
                            <span>Selected</span>
                            <span className="font-semibold text-violet-700">{draft.targetExams.length}</span>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {targetExamOptions.map((option) => {
                              const isActive = draft.targetExams.includes(option);
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() =>
                                    updateDraft((current) => ({
                                      ...current,
                                      targetExams: current.targetExams.includes(option)
                                        ? current.targetExams.filter((item) => item !== option)
                                        : [...current.targetExams, option],
                                    }))
                                  }
                                  className={cn(
                                    "rounded-full border px-3.5 py-2 text-sm font-medium transition",
                                    isActive
                                      ? "border-violet-600 bg-violet-600 text-white"
                                      : "border-violet-100 bg-violet-50/40 text-slate-700 hover:border-violet-200",
                                  )}
                                >
                                  {option.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {currentStep === 4 ? (
                        <div className="space-y-4">
                          <div className="rounded-[20px] border border-violet-100 bg-violet-50/40 px-4 py-3 text-sm text-slate-700">
                            Choose up to 5. {draft.mentorshipNeeds.length} selected
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {mentorshipOptions.map((option) => {
                              const isActive = draft.mentorshipNeeds.includes(option);
                              return (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() =>
                                    updateDraft((current) => {
                                      const exists = current.mentorshipNeeds.includes(option);
                                      if (exists) {
                                        return {
                                          ...current,
                                          mentorshipNeeds: current.mentorshipNeeds.filter((item) => item !== option),
                                        };
                                      }
                                      if (current.mentorshipNeeds.length >= 5) {
                                        toast.error("Choose up to 5 mentorship areas.");
                                        return current;
                                      }
                                      return {
                                        ...current,
                                        mentorshipNeeds: [...current.mentorshipNeeds, option],
                                      };
                                    })
                                  }
                                  className={cn(
                                    "rounded-full border px-3.5 py-2 text-sm font-medium transition",
                                    isActive
                                      ? "border-violet-600 bg-violet-600 text-white"
                                      : "border-violet-100 bg-violet-50/40 text-slate-700 hover:border-violet-200",
                                  )}
                                >
                                  {option.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {currentStep === 5 ? (
                        <div className="grid gap-3">
                          {decisionStageOptions.map((option) => {
                            const isActive = draft.decisionStage === option;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => updateDraft((current) => ({ ...current, decisionStage: isActive ? undefined : option }))}
                                className={cn(
                                  "rounded-[20px] border px-4 py-4 text-left transition",
                                  isActive
                                    ? "border-violet-600 bg-violet-600 text-white"
                                    : "border-violet-100 bg-violet-50/40 text-slate-700 hover:border-violet-200",
                                )}
                              >
                                {option.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {currentStep === 6 ? (
                        <div className="space-y-3">
                          <textarea
                            value={draft.currentConfusion ?? ""}
                            onChange={(event) =>
                              updateDraft((current) => ({
                                ...current,
                                currentConfusion: event.target.value.slice(0, 500),
                              }))
                            }
                            rows={6}
                            placeholder="I’m in Class 11 PCM with regular school + coaching. I’m preparing for JEE but I’m not sure how to balance school and coaching..."
                            className="w-full rounded-[22px] border border-violet-100 bg-violet-50/30 px-4 py-3 text-sm leading-6 text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                          />
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Optional</span>
                            <span>{(draft.currentConfusion ?? "").length}/500</span>
                          </div>
                        </div>
                      ) : null}

                      {currentStep === 7 ? (
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-900">State</label>
                            <select
                              value={draft.state ?? ""}
                              onChange={(event) =>
                                updateDraft((current) => ({
                                  ...current,
                                  state: event.target.value ? (event.target.value as IndianStateValue) : undefined,
                                }))
                              }
                              className="h-12 w-full rounded-[18px] border border-violet-100 bg-violet-50/30 px-4 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                            >
                              <option value="">Select your state</option>
                              {INDIAN_STATE_VALUES.map((state) => (
                                <option key={state} value={state}>{state}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-900">City</label>
                            <Input
                              value={cityValue}
                              onChange={(event) =>
                                updateDraft((current) => ({
                                  ...current,
                                  city: event.target.value,
                                }))
                              }
                              placeholder={draft.state ? `Search cities in ${draft.state}` : "Type your city"}
                              className="h-12 rounded-[18px] border-violet-100 bg-violet-50/30 px-4 text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10"
                            />
                            {citySuggestions.length > 0 ? (
                              <div className="flex flex-wrap gap-2 pt-2">
                                {citySuggestions.map((city) => (
                                  <button
                                    key={city}
                                    type="button"
                                    onClick={() => updateDraft((current) => ({ ...current, city }))}
                                    className={cn(
                                      "rounded-full border border-violet-100 bg-violet-50/30 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-violet-200",
                                      city.toLowerCase() === normalizedCityValue ? "border-violet-500 bg-violet-600 text-white" : "",
                                    )}
                                  >
                                    {city}
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-900">Preferred language</label>
                            <select
                              value={draft.languagePreference ?? ""}
                              onChange={(event) =>
                                updateDraft((current) => ({
                                  ...current,
                                  languagePreference: event.target.value ? (event.target.value as LanguageValue) : undefined,
                                }))
                              }
                              className="h-12 w-full rounded-[18px] border border-violet-100 bg-violet-50/30 px-4 text-sm text-slate-800 focus:border-violet-400 focus:outline-none focus:ring-4 focus:ring-violet-500/10"
                            >
                              <option value="">Choose a language</option>
                              {LANGUAGE_VALUES.map((language) => (
                                <option key={language} value={language}>{language}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!isSuccess ? (
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    {currentStep > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goToPreviousStep}
                        disabled={isBusy}
                        className="h-12 rounded-[16px] border-violet-100 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-violet-50"
                      >
                        Back
                      </Button>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    onClick={currentStep === TOTAL_STEPS ? handleComplete : () => void goToNextStep()}
                    disabled={!canContinue || isBusy}
                    className="h-12 rounded-[16px] bg-gradient-to-r from-violet-600 via-violet-600 to-fuchsia-500 px-5 text-sm font-semibold text-white shadow-[0_18px_30px_-20px_rgba(124,58,237,0.7)] hover:opacity-95"
                  >
                    {currentStep === TOTAL_STEPS
                      ? isSubmitting ? "Saving your profile..." : "Complete onboarding"
                      : saveState === "saving" ? "Saving step..." : "Continue →"}
                  </Button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

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
import { toast } from "sonner";

import { Button, buttonVariants } from "@/client/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { Input } from "@/client/components/ui/input";
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
  getStepThreeOptions,
  getStepThreeQuestion,
  getStreamOption,
  INDIAN_STATE_VALUES,
  LANGUAGE_VALUES,
  MAJOR_INDIAN_CITIES,
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
} from "@/server/student-onboarding";
import { cn } from "@/server/utils";

type StudentOnboardingWizardProps = {
  userName: string;
};

type WizardStep = 1 | 2 | 3 | 4 | 5;

type StudentOnboardingDraft = {
  class?: StudentClassValue;
  board?: BoardValue;
  stream?: StreamValue;
  confusionTypes: ConfusionTypeValue[];
  city: string;
  state?: IndianStateValue;
  languagePreference?: LanguageValue;
};

type StoredWizardState = {
  step?: number;
  data?: Partial<StudentOnboardingDraft>;
};

const TOTAL_STEPS = 5;
const MAX_CONFUSIONS = 3;

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
  if (step === 1 && studentClass && !requiresBoard(studentClass)) {
    return 3;
  }

  return Math.min(step + 1, TOTAL_STEPS) as WizardStep;
}

function getPreviousStep(step: WizardStep, studentClass?: StudentClassValue): WizardStep {
  if (step === 3 && studentClass && !requiresBoard(studentClass)) {
    return 1;
  }

  return Math.max(step - 1, 1) as WizardStep;
}

function normalizeStep(step: number | undefined, draft: StudentOnboardingDraft): WizardStep {
  const clampedStep = typeof step === "number" ? Math.min(Math.max(step, 1), TOTAL_STEPS) : 1;

  if (!requiresBoard(draft.class) && clampedStep === 2) {
    return 3;
  }

  return clampedStep as WizardStep;
}

function getFirstIncompleteStep(draft: StudentOnboardingDraft): WizardStep {
  if (!draft.class) {
    return 1;
  }

  if (requiresBoard(draft.class) && !draft.board) {
    return 2;
  }

  if (!draft.stream) {
    return 3;
  }

  if (draft.confusionTypes.length === 0) {
    return 4;
  }

  if (
    draft.city.trim().length < 2 ||
    !draft.state ||
    !draft.languagePreference
  ) {
    return 5;
  }

  return 5;
}

function isStepValid(step: WizardStep, draft: StudentOnboardingDraft) {
  switch (step) {
    case 1:
      return Boolean(draft.class);
    case 2:
      return requiresBoard(draft.class) ? Boolean(draft.board) : true;
    case 3:
      return Boolean(draft.stream);
    case 4:
      return draft.confusionTypes.length > 0 && draft.confusionTypes.length <= MAX_CONFUSIONS;
    case 5:
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

export function StudentOnboardingWizard({
  userName,
}: StudentOnboardingWizardProps) {
  const router = useRouter();
  const { update } = useSession();
  const [direction, setDirection] = useState(1);
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [draft, setDraft] = useState<StudentOnboardingDraft>(getEmptyDraft);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const storedValue = window.localStorage.getItem(STUDENT_ONBOARDING_STORAGE_KEY);

    if (!storedValue) {
      setIsHydrated(true);
      return;
    }

    try {
      const parsed = JSON.parse(storedValue) as StoredWizardState;
      const sanitizedDraft = sanitizeDraft(parsed.data);
      const restoredStep = normalizeStep(parsed.step, sanitizedDraft);
      const firstIncompleteStep = getFirstIncompleteStep(sanitizedDraft);

      setDraft(sanitizedDraft);
      setCurrentStep(
        Math.min(restoredStep, firstIncompleteStep) as WizardStep,
      );
    } catch {
      window.localStorage.removeItem(STUDENT_ONBOARDING_STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

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

  function goToNextStep() {
    if (!isStepValid(currentStep, draft)) {
      return;
    }

    setDirection(1);
    setCurrentStep(getNextStep(currentStep, draft.class));
  }

  function goToPreviousStep() {
    setDirection(-1);
    setCurrentStep(getPreviousStep(currentStep, draft.class));
  }

  async function handleComplete() {
    if (!isStepValid(5, draft) || !draft.class || !draft.stream || !draft.state || !draft.languagePreference) {
      return;
    }

    setIsSubmitting(true);

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

      window.localStorage.removeItem(STUDENT_ONBOARDING_STORAGE_KEY);
      setIsSuccess(true);
      setTimeout(() => {
        router.replace(payload.redirectTo as Route);
      }, 1300);
    } catch (error) {
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
  const cityValue = draft.city;

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

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#eef4ff_48%,_#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_32px_120px_-48px_rgba(15,23,42,0.45)] backdrop-blur xl:grid-cols-[0.96fr_minmax(430px,560px)]">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.2),_transparent_30%),linear-gradient(165deg,_#06101f_0%,_#0f172a_55%,_#15264b_100%)] px-6 py-8 text-slate-50 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="absolute inset-0">
            <div className="absolute -left-16 top-14 size-40 rounded-full bg-teal-400/10 blur-3xl" />
            <div className="absolute bottom-10 right-[-4rem] size-52 rounded-full bg-cyan-300/10 blur-3xl" />
          </div>

          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur">
                <span className="flex size-9 items-center justify-center rounded-full bg-teal-400/16 text-teal-200">
                  <Compass className="size-4.5" />
                </span>
                Student onboarding
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-200/90">
                  Built around your next decision
                </p>
                <h1 className="font-display text-4xl leading-[0.95] font-bold text-white sm:text-5xl">
                  GuideMe will shape your experience around where you are now.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                  A few focused answers are enough for us to match the right mentors, the right
                  roadmap, and the right next move for {userName}.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">
                      Current progress
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                      Step {currentStep} of {TOTAL_STEPS}
                    </div>
                  </div>
                  <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-teal-100">
                    {Math.round((currentStep / TOTAL_STEPS) * 100)}%
                  </div>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    animate={{ width: getProgressWidth(currentStep) }}
                    transition={{ duration: 0.32, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-teal-300 via-cyan-300 to-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">
                  Your snapshot
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Class</div>
                    <div className="mt-2 text-base font-semibold text-white">
                      {classOption?.label ?? "Not selected yet"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-300">
                      Board / focus
                    </div>
                    <div className="mt-2 text-base font-semibold text-white">
                      {boardOption?.label ?? streamOption?.label ?? "Still deciding"}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-300">
                      Top confusion
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {draft.confusionTypes.length > 0 ? (
                        draft.confusionTypes.map((value) => (
                          <span
                            key={value}
                            className="rounded-full border border-white/12 bg-white/10 px-3 py-1 text-sm text-white"
                          >
                            {getConfusionOption(value, draft.class)?.label ?? value}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-300">Nothing picked yet</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/12 bg-slate-950/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-100">
                  <CheckCircle2 className="size-4 text-teal-200" />
                  Saved on this device
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  Your draft is stored locally after each step, so a refresh will not wipe your progress.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div className="w-full max-w-xl">
            <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/92 py-0 shadow-card backdrop-blur">
              <CardHeader className="gap-4 border-b border-slate-200/80 px-6 py-7 sm:px-7">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Step {currentStep} of {TOTAL_STEPS}
                    </p>
                    <div className="flex gap-1.5">
                      {Array.from({ length: TOTAL_STEPS }, (_, index) => {
                        const stepNumber = (index + 1) as WizardStep;

                        return (
                          <span
                            key={stepNumber}
                            className={cn(
                              "h-2 w-9 rounded-full transition-colors",
                              stepNumber < currentStep && "bg-slate-950",
                              stepNumber === currentStep && "bg-teal-500",
                              stepNumber > currentStep && "bg-slate-200",
                            )}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {!isSuccess ? (
                    <>
                      <CardTitle className="font-display text-3xl font-bold text-slate-950">
                        {currentStep === 1 && "What class are you in?"}
                        {currentStep === 2 && "Which board are you in?"}
                        {currentStep === 3 && getStepThreeQuestion(draft.class)}
                        {currentStep === 4 && "What are you most confused about?"}
                        {currentStep === 5 && "Where are you from?"}
                      </CardTitle>
                      <CardDescription className="text-sm leading-6 text-slate-600">
                        {currentStep === 1 &&
                          "Pick the stage you are currently in so the rest of the journey adapts around it."}
                        {currentStep === 2 &&
                          "This helps us understand the syllabus context and exam rhythm you are working with."}
                        {currentStep === 3 &&
                          "Choose the stream or focus that best reflects your current reality."}
                        {currentStep === 4 &&
                          "Pick up to 3 areas where you want the most clarity from mentors."}
                        {currentStep === 5 &&
                          "Tell us your location and preferred language so recommendations feel local and natural."}
                      </CardDescription>
                    </>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="px-6 py-7 sm:px-7">
                <AnimatePresence mode="wait" custom={direction}>
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="space-y-6 py-6 text-center"
                    >
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 220, damping: 18 }}
                        className="mx-auto flex size-20 items-center justify-center rounded-full bg-teal-50 text-teal-600"
                      >
                        <CheckCircle2 className="size-10" />
                      </motion.div>
                      <div className="space-y-2">
                        <h3 className="font-display text-3xl font-bold text-slate-950">
                          All set.
                        </h3>
                        <p className="text-sm leading-6 text-slate-600">
                          Your student profile is saved. We are taking you to your dashboard now.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`step-${currentStep}`}
                      custom={direction}
                      initial={{ opacity: 0, x: direction > 0 ? 32 : -32 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction > 0 ? -32 : 32 }}
                      transition={{ duration: 0.26, ease: "easeOut" }}
                      className="space-y-4"
                    >
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
                                  "rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-card",
                                  isActive
                                    ? "border-slate-950 bg-slate-950 text-white"
                                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-950",
                                )}
                              >
                                <div className="flex items-start gap-4">
                                  <span
                                    className={cn(
                                      "flex size-12 shrink-0 items-center justify-center rounded-2xl",
                                      isActive ? "bg-white/12 text-white" : "bg-slate-950 text-white",
                                    )}
                                  >
                                    <Icon className="size-5" />
                                  </span>
                                  <div className="space-y-2">
                                    <div className="font-display text-xl font-semibold">
                                      {option.label}
                                    </div>
                                    <p
                                      className={cn(
                                        "text-sm leading-6",
                                        isActive ? "text-slate-200" : "text-slate-600",
                                      )}
                                    >
                                      {option.description}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {currentStep === 2 ? (
                        <div className="grid gap-4">
                          {BOARD_OPTIONS.map((option) => {
                            const Icon = ICON_MAP[option.icon];
                            const isActive = draft.board === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleBoardSelect(option.value)}
                                className={cn(
                                  "rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-card",
                                  isActive
                                    ? "border-slate-950 bg-slate-950 text-white"
                                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-950",
                                )}
                              >
                                <div className="flex items-start gap-4">
                                  <span
                                    className={cn(
                                      "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                                      isActive ? "bg-white/12 text-white" : "bg-slate-100 text-slate-900",
                                    )}
                                  >
                                    <Icon className="size-5" />
                                  </span>
                                  <div>
                                    <div className="font-display text-xl font-semibold">
                                      {option.label}
                                    </div>
                                    <p
                                      className={cn(
                                        "mt-2 text-sm leading-6",
                                        isActive ? "text-slate-200" : "text-slate-600",
                                      )}
                                    >
                                      {option.description}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {currentStep === 3 ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          {getStepThreeOptions(draft.class).map((option) => {
                            const Icon = ICON_MAP[option.icon];
                            const isActive = draft.stream === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleStreamSelect(option.value)}
                                className={cn(
                                  "rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-card",
                                  isActive
                                    ? "border-teal-500 bg-teal-50 text-slate-950"
                                    : "border-slate-200 bg-white text-slate-900 hover:border-slate-950",
                                )}
                              >
                                <div className="flex items-start gap-4">
                                  <span
                                    className={cn(
                                      "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                                      isActive ? "bg-teal-500 text-white" : "bg-slate-100 text-slate-900",
                                    )}
                                  >
                                    <Icon className="size-5" />
                                  </span>
                                  <div>
                                    <div className="font-display text-lg font-semibold">
                                      {option.label}
                                    </div>
                                    <p className="mt-2 text-sm leading-6 text-slate-600">
                                      {option.description}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : null}

                      {currentStep === 4 ? (
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            {draft.confusionTypes.length} of {MAX_CONFUSIONS} selected
                          </div>
                          <div className="grid gap-4">
                            {confusionOptions.map((option) => {
                              const Icon = ICON_MAP[option.icon];
                              const isActive = draft.confusionTypes.includes(option.value);

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleConfusionToggle(option.value)}
                                  className={cn(
                                    "rounded-[1.5rem] border p-5 text-left transition hover:-translate-y-0.5 hover:shadow-card",
                                    isActive
                                      ? "border-slate-950 bg-slate-950 text-white"
                                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-950",
                                  )}
                                >
                                  <div className="flex items-start gap-4">
                                    <span
                                      className={cn(
                                        "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                                        isActive ? "bg-white/12 text-white" : "bg-slate-100 text-slate-900",
                                      )}
                                    >
                                      <Icon className="size-5" />
                                    </span>
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between gap-4">
                                        <div className="font-display text-lg font-semibold">
                                          {option.label}
                                        </div>
                                        <span
                                          className={cn(
                                            "flex size-7 shrink-0 items-center justify-center rounded-full border",
                                            isActive
                                              ? "border-white/30 bg-white/10 text-white"
                                              : "border-slate-200 bg-white text-transparent",
                                          )}
                                        >
                                          <Check className="size-4" />
                                        </span>
                                      </div>
                                      <p
                                        className={cn(
                                          "mt-2 text-sm leading-6",
                                          isActive ? "text-slate-200" : "text-slate-600",
                                        )}
                                      >
                                        {option.description}
                                      </p>
                                    </div>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {currentStep === 5 ? (
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <label
                              htmlFor="student-city"
                              className="text-sm font-semibold text-slate-900"
                            >
                              City
                            </label>
                            <Input
                              id="student-city"
                              list="student-city-suggestions"
                              value={cityValue}
                              onChange={(event) =>
                                updateDraft((current) => ({
                                  ...current,
                                  city: event.target.value,
                                }))
                              }
                              placeholder="Start typing your city"
                              className="h-12 rounded-xl border-slate-200 bg-white px-4"
                            />
                            <datalist id="student-city-suggestions">
                              {MAJOR_INDIAN_CITIES.map((city) => (
                                <option key={city} value={city} />
                              ))}
                            </datalist>
                            <p className="text-sm text-slate-500">
                              Suggestions cover major Indian cities. You can still type your own.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor="student-state"
                              className="text-sm font-semibold text-slate-900"
                            >
                              State
                            </label>
                            <select
                              id="student-state"
                              value={draft.state ?? ""}
                              onChange={(event) =>
                                updateDraft((current) => ({
                                  ...current,
                                  state: event.target.value
                                    ? (event.target.value as IndianStateValue)
                                    : undefined,
                                }))
                              }
                              className={cn(
                                buttonVariants({ variant: "outline" }),
                                "h-12 w-full justify-between rounded-xl border-slate-200 bg-white px-4 text-left text-sm font-normal text-slate-900 hover:bg-white",
                              )}
                            >
                              <option value="">Select your state</option>
                              {INDIAN_STATE_VALUES.map((state) => (
                                <option key={state} value={state}>
                                  {state}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor="student-language"
                              className="text-sm font-semibold text-slate-900"
                            >
                              Language preference
                            </label>
                            <select
                              id="student-language"
                              value={draft.languagePreference ?? ""}
                              onChange={(event) =>
                                updateDraft((current) => ({
                                  ...current,
                                  languagePreference: event.target.value
                                    ? (event.target.value as LanguageValue)
                                    : undefined,
                                }))
                              }
                              className={cn(
                                buttonVariants({ variant: "outline" }),
                                "h-12 w-full justify-between rounded-xl border-slate-200 bg-white px-4 text-left text-sm font-normal text-slate-900 hover:bg-white",
                              )}
                            >
                              <option value="">Choose your preferred language</option>
                              {LANGUAGE_VALUES.map((language) => (
                                <option key={language} value={language}>
                                  {language}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>

              {!isSuccess ? (
                <CardFooter className="justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-5 sm:px-7">
                  <div className="flex items-center gap-3">
                    {currentStep > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={goToPreviousStep}
                        disabled={isSubmitting}
                        className="h-12 rounded-xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                      >
                        Back
                      </Button>
                    ) : null}
                  </div>

                  {currentStep < 5 ? (
                    <Button
                      type="button"
                      onClick={goToNextStep}
                      disabled={!canContinue}
                      className="h-12 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleComplete}
                      disabled={!canContinue || isSubmitting}
                      className="h-12 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      {isSubmitting ? "Saving your profile..." : "Complete onboarding"}
                    </Button>
                  )}
                </CardFooter>
              ) : null}
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

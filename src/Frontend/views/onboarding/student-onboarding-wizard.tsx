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

type SaveState = "idle" | "saving" | "saved" | "error";

const TOTAL_STEPS = 5;
const MAX_CONFUSIONS = 3;
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

function getResumeStep(savedStep: number, draft: StudentOnboardingDraft): WizardStep {
  if (savedStep <= 0) {
    return 1;
  }

  const nextSavedStep = getNextStep(
    Math.min(Math.max(savedStep, 1), TOTAL_STEPS) as WizardStep,
    draft.class,
  );
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
        };
      case 3:
        return {
          class: currentDraft.class,
          stream: currentDraft.stream,
        };
      case 4:
        return {
          class: currentDraft.class,
          confusionTypes: currentDraft.confusionTypes,
        };
      case 5:
        return {
          class: currentDraft.class,
          board: currentDraft.board,
          stream: currentDraft.stream,
          confusionTypes: currentDraft.confusionTypes,
          city: currentDraft.city.trim(),
          state: currentDraft.state,
          languagePreference: currentDraft.languagePreference,
        };
    }
  }

  async function persistStep(step: Exclude<WizardStep, 5>) {
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
          savedStep?: number;
        }
      | null;

    if (!response.ok) {
      setSaveState("error");
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

    if (currentStep === 5) {
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
    if (!isStepValid(5, draft) || !draft.class || !draft.stream || !draft.state || !draft.languagePreference) {
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
                  Progress sync
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  {saveState === "saving"
                    ? "Saving your latest step to your account..."
                    : saveState === "saved" && lastSavedStep > 0
                      ? `Saved through step ${lastSavedStep}. Local draft backup stays on this device too.`
                      : saveState === "error"
                        ? "We could not sync the last step to your account. Your local draft is still preserved on this device."
                        : "We will keep completed steps synced to your account and keep a local draft backup on this device."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-12">
          <div className="w-full max-w-xl space-y-4">
            <DashboardAccountPanel
              name={displayName}
              email={userEmail}
              image={userImage}
              initials={accountInitials}
              roleLabel="Student"
              onboardingComplete={Boolean(data?.user?.onboardingComplete)}
              profileHref="/profile"
              signOutRedirectTo="/auth/signin"
            />
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
                              htmlFor="student-state"
                              className="text-sm font-semibold text-slate-900"
                            >
                              State
                            </label>
                            <select
                              id="student-state"
                              autoComplete="address-level1"
                              value={draft.state ?? ""}
                              onChange={(event) =>
                                updateDraft((current) => ({
                                  ...current,
                                  state: event.target.value
                                    ? (event.target.value as IndianStateValue)
                                    : undefined,
                                }))
                              }
                              className={LOCATION_FIELD_CLASS_NAME}
                            >
                              <option value="">Select your state</option>
                              {INDIAN_STATE_VALUES.map((state) => (
                                <option key={state} value={state}>
                                  {state}
                                </option>
                              ))}
                            </select>
                            <p className="text-sm text-slate-500">
                              Pick your state first for more relevant city suggestions.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <label
                              htmlFor="student-city"
                              className="text-sm font-semibold text-slate-900"
                            >
                              City
                            </label>
                            <Input
                              id="student-city"
                              autoComplete="address-level2"
                              value={cityValue}
                              onChange={(event) =>
                                updateDraft((current) => ({
                                  ...current,
                                  city: event.target.value,
                                }))
                              }
                              placeholder={
                                draft.state
                                  ? `Search cities in ${draft.state}`
                                  : "Type your city or choose your state first"
                              }
                              className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 shadow-sm placeholder:text-slate-400"
                            />
                            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                  Quick suggestions
                                </div>
                                <div className="text-xs font-medium text-slate-500">
                                  {draft.state ?? "All India"}
                                </div>
                              </div>
                              {citySuggestions.length > 0 ? (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {citySuggestions.map((city) => {
                                    const isActive = city.toLowerCase() === normalizedCityValue;

                                    return (
                                      <button
                                        key={city}
                                        type="button"
                                        onClick={() =>
                                          updateDraft((current) => ({
                                            ...current,
                                            city,
                                          }))
                                        }
                                        className={cn(
                                          "rounded-full border px-3 py-1.5 text-sm font-medium transition",
                                          isActive
                                            ? "border-slate-950 bg-slate-950 text-white"
                                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-950 hover:text-slate-950",
                                        )}
                                      >
                                        {city}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="mt-3 text-sm leading-6 text-slate-500">
                                  No quick matches found. You can still type your city manually.
                                </p>
                              )}
                            </div>
                            <p className="text-sm text-slate-500">
                              {draft.state
                                ? `Showing cities for ${draft.state}. If yours is missing, type it manually.`
                                : normalizedCityValue.length > 0
                                  ? "Showing matching cities across India. Pick a state for tighter results."
                                  : "Type to search across India, or choose a state to narrow the list."}
                            </p>
                            {!cityMatchesSelectedState && draft.state ? (
                              <p className="text-sm text-amber-600">
                                {cityValue} does not match our quick suggestions for {draft.state}.
                                You can keep typing if it is correct.
                              </p>
                            ) : null}
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
                              className={LOCATION_FIELD_CLASS_NAME}
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
                        disabled={isBusy}
                        className="h-12 rounded-xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                      >
                        Back
                      </Button>
                    ) : null}
                  </div>

                  {currentStep < 5 ? (
                    <Button
                      type="button"
                      onClick={() => void goToNextStep()}
                      disabled={!canContinue || isBusy}
                      className="h-12 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      {saveState === "saving" ? "Saving step..." : "Next"}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleComplete}
                      disabled={!canContinue || isBusy}
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

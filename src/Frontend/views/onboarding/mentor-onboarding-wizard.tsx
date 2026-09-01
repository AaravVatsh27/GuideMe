"use client";

import type { Route } from "next";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  GraduationCap,
  IndianRupee,
  Loader2,
  ShieldCheck,
  Star,
  UserRound,
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
import { DEFAULT_TIMEZONE, PLATFORM_CUT } from "@/Backend/server/constants";
import {
  AVAILABILITY_DAYS,
  AVAILABILITY_SLOTS,
  BRANCH_SUGGESTIONS,
  buildGraduationYearOptions,
  calculateEstimatedMonthlyEarnings,
  calculateFortyFiveMinutePrice,
  createAvailabilityKey,
  DEGREE_OPTIONS,
  EXAM_OPTIONS,
  formatAvailabilityLabel,
  getExamLabel,
  HELP_TOPIC_OPTIONS,
  PRICING_POINTS,
  YEAR_OF_STUDY_OPTIONS,
  type DegreeValue,
  type MentorExamValue,
  type MentorHelpTopicValue,
  type MentorOnboardingDraft,
  type MentorTierValue,
  type MentorOnboardingStep,
  type YearOfStudyValue,
} from "@/Backend/server/mentor-onboarding";
import { uploadFiles } from "@/Backend/server/uploadthing";
import { cn } from "@/Backend/server/utils";

type MentorOnboardingWizardProps = {
  userName: string;
  initialDraft: MentorOnboardingDraftWithInstitution;
  savedStep: number;
  avatarUploadsEnabled: boolean;
};

type InstitutionSearchResult = {
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

type MentorOnboardingDraftWithInstitution = MentorOnboardingDraft & {
  institutionId?: string;
};

type SaveState = "idle" | "saving" | "saved" | "error";
type StepPersistIssues = {
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
};
type StepPersistResponse = {
  error?: string;
  issues?: StepPersistIssues;
  savedStep?: number;
  redirectTo?: string | null;
};

const TOTAL_STEPS = 7;
const MAX_HELP_TOPICS = 5;
const EXAM_YEAR_OPTIONS = Array.from({ length: 16 }, (_, index) => new Date().getFullYear() - index);
const MENTOR_FIELD_CLASS_NAME =
  "h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 shadow-sm placeholder:text-slate-400";
const MENTOR_SELECT_CLASS_NAME =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5";
const MENTOR_TEXTAREA_CLASS_NAME =
  "w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5";

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("We could not read that image file."));
    };

    reader.onerror = () => {
      reject(new Error("We could not read that image file."));
    };

    reader.readAsDataURL(file);
  });
}

function getInitialStep(savedStep: number) {
  return Math.min(Math.max(savedStep + 1, 1), TOTAL_STEPS) as MentorOnboardingStep;
}

function getStepTitle(step: MentorOnboardingStep) {
  switch (step) {
    case 1:
      return "Your institution";
    case 2:
      return "Your course details";
    case 3:
      return "Exams you've cleared";
    case 4:
      return "What can you help students with?";
    case 5:
      return "Set your pricing";
    case 6:
      return "Write your profile";
    case 7:
      return "Set your availability";
  }
}

function getStepDescription(step: MentorOnboardingStep) {
  switch (step) {
    case 1:
      return "We use your institution to add accurate academic context. Your institution tier is separate from your personal mentor trust level.";
    case 2:
      return "Course context helps students understand what path you are actually walking right now.";
    case 3:
      return "This makes your proof points visible and lets students find mentors by exam journey.";
    case 4:
      return "Choose up to 5 high-value areas where you can give concrete help, not generic advice.";
    case 5:
      return "Set a fair starting point. Students see the free intro call first and your paid slots after.";
    case 6:
      return "A clear headline, honest bio, and real avatar are what make the profile feel credible.";
    case 7:
      return "Students should see real slots you can actually commit to every week.";
  }
}

function isStepValid(step: MentorOnboardingStep, draft: MentorOnboardingDraft) {
  switch (step) {
    case 1:
      // Known institution:  institutionId + college + tier (set by handleInstitutionSelect)
      // Unknown institution: college (submitted name) + tier (from suggestion flow, no institutionId)
      // Either way, a non-empty college name and a tier are enough to continue.
      return Boolean(draft.college?.trim()) && Boolean(draft.tier);
    case 2:
      return Boolean(draft.degree && draft.branch?.trim() && draft.yearOfStudy && draft.expectedGraduationYear);
    case 3:
      return true;
    case 4:
      return draft.specialisations.length > 0 && draft.specialisations.length <= MAX_HELP_TOPICS;
    case 5:
      return PRICING_POINTS.includes(draft.priceMin as (typeof PRICING_POINTS)[number]);
    case 6:
      return Boolean(
        draft.headline?.trim() &&
        draft.headline.trim().length <= 80 &&
        draft.bio?.trim() &&
        draft.bio.trim().length >= 150 &&
        draft.bio.trim().length <= 400 &&
        draft.avatarUrl,
      );
    case 7:
      return draft.availabilitySlots.length >= 5;
  }
}

function getStepPayload(step: MentorOnboardingStep, draft: MentorOnboardingDraftWithInstitution) {
  switch (step) {
    case 1:
      return {
        institutionId: draft.institutionId,
        college: draft.college,
        tier: draft.tier,
      };
    case 2:
      return {
        degree: draft.degree,
        branch: draft.branch,
        yearOfStudy: draft.yearOfStudy,
        expectedGraduationYear: draft.expectedGraduationYear,
      };
    case 3:
      return {
        exams: draft.exams,
      };
    case 4:
      return {
        specialisations: draft.specialisations,
      };
    case 5:
      return {
        priceMin: draft.priceMin,
        priceMax: draft.priceMax,
      };
    case 6:
      return {
        headline: draft.headline,
        bio: draft.bio,
        avatarUrl: draft.avatarUrl,
        linkedinUrl: draft.linkedinUrl,
      };
    case 7:
      return {
        timezone: draft.timezone,
        availabilitySlots: draft.availabilitySlots,
      };
  }
}

function getProgressPercent(step: MentorOnboardingStep) {
  return Math.round((step / TOTAL_STEPS) * 100);
}

function getInstitutionTierBadgeClasses(tier?: string) {
  if (tier === "TIER_1") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (tier === "TIER_2") {
    return "border-teal-200 bg-teal-50 text-teal-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getUserInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function MentorOnboardingWizard({
  userName,
  initialDraft,
  savedStep,
  avatarUploadsEnabled,
}: MentorOnboardingWizardProps) {
  const router = useRouter();
  const { data, update } = useSession();
  const [draft, setDraft] = useState<MentorOnboardingDraftWithInstitution>(initialDraft);
  const [institutionQuery, setInstitutionQuery] = useState(initialDraft.college ?? "");
  const [institutionResults, setInstitutionResults] = useState<InstitutionSearchResult[]>([]);
  const [institutionLoading, setInstitutionLoading] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionSearchResult | null>(null);
  const [currentStep, setCurrentStep] = useState<MentorOnboardingStep>(getInitialStep(savedStep));
  const [direction, setDirection] = useState(1);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [lastSavedStep, setLastSavedStep] = useState(savedStep);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [suggestionName, setSuggestionName] = useState("");
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const displayName = data?.user?.name ?? userName;
  const userEmail = data?.user?.email ?? "";
  const userImage = data?.user?.image ?? null;
  const accountInitials = getUserInitials(displayName);

  const graduationYearOptions = useMemo(
    () => buildGraduationYearOptions(),
    [],
  );
  const pricingIndex = Math.max(
    0,
    PRICING_POINTS.findIndex((value) => value === draft.priceMin),
  );
  const monthlyEarnings = calculateEstimatedMonthlyEarnings(draft.priceMin);
  const canContinue = isStepValid(currentStep, draft) && !isUploadingAvatar && !isSubmitting;
  const trimmedHeadline = draft.headline?.trim() ?? "";
  const trimmedBio = draft.bio?.trim() ?? "";
  const hasAvatar = Boolean(draft.avatarUrl?.trim());
  const profileStepChecks = [
    {
      label: "Headline between 10 and 80 characters",
      complete: trimmedHeadline.length >= 10 && trimmedHeadline.length <= 80,
    },
    {
      label: "Bio between 150 and 400 characters",
      complete: trimmedBio.length >= 150 && trimmedBio.length <= 400,
    },
    {
      label: "Avatar image selected",
      complete: hasAvatar,
    },
  ] as const;

  function updateDraftValue<K extends keyof MentorOnboardingDraftWithInstitution>(
    key: K,
    value: MentorOnboardingDraftWithInstitution[K],
  ) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function mapInstitutionTierToLegacyMentorTier(
    institutionTier: string,
  ): MentorTierValue {
    switch (institutionTier) {
      case "TIER_1":
        return "ELITE";
      case "TIER_2":
        return "VERIFIED";
      case "TIER_3":
      case "UNCLASSIFIED":
      default:
        return "RISING";
    }
  }

  function handleCollegeChange(value: string) {
    setSelectedInstitution(null);
    setInstitutionQuery(value);

    setDraft((current) => ({
      ...current,
      institutionId: undefined,
      college: value,
      tier: undefined,
    }));
  }

  function handleInstitutionSelect(institution: InstitutionSearchResult) {
    setSelectedInstitution(institution);
    setInstitutionQuery(institution.name);
    setInstitutionResults([]);

    setDraft((current) => ({
      ...current,
      institutionId: institution.id,
      college: institution.name,
      tier: mapInstitutionTierToLegacyMentorTier(institution.institutionTier),
    }));
  }

  useEffect(() => {
    if (!initialDraft.institutionId || !initialDraft.college || selectedInstitution) {
      return;
    }

    const controller = new AbortController();

    const restoreInstitution = async () => {
      try {
        const response = await fetch(
          `/api/v1/institutions/search?q=${encodeURIComponent(initialDraft.college ?? "")}&limit=10`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          results?: InstitutionSearchResult[];
        };

        const matchingInstitution = payload.results?.find(
          (institution) => institution.id === initialDraft.institutionId,
        );

        if (matchingInstitution) {
          setSelectedInstitution(matchingInstitution);
          setInstitutionQuery(matchingInstitution.name);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error("Could not restore institution selection", error);
      }
    };

    void restoreInstitution();

    return () => controller.abort();
  }, [initialDraft.college, initialDraft.institutionId, selectedInstitution]);

  useEffect(() => {
    const query = institutionQuery.trim();

    if (selectedInstitution || query.length < 2) {
      setInstitutionResults([]);
      setInstitutionLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setInstitutionLoading(true);

        const response = await fetch(
          `/api/v1/institutions/search?q=${encodeURIComponent(query)}&limit=10`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Institution search failed");
        }

        const payload = (await response.json()) as {
          results?: InstitutionSearchResult[];
        };

        setInstitutionResults(payload.results ?? []);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Institution search failed", error);
        setInstitutionResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setInstitutionLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [institutionQuery, selectedInstitution]);

  function handleExamToggle(value: MentorExamValue) {
    setDraft((current) => {
      const exists = current.exams.some((entry) => entry.exam === value);

      if (exists) {
        return {
          ...current,
          exams: current.exams.filter((entry) => entry.exam !== value),
        };
      }

      return {
        ...current,
        exams: [...current.exams, { exam: value }],
      };
    });
  }

  function handleExamYearChange(value: MentorExamValue, year: number | undefined) {
    setDraft((current) => ({
      ...current,
      exams: current.exams.map((entry) =>
        entry.exam === value
          ? {
            ...entry,
            year,
          }
          : entry,
      ),
    }));
  }

  function handleHelpTopicToggle(value: MentorHelpTopicValue) {
    setDraft((current) => {
      const exists = current.specialisations.includes(value);

      if (exists) {
        return {
          ...current,
          specialisations: current.specialisations.filter((item) => item !== value),
        };
      }

      if (current.specialisations.length >= MAX_HELP_TOPICS) {
        toast.error("Pick up to 5 help areas.");
        return current;
      }

      return {
        ...current,
        specialisations: [...current.specialisations, value],
      };
    });
  }

  function handlePricingChange(index: number) {
    const price30 = PRICING_POINTS[index] ?? PRICING_POINTS[0];

    setDraft((current) => ({
      ...current,
      priceMin: price30,
      priceMax: calculateFortyFiveMinutePrice(price30),
    }));
  }

  async function handleInstitutionSuggestion() {
    const submittedName = suggestionName.trim();

    if (submittedName.length < 3) {
      toast.error(
        "College name must be at least 3 characters.",
      );
      return;
    }

    setIsSubmittingSuggestion(true);

    try {
      const response = await fetch(
        "/api/v1/institutions/suggest",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            submittedName,
          }),
        },
      );

      const payload = (await response.json()) as {
        suggestionId?: string;
        status?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(
          payload.error ??
            "We could not submit your college for review.",
        );
      }

      setSuggestionSubmitted(true);

      // Stamp the draft so isStepValid(1) passes and the mentor can continue.
      // institutionId stays undefined — this is the unknown-institution path.
      setDraft((current) => ({
        ...current,
        college: submittedName,
        tier: current.tier ?? "RISING",
      }));

      toast.success(
        payload.message ??
          "Your college has been submitted for review.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "We could not submit your college for review.",
      );
    } finally {
      setIsSubmittingSuggestion(false);
    }
  }

  async function handleAvatarUpload(file: File | null) {
    if (!file) {
      return;
    }

    if (!avatarUploadsEnabled) {
      setIsUploadingAvatar(true);

      try {
        const dataUrl = await readFileAsDataUrl(file);
        updateDraftValue("avatarUrl", dataUrl);
        toast.success("Avatar selected. It will be saved with this profile step.");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "We could not read that image file.",
        );
      } finally {
        setIsUploadingAvatar(false);
      }

      return;
    }

    setIsUploadingAvatar(true);
    setSaveState("saving");

    try {
      const uploaded = await uploadFiles("mentorAvatar", {
        files: [file],
      });

      const uploadedFile = uploaded[0];

      if (!uploadedFile?.ufsUrl) {
        throw new Error("Avatar upload did not return a file URL.");
      }

      setDraft((current) => ({
        ...current,
        avatarUrl: uploadedFile.ufsUrl,
      }));
      setSaveState("saved");
      toast.success("Avatar uploaded.");
    } catch (error) {
      setSaveState("error");
      toast.error(
        error instanceof Error &&
          /invalid token|base64 encoded json|appid|regions/i.test(error.message)
          ? "Avatar uploads are not configured correctly right now. Use the image URL field instead."
          : error instanceof Error
            ? error.message
            : "We could not upload the avatar.",
      );
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  function toggleAvailability(dayOfWeek: number, startTime: string, endTime: string) {
    setDraft((current) => {
      const slot = { dayOfWeek, startTime, endTime };
      const key = createAvailabilityKey(slot);
      const exists = current.availabilitySlots.some(
        (item) => createAvailabilityKey(item) === key,
      );

      return {
        ...current,
        availabilitySlots: exists
          ? current.availabilitySlots.filter(
            (item) => createAvailabilityKey(item) !== key,
          )
          : [...current.availabilitySlots, slot].sort((left, right) => {
            if (left.dayOfWeek !== right.dayOfWeek) {
              return left.dayOfWeek - right.dayOfWeek;
            }

            return left.startTime.localeCompare(right.startTime);
          }),
      };
    });
  }

  async function persistStep(step: MentorOnboardingStep, submit = false) {
    setSaveState("saving");

    const response = await fetch("/api/onboarding/mentor", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        step,
        submit,
        data: getStepPayload(step, draft),
      }),
    });

    const payload = (await response.json().catch(() => null)) as StepPersistResponse | null;

    if (!response.ok) {
      setSaveState("error");
      const errorMsg = payload?.error ?? "We could not save this step.";
      const issues = payload?.issues;

      if (issues && typeof issues === "object") {
        const fieldErrors = issues.fieldErrors;
        if (fieldErrors) {
          const firstError = Object.values(fieldErrors).flatMap((messages) => messages ?? [])[0];
          if (firstError) {
            throw new Error(String(firstError));
          }
        }
      }

      throw new Error(errorMsg);
    }

    setLastSavedStep(payload?.savedStep ?? step);
    setSaveState("saved");

    if (submit && payload?.redirectTo) {
      await update({
        user: {
          role: "MENTOR",
          onboardingComplete: true,
        },
      });

      setIsSubmitted(true);
      setTimeout(() => {
        router.replace(payload.redirectTo as Route);
      }, 1800);
    }
  }

  async function handleNext() {
    if (!canContinue) {
      return;
    }

    try {
      await persistStep(currentStep, false);
      setDirection(1);
      setCurrentStep((current) => Math.min(current + 1, TOTAL_STEPS) as MentorOnboardingStep);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "We could not save this step.",
      );
    }
  }

  function handleBack() {
    setDirection(-1);
    setCurrentStep((current) => Math.max(current - 1, 1) as MentorOnboardingStep);
  }

  async function handleSubmit() {
    if (!canContinue) {
      return;
    }

    setIsSubmitting(true);

    try {
      await persistStep(7, true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "We could not submit your application.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#eef4ff_48%,_#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_32px_120px_-48px_rgba(15,23,42,0.45)] backdrop-blur xl:grid-cols-[1fr_minmax(460px,580px)]">
        <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.2),_transparent_30%),linear-gradient(165deg,_#06101f_0%,_#0f172a_55%,_#15264b_100%)] px-6 py-8 text-slate-50 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="absolute inset-0">
            <div className="absolute -left-16 top-14 size-40 rounded-full bg-teal-400/10 blur-3xl" />
            <div className="absolute bottom-10 right-[-4rem] size-52 rounded-full bg-cyan-300/10 blur-3xl" />
          </div>

          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur">
                <span className="flex size-9 items-center justify-center rounded-full bg-teal-400/16 text-teal-200">
                  <GraduationCap className="size-4.5" />
                </span>
                Mentor onboarding
              </div>

              <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-200/90">
                  Build a profile students can trust
                </p>
                <h1 className="font-display text-4xl leading-[0.95] font-bold text-white sm:text-5xl">
                  Set up your mentor application around real proof, real availability, and clear value.
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
                  GuideMe will use this to position {userName} properly, estimate quality signals,
                  and make sure students know exactly why they should book you.
                </p>
              </div>

              <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">
                      Application progress
                    </div>
                    <div className="mt-2 text-3xl font-semibold text-white">
                      Step {currentStep} of {TOTAL_STEPS}
                    </div>
                  </div>
                  <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-teal-100">
                    {getProgressPercent(currentStep)}%
                  </div>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    animate={{ width: `${getProgressPercent(currentStep)}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="h-full rounded-full bg-gradient-to-r from-teal-300 via-cyan-300 to-white"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
                <div className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">
                  Live summary
                </div>
                <div className="grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-300">
                      Institution
                    </div>
                    <div className="mt-2 text-base font-semibold text-white">
                      {draft.college?.trim() || "Not selected yet"}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                      <ShieldCheck className="size-3.5" />
                      Institution tier
                    </div>
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                        getInstitutionTierBadgeClasses(selectedInstitution?.institutionTier),
                      )}
                    >
                      {selectedInstitution?.institutionTier ?? "Not selected yet"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-300">
                      Pricing
                    </div>
                    <div className="mt-2 text-base font-semibold text-white">
                      {`Rs. ${draft.priceMin} / 30 min`}
                    </div>
                    <div className="mt-1 text-sm text-slate-300">
                      {`Rs. ${draft.priceMax} / 45 min`}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/25 p-4">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-300">
                      Saved status
                    </div>
                    <div className="mt-2 text-base font-semibold text-white">
                      {saveState === "saving" && "Saving..."}
                      {saveState === "saved" && `Saved through step ${lastSavedStep}`}
                      {saveState === "error" && "Save failed"}
                      {saveState === "idle" && (lastSavedStep > 0 ? `Saved through step ${lastSavedStep}` : "No autosave yet")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/12 bg-slate-950/30 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-100">
                  <Star className="size-4 text-teal-200" />
                  Trust-first application
                </div>
                <p className="text-sm leading-6 text-slate-300">
                  Students see a free intro call first, then your paid sessions, verified context,
                  and the exact areas where you can actually help.
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
              roleLabel="Mentor"
              onboardingComplete={Boolean(data?.user?.onboardingComplete)}
              profileHref="/profile"
              signOutRedirectTo="/auth/signin"
            />
            <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/92 py-0 shadow-card backdrop-blur">
              <CardHeader className="gap-4 border-b border-slate-200/80 px-6 py-7 sm:px-7">
                {!isSubmitted ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        Step {currentStep} of {TOTAL_STEPS}
                      </p>
                      <div className="text-xs font-medium text-slate-500">
                        {saveState === "saving" && "Saving..."}
                        {saveState === "saved" && "Saved"}
                        {saveState === "error" && "Save failed"}
                      </div>
                    </div>
                    <CardTitle className="font-display text-3xl font-bold text-slate-950">
                      {getStepTitle(currentStep)}
                    </CardTitle>
                    <CardDescription className="text-sm leading-6 text-slate-600">
                      {getStepDescription(currentStep)}
                    </CardDescription>
                  </div>
                ) : null}
              </CardHeader>

              <CardContent className="px-6 py-7 sm:px-7">
                <AnimatePresence mode="wait" custom={direction}>
                  {isSubmitted ? (
                    <motion.div
                      key="mentor-submitted"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="space-y-6 py-4"
                    >
                      <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-teal-50 text-teal-600">
                        <CheckCircle2 className="size-10" />
                      </div>
                      <div className="space-y-2 text-center">
                        <h3 className="font-display text-3xl font-bold text-slate-950">
                          Application submitted
                        </h3>
                        <p className="text-sm leading-6 text-slate-600">
                          Your mentor profile is now marked as <span className="font-semibold">PENDING</span>.
                          We are taking you to your mentor status dashboard.
                        </p>
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="font-semibold text-slate-950">What happens next</div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Our team reviews your institution, profile quality, and availability fit
                            before making the mentor profile visible to students.
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="font-semibold text-slate-950">Current status</div>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            Pending verification. You can review your saved details from the mentor dashboard.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`mentor-step-${currentStep}`}
                      custom={direction}
                      initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                      transition={{ duration: 0.24, ease: "easeOut" }}
                      className="space-y-5"
                    >
                      {currentStep === 1 ? (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <label htmlFor="mentor-college" className="text-sm font-semibold text-slate-900">
                              College / University
                            </label>

                            <div className="relative">
                              <Input
                                id="mentor-college"
                                value={institutionQuery}
                                onChange={(event) => handleCollegeChange(event.target.value)}
                                placeholder="Search your college or university"
                                autoComplete="off"
                                className={MENTOR_FIELD_CLASS_NAME}
                              />

                              {institutionQuery.trim().length >= 2 && !selectedInstitution ? (
                                <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-20px_rgba(15,23,42,0.35)]">
                                  {institutionLoading ? (
                                    <div className="px-4 py-4 text-sm text-slate-500">
                                      Searching institutions...
                                    </div>
                                  ) : institutionResults.length > 0 ? (
                                    <div className="max-h-72 overflow-y-auto py-1">
                                      {institutionResults.map((institution) => (
                                        <button
                                          key={institution.id}
                                          type="button"
                                          onClick={() => handleInstitutionSelect(institution)}
                                          className="block w-full border-b border-slate-100 px-4 py-3 text-left last:border-b-0 hover:bg-slate-50"
                                        >
                                          <div className="font-semibold text-slate-950">
                                            {institution.name}
                                          </div>
                                          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                                            {institution.shortName ? <span>{institution.shortName}</span> : null}
                                            {institution.city ? <span>{institution.city}</span> : null}
                                            {institution.state ? <span>{institution.state}</span> : null}
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  ) : (
                                    !institutionLoading &&
                                    institutionResults.length === 0 && (
                                      <div className="space-y-4 px-4 py-4">
                                        {!suggestionSubmitted ? (
                                          <>
                                            <div>
                                              <p className="text-sm font-semibold text-slate-900">
                                                No institution found
                                              </p>

                                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                                Can&apos;t find your college or university?
                                                Submit it for review and continue your
                                                onboarding.
                                              </p>
                                            </div>

                                            <div className="space-y-2">
                                              <label
                                                htmlFor="institution-suggestion"
                                                className="text-xs font-semibold text-slate-700"
                                              >
                                                College / university name
                                              </label>

                                              <Input
                                                id="institution-suggestion"
                                                value={suggestionName}
                                                onChange={(event) =>
                                                  setSuggestionName(
                                                    event.target.value,
                                                  )
                                                }
                                                placeholder="Enter your college name"
                                                className={MENTOR_FIELD_CLASS_NAME}
                                                maxLength={200}
                                              />
                                            </div>

                                            <Button
                                              type="button"
                                              onClick={handleInstitutionSuggestion}
                                              disabled={
                                                isSubmittingSuggestion ||
                                                suggestionName.trim().length < 3
                                              }
                                              className="w-full rounded-xl"
                                            >
                                              {isSubmittingSuggestion ? (
                                                <>
                                                  <Loader2 className="mr-2 size-4 animate-spin" />
                                                  Submitting…
                                                </>
                                              ) : (
                                                "Submit for review"
                                              )}
                                            </Button>
                                          </>
                                        ) : (
                                          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                                            <div className="flex items-start gap-3">
                                              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />

                                              <div>
                                                <p className="text-sm font-semibold text-emerald-900">
                                                  College submitted for review
                                                </p>

                                                <p className="mt-1 text-xs leading-5 text-emerald-800">
                                                  Your college has been submitted for
                                                  review. You can continue onboarding.
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              ) : null}
                            </div>

                            {selectedInstitution ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedInstitution(null);
                                  setInstitutionQuery("");
                                  setDraft((current) => ({
                                    ...current,
                                    institutionId: undefined,
                                    college: undefined,
                                    tier: undefined,
                                  }));
                                }}
                                className="text-xs font-medium text-slate-500 underline underline-offset-2 hover:text-slate-900"
                              >
                                Change institution
                              </button>
                            ) : null}
                          </div>

                          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                            {selectedInstitution ? (
                              <div className="space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-2">
                                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                      Selected institution
                                    </div>
                                    <div className="font-display text-2xl font-semibold text-slate-950">
                                      {selectedInstitution.name}
                                    </div>
                                    <p className="text-sm leading-6 text-slate-600">
                                      {selectedInstitution.city ?? ""}
                                      {selectedInstitution.city && selectedInstitution.state ? ", " : ""}
                                      {selectedInstitution.state ?? ""}
                                    </p>
                                  </div>

                                  <span
                                    className={cn(
                                      "inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]",
                                      getInstitutionTierBadgeClasses(selectedInstitution.institutionTier),
                                    )}
                                  >
                                    {selectedInstitution.institutionTier}
                                  </span>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                      Category
                                    </div>
                                    <div className="mt-1 text-sm font-medium text-slate-900">
                                      {selectedInstitution.academicCategory}
                                    </div>
                                  </div>

                                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                                      Classification
                                    </div>
                                    <div className="mt-1 text-sm font-medium text-slate-900">
                                      {selectedInstitution.institutionClassification}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  Institution verification
                                </div>
                                <p className="text-sm leading-6 text-slate-600">
                                  Search and select your institution to continue. Institution tier is separate from your personal mentor trust level.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}

                      {currentStep === 2 ? (
                        <div className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-slate-900">Degree</label>
                              <select
                                value={draft.degree ?? ""}
                                onChange={(event) =>
                                  updateDraftValue(
                                    "degree",
                                    (event.target.value || undefined) as DegreeValue | undefined,
                                  )
                                }
                                className={MENTOR_SELECT_CLASS_NAME}
                              >
                                <option value="">Select degree</option>
                                {DEGREE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-slate-900">Year of study</label>
                              <select
                                value={draft.yearOfStudy ?? ""}
                                onChange={(event) =>
                                  updateDraftValue(
                                    "yearOfStudy",
                                    (event.target.value ? Number(event.target.value) : undefined) as YearOfStudyValue | undefined,
                                  )
                                }
                                className={MENTOR_SELECT_CLASS_NAME}
                              >
                                <option value="">Select year</option>
                                {YEAR_OF_STUDY_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="mentor-branch" className="text-sm font-semibold text-slate-900">
                              Branch / Specialisation
                            </label>
                            <Input
                              id="mentor-branch"
                              list="mentor-branch-suggestions"
                              value={draft.branch ?? ""}
                              onChange={(event) => updateDraftValue("branch", event.target.value || undefined)}
                              placeholder="Type your branch or area of specialisation"
                              className={MENTOR_FIELD_CLASS_NAME}
                            />
                            <datalist id="mentor-branch-suggestions">
                              {BRANCH_SUGGESTIONS.map((branch) => (
                                <option key={branch} value={branch} />
                              ))}
                            </datalist>
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-900">
                              Expected graduation year
                            </label>
                            <select
                              value={draft.expectedGraduationYear ?? ""}
                              onChange={(event) =>
                                updateDraftValue(
                                  "expectedGraduationYear",
                                  event.target.value ? Number(event.target.value) : undefined,
                                )
                              }
                              className={MENTOR_SELECT_CLASS_NAME}
                            >
                              <option value="">Select graduation year</option>
                              {graduationYearOptions.map((year) => (
                                <option key={year} value={year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ) : null}

                      {currentStep === 3 ? (
                        <div className="space-y-5">
                          <div className="flex flex-wrap gap-3">
                            {EXAM_OPTIONS.map((option) => {
                              const active = draft.exams.some((entry) => entry.exam === option.value);

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleExamToggle(option.value)}
                                  className={cn(
                                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                                    active
                                      ? "border-slate-950 bg-slate-950 text-white"
                                      : "border-slate-200 bg-white text-slate-800 hover:border-slate-950",
                                  )}
                                >
                                  {option.label}
                                </button>
                              );
                            })}
                          </div>

                          {draft.exams.length > 0 ? (
                            <div className="grid gap-3">
                              {draft.exams.map((entry) => (
                                <div
                                  key={entry.exam}
                                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                  <div className="mb-3 text-sm font-semibold text-slate-900">
                                    {getExamLabel(entry.exam)}
                                  </div>
                                  <select
                                    value={entry.year ?? ""}
                                    onChange={(event) =>
                                      handleExamYearChange(
                                        entry.exam,
                                        event.target.value ? Number(event.target.value) : undefined,
                                      )
                                    }
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5"
                                  >
                                    <option value="">Year cleared (optional)</option>
                                    {EXAM_YEAR_OPTIONS.map((year) => (
                                      <option key={year} value={year}>
                                        {year}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm leading-6 text-slate-500">
                              No exam selected yet. If none apply, you can continue without adding one.
                            </div>
                          )}
                        </div>
                      ) : null}

                      {currentStep === 4 ? (
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                            {draft.specialisations.length} of {MAX_HELP_TOPICS} selected
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {HELP_TOPIC_OPTIONS.map((option) => {
                              const active = draft.specialisations.includes(option.value);

                              return (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => handleHelpTopicToggle(option.value)}
                                  className={cn(
                                    "rounded-[1.25rem] border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-card",
                                    active
                                      ? "border-slate-950 bg-slate-950 text-white"
                                      : "border-slate-200 bg-white text-slate-900 hover:border-slate-950",
                                  )}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <span className="text-sm font-semibold leading-6">
                                      {option.label}
                                    </span>
                                    <span
                                      className={cn(
                                        "flex size-6 shrink-0 items-center justify-center rounded-full border",
                                        active
                                          ? "border-white/30 bg-white/10 text-white"
                                          : "border-slate-200 bg-white text-transparent",
                                      )}
                                    >
                                      <Check className="size-3.5" />
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {currentStep === 5 ? (
                        <div className="space-y-6">
                          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  Intro call
                                </div>
                                <div className="mt-2 font-display text-2xl font-semibold text-slate-950">
                                  Free
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  This is shown first to reduce friction for students.
                                </p>
                              </div>
                              <div className="rounded-full bg-teal-100 px-4 py-2 text-sm font-semibold text-teal-800">
                                Fixed
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-end justify-between gap-4">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  30-minute session
                                </div>
                                <div className="mt-2 flex items-center gap-1 font-display text-4xl font-bold text-slate-950">
                                  <IndianRupee className="size-7" />
                                  {draft.priceMin}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  45-minute session
                                </div>
                                <div className="mt-2 flex items-center justify-end gap-1 text-2xl font-semibold text-slate-900">
                                  <IndianRupee className="size-5" />
                                  {draft.priceMax}
                                </div>
                              </div>
                            </div>

                            <input
                              type="range"
                              min={0}
                              max={PRICING_POINTS.length - 1}
                              step={1}
                              value={pricingIndex}
                              onChange={(event) => handlePricingChange(Number(event.target.value))}
                              className="w-full accent-slate-950"
                            />

                            <div className="grid grid-cols-9 gap-2 text-center text-[11px] font-medium text-slate-500">
                              {PRICING_POINTS.map((price) => (
                                <span key={price}>{price}</span>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              Estimated monthly earnings
                            </div>
                            <div className="mt-2 flex items-center gap-1 font-display text-3xl font-bold text-slate-950">
                              <IndianRupee className="size-6" />
                              {monthlyEarnings}
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              Based on 3 paid 30-minute sessions per week after the {Math.round(PLATFORM_CUT * 100)}% platform cut.
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {currentStep === 6 ? (
                        <div className="space-y-5">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-4">
                              <label htmlFor="mentor-headline" className="text-sm font-semibold text-slate-900">
                                Headline
                              </label>
                              <span className="text-xs font-medium text-slate-500">
                                {(draft.headline ?? "").length}/80
                              </span>
                            </div>
                            <Input
                              id="mentor-headline"
                              value={draft.headline ?? ""}
                              onChange={(event) => updateDraftValue("headline", event.target.value || undefined)}
                              maxLength={80}
                              placeholder="IIT Bombay CSE · Cracked JEE 2023 · Helped 40+ students"
                              className={MENTOR_FIELD_CLASS_NAME}
                            />
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-4">
                              <label htmlFor="mentor-bio" className="text-sm font-semibold text-slate-900">
                                Bio
                              </label>
                              <span className="text-xs font-medium text-slate-500">
                                {(draft.bio ?? "").length}/400
                              </span>
                            </div>
                            <textarea
                              id="mentor-bio"
                              value={draft.bio ?? ""}
                              onChange={(event) => updateDraftValue("bio", event.target.value || undefined)}
                              maxLength={400}
                              rows={6}
                              placeholder="What did you struggle with? What do you wish you knew earlier? What kind of students do you help best?"
                              className={MENTOR_TEXTAREA_CLASS_NAME}
                            />
                            <p className="text-sm leading-6 text-slate-500">
                              Guided prompts: what you struggled with, what you wish you knew earlier, and what kind of students you can help best.
                            </p>
                          </div>

                          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-4">
                            <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                              Step 6 checklist
                            </div>
                            <div className="mt-3 space-y-2">
                              {profileStepChecks.map((check) => (
                                <div
                                  key={check.label}
                                  className={cn(
                                    "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm",
                                    check.complete
                                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                      : "border-slate-200 bg-white text-slate-600",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "flex size-5 items-center justify-center rounded-full border",
                                      check.complete
                                        ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                                        : "border-slate-300 bg-slate-100 text-slate-400",
                                    )}
                                  >
                                    <Check className="size-3.5" />
                                  </span>
                                  <span>{check.label}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
                            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                              <div className="mb-3 text-sm font-semibold text-slate-900">
                                Avatar upload
                              </div>
                              <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-[1.25rem] border border-dashed border-slate-200 bg-white">
                                {draft.avatarUrl ? (
                                  <Image
                                    src={draft.avatarUrl}
                                    alt="Mentor avatar preview"
                                    fill
                                    sizes="(min-width: 640px) 16rem, 100vw"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="space-y-2 text-center text-sm text-slate-500">
                                    <UserRound className="mx-auto size-8" />
                                    <div>No avatar uploaded yet</div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <label className="block">
                                <span className="mb-2 block text-sm font-semibold text-slate-900">
                                  Upload avatar
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={isUploadingAvatar}
                                  onChange={(event) =>
                                    void handleAvatarUpload(event.target.files?.[0] ?? null)
                                  }
                                  className={cn(
                                    "block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-slate-900",
                                    isUploadingAvatar && "cursor-not-allowed opacity-60 file:cursor-not-allowed",
                                  )}
                                />
                              </label>
                              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                                {!avatarUploadsEnabled ? (
                                  draft.avatarUrl?.startsWith("data:") ? (
                                    <span className="inline-flex items-center gap-2 font-medium text-teal-700">
                                      <CheckCircle2 className="size-4" />
                                      Local avatar selected. It will be saved when you continue.
                                    </span>
                                  ) : draft.avatarUrl ? (
                                    <span className="inline-flex items-center gap-2 font-medium text-teal-700">
                                      <CheckCircle2 className="size-4" />
                                      UploadThing is unavailable locally. Your current profile image will be used, or you can choose a new file below.
                                    </span>
                                  ) : (
                                    "UploadThing is unavailable locally. Choose a file below or paste a public image URL."
                                  )
                                ) : isUploadingAvatar ? (
                                  <span className="inline-flex items-center gap-2">
                                    <Loader2 className="size-4 animate-spin" />
                                    Uploading avatar...
                                  </span>
                                ) : draft.avatarUrl ? (
                                  <span className="inline-flex items-center gap-2 font-medium text-teal-700">
                                    <CheckCircle2 className="size-4" />
                                    Avatar uploaded successfully.
                                  </span>
                                ) : (
                                  "A real avatar is required before your application can be submitted."
                                )}
                              </div>

                              <div className="space-y-2">
                                <label htmlFor="mentor-avatar-url" className="text-sm font-semibold text-slate-900">
                                  Avatar image URL
                                </label>
                                <Input
                                  id="mentor-avatar-url"
                                  type="url"
                                  value={draft.avatarUrl ?? ""}
                                  onChange={(event) => updateDraftValue("avatarUrl", event.target.value || undefined)}
                                  placeholder="https://example.com/your-photo.jpg"
                                  className={MENTOR_FIELD_CLASS_NAME}
                                />
                                <p className="text-sm text-slate-500">
                                  Use any public image URL if file upload is unavailable.
                                </p>
                              </div>

                              <div className="space-y-2">
                                <label htmlFor="mentor-linkedin" className="text-sm font-semibold text-slate-900">
                                  LinkedIn URL (optional)
                                </label>
                                <Input
                                  id="mentor-linkedin"
                                  value={draft.linkedinUrl ?? ""}
                                  onChange={(event) => updateDraftValue("linkedinUrl", event.target.value || undefined)}
                                  placeholder="https://www.linkedin.com/in/your-profile"
                                  className={MENTOR_FIELD_CLASS_NAME}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : null}

                      {currentStep === 7 ? (
                        <div className="space-y-5">
                          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                  Timezone
                                </div>
                                <div className="mt-2 font-display text-2xl font-semibold text-slate-950">
                                  IST
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  Saved as {draft.timezone || DEFAULT_TIMEZONE}. This schedule uses India Standard Time clearly across the app.
                                </p>
                              </div>
                              <div className="rounded-full bg-teal-100 px-4 py-2 text-sm font-semibold text-teal-800">
                                {draft.availabilitySlots.length} slots selected
                              </div>
                            </div>
                          </div>

                          <div className="overflow-x-auto">
                            <div className="min-w-[760px] rounded-[1.5rem] border border-slate-200 bg-white">
                              <div className="grid grid-cols-[90px_repeat(7,minmax(0,1fr))] border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                                <div className="px-3 py-3">Time</div>
                                {AVAILABILITY_DAYS.map((day) => (
                                  <div key={day.value} className="px-3 py-3 text-center">
                                    {day.label}
                                  </div>
                                ))}
                              </div>

                              {AVAILABILITY_SLOTS.map((slot) => (
                                <div
                                  key={slot.value}
                                  className="grid grid-cols-[90px_repeat(7,minmax(0,1fr))] border-b border-slate-100 last:border-b-0"
                                >
                                  <div className="px-3 py-3 text-sm font-medium text-slate-600">
                                    {slot.label}
                                  </div>
                                  {AVAILABILITY_DAYS.map((day) => {
                                    const availabilitySlot = {
                                      dayOfWeek: day.value,
                                      startTime: slot.value,
                                      endTime: slot.endValue,
                                    };
                                    const active = draft.availabilitySlots.some(
                                      (item) =>
                                        createAvailabilityKey(item) ===
                                        createAvailabilityKey(availabilitySlot),
                                    );

                                    return (
                                      <button
                                        key={`${day.value}-${slot.value}`}
                                        type="button"
                                        onClick={() =>
                                          toggleAvailability(day.value, slot.value, slot.endValue)
                                        }
                                        className={cn(
                                          "m-1 rounded-xl border px-2 py-3 text-sm font-medium transition",
                                          active
                                            ? "border-slate-950 bg-slate-950 text-white"
                                            : "border-slate-200 bg-white text-slate-500 hover:border-slate-950 hover:text-slate-900",
                                        )}
                                      >
                                        {active ? "Available" : ""}
                                      </button>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-sm font-semibold text-slate-900">Selected slots</div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {draft.availabilitySlots.length > 0 ? (
                                draft.availabilitySlots.map((slot) => (
                                  <span
                                    key={createAvailabilityKey(slot)}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                                  >
                                    {formatAvailabilityLabel(slot)}
                                  </span>
                                ))
                              ) : (
                                <span className="text-sm text-slate-500">
                                  Select at least 5 slots to continue.
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>

              {!isSubmitted ? (
                <CardFooter className="justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-5 sm:px-7">
                  <div>
                    {currentStep > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleBack}
                        disabled={isSubmitting}
                        className="h-12 rounded-xl border-slate-200 bg-white px-5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                      >
                        Back
                      </Button>
                    ) : null}
                  </div>

                  {currentStep < 7 ? (
                    <Button
                      type="button"
                      onClick={() => void handleNext()}
                      disabled={!canContinue}
                      className="h-12 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      Save and continue
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => void handleSubmit()}
                      disabled={!canContinue || isSubmitting}
                      className="h-12 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-900"
                    >
                      {isSubmitting ? "Submitting application..." : "Submit for verification"}
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

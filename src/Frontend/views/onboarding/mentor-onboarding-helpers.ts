/** Step metadata, validation and payload building for the mentor onboarding wizard. */

import { PRICING_POINTS, type MentorOnboardingDraft, type MentorOnboardingStep } from "@/shared/mentor-onboarding";

export type InstitutionSearchResult = {
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

export type MentorOnboardingDraftWithInstitution = MentorOnboardingDraft & {
  institutionId?: string;
};

export type SaveState = "idle" | "saving" | "saved" | "error";

type StepPersistIssues = {
  fieldErrors?: Record<string, string[] | undefined>;
  formErrors?: string[];
};

export type StepPersistResponse = {
  error?: string;
  issues?: StepPersistIssues;
  savedStep?: number;
  redirectTo?: string | null;
};

export const TOTAL_STEPS = 7;

export const MAX_HELP_TOPICS = 5;

export const EXAM_YEAR_OPTIONS = Array.from({ length: 16 }, (_, index) => new Date().getFullYear() - index);

export const MENTOR_FIELD_CLASS_NAME =
  "h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-950 shadow-sm placeholder:text-slate-400";

export const MENTOR_SELECT_CLASS_NAME =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-950 shadow-sm outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5";

export const MENTOR_TEXTAREA_CLASS_NAME =
  "w-full rounded-[1.25rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none placeholder:text-slate-400 focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5";

export function readFileAsDataUrl(file: File) {
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

export function getInitialStep(savedStep: number) {
  return Math.min(Math.max(savedStep + 1, 1), TOTAL_STEPS) as MentorOnboardingStep;
}

export function getStepTitle(step: MentorOnboardingStep) {
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

export function getStepDescription(step: MentorOnboardingStep) {
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

export function isStepValid(step: MentorOnboardingStep, draft: MentorOnboardingDraft) {
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

export function getStepPayload(step: MentorOnboardingStep, draft: MentorOnboardingDraftWithInstitution) {
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

export function getProgressPercent(step: MentorOnboardingStep) {
  return Math.round((step / TOTAL_STEPS) * 100);
}

export function getInstitutionTierBadgeClasses(tier?: string) {
  if (tier === "TIER_1") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (tier === "TIER_2") {
    return "border-teal-200 bg-teal-50 text-teal-800";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function getUserInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

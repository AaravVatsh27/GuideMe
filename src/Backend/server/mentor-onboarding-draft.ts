/** Request schema and draft helpers for the mentor onboarding API: loading the saved draft, merging steps and validating step data. */

import { Prisma, type MentorTier } from "@prisma/client";
import { z } from "zod";
import { DEFAULT_TIMEZONE } from "@/shared/constants";
import { mentorAvailabilityStepSchema, mentorCourseStepSchema, mentorExamsStepSchema, mentorHelpStepSchema, mentorInstitutionStepSchema, mentorPricingStepSchema, mentorProfileStepSchema } from "@/Backend/validations/mentor";

export const patchRequestSchema = z.object({
  step: z.number().int().min(1).max(7),
  submit: z.boolean().optional(),
  data: z.object({}).passthrough(),
});

export const MENTOR_DASHBOARD_PATH = "/dashboard/mentor";

type ExistingMentorState = {
  name: string | null;
  email: string | null;
  image: string | null;
  onboardingComplete: boolean;
  onboardingStep: number;

  mentorProfile: {
    username: string;
    institutionId: string | null;
    college: string | null;
    degree: string | null;
    branch: string | null;
    yearOfStudy: number | null;
    expectedGraduationYear: number | null;
    tier: MentorTier;
    bio: string | null;
    headline: string | null;
    examsCleared: string[];
    examYears: Prisma.JsonValue | null;
    specialisations: string[];
    priceMinPaise: number | null;
    priceMaxPaise: number | null;
    linkedinUrl: string | null;
    onboardingStep: number;
  } | null;

  availabilities: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone: string;
  }>;
};

type MentorExamEntryInput = {
  exam: string;
  year?: number | null;
};

function isJsonObject(
  value: Prisma.JsonValue | null | undefined,
): value is Prisma.JsonObject {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

export function buildUsername(
  name: string | null,
  email: string | null,
  userId: string,
) {
  const source =
    name?.trim() ||
    email?.split("@")[0] ||
    "mentor";

  const normalized = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 16);

  return `${normalized || "mentor"}_${userId.slice(0, 6)}`;
}

export function buildExistingDraft(
  existing: ExistingMentorState,
) {
  const examYears = isJsonObject(
    existing.mentorProfile?.examYears,
  )
    ? existing.mentorProfile.examYears
    : {};

  return {
    institutionId:
      existing.mentorProfile?.institutionId ??
      undefined,

    college:
      existing.mentorProfile?.college ??
      undefined,

    tier:
      existing.mentorProfile?.tier ??
      undefined,

    degree:
      existing.mentorProfile?.degree ??
      undefined,

    branch:
      existing.mentorProfile?.branch ??
      undefined,

    yearOfStudy:
      existing.mentorProfile?.yearOfStudy ??
      undefined,

    expectedGraduationYear:
      existing.mentorProfile?.expectedGraduationYear ??
      undefined,

    exams:
      existing.mentorProfile?.examsCleared.map(
        (exam) => ({
          exam,
          year:
            typeof examYears[exam] === "number"
              ? (examYears[exam] as number)
              : undefined,
        }),
      ) ?? [],

    specialisations:
      existing.mentorProfile?.specialisations ?? [],

    priceMinPaise:
      existing.mentorProfile?.priceMinPaise ??
      undefined,

    priceMaxPaise:
      existing.mentorProfile?.priceMaxPaise ??
      undefined,

    headline:
      existing.mentorProfile?.headline ??
      undefined,

    bio:
      existing.mentorProfile?.bio ??
      undefined,

    avatarUrl:
      existing.image ??
      undefined,

    linkedinUrl:
      existing.mentorProfile?.linkedinUrl ??
      undefined,

    timezone:
      existing.availabilities[0]?.timezone ??
      DEFAULT_TIMEZONE,

    availabilitySlots:
      existing.availabilities.map((slot) => ({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
  };
}

export function mergeDraft(
  existingDraft: ReturnType<typeof buildExistingDraft>,
  incoming: Record<string, unknown>,
) {
  return {
    ...existingDraft,
    ...incoming,

    exams: Array.isArray(incoming.exams)
      ? incoming.exams
      : existingDraft.exams,

    specialisations: Array.isArray(
      incoming.specialisations,
    )
      ? incoming.specialisations
      : existingDraft.specialisations,

    availabilitySlots: Array.isArray(
      incoming.availabilitySlots,
    )
      ? incoming.availabilitySlots
      : existingDraft.availabilitySlots,
  };
}

export function buildExamYears(
  exams: MentorExamEntryInput[],
) {
  const entries = exams
    .filter(
      (entry) => typeof entry.year === "number",
    )
    .map(
      (entry) =>
        [entry.exam, entry.year] as const,
    );

  return entries.length > 0
    ? (Object.fromEntries(
      entries,
    ) as Prisma.InputJsonObject)
    : Prisma.JsonNull;
}

export function getValidatedStepData(
  step: number,
  data: Record<string, unknown>,
) {
  switch (step) {
    case 1:
      return mentorInstitutionStepSchema.safeParse(
        data,
      );

    case 2:
      return mentorCourseStepSchema.safeParse(
        data,
      );

    case 3:
      return mentorExamsStepSchema.safeParse(
        data,
      );

    case 4:
      return mentorHelpStepSchema.safeParse(
        data,
      );

    case 5:
      return mentorPricingStepSchema.safeParse(
        data,
      );

    case 6:
      return mentorProfileStepSchema.safeParse(
        data,
      );

    case 7:
      return mentorAvailabilityStepSchema.safeParse(
        data,
      );

    default:
      return z.never().safeParse(data);
  }
}

import { DEFAULT_TIMEZONE, MAX_PRICE, MIN_PRICE } from "@/Backend/server/constants";
import {
  calculateFortyFiveMinutePrice,
  DEGREE_VALUES,
  EXAM_VALUES,
  HELP_TOPIC_VALUES,
  MENTOR_TIER_VALUES,
  PRICING_POINTS,
  YEAR_OF_STUDY_VALUES,
} from "@/Backend/server/mentor-onboarding";
import { sanitizeText } from "@/Backend/lib/sanitize";
import { z } from "zod";

const currentYear = new Date().getFullYear();

const mentorTierSchema = z.enum(MENTOR_TIER_VALUES);
const degreeSchema = z.enum(DEGREE_VALUES);
const examSchema = z.enum(EXAM_VALUES);
const helpTopicSchema = z.enum(HELP_TOPIC_VALUES);

const yearOfStudySchema = z
  .number()
  .int()
  .refine(
    (value) =>
      YEAR_OF_STUDY_VALUES.includes(
        value as (typeof YEAR_OF_STUDY_VALUES)[number],
      ),
    "Choose a valid year of study",
  );

const timeSlotSchema = z
  .string()
  .regex(
    /^([01]\d|2[0-3]):00$/,
    "Time must use HH:00 format",
  );

const optionalUrlSchema = z
  .union([
    z.string().trim().url("Enter a valid URL"),
    z.literal(""),
    z.null(),
  ])
  .transform((value) => value || undefined);

const optionalShortTextSchema = z
  .union([
    z.string().trim().max(120),
    z.literal(""),
    z.null(),
  ])
  .transform((value) => value || undefined);

const examEntrySchema = z.object({
  exam: examSchema,
  year: z
    .number()
    .int()
    .min(2000)
    .max(currentYear + 1)
    .optional()
    .nullable(),
});

const availabilitySlotSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: timeSlotSchema,
    endTime: timeSlotSchema,
  })
  .refine(
    (value) => value.startTime < value.endTime,
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

/**
 * STEP 1 — Institution
 *
 * institutionId is the authoritative reference to the
 * Institution directory.
 *
 * college remains temporarily for backwards compatibility
 * and manual/free-text fallback.
 *
 * tier remains MentorTier and represents mentor trust,
 * NOT InstitutionTier.
 */
export const mentorInstitutionStepSchema = z.object({
  institutionId: z
    .string()
    .uuid("Invalid institution ID")
    .optional(),

  college: z
    .string()
    .trim()
    .min(2, "College name is too short")
    .max(120)
    .transform(sanitizeText),

  tier: mentorTierSchema,
});

export const mentorCourseStepSchema = z.object({
  degree: degreeSchema,

  branch: z
    .string()
    .trim()
    .min(2, "Branch is too short")
    .max(120)
    .transform(sanitizeText),

  yearOfStudy: yearOfStudySchema,

  expectedGraduationYear: z
    .number()
    .int()
    .min(currentYear)
    .max(currentYear + 10),
});

export const mentorExamsStepSchema = z
  .object({
    exams: z
      .array(examEntrySchema)
      .max(EXAM_VALUES.length),
  })
  .refine(
    (value) =>
      new Set(
        value.exams.map(
          (entry) => entry.exam,
        ),
      ).size === value.exams.length,
    {
      message: "Duplicate exams are not allowed",
      path: ["exams"],
    },
  );

export const mentorHelpStepSchema = z
  .object({
    specialisations: z
      .array(helpTopicSchema)
      .min(1)
      .max(5),
  })
  .refine(
    (value) =>
      new Set(value.specialisations).size ===
      value.specialisations.length,
    {
      message: "Duplicate topics are not allowed",
      path: ["specialisations"],
    },
  );

export const mentorPricingStepSchema = z
  .object({
    priceMin: z
      .number()
      .int()
      .min(MIN_PRICE)
      .max(MAX_PRICE)
      .refine(
        (value) =>
          PRICING_POINTS.includes(
            value as (typeof PRICING_POINTS)[number],
          ),
        "Choose one of the supported pricing points",
      ),

    priceMax: z
      .number()
      .int()
      .min(MIN_PRICE)
      .max(999),
  })
  .refine(
    (value) =>
      value.priceMax ===
      calculateFortyFiveMinutePrice(
        value.priceMin,
      ),
    {
      message:
        "45-minute pricing must be auto-calculated from the 30-minute session",
      path: ["priceMax"],
    },
  );

export const mentorProfileStepSchema = z.object({
  headline: z
    .string()
    .trim()
    .min(10)
    .max(80)
    .transform(sanitizeText),

  bio: z
    .string()
    .trim()
    .min(150)
    .max(400)
    .transform(sanitizeText),

  avatarUrl: z
    .string()
    .trim()
    .url("Upload an avatar before continuing"),

  linkedinUrl: optionalUrlSchema.optional(),
});

export const mentorAvailabilityStepSchema = z
  .object({
    timezone: z
      .string()
      .trim()
      .min(3)
      .max(64)
      .default(DEFAULT_TIMEZONE),

    availabilitySlots: z
      .array(availabilitySlotSchema)
      .min(5)
      .max(98),
  })
  .refine(
    (value) =>
      new Set(
        value.availabilitySlots.map(
          (slot) =>
            `${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`,
        ),
      ).size ===
      value.availabilitySlots.length,
    {
      message:
        "Duplicate time slots are not allowed",
      path: ["availabilitySlots"],
    },
  );

export const mentorOnboardingSchema =
  mentorInstitutionStepSchema
    .merge(mentorCourseStepSchema)
    .merge(mentorExamsStepSchema)
    .merge(mentorHelpStepSchema)
    .merge(mentorPricingStepSchema)
    .merge(mentorProfileStepSchema)
    .merge(mentorAvailabilityStepSchema);

export const mentorProfileUpdateSchema = z
  .object({
    /**
     * New institution reference.
     */
    institutionId: z
      .string()
      .uuid("Invalid institution ID")
      .optional(),

    /**
     * Legacy institution display field.
     */
    college: optionalShortTextSchema.optional(),

    /**
     * Mentor trust tier.
     */
    tier: mentorTierSchema.optional(),

    degree: degreeSchema.optional(),

    branch:
      optionalShortTextSchema.optional(),

    yearOfStudy:
      yearOfStudySchema.optional(),

    expectedGraduationYear: z
      .number()
      .int()
      .min(currentYear)
      .max(currentYear + 10)
      .optional(),

    exams: z
      .array(examEntrySchema)
      .max(EXAM_VALUES.length)
      .optional(),

    specialisations: z
      .array(helpTopicSchema)
      .max(5)
      .optional(),

    priceMin: z
      .number()
      .int()
      .min(MIN_PRICE)
      .max(MAX_PRICE)
      .optional(),

    priceMax: z
      .number()
      .int()
      .min(MIN_PRICE)
      .max(999)
      .optional(),

    headline: z
      .string()
      .trim()
      .min(10)
      .max(80)
      .transform(sanitizeText)
      .optional(),

    bio: z
      .string()
      .trim()
      .min(150)
      .max(400)
      .transform(sanitizeText)
      .optional(),

    avatarUrl: z
      .string()
      .trim()
      .url()
      .optional(),

    introVideoUrl:
      optionalUrlSchema.optional(),

    linkedinUrl:
      optionalUrlSchema.optional(),

    timezone: z
      .string()
      .trim()
      .min(3)
      .max(64)
      .optional(),

    availabilitySlots: z
      .array(availabilitySlotSchema)
      .min(5)
      .max(98)
      .optional(),

    onboardingStep: z
      .number()
      .int()
      .min(0)
      .max(7)
      .optional(),
  })
  .refine(
    (value) =>
      Object.values(value).some(
        (field) => field !== undefined,
      ),
    "At least one field is required",
  )
  .superRefine((value, context) => {
    if (
      value.priceMin !== undefined &&
      value.priceMax !== undefined &&
      value.priceMax !==
      calculateFortyFiveMinutePrice(
        value.priceMin,
      )
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "45-minute pricing must be derived from the 30-minute price",
        path: ["priceMax"],
      });
    }

    if (
      value.exams &&
      new Set(
        value.exams.map(
          (entry) => entry.exam,
        ),
      ).size !== value.exams.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Duplicate exams are not allowed",
        path: ["exams"],
      });
    }

    if (
      value.specialisations &&
      new Set(value.specialisations).size !==
      value.specialisations.length
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Duplicate help topics are not allowed",
        path: ["specialisations"],
      });
    }
  });

export const mentorAvailabilitySchema =
  mentorAvailabilityStepSchema;

export type MentorOnboardingInput =
  z.infer<typeof mentorOnboardingSchema>;

export type MentorProfileUpdateInput =
  z.infer<typeof mentorProfileUpdateSchema>;

export type MentorAvailabilityInput =
  z.infer<typeof mentorAvailabilitySchema>;
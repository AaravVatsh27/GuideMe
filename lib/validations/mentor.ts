import { MAX_PRICE, MIN_PRICE } from "@/lib/constants";
import { z } from "zod";

const mentorTierSchema = z.enum(["RISING", "VERIFIED", "ELITE"]);
const timeSlotSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:MM format");
const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username is too short")
  .max(24, "Username is too long")
  .regex(/^[a-z0-9_]+$/, "Username can only contain lowercase letters, numbers, and underscores");
const optionalUrlSchema = z
  .union([z.string().trim().url("Enter a valid URL"), z.literal("")])
  .transform((value) => value || undefined);
const optionalShortTextSchema = z
  .union([z.string().trim().max(120), z.literal("")])
  .transform((value) => value || undefined);
const tagListSchema = z
  .array(z.string().trim().min(1).max(40))
  .max(12, "Too many values");

const mentorProfileBaseSchema = z
  .object({
    username: usernameSchema,
    college: z.string().trim().min(2).max(120),
    degree: z.string().trim().min(2).max(120),
    branch: z.string().trim().min(2).max(120),
    yearOfStudy: z.number().int().min(1).max(8),
    tier: mentorTierSchema.default("RISING"),
    headline: z.string().trim().min(10).max(120),
    bio: z.string().trim().min(80).max(1200),
    examsCleared: tagListSchema.default([]),
    specialisations: tagListSchema.min(1).max(12),
    priceMin: z.number().int().min(MIN_PRICE).max(MAX_PRICE),
    priceMax: z.number().int().min(MIN_PRICE).max(MAX_PRICE),
    linkedinUrl: optionalUrlSchema.optional(),
    introVideoUrl: optionalUrlSchema.optional(),
    isAvailable: z.boolean().default(true),
    isVerified: z.boolean().default(false),
    isActive: z.boolean().default(true),
    onboardingStep: z.number().int().min(0).default(0),
  })
  .refine((value) => value.priceMin <= value.priceMax, {
    message: "priceMin must be less than or equal to priceMax",
    path: ["priceMax"],
  });

export const mentorOnboardingSchema = mentorProfileBaseSchema;

export const mentorProfileUpdateSchema = z
  .object({
    username: usernameSchema.optional(),
    college: optionalShortTextSchema.optional(),
    degree: optionalShortTextSchema.optional(),
    branch: optionalShortTextSchema.optional(),
    yearOfStudy: z.number().int().min(1).max(8).optional(),
    tier: mentorTierSchema.optional(),
    headline: optionalShortTextSchema.optional(),
    bio: z.string().trim().min(80).max(1200).optional(),
    examsCleared: tagListSchema.optional(),
    specialisations: tagListSchema.optional(),
    priceMin: z.number().int().min(MIN_PRICE).max(MAX_PRICE).optional(),
    priceMax: z.number().int().min(MIN_PRICE).max(MAX_PRICE).optional(),
    linkedinUrl: optionalUrlSchema.optional(),
    introVideoUrl: optionalUrlSchema.optional(),
    isAvailable: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    isActive: z.boolean().optional(),
    onboardingStep: z.number().int().min(0).optional(),
  })
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "At least one field is required",
  )
  .refine(
    (value) =>
      value.priceMin === undefined ||
      value.priceMax === undefined ||
      value.priceMin <= value.priceMax,
    {
      message: "priceMin must be less than or equal to priceMax",
      path: ["priceMax"],
    },
  );

export const mentorAvailabilitySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: timeSlotSchema,
    endTime: timeSlotSchema,
    isRecurring: z.boolean().default(true),
    specificDate: z.coerce.date().optional(),
    timezone: z.string().trim().min(3).max(64),
    isActive: z.boolean().default(true),
  })
  .refine((value) => value.startTime < value.endTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  })
  .refine(
    (value) => value.isRecurring || value.specificDate instanceof Date,
    {
      message: "specificDate is required for non-recurring slots",
      path: ["specificDate"],
    },
  );

export type MentorOnboardingInput = z.infer<typeof mentorOnboardingSchema>;
export type MentorProfileUpdateInput = z.infer<typeof mentorProfileUpdateSchema>;
export type MentorAvailabilityInput = z.infer<typeof mentorAvailabilitySchema>;

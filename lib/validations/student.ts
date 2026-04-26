import { z } from "zod";

const classSchema = z.enum([
  "CLASS_10",
  "CLASS_11",
  "CLASS_12",
  "UG_1",
  "UG_2",
  "UG_3",
  "UG_4",
]);

const boardSchema = z.enum(["CBSE", "ICSE", "STATE", "INTERNATIONAL"]);
const streamSchema = z.enum([
  "SCIENCE_PCM",
  "SCIENCE_PCB",
  "COMMERCE",
  "ARTS",
  "ENGINEERING",
  "MEDICAL",
  "LAW",
  "MANAGEMENT",
  "UNDECIDED",
]);
const targetExamSchema = z.enum([
  "JEE",
  "NEET",
  "CA_FOUNDATION",
  "CLAT",
  "GATE",
  "CAT",
  "GRE",
  "GMAT",
  "UPSC",
  "NDA",
  "OTHER",
  "UNDECIDED",
]);
const confusionTypeSchema = z.enum([
  "STREAM_SELECTION",
  "EXAM_CHOICE",
  "COLLEGE_SELECTION",
  "CAREER_DIRECTION",
  "SUBJECT_COMBINATION",
  "COACHING_SELECTION",
]);
const parentalPressureSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

const optionalTextSchema = z
  .union([z.string().trim().max(80), z.literal("")])
  .transform((value) => value || undefined);

const studentProfileFields = {
  class: classSchema,
  board: boardSchema,
  stream: streamSchema,
  targetExam: targetExamSchema,
  confusionType: confusionTypeSchema,
  city: optionalTextSchema.optional(),
  state: optionalTextSchema.optional(),
  languagePreference: optionalTextSchema.optional(),
  parentalPressure: parentalPressureSchema,
} as const;

export const studentOnboardingSchema = z.object(studentProfileFields);

export const studentProfileUpdateSchema = z
  .object({
    class: classSchema.optional(),
    board: boardSchema.optional(),
    stream: streamSchema.optional(),
    targetExam: targetExamSchema.optional(),
    confusionType: confusionTypeSchema.optional(),
    city: optionalTextSchema.optional(),
    state: optionalTextSchema.optional(),
    languagePreference: optionalTextSchema.optional(),
    parentalPressure: parentalPressureSchema.optional(),
  })
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "At least one field is required",
  );

export type StudentOnboardingInput = z.infer<typeof studentOnboardingSchema>;
export type StudentProfileUpdateInput = z.infer<typeof studentProfileUpdateSchema>;

import { sanitizeText } from "@/Backend/lib/sanitize";
import { z } from "zod";

import {
  BOARD_VALUES,
  CONFUSION_TYPE_VALUES,
  getAllowedStreamValues,
  getConfusionOptions,
  INDIAN_STATE_VALUES,
  isUGClass,
  LANGUAGE_VALUES,
  requiresBoard,
  STREAM_VALUES,
  STUDENT_CLASS_VALUES,
} from "@/Backend/server/student-onboarding";

const classSchema = z.enum(STUDENT_CLASS_VALUES);
const boardSchema = z.enum(BOARD_VALUES);
const streamSchema = z.enum(STREAM_VALUES);
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
const confusionTypeSchema = z.enum(CONFUSION_TYPE_VALUES);
const parentalPressureSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);
const languageSchema = z.enum(LANGUAGE_VALUES);
const stateSchema = z.enum(INDIAN_STATE_VALUES);
const citySchema = z
  .string()
  .trim()
  .min(2, "Enter your city")
  .max(80, "City is too long")
  .transform(sanitizeText);
const optionalTextSchema = z
  .union([z.string().trim().max(80), z.literal(""), z.null()])
  .transform((value) => value || undefined);
const confusionTypesSchema = z
  .array(confusionTypeSchema)
  .min(1, "Select at least one area of confusion")
  .max(3, "Select up to 3 areas")
  .refine(
    (value) => new Set(value).size === value.length,
    "Duplicate confusion tags are not allowed",
  );

function validateStudentBoard(
  value: {
    class: z.infer<typeof classSchema>;
    board?: z.infer<typeof boardSchema>;
  },
  context: z.RefinementCtx,
) {
  if (requiresBoard(value.class) && !value.board) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["board"],
      message: "Board is required for school students",
    });
  }

  if (!requiresBoard(value.class) && value.board) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["board"],
      message: "Board should only be set for school students",
    });
  }
}

function validateStudentStream(
  value: {
    class: z.infer<typeof classSchema>;
    stream: z.infer<typeof streamSchema>;
  },
  context: z.RefinementCtx,
) {
  if (!getAllowedStreamValues(value.class).includes(value.stream)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["stream"],
      message: "Choose a valid stream or focus for your current stage",
    });
  }
}

function validateStudentConfusions(
  value: {
    class: z.infer<typeof classSchema>;
    confusionTypes: z.infer<typeof confusionTypesSchema>;
  },
  context: z.RefinementCtx,
) {
  const allowedConfusions = new Set(
    getConfusionOptions(value.class).map((option) => option.value),
  );

  if (value.confusionTypes.some((confusion) => !allowedConfusions.has(confusion))) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confusionTypes"],
      message: "Choose valid confusion areas for your current stage",
    });
  }

  if (!isUGClass(value.class) && value.confusionTypes.includes("POST_GRADUATION_PATH")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["confusionTypes"],
      message: "Post-graduation confusion only applies to UG students",
    });
  }
}

export const studentClassStepSchema = z.object({
  class: classSchema,
});

export const studentBoardStepSchema = z
  .object({
    class: classSchema,
    board: boardSchema.optional(),
  })
  .superRefine(validateStudentBoard);

export const studentStreamStepSchema = z
  .object({
    class: classSchema,
    stream: streamSchema,
  })
  .superRefine(validateStudentStream);

export const studentConfusionsStepSchema = z
  .object({
    class: classSchema,
    confusionTypes: confusionTypesSchema,
  })
  .superRefine(validateStudentConfusions);

export const studentOnboardingSchema = z
  .object({
    class: classSchema,
    board: boardSchema.optional(),
    stream: streamSchema,
    confusionTypes: confusionTypesSchema,
    city: citySchema,
    state: stateSchema,
    languagePreference: languageSchema,
  })
  .superRefine((value, context) => {
    validateStudentBoard(value, context);
    validateStudentStream(value, context);
    validateStudentConfusions(value, context);
  });

export const studentProfileUpdateSchema = z
  .object({
    class: classSchema.optional(),
    board: boardSchema.optional(),
    stream: streamSchema.optional(),
    targetExam: targetExamSchema.optional(),
    confusionType: confusionTypeSchema.optional(),
    confusionTypes: z.array(confusionTypeSchema).max(3).optional(),
    city: optionalTextSchema.optional(),
    state: optionalTextSchema.optional(),
    languagePreference: languageSchema.optional(),
    parentalPressure: parentalPressureSchema.optional(),
  })
  .refine(
    (value) => Object.values(value).some((field) => field !== undefined),
    "At least one field is required",
  );

export type StudentOnboardingInput = z.infer<typeof studentOnboardingSchema>;
export type StudentProfileUpdateInput = z.infer<typeof studentProfileUpdateSchema>;

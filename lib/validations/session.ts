import {
  FREE_INTRO_DURATION,
  MAX_PRICE,
  MIN_PRICE,
  SESSION_DURATIONS,
} from "@/lib/constants";
import { z } from "zod";

const paidDurationSchema = z.union([
  z.literal(SESSION_DURATIONS[0]),
  z.literal(SESSION_DURATIONS[1]),
]);

export const createSessionSchema = z
  .object({
    mentorId: z.string().uuid("mentorId must be a valid UUID"),
    availabilityId: z.string().uuid("availabilityId must be a valid UUID").optional(),
    type: z.enum(["INTRO", "PAID"]),
    scheduledAt: z.coerce.date(),
    durationMinutes: z.number().int(),
    price: z.number().int().min(0).max(MAX_PRICE),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((value) => value.scheduledAt.getTime() > Date.now(), {
    message: "scheduledAt must be in the future",
    path: ["scheduledAt"],
  })
  .refine(
    (value) =>
      value.type === "INTRO"
        ? value.durationMinutes === FREE_INTRO_DURATION && value.price === 0
        : paidDurationSchema.safeParse(value.durationMinutes).success &&
          value.price >= MIN_PRICE,
    {
      message:
        "Intro sessions must be free 10-minute calls and paid sessions must use a valid duration with a valid price",
      path: ["durationMinutes"],
    },
  );

export const cancelSessionSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
  reason: z.string().trim().min(10).max(280),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CancelSessionInput = z.infer<typeof cancelSessionSchema>;

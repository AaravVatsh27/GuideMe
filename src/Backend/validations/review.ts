import { sanitizeText } from "@/Backend/lib/sanitize";
import { z } from "zod";

export const createReviewSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().trim().max(1500).transform(sanitizeText).optional(),
  tags: z.array(z.string().trim().min(1).max(32)).max(8).default([]),
  wouldRebook: z.boolean(),
  isPublic: z.boolean().default(true),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;

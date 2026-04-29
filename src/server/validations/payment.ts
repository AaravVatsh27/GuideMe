import { DEFAULT_CURRENCY } from "@/server/constants";
import { z } from "zod";

const orderNotesSchema = z.record(z.string(), z.union([z.string(), z.number()]));

export const createOrderSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
  amount: z.number().int().positive("amount must be positive"),
  currency: z.string().trim().length(3).default(DEFAULT_CURRENCY),
  receipt: z.string().trim().min(3).max(40),
  notes: orderNotesSchema.optional(),
});

export const verifyPaymentSchema = z.object({
  orderId: z.string().trim().min(1),
  paymentId: z.string().trim().min(1),
  signature: z.string().trim().min(1),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;

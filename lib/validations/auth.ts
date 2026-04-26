import { z } from "zod";

const studentOrMentorRoleSchema = z.enum(["STUDENT", "MENTOR"]);

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid Indian mobile number");

const optionalPhoneSchema = z
  .union([phoneSchema, z.literal("")])
  .transform((value) => value || undefined);

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100, "Name is too long"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: optionalPhoneSchema.optional(),
  role: studentOrMentorRoleSchema.default("STUDENT"),
  acceptedTerms: z.boolean().refine((value) => value, {
    message: "You must accept the terms to continue",
  }),
});

export const signInSchema = z.object({
  provider: z.literal("google").default("google"),
  redirectTo: z
    .string()
    .trim()
    .refine((value) => value.startsWith("/"), "Redirect must be a relative path")
    .optional(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

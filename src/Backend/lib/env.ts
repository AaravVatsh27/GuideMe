import { z } from "zod";

/**
 * Checks the server's environment variables once at startup (see instrumentation.ts),
 * so a missing or malformed setting stops the server with a clear message instead of
 * failing later in the middle of a booking or a payment.
 */

const LOCAL_APP_URL = "http://localhost:3000";

// Treat empty strings (e.g. `KEY=` in .env files) as unset.
const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);
const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().url().optional(),
);

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().trim().url(),
    NEXT_PUBLIC_APP_URL: optionalUrl,
    AUTH_URL: optionalUrl,
    AUTH_SECRET: optionalString,
    NEXTAUTH_SECRET: optionalString,
    AUTH_GOOGLE_ID: optionalString,
    AUTH_GOOGLE_SECRET: optionalString,
    RESEND_API_KEY: optionalString,
    EMAIL_FROM: optionalString,
    RAZORPAY_KEY_ID: optionalString,
    RAZORPAY_KEY_SECRET: optionalString,
    RAZORPAY_WEBHOOK_SECRET: optionalString,
    DAILY_API_KEY: optionalString,
    NEXT_PUBLIC_DAILY_DOMAIN: optionalString,
    DAILY_WEBHOOK_SECRET: optionalString,
    UPSTASH_REDIS_REST_URL: optionalUrl,
    UPSTASH_REDIS_REST_TOKEN: optionalString,
    CRON_SECRET: optionalString,
  })
  .superRefine((env, context) => {
    const require = (key: keyof typeof env, reason: string) => {
      if (!env[key]) {
        context.addIssue({ code: "custom", path: [key], message: `is required ${reason}` });
      }
    };
    const requireTogether = (keys: Array<keyof typeof env>) => {
      if (keys.some((key) => env[key]) && !keys.every((key) => env[key])) {
        for (const key of keys.filter((k) => !env[k])) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: `must be set together with ${keys.filter((k) => k !== key).join(", ")}`,
          });
        }
      }
    };

    if (!env.AUTH_SECRET && !env.NEXTAUTH_SECRET) {
      context.addIssue({ code: "custom", path: ["AUTH_SECRET"], message: "is required (or NEXTAUTH_SECRET)" });
    }

    requireTogether(["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"]);
    requireTogether(["RESEND_API_KEY", "EMAIL_FROM"]);
    requireTogether(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"]);
    requireTogether(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]);
    requireTogether(["DAILY_API_KEY", "NEXT_PUBLIC_DAILY_DOMAIN"]);

    if (env.NODE_ENV === "production") {
      const reason = "in production";
      require("NEXT_PUBLIC_APP_URL", `${reason} (used in emails and payment links)`);
      require("RAZORPAY_KEY_ID", reason);
      require("RAZORPAY_KEY_SECRET", reason);
      require("RAZORPAY_WEBHOOK_SECRET", reason);
      require("DAILY_API_KEY", reason);
      require("NEXT_PUBLIC_DAILY_DOMAIN", reason);
      require("CRON_SECRET", `${reason} (protects the scheduled jobs)`);
    }
  });

export type ServerEnv = z.infer<typeof envSchema>;

let validated: ServerEnv | undefined;

/** Validates process.env and throws one error listing every problem. */
export function validateEnv(): ServerEnv {
  if (validated) {
    return validated;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")} ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${problems}`);
  }

  validated = result.data;
  return validated;
}

/**
 * The public base URL of the app, used for links in emails and redirects.
 * Falls back to localhost only outside production.
 */
export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.AUTH_URL?.trim();

  if (url) {
    return url.replace(/\/+$/, "");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_APP_URL is not set");
  }

  return LOCAL_APP_URL;
}

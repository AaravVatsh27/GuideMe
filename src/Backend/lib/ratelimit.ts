import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { log } from "@/Backend/lib/logger";

/**
 * Lazy singleton — when Upstash env vars are absent, limiters fall back to a per-process
 * in-memory counter so limits still apply (per instance) instead of being silently disabled.
 * Each limiter is created once per process.
 */

export type RateLimiter = {
  limit(identifier: string): Promise<{ success: boolean; limit: number; reset: number }>;
};

type Window = `${number} ${"ms" | "s" | "m" | "h" | "d"}`;

let redis: Redis | null | undefined;
let warnedAboutMemoryFallback = false;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = null;
    return null;
  }

  redis = Redis.fromEnv();
  return redis;
}

const WINDOW_UNIT_MS = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 } as const;

function windowToMs(window: Window) {
  const [amount, unit] = window.split(" ") as [string, keyof typeof WINDOW_UNIT_MS];
  return Number(amount) * WINDOW_UNIT_MS[unit];
}

function createMemoryLimiter(tokens: number, window: Window): RateLimiter {
  const windowMs = windowToMs(window);
  const buckets = new Map<string, { count: number; reset: number }>();

  return {
    async limit(identifier) {
      const now = Date.now();

      if (buckets.size > 10_000) {
        buckets.forEach((bucket, key) => {
          if (bucket.reset <= now) buckets.delete(key);
        });
      }

      let bucket = buckets.get(identifier);

      if (!bucket || bucket.reset <= now) {
        bucket = { count: 0, reset: now + windowMs };
        buckets.set(identifier, bucket);
      }

      bucket.count += 1;

      return { success: bucket.count <= tokens, limit: tokens, reset: bucket.reset };
    },
  };
}

function makeLimiter(tokens: number, window: Window, prefix: string): RateLimiter {
  const r = getRedis();

  if (!r) {
    if (process.env.NODE_ENV === "production" && !warnedAboutMemoryFallback) {
      warnedAboutMemoryFallback = true;
      log.warn("Upstash Redis is not configured; rate limits are per-instance only", {
        requestId: "system",
        route: "ratelimit",
      });
    }

    return createMemoryLimiter(tokens, window);
  }

  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(tokens, window),
    prefix: `${process.env.RATE_LIMIT_PREFIX ?? "guideme"}:rl:${prefix}`,
    analytics: false,
  });
}

/**
 * 5 requests per 15 minutes per IP — auth routes (/api/auth/*)
 */
export const authLimiter = makeLimiter(5, "15 m", "auth");

/**
 * 5 attempts per 15 minutes — admin password sign-in, applied per email and per IP
 */
export const adminLoginLimiter = makeLimiter(5, "15 m", "admin-login");

/**
 * 10 sign-in requests (magic link or OAuth start) per 15 minutes per IP
 */
export const signInIpLimiter = makeLimiter(10, "15 m", "signin-ip");

/**
 * 5 magic-link emails per hour per email address
 */
export const signInEmailLimiter = makeLimiter(5, "1 h", "signin-email");

/**
 * 30 requests per minute per user — mentor search (/api/mentors GET)
 */
export const searchLimiter = makeLimiter(30, "1 m", "search");

/**
 * 10 requests per hour per user — session booking (/api/sessions POST)
 */
export const bookingLimiter = makeLimiter(10, "1 h", "booking");

/**
 * 5 requests per hour per user — payment routes (/api/payment/*)
 */
export const paymentLimiter = makeLimiter(5, "1 h", "payment");

/**
 * 100 requests per minute per user — all other authenticated routes
 */
export const generalLimiter = makeLimiter(100, "1 m", "general");

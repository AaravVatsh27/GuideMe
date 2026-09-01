import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Lazy singleton — returns null when Upstash env vars are absent so local dev
 * without Redis still works. Each limiter is created once per process.
 */

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = null;
    return null;
  }

  redis = Redis.fromEnv();
  return redis;
}

function makeLimiter(
  tokens: number,
  window: `${number} ${"ms" | "s" | "m" | "h" | "d"}`,
  prefix: string,
): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;

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

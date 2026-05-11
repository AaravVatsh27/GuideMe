import { getRedis, deleteRedisKeysByPattern } from "@/server/redis";
import { log } from "@/lib/logger";

export const cacheTtl = {
  mentorProfile: 60 * 60,
  searchResults: 60 * 5,
  matchingResults: 60 * 60 * 24,
  mentorAvailability: 15 * 60,
  sessionDetails: 5 * 60,
  adminOverviewStats: 5 * 60,
} as const;

export const cacheKeys = {
  mentorProfile: (username: string) => `mentor:profile:${username}`,
  search: (paramsHash: string) => `search:${paramsHash}`,
  searchPattern: "search:*",
  matching: (studentId: string) => `matching:${studentId}`,
  matchingPattern: "matching:*",
  availability: (mentorId: string, date: string) => `availability:${mentorId}:${date}`,
  availabilityPattern: (mentorId: string) => `availability:${mentorId}:*`,
  session: (sessionId: string) => `session:${sessionId}`,
  adminStats: "admin:stats",
} as const;

/**
 * Retrieves a value from the cache.
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;

  try {
    const cached = await redis.get<T>(key);
    return cached;
  } catch (error) {
    log.error("Cache get failed", error, {
      requestId: "system",
      route: "cache",
      key,
    });
    return null;
  }
}

/**
 * Sets a value in the cache with a TTL.
 */
export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    log.error("Cache set failed", error, {
      requestId: "system",
      route: "cache",
      key,
      ttlSeconds,
    });
  }
}

/**
 * Deletes a specific key from the cache.
 */
export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    await redis.del(key);
  } catch (error) {
    log.error("Cache delete failed", error, {
      requestId: "system",
      route: "cache",
      key,
    });
  }
}

/**
 * Deletes all keys matching a pattern.
 */
export async function cacheDelPattern(pattern: string): Promise<void> {
  try {
    await deleteRedisKeysByPattern(pattern);
  } catch (error) {
    log.error("Cache pattern delete failed", error, {
      requestId: "system",
      route: "cache",
      pattern,
    });
  }
}

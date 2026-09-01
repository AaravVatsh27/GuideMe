import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;

export const REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX ?? "guideme";

export function getRedis(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = null;
    return redisClient;
  }

  redisClient = Redis.fromEnv();
  return redisClient;
}

export async function deleteRedisKeysByPattern(pattern: string): Promise<number> {
  const redis = getRedis();

  if (!redis) {
    return 0;
  }

  const keys: string[] = [];
  let cursor = "0";

  do {
    const [nextCursor, batch] = await redis.scan(cursor, {
      match: pattern,
      count: 200,
    });

    cursor = nextCursor;
    keys.push(...batch);
  } while (cursor !== "0");

  if (keys.length === 0) {
    return 0;
  }

  return redis.del(...keys);
}

export function redisKey(...parts: string[]): string {
  return [REDIS_KEY_PREFIX, ...parts].join(":");
}

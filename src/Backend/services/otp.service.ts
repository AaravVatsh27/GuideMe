import {
  MAX_OTP_ATTEMPTS,
  MAX_OTP_PER_HOUR,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
} from "@/constants/verification";
import { getRedis, redisKey } from "@/Backend/lib/redis";
import { hashOtp, safeCompareHex, sha256 } from "@/Backend/lib/hash";
import { generateOTP, isValidOtp, normalizeOtp } from "@/Backend/lib/otp";

const OTP_KEY_PREFIX = "verification:email:otp";
const OTP_COOLDOWN_PREFIX = "verification:email:cooldown";
const OTP_SENDS_PREFIX = "verification:email:sends";
const SEND_RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

export const OTP_PURPOSE = {
  COLLEGE_EMAIL_VERIFICATION: "college-email-verification",
} as const;

export type OtpPurpose = (typeof OTP_PURPOSE)[keyof typeof OTP_PURPOSE];

type StoredOtpChallenge = {
  email: string;
  purpose: OtpPurpose;
  otpHash: string;
  attempts: number;
  createdAt: string;
  expiresAt: string;
};

export type CreateOtpChallengeInput = {
  email: string;
  purpose?: OtpPurpose;
};

export type CreateOtpChallengeResult =
  | {
      ok: true;
      email: string;
      otp: string;
      expiresAt: Date;
      resendAvailableAt: Date;
    }
  | {
      ok: false;
      reason: "redis_unavailable" | "cooldown" | "send_rate_limited";
      retryAfterSeconds?: number;
    };

export type VerifyOtpChallengeInput = {
  email: string;
  otp: string;
  purpose?: OtpPurpose;
};

export type VerifyOtpChallengeResult =
  | {
      ok: true;
      email: string;
      purpose: OtpPurpose;
    }
  | {
      ok: false;
      reason: "redis_unavailable" | "expired" | "invalid_otp" | "max_attempts_exceeded";
      remainingAttempts?: number;
    };

export type OtpRateLimitState = {
  email: string;
  cooldownSeconds: number;
  hourlySendWindowSeconds: number;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function emailKeyPart(email: string): string {
  return sha256(email);
}

function otpKey(email: string): string {
  return redisKey(OTP_KEY_PREFIX, emailKeyPart(email));
}

function cooldownKey(email: string): string {
  return redisKey(OTP_COOLDOWN_PREFIX, emailKeyPart(email));
}

function sendsKey(email: string): string {
  return redisKey(OTP_SENDS_PREFIX, emailKeyPart(email));
}

async function getPositiveTtlSeconds(key: string): Promise<number> {
  const redis = getRedis();

  if (!redis) {
    return 0;
  }

  const ttl = await redis.ttl(key);
  return ttl > 0 ? ttl : 0;
}

async function incrementHourlySendCount(email: string): Promise<number> {
  const redis = getRedis();

  if (!redis) {
    return 0;
  }

  const key = sendsKey(email);
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, SEND_RATE_LIMIT_WINDOW_SECONDS);
  }

  return count;
}

async function getHourlySendCount(email: string): Promise<number> {
  const redis = getRedis();

  if (!redis) {
    return 0;
  }

  return (await redis.get<number>(sendsKey(email))) ?? 0;
}

export async function createOtpChallenge({
  email,
  purpose = OTP_PURPOSE.COLLEGE_EMAIL_VERIFICATION,
}: CreateOtpChallengeInput): Promise<CreateOtpChallengeResult> {
  const redis = getRedis();

  if (!redis) {
    return { ok: false, reason: "redis_unavailable" };
  }

  const normalizedEmail = normalizeEmail(email);
  const existingCooldownSeconds = await getPositiveTtlSeconds(cooldownKey(normalizedEmail));

  if (existingCooldownSeconds > 0) {
    return {
      ok: false,
      reason: "cooldown",
      retryAfterSeconds: existingCooldownSeconds,
    };
  }

  const currentSendCount = await getHourlySendCount(normalizedEmail);

  if (currentSendCount >= MAX_OTP_PER_HOUR) {
    return {
      ok: false,
      reason: "send_rate_limited",
      retryAfterSeconds: await getPositiveTtlSeconds(sendsKey(normalizedEmail)),
    };
  }

  const cooldownSet = await redis.set(cooldownKey(normalizedEmail), "1", {
    ex: OTP_RESEND_COOLDOWN_SECONDS,
    nx: true,
  });

  if (cooldownSet !== "OK") {
    return {
      ok: false,
      reason: "cooldown",
      retryAfterSeconds: await getPositiveTtlSeconds(cooldownKey(normalizedEmail)),
    };
  }

  await incrementHourlySendCount(normalizedEmail);

  const otp = generateOTP();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1000);
  const challenge: StoredOtpChallenge = {
    email: normalizedEmail,
    purpose,
    otpHash: hashOtp({ email: normalizedEmail, otp, purpose }),
    attempts: 0,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  await redis.set(otpKey(normalizedEmail), challenge, { ex: OTP_TTL_SECONDS });

  return {
    ok: true,
    email: normalizedEmail,
    otp,
    expiresAt,
    resendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_SECONDS * 1000),
  };
}

export async function verifyOtpChallenge({
  email,
  otp,
  purpose = OTP_PURPOSE.COLLEGE_EMAIL_VERIFICATION,
}: VerifyOtpChallengeInput): Promise<VerifyOtpChallengeResult> {
  const redis = getRedis();

  if (!redis) {
    return { ok: false, reason: "redis_unavailable" };
  }

  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = normalizeOtp(otp);

  if (!isValidOtp(normalizedOtp)) {
    return {
      ok: false,
      reason: "invalid_otp",
      remainingAttempts: MAX_OTP_ATTEMPTS,
    };
  }

  const key = otpKey(normalizedEmail);
  const challenge = await redis.get<StoredOtpChallenge>(key);

  if (!challenge || challenge.purpose !== purpose) {
    return { ok: false, reason: "expired" };
  }

  if (challenge.attempts >= MAX_OTP_ATTEMPTS) {
    await redis.del(key);
    return { ok: false, reason: "max_attempts_exceeded", remainingAttempts: 0 };
  }

  const candidateHash = hashOtp({ email: normalizedEmail, otp: normalizedOtp, purpose });

  if (safeCompareHex(candidateHash, challenge.otpHash)) {
    await redis.del(key);
    return {
      ok: true,
      email: normalizedEmail,
      purpose,
    };
  }

  const attempts = challenge.attempts + 1;
  const remainingAttempts = Math.max(MAX_OTP_ATTEMPTS - attempts, 0);

  if (attempts >= MAX_OTP_ATTEMPTS) {
    await redis.del(key);
    return {
      ok: false,
      reason: "max_attempts_exceeded",
      remainingAttempts: 0,
    };
  }

  const ttl = await getPositiveTtlSeconds(key);

  if (ttl <= 0) {
    await redis.del(key);
    return { ok: false, reason: "expired" };
  }

  await redis.set(
    key,
    {
      ...challenge,
      attempts,
    },
    { ex: ttl },
  );

  return {
    ok: false,
    reason: "invalid_otp",
    remainingAttempts,
  };
}

export async function invalidateOtpChallenge(email: string): Promise<void> {
  const redis = getRedis();

  if (!redis) {
    return;
  }

  await redis.del(otpKey(normalizeEmail(email)));
}

export async function getOtpRateLimitState(email: string): Promise<OtpRateLimitState> {
  const normalizedEmail = normalizeEmail(email);

  return {
    email: normalizedEmail,
    cooldownSeconds: await getPositiveTtlSeconds(cooldownKey(normalizedEmail)),
    hourlySendWindowSeconds: await getPositiveTtlSeconds(sendsKey(normalizedEmail)),
  };
}

export const otpService = {
  generate: createOtpChallenge,
  store: createOtpChallenge,
  verify: verifyOtpChallenge,
  invalidate: invalidateOtpChallenge,
  getRateLimitState: getOtpRateLimitState,
};

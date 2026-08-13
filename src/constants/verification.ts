export const OTP_LENGTH = 6;

export const OTP_TTL_SECONDS = 10 * 60;

export const MAX_OTP_ATTEMPTS = 3;

export const MAX_OTP_PER_HOUR = 3;

export const OTP_RESEND_COOLDOWN_SECONDS = 60;

export const TRUST_SCORE = {
  LINKEDIN: 20,
  COLLEGE_EMAIL: 35,
  DIGILOCKER: 50,
  DEGREE: 25,
} as const;

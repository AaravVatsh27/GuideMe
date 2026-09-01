import { randomInt } from "crypto";

import { OTP_LENGTH } from "@/constants/verification";

const OTP_DIGITS = "0123456789";

export function normalizeOtp(otp: string): string {
  return otp.trim();
}

export function isValidOtp(otp: string, length = OTP_LENGTH): boolean {
  return new RegExp(`^\\d{${length}}$`).test(normalizeOtp(otp));
}

export function generateOTP(length = OTP_LENGTH): string {
  let otp = "";

  for (let i = 0; i < length; i++) {
    otp += OTP_DIGITS[randomInt(0, OTP_DIGITS.length)];
  }

  return otp;
}

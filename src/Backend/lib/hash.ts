import { createHash, createHmac, timingSafeEqual } from "crypto";

function getOtpHashSecret(): string {
  const secret = process.env.OTP_HASH_SECRET ?? process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("Missing OTP hash secret");
  }

  return secret;
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashOtp(input: { email: string; otp: string; purpose: string }): string {
  return createHmac("sha256", getOtpHashSecret())
    .update(input.purpose)
    .update(":")
    .update(input.email)
    .update(":")
    .update(input.otp)
    .digest("hex");
}

export function safeCompareHex(left: string, right: string): boolean {
  if (!/^[0-9a-f]+$/i.test(left) || !/^[0-9a-f]+$/i.test(right)) {
    return false;
  }

  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

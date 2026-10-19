import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/Backend/server/db";
import { OTP_TTL_SECONDS } from "@/constants/verification";
import { getRedis } from "@/Backend/lib/redis";
import { isVerifiableInstitutionalEmail, resolveCollegeFromEmail } from "@/Backend/services/college.service";
import { sendCollegeVerificationOtp } from "@/Backend/services/email.service";
import { OTP_PURPOSE, createOtpChallenge, invalidateOtpChallenge } from "@/Backend/services/otp.service";
import { defineRoute } from "@/Backend/lib/define-route";
import { apiErrorResponse } from "@/Backend/lib/api-helpers";

const SEND_LIMIT = 3;
const SEND_WINDOW_SECONDS = 60 * 60;

const sendEmailVerificationSchema = z.object({
  email: z.string().trim().pipe(z.email()),
});

async function consumeMentorSendLimit(mentorId: string) {
  const redis = getRedis();

  if (!redis) {
    return { ok: true as const };
  }

  const key = `ratelimit:college-email-send:${mentorId}`;
  const [count, ttl] = await redis.eval<[string], [number, number]>(
    `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("TTL", KEYS[1])
return { count, ttl }
`,
    [key],
    [String(SEND_WINDOW_SECONDS)],
  );

  if (count > SEND_LIMIT) {
    return {
      ok: false as const,
      retryAfterSeconds: ttl > 0 ? ttl : SEND_WINDOW_SECONDS,
    };
  }

  return { ok: true as const };
}

export const POST = defineRoute(
  { roles: ["MENTOR"], forbiddenMessage: "Only mentors can verify college email." },
  async (request: Request, _context, { session }) => {
  const mentorId = session.user.id;
  const payload = await request.json().catch(() => null);
  const parsed = sendEmailVerificationSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Please enter your institutional email address.", 400);
  }

  const email = parsed.data.email.trim().toLowerCase();
  const college = await resolveCollegeFromEmail(email);

  if (!college || !isVerifiableInstitutionalEmail(email, college)) {
    return apiErrorResponse("Please enter your institutional email address.", 400);
  }

  const claimedByAnotherMentor = await db.mentorProfile.findFirst({
    where: {
      verifiedCollegeEmail: email,
      NOT: { userId: mentorId },
    },
    select: { userId: true },
  });

  if (claimedByAnotherMentor) {
    return apiErrorResponse("This college email is already verified on another account.", 409);
  }

  const mentorLimit = await consumeMentorSendLimit(mentorId);

  if (!mentorLimit.ok) {
    return apiErrorResponse("Too many verification codes requested. Please try again later.", 429, undefined, { headers: {
          "Retry-After": String(mentorLimit.retryAfterSeconds),
        } });
  }

  const challenge = await createOtpChallenge({
    email,
    purpose: OTP_PURPOSE.COLLEGE_EMAIL_VERIFICATION,
    subjectId: mentorId,
  });

  if (!challenge.ok) {
    const retryAfterSeconds = challenge.retryAfterSeconds ?? SEND_WINDOW_SECONDS;
    const status = challenge.reason === "redis_unavailable" ? 503 : 429;

    return apiErrorResponse(status === 503
            ? "Verification is temporarily unavailable. Please try again later."
            : "Too many verification codes requested. Please try again later.", status, undefined, { headers: status === 429 ? { "Retry-After": String(retryAfterSeconds) } : undefined });
  }

  try {
    await sendCollegeVerificationOtp({
      email: challenge.email,
      otp: challenge.otp,
      collegeName: college?.recognized ? college.collegeName : null,
      expiresInMinutes: Math.ceil(OTP_TTL_SECONDS / 60),
    });
  } catch (error) {
    await invalidateOtpChallenge(challenge.email);
    throw error;
  }

  return NextResponse.json({
    success: true,
    message: "A verification code has been sent.",
  });
},
  "/api/v1/verification/email/send",
);

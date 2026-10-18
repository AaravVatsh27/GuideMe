import { MentorTier, VerificationEvidenceType, VerificationProvider, VerificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/Backend/server/db";
import { isVerifiableInstitutionalEmail, resolveCollegeFromEmail } from "@/Backend/services/college.service";
import { OTP_PURPOSE, verifyOtpChallenge } from "@/Backend/services/otp.service";
import { defineRoute } from "@/Backend/lib/define-route";
import { apiErrorResponse } from "@/Backend/lib/api-helpers";

const verifyEmailSchema = z.object({
  email: z.string().trim().email(),
  otp: z.string().trim().regex(/^\d{6}$/),
});

const TIER_RANK: Record<MentorTier, number> = {
  RISING: 0,
  VERIFIED: 1,
  ELITE: 2,
};

function shouldUpgradeTier(currentTier: MentorTier | undefined, verifiedTier: MentorTier | null) {
  if (!currentTier || !verifiedTier) {
    return false;
  }

  return currentTier === MentorTier.RISING && TIER_RANK[verifiedTier] > TIER_RANK[currentTier];
}

export const POST = defineRoute(
  { roles: ["MENTOR"], forbiddenMessage: "Only mentors can verify college email." },
  async (request: Request, _context, { session }) => {
  const mentorId = session.user.id;
  const payload = await request.json().catch(() => null);
  const parsed = verifyEmailSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Please enter your institutional email address.", 400);
  }

  const email = parsed.data.email.trim().toLowerCase();
  const college = await resolveCollegeFromEmail(email);

  if (!college || !isVerifiableInstitutionalEmail(email, college)) {
    return apiErrorResponse("Please enter your institutional email address.", 400);
  }

  const verification = await verifyOtpChallenge({
    email,
    otp: parsed.data.otp,
    purpose: OTP_PURPOSE.COLLEGE_EMAIL_VERIFICATION,
    subjectId: mentorId,
  });

  if (!verification.ok) {
    const status = verification.reason === "redis_unavailable" ? 503 : 400;

    return apiErrorResponse(status === 503
            ? "Verification is temporarily unavailable. Please try again later."
            : "Invalid or expired verification code.", status);
  }

  const result = await db.$transaction(async (tx) => {
    const profile = await tx.mentorProfile.findUnique({
      where: { userId: mentorId },
      select: {
        college: true,
        tier: true,
      },
    });

    if (!profile) {
      return null;
    }

    const claimedByAnotherMentor = await tx.mentorProfile.findFirst({
      where: {
        verifiedCollegeEmail: verification.email,
        NOT: { userId: mentorId },
      },
      select: { userId: true },
    });

    if (claimedByAnotherMentor) {
      return "email_taken" as const;
    }

    const createdEvidence = await tx.verificationEvidence.create({
      data: {
        mentorId,
        type: VerificationEvidenceType.COLLEGE_EMAIL,
        provider: VerificationProvider.COLLEGE_EMAIL,
        status: VerificationStatus.APPROVED,
        confidence: 100,
        verifiedAt: new Date(),
        metadata: {
          domain: college.domain,
          collegeName: college.collegeName,
          tier: college.tier,
          type: college.type,
          domainRecognized: college.recognized,
          emailOwnershipConfidence: 100,
          institutionConfidence: college.recognized ? 100 : 0,
        },
      },
      select: {
        id: true,
        type: true,
        status: true,
      },
    });

    const nextTier =
      college.recognized && college.tier && shouldUpgradeTier(profile.tier, college.tier)
        ? college.tier
        : undefined;
    const nextCollege =
      college.recognized && college.collegeName && !profile.college
        ? college.collegeName
        : undefined;

    await tx.mentorProfile.update({
      where: { userId: mentorId },
      data: {
        verifiedCollegeEmail: verification.email,
        ...(nextCollege ? { college: nextCollege } : {}),
        ...(nextTier ? { tier: nextTier } : {}),
      },
    });

    return createdEvidence;
  });

  if (!result) {
    return apiErrorResponse("Mentor profile not found.", 404);
  }

  if (result === "email_taken") {
    return apiErrorResponse("This college email is already verified on another account.", 409);
  }

  return NextResponse.json({
    success: true,
    verified: true,
    college: {
      name: college.collegeName,
      tier: college.tier,
      recognized: college.recognized,
    },
    evidence: {
      type: result.type,
      status: result.status,
    },
  });
},
  "/api/v1/verification/email/verify",
);

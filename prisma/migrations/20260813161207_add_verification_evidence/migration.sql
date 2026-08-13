-- CreateEnum
CREATE TYPE "CollegeType" AS ENUM ('IIT', 'NIT', 'IIIT', 'IIM', 'AIIMS', 'BITS', 'NLU', 'STATE', 'PRIVATE', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationProvider" AS ENUM ('LINKEDIN', 'COLLEGE_EMAIL', 'DIGILOCKER', 'OCR', 'MANUAL');

-- CreateEnum
CREATE TYPE "VerificationEvidenceType" AS ENUM ('LINKEDIN_PROFILE', 'COLLEGE_EMAIL', 'DEGREE', 'INTERNSHIP', 'COMPANY');

-- CreateTable
CREATE TABLE "CollegeDomain" (
    "id" UUID NOT NULL,
    "domain" TEXT NOT NULL,
    "collegeName" TEXT NOT NULL,
    "type" "CollegeType" NOT NULL,
    "tier" "MentorTier" NOT NULL DEFAULT 'RISING',
    "city" TEXT,
    "state" TEXT,
    "website" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollegeDomain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationEvidence" (
    "id" UUID NOT NULL,
    "mentorId" UUID NOT NULL,
    "type" "VerificationEvidenceType" NOT NULL,
    "provider" "VerificationProvider" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "confidence" INTEGER,
    "metadata" JSONB,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollegeDomain_domain_key" ON "CollegeDomain"("domain");

-- CreateIndex
CREATE INDEX "CollegeDomain_collegeName_idx" ON "CollegeDomain"("collegeName");

-- CreateIndex
CREATE INDEX "CollegeDomain_tier_idx" ON "CollegeDomain"("tier");

-- CreateIndex
CREATE INDEX "CollegeDomain_type_idx" ON "CollegeDomain"("type");

-- CreateIndex
CREATE INDEX "CollegeDomain_isApproved_idx" ON "CollegeDomain"("isApproved");

-- CreateIndex
CREATE INDEX "VerificationEvidence_mentorId_idx" ON "VerificationEvidence"("mentorId");

-- CreateIndex
CREATE INDEX "VerificationEvidence_type_idx" ON "VerificationEvidence"("type");

-- CreateIndex
CREATE INDEX "VerificationEvidence_provider_idx" ON "VerificationEvidence"("provider");

-- CreateIndex
CREATE INDEX "VerificationEvidence_status_idx" ON "VerificationEvidence"("status");

-- CreateIndex
CREATE INDEX "VerificationEvidence_mentorId_type_idx" ON "VerificationEvidence"("mentorId", "type");

-- AddForeignKey
ALTER TABLE "VerificationEvidence" ADD CONSTRAINT "VerificationEvidence_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

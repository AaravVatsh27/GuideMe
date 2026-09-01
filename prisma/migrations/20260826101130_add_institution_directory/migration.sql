-- CreateEnum
CREATE TYPE "AcademicCategory" AS ENUM ('ENGINEERING', 'MEDICAL', 'MANAGEMENT', 'LAW', 'PHARMACY', 'ARCHITECTURE', 'DESIGN', 'AGRICULTURE', 'SCIENCE', 'ARTS', 'COMMERCE', 'NURSING', 'DENTAL', 'PARAMEDICAL', 'EDUCATION', 'MULTIDISCIPLINARY', 'OTHER');

-- CreateEnum
CREATE TYPE "InstitutionClassification" AS ENUM ('CENTRAL_UNIVERSITY', 'STATE_UNIVERSITY', 'PRIVATE_UNIVERSITY', 'DEEMED_UNIVERSITY', 'IIT', 'NIT', 'IIIT', 'IIM', 'AIIMS', 'NLU', 'GOVERNMENT_COLLEGE', 'PRIVATE_COLLEGE', 'AUTONOMOUS_COLLEGE', 'GOVERNMENT_INSTITUTE', 'PRIVATE_INSTITUTE', 'OTHER');

-- CreateEnum
CREATE TYPE "InstitutionTier" AS ENUM ('TIER_1', 'TIER_2', 'TIER_3', 'UNCLASSIFIED');

-- CreateEnum
CREATE TYPE "InstitutionSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "CollegeDomain" ADD COLUMN     "institutionId" UUID;

-- AlterTable
ALTER TABLE "MentorProfile" ADD COLUMN     "institutionId" UUID;

-- AlterTable
ALTER TABLE "VerificationEvidence" ADD COLUMN     "institutionId" UUID;

-- CreateTable
CREATE TABLE "Institution" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "slug" TEXT NOT NULL,
    "academicCategory" "AcademicCategory" NOT NULL,
    "institutionClassification" "InstitutionClassification" NOT NULL,
    "institutionTier" "InstitutionTier" NOT NULL DEFAULT 'UNCLASSIFIED',
    "city" TEXT,
    "state" TEXT,
    "website" TEXT,
    "officialId" TEXT,
    "officialSource" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionSuggestion" (
    "id" UUID NOT NULL,
    "mentorId" UUID NOT NULL,
    "approvedInstitutionId" UUID,
    "submittedName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "status" "InstitutionSuggestionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" UUID,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_slug_key" ON "Institution"("slug");

-- CreateIndex
CREATE INDEX "Institution_name_idx" ON "Institution"("name");

-- CreateIndex
CREATE INDEX "Institution_shortName_idx" ON "Institution"("shortName");

-- CreateIndex
CREATE INDEX "Institution_academicCategory_idx" ON "Institution"("academicCategory");

-- CreateIndex
CREATE INDEX "Institution_institutionClassification_idx" ON "Institution"("institutionClassification");

-- CreateIndex
CREATE INDEX "Institution_institutionTier_idx" ON "Institution"("institutionTier");

-- CreateIndex
CREATE INDEX "Institution_state_city_idx" ON "Institution"("state", "city");

-- CreateIndex
CREATE UNIQUE INDEX "Institution_officialSource_officialId_key" ON "Institution"("officialSource", "officialId");

-- CreateIndex
CREATE INDEX "InstitutionSuggestion_status_idx" ON "InstitutionSuggestion"("status");

-- CreateIndex
CREATE INDEX "InstitutionSuggestion_normalizedName_idx" ON "InstitutionSuggestion"("normalizedName");

-- CreateIndex
CREATE INDEX "InstitutionSuggestion_mentorId_idx" ON "InstitutionSuggestion"("mentorId");

-- CreateIndex
CREATE INDEX "InstitutionSuggestion_approvedInstitutionId_idx" ON "InstitutionSuggestion"("approvedInstitutionId");

-- CreateIndex
CREATE INDEX "CollegeDomain_institutionId_idx" ON "CollegeDomain"("institutionId");

-- CreateIndex
CREATE INDEX "MentorProfile_institutionId_idx" ON "MentorProfile"("institutionId");

-- CreateIndex
CREATE INDEX "VerificationEvidence_institutionId_idx" ON "VerificationEvidence"("institutionId");

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollegeDomain" ADD CONSTRAINT "CollegeDomain_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvidence" ADD CONSTRAINT "VerificationEvidence_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionSuggestion" ADD CONSTRAINT "InstitutionSuggestion_approvedInstitutionId_fkey" FOREIGN KEY ("approvedInstitutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionSuggestion" ADD CONSTRAINT "InstitutionSuggestion_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Data integrity migration.
--
-- Before applying, check that existing data satisfies the new rules; each query must return no rows:
--   SELECT "verifiedCollegeEmail" FROM "MentorProfile" WHERE "verifiedCollegeEmail" IS NOT NULL
--     GROUP BY 1 HAVING count(*) > 1;
--   SELECT a.id, b.id FROM "Session" a JOIN "Session" b ON a.id < b.id
--     AND (a."mentorId" = b."mentorId" OR a."studentId" = b."studentId")
--     AND a.status IN ('SCHEDULED','ONGOING') AND b.status IN ('SCHEDULED','ONGOING')
--     AND a."scheduledAt" < b."scheduledAt" + make_interval(mins => b."durationMinutes")
--     AND b."scheduledAt" < a."scheduledAt" + make_interval(mins => a."durationMinutes");
--   SELECT id FROM "Payment" WHERE "refundAmount" > amount;
--   SELECT id FROM "Review" WHERE rating NOT BETWEEN 1 AND 5;

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_userId_fkey";

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_mentorId_fkey";

-- DropForeignKey
ALTER TABLE "Payout" DROP CONSTRAINT "Payout_sessionId_fkey";

-- DropIndex
DROP INDEX "Session_studentId_idx";

-- DropIndex
DROP INDEX "Session_mentorId_idx";

-- DropIndex
DROP INDEX "Review_mentorId_idx";

-- DropIndex
DROP INDEX "Availability_mentorId_idx";

-- DropIndex
DROP INDEX "Notification_userId_idx";

-- DropIndex
DROP INDEX "Message_sessionId_idx";

-- DropIndex
DROP INDEX "Message_receiverId_idx";

-- DropIndex
DROP INDEX "SavedMentor_studentId_idx";

-- DropIndex
DROP INDEX "CollegeDomain_type_idx";

-- DropIndex
DROP INDEX "CollegeDomain_isApproved_idx";

-- DropIndex
DROP INDEX "VerificationEvidence_mentorId_idx";

-- DropIndex
DROP INDEX "VerificationEvidence_type_idx";

-- DropIndex
DROP INDEX "VerificationEvidence_provider_idx";

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "deletedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "lastActiveAt" SET DATA TYPE TIMESTAMPTZ(3) USING "lastActiveAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "VerificationToken" ALTER COLUMN "expires" SET DATA TYPE TIMESTAMPTZ(3) USING "expires" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "MentorProfile" ALTER COLUMN "lastProfileUpdate" SET DATA TYPE TIMESTAMPTZ(3) USING "lastProfileUpdate" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "scheduledAt" SET DATA TYPE TIMESTAMPTZ(3) USING "scheduledAt" AT TIME ZONE 'UTC',
ALTER COLUMN "startedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "startedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "endedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "endedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "cancelledAt" SET DATA TYPE TIMESTAMPTZ(3) USING "cancelledAt" AT TIME ZONE 'UTC',
ALTER COLUMN "studentJoinedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "studentJoinedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "mentorJoinedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "mentorJoinedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "paidAt" SET DATA TYPE TIMESTAMPTZ(3) USING "paidAt" AT TIME ZONE 'UTC',
ALTER COLUMN "refundedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "refundedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Payout" ALTER COLUMN "scheduledAt" SET DATA TYPE TIMESTAMPTZ(3) USING "scheduledAt" AT TIME ZONE 'UTC',
ALTER COLUMN "processedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "processedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Booking" ALTER COLUMN "bookedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "bookedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "readAt" SET DATA TYPE TIMESTAMPTZ(3) USING "readAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "readAt" SET DATA TYPE TIMESTAMPTZ(3) USING "readAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "SavedMentor" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "SessionNote" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "Institution" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "CollegeDomain" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "VerificationEvidence" ALTER COLUMN "verifiedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "verifiedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "InstitutionSuggestion" ALTER COLUMN "reviewedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "reviewedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "MentorVerification" ALTER COLUMN "reviewedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "reviewedAt" AT TIME ZONE 'UTC',
ALTER COLUMN "submittedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "submittedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "AuditLog" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC';

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_verifiedCollegeEmail_key" ON "MentorProfile"("verifiedCollegeEmail");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payout" ADD CONSTRAINT "Payout_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data rules the application already enforces, now also guaranteed by the database.
ALTER TABLE "Review"
  ADD CONSTRAINT "Review_rating_range" CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_duration_positive" CHECK ("durationMinutes" > 0),
  ADD CONSTRAINT "Session_amounts_non_negative" CHECK ("price" >= 0 AND "platformCut" >= 0 AND "mentorEarning" >= 0);

ALTER TABLE "Payment"
  ADD CONSTRAINT "Payment_amount_non_negative" CHECK ("amount" >= 0),
  ADD CONSTRAINT "Payment_refund_within_amount" CHECK ("refundAmount" IS NULL OR ("refundAmount" >= 0 AND "refundAmount" <= "amount"));

ALTER TABLE "Payout"
  ADD CONSTRAINT "Payout_amount_non_negative" CHECK ("amount" >= 0);

ALTER TABLE "Availability"
  ADD CONSTRAINT "Availability_day_of_week" CHECK ("dayOfWeek" BETWEEN 0 AND 6),
  ADD CONSTRAINT "Availability_time_format" CHECK ("startTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' AND "endTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  ADD CONSTRAINT "Availability_end_after_start" CHECK ("endTime" > "startTime");

ALTER TABLE "MentorProfile"
  ADD CONSTRAINT "MentorProfile_prices_non_negative" CHECK (("priceMin" IS NULL OR "priceMin" >= 0) AND ("priceMax" IS NULL OR "priceMax" >= 0)),
  ADD CONSTRAINT "MentorProfile_rating_range" CHECK ("avgRating" BETWEEN 0 AND 5),
  ADD CONSTRAINT "MentorProfile_counts_non_negative" CHECK ("totalReviews" >= 0 AND "totalSessions" >= 0 AND "profileViews" >= 0);

-- No two active sessions may overlap for the same mentor or the same student,
-- whichever code path writes them.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Adding minutes doesn't depend on the time zone, so this is safe to mark IMMUTABLE,
-- which an exclusion constraint requires.
CREATE OR REPLACE FUNCTION session_time_range(starts_at timestamptz, duration_minutes integer)
RETURNS tstzrange
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
  SELECT tstzrange(starts_at, starts_at + make_interval(mins => duration_minutes), '[)')
$$;

ALTER TABLE "Session"
  ADD CONSTRAINT "Session_mentor_no_overlap" EXCLUDE USING gist (
    "mentorId" WITH =,
    session_time_range("scheduledAt", "durationMinutes") WITH &&
  ) WHERE ("status" IN ('SCHEDULED', 'ONGOING')),
  ADD CONSTRAINT "Session_student_no_overlap" EXCLUDE USING gist (
    "studentId" WITH =,
    session_time_range("scheduledAt", "durationMinutes") WITH &&
  ) WHERE ("status" IN ('SCHEDULED', 'ONGOING'));

-- The app signs users in with JWTs and never calls Google with these tokens; stop keeping them.
UPDATE "Account" SET "access_token" = NULL, "refresh_token" = NULL, "id_token" = NULL;

-- CreateEnum
CREATE TYPE "SchoolingMode" AS ENUM (
    'REGULAR_SCHOOL',
    'REGULAR_SCHOOL_WITH_COACHING',
    'DUMMY_SCHOOL_WITH_COACHING',
    'ONLINE_SCHOOL_WITH_COACHING',
    'SELF_STUDY',
    'OTHER'
);

CREATE TYPE "CoachingMode" AS ENUM (
    'NONE',
    'ONLINE',
    'OFFLINE',
    'ONLINE_AND_OFFLINE'
);

CREATE TYPE "MentorshipNeed" AS ENUM (
    'STREAM_SELECTION',
    'SUBJECT_SELECTION',
    'EXAM_PREPARATION',
    'STUDY_STRATEGY',
    'SCHOOL_COACHING_BALANCE',
    'COLLEGE_SELECTION',
    'BRANCH_SELECTION',
    'COLLEGE_COMPARISON',
    'CAREER_EXPLORATION',
    'COLLEGE_LIFE',
    'HIGHER_STUDIES',
    'TIME_MANAGEMENT',
    'OTHER'
);

CREATE TYPE "DecisionStage" AS ENUM (
    'EXPLORING',
    'SHORTLISTING',
    'COMPARING',
    'DECIDING_SOON',
    'EXECUTION'
);

-- AlterTable
ALTER TABLE "StudentProfile"
    ADD COLUMN "schoolingMode" "SchoolingMode",
    ADD COLUMN "coachingMode" "CoachingMode",
    ADD COLUMN "targetExams" "TargetExam"[] NOT NULL DEFAULT ARRAY[]::"TargetExam"[],
    ADD COLUMN "mentorshipNeeds" "MentorshipNeed"[] NOT NULL DEFAULT ARRAY[]::"MentorshipNeed"[],
    ADD COLUMN "decisionStage" "DecisionStage",
    ADD COLUMN "currentConfusion" TEXT;

CREATE INDEX "StudentProfile_schoolingMode_coachingMode_idx"
    ON "StudentProfile"("schoolingMode", "coachingMode");

CREATE INDEX "StudentProfile_decisionStage_idx"
    ON "StudentProfile"("decisionStage");

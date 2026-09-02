import { NextResponse } from "next/server";
import { z } from "zod";

import { auth, updateSession } from "@/Backend/auth";
import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { db } from "@/Backend/server/db";
import { invalidateMatchingCacheForStudent } from "@/Backend/server/matching";
import {
  type BoardValue,
  getAllowedStreamValues,
  getConfusionOptions,
  requiresBoard,
  type ConfusionTypeValue,
  type StreamValue,
  type StudentClassValue,
} from "@/Backend/server/student-onboarding";
import {
  studentBoardStepSchema,
  studentClassStepSchema,
  studentCurrentConfusionStepSchema,
  studentDecisionStageStepSchema,
  studentLocationStepSchema,
  studentMentorshipNeedsStepSchema,
  studentOnboardingSchema,
  studentTargetExamsStepSchema,
} from "@/Backend/validations/student";
import {
  type CoachingMode,
  type DecisionStage,
  type MentorshipNeed,
  type ParentalPressure,
  type SchoolingMode,
  type TargetExam,
} from "@prisma/client";

const STUDENT_DASHBOARD_PATH = "/dashboard/student";
const STUDENT_DRAFT_STREAM = "UNDECIDED";

const patchRequestSchema = z.object({
  step: z.number().int().min(1).max(7),
  data: z.object({}).passthrough(),
});

type ExistingStudentState = {
  onboardingStep: number;
  studentProfile: {
    class: StudentClassValue;
    board: BoardValue | null;
    stream: StreamValue;
    schoolingMode: SchoolingMode | null;
    coachingMode: CoachingMode | null;
    targetExam: TargetExam | null;
    targetExams: TargetExam[];
    mentorshipNeeds: MentorshipNeed[];
    decisionStage: DecisionStage | null;
    currentConfusion: string | null;
    confusionType: ConfusionTypeValue | null;
    confusionTypes: ConfusionTypeValue[];
    city: string | null;
    state: string | null;
    languagePreference: string | null;
    parentalPressure: ParentalPressure | null;
  } | null;
};

function getValidatedStepData(step: number, data: Record<string, unknown>) {
  switch (step) {
    case 1:
      return studentClassStepSchema.safeParse(data);
    case 2:
      return studentBoardStepSchema.safeParse(data);
    case 3:
      return studentTargetExamsStepSchema.safeParse(data);
    case 4:
      return studentMentorshipNeedsStepSchema.safeParse(data);
    case 5:
      return studentDecisionStageStepSchema.safeParse(data);
    case 6:
      return studentCurrentConfusionStepSchema.safeParse(data);
    case 7:
      return studentLocationStepSchema.safeParse(data);
    default:
      return z.never().safeParse(data);
  }
}

function buildPersistedStudentProfile(
  existing: ExistingStudentState["studentProfile"],
  step: number,
  stepData: Record<string, unknown>,
) {
  const profile = existing ?? {
    class: stepData.class as StudentClassValue,
    board: null,
    stream: STUDENT_DRAFT_STREAM as StreamValue,
    schoolingMode: null,
    coachingMode: null,
    targetExam: null,
    targetExams: [],
    mentorshipNeeds: [],
    decisionStage: null,
    currentConfusion: null,
    confusionType: null,
    confusionTypes: [],
    city: null,
    state: null,
    languagePreference: null,
    parentalPressure: null,
  };

  const studentClass = stepData.class as StudentClassValue;
  const allowedStreams = new Set(getAllowedStreamValues(studentClass));
  const allowedConfusions = new Set(
    getConfusionOptions(studentClass).map((option) => option.value),
  );

  const fallbackStream = allowedStreams.has(profile.stream ?? STUDENT_DRAFT_STREAM)
    ? (profile.stream ?? STUDENT_DRAFT_STREAM)
    : STUDENT_DRAFT_STREAM;

  const nextStream =
    step >= 3 && typeof stepData.stream === "string"
      ? (stepData.stream as StreamValue)
      : fallbackStream;

  const nextConfusions =
    step >= 4 && Array.isArray(stepData.confusionTypes)
      ? (stepData.confusionTypes as ConfusionTypeValue[])
      : (profile.confusionTypes ?? []).filter((value) => allowedConfusions.has(value));

  const nextTargetExams = Array.isArray(stepData.targetExams)
    ? (stepData.targetExams as TargetExam[])
    : (profile.targetExams ?? []);

  const nextMentorshipNeeds = Array.isArray(stepData.mentorshipNeeds)
    ? (stepData.mentorshipNeeds as MentorshipNeed[])
    : (profile.mentorshipNeeds ?? []);

  const nextSchoolingMode =
    typeof stepData.schoolingMode !== "undefined" && stepData.schoolingMode !== null
      ? (stepData.schoolingMode as SchoolingMode)
      : profile.schoolingMode ?? null;

  const nextCoachingMode =
    typeof stepData.coachingMode !== "undefined" && stepData.coachingMode !== null
      ? (stepData.coachingMode as CoachingMode)
      : profile.coachingMode ?? null;

  const nextDecisionStage =
    typeof stepData.decisionStage !== "undefined" && stepData.decisionStage !== null
      ? (stepData.decisionStage as DecisionStage)
      : profile.decisionStage ?? null;

  const nextCurrentConfusion =
    typeof stepData.currentConfusion === "undefined"
      ? profile.currentConfusion ?? null
      : stepData.currentConfusion === "" || stepData.currentConfusion === null
        ? null
        : String(stepData.currentConfusion).trim() || null;

  const nextTargetExam =
    typeof stepData.targetExam !== "undefined" && stepData.targetExam !== null
      ? (stepData.targetExam as TargetExam)
      : nextTargetExams[0] ?? profile.targetExam ?? null;

  return {
    ...profile,
    class: studentClass,
    board: requiresBoard(studentClass)
      ? step >= 2
        ? ((stepData.board as BoardValue | undefined) ?? profile.board ?? null)
        : (profile.board ?? null)
      : null,
    stream: nextStream,
    schoolingMode: nextSchoolingMode,
    coachingMode: nextCoachingMode,
    targetExam: nextTargetExam,
    targetExams: nextTargetExams,
    mentorshipNeeds: nextMentorshipNeeds,
    decisionStage: nextDecisionStage,
    currentConfusion: nextCurrentConfusion,
    confusionType: nextConfusions[0] ?? profile.confusionType ?? null,
    confusionTypes: nextConfusions,
    city: profile.city ?? null,
    state: profile.state ?? null,
    languagePreference: profile.languagePreference ?? null,
    parentalPressure: profile.parentalPressure ?? null,
  };
}

export const PATCH = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  if (session.user.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Only students can save this onboarding flow" },
      { status: 403 },
    );
  }

  const payload = await request.json().catch(() => null);
  const parsedRequest = patchRequestSchema.safeParse(payload);

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        error: "Invalid onboarding request",
        issues: parsedRequest.error.flatten(),
      },
      { status: 400 },
    );
  }

  const validatedStep = getValidatedStepData(parsedRequest.data.step, parsedRequest.data.data);

  if (!validatedStep.success) {
    return NextResponse.json(
      {
        error: "Invalid step data",
        issues: validatedStep.error.flatten(),
      },
      { status: 400 },
    );
  }

  const existing = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      onboardingStep: true,
      studentProfile: {
        select: {
          class: true,
          board: true,
          stream: true,
          schoolingMode: true,
          coachingMode: true,
          targetExam: true,
          targetExams: true,
          mentorshipNeeds: true,
          decisionStage: true,
          currentConfusion: true,
          confusionType: true,
          confusionTypes: true,
          city: true,
          state: true,
          languagePreference: true,
          parentalPressure: true,
        },
      },
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const savedStep = Math.max(existing.onboardingStep, parsedRequest.data.step);
  const persistedProfile = buildPersistedStudentProfile(
    existing.studentProfile,
    parsedRequest.data.step,
    parsedRequest.data.data,
  );

  await db.$transaction(async (tx) => {
    await tx.studentProfile.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        ...persistedProfile,
      },
      update: persistedProfile,
    });

    await tx.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        onboardingStep: savedStep,
      },
    });
  });

  return NextResponse.json({
    savedStep,
    status: "DRAFT",
  });
}, "/api/onboarding/student");

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can complete this onboarding flow" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = studentOnboardingSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid onboarding data",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const rawData = payload as Record<string, unknown>;
  const result = await db.$transaction(async (tx) => {
    const profile = await tx.studentProfile.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        class: parsed.data.class,
        board: parsed.data.board ?? null,
        stream: parsed.data.stream,
        schoolingMode:
          typeof rawData.schoolingMode === "string" ? (rawData.schoolingMode as SchoolingMode) : null,
        coachingMode:
          typeof rawData.coachingMode === "string" ? (rawData.coachingMode as CoachingMode) : null,
        targetExam:
          typeof rawData.targetExam === "string" 
            ? (rawData.targetExam as TargetExam)
            : Array.isArray(rawData.targetExams) && rawData.targetExams.length > 0
              ? (rawData.targetExams[0] as TargetExam)
              : null,
        targetExams: Array.isArray(rawData.targetExams)
          ? (rawData.targetExams as TargetExam[])
          : [],
        mentorshipNeeds: Array.isArray(rawData.mentorshipNeeds)
          ? (rawData.mentorshipNeeds as MentorshipNeed[])
          : [],
        decisionStage:
          typeof rawData.decisionStage === "string" ? (rawData.decisionStage as DecisionStage) : null,
        currentConfusion:
          typeof rawData.currentConfusion === "string" && rawData.currentConfusion.trim().length > 0
            ? rawData.currentConfusion.trim()
            : null,
        confusionType: parsed.data.confusionTypes[0] ?? null,
        confusionTypes: parsed.data.confusionTypes,
        city: parsed.data.city,
        state: parsed.data.state,
        languagePreference: parsed.data.languagePreference,
        parentalPressure:
          typeof rawData.parentalPressure === "string"
            ? (rawData.parentalPressure as ParentalPressure)
            : null,
      },
      update: {
        class: parsed.data.class,
        board: parsed.data.board ?? null,
        stream: parsed.data.stream,
        schoolingMode:
          typeof rawData.schoolingMode === "string" ? (rawData.schoolingMode as SchoolingMode) : undefined,
        coachingMode:
          typeof rawData.coachingMode === "string" ? (rawData.coachingMode as CoachingMode) : undefined,
        targetExam:
          typeof rawData.targetExam === "string"
            ? (rawData.targetExam as TargetExam)
            : Array.isArray(rawData.targetExams) && rawData.targetExams.length > 0
              ? (rawData.targetExams[0] as TargetExam)
              : undefined,
        targetExams: Array.isArray(rawData.targetExams)
          ? (rawData.targetExams as TargetExam[])
          : undefined,
        mentorshipNeeds: Array.isArray(rawData.mentorshipNeeds)
          ? (rawData.mentorshipNeeds as MentorshipNeed[])
          : undefined,
        decisionStage:
          typeof rawData.decisionStage === "string" ? (rawData.decisionStage as DecisionStage) : undefined,
        currentConfusion:
          typeof rawData.currentConfusion === "string"
            ? (rawData.currentConfusion.trim() || null)
            : undefined,
        confusionType: parsed.data.confusionTypes[0] ?? null,
        confusionTypes: parsed.data.confusionTypes,
        city: parsed.data.city,
        state: parsed.data.state,
        languagePreference: parsed.data.languagePreference,
        parentalPressure:
          typeof rawData.parentalPressure === "string"
            ? (rawData.parentalPressure as ParentalPressure)
            : undefined,
      },
      select: {
        class: true,
        board: true,
        stream: true,
        schoolingMode: true,
        coachingMode: true,
        targetExam: true,
        targetExams: true,
        mentorshipNeeds: true,
        decisionStage: true,
        currentConfusion: true,
        confusionType: true,
        confusionTypes: true,
        city: true,
        state: true,
        languagePreference: true,
        parentalPressure: true,
      },
    });

    await tx.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        onboardingComplete: true,
        onboardingStep: 7,
      },
    });

    return profile;
  });

  await invalidateMatchingCacheForStudent(session.user.id);

  await updateSession({
    user: {
      role: session.user.role,
      onboardingComplete: true,
    },
  });

  return NextResponse.json({
    onboardingComplete: true,
    savedStep: 7,
    redirectTo: STUDENT_DASHBOARD_PATH,
    profile: result,
  });
}, "/api/onboarding/student");

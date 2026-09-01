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
  studentConfusionsStepSchema,
  studentOnboardingSchema,
  studentStreamStepSchema,
} from "@/Backend/validations/student";

const STUDENT_DASHBOARD_PATH = "/dashboard/student";
const STUDENT_DRAFT_STREAM = "UNDECIDED";

const patchRequestSchema = z.object({
  step: z.number().int().min(1).max(4),
  data: z.object({}).passthrough(),
});

type ExistingStudentState = {
  onboardingStep: number;
  studentProfile: {
    class: StudentClassValue;
    board: BoardValue | null;
    stream: StreamValue;
    confusionTypes: ConfusionTypeValue[];
    city: string | null;
    state: string | null;
    languagePreference: string | null;
  } | null;
};

function getValidatedStepData(step: number, data: Record<string, unknown>) {
  switch (step) {
    case 1:
      return studentClassStepSchema.safeParse(data);
    case 2:
      return studentBoardStepSchema.safeParse(data);
    case 3:
      return studentStreamStepSchema.safeParse(data);
    case 4:
      return studentConfusionsStepSchema.safeParse(data);
    default:
      return z.never().safeParse(data);
  }
}

function buildPersistedStudentProfile(
  existing: ExistingStudentState["studentProfile"],
  step: number,
  stepData: Record<string, unknown>,
) {
  const studentClass = stepData.class as StudentClassValue;
  const allowedStreams = new Set(getAllowedStreamValues(studentClass));
  const allowedConfusions = new Set(
    getConfusionOptions(studentClass).map((option) => option.value),
  );

  const fallbackStream = allowedStreams.has(existing?.stream ?? STUDENT_DRAFT_STREAM)
    ? (existing?.stream ?? STUDENT_DRAFT_STREAM)
    : STUDENT_DRAFT_STREAM;

  const nextStream =
    step >= 3 && typeof stepData.stream === "string"
      ? (stepData.stream as StreamValue)
      : fallbackStream;

  const nextConfusions =
    step >= 4 && Array.isArray(stepData.confusionTypes)
      ? (stepData.confusionTypes as ConfusionTypeValue[])
      : (existing?.confusionTypes ?? []).filter((value) => allowedConfusions.has(value));

  return {
    class: studentClass,
    board: requiresBoard(studentClass)
      ? step >= 2
        ? ((stepData.board as BoardValue | undefined) ?? null)
        : (existing?.board ?? null)
      : null,
    stream: nextStream,
    confusionType: nextConfusions[0] ?? null,
    confusionTypes: nextConfusions,
    city: existing?.city ?? null,
    state: existing?.state ?? null,
    languagePreference: existing?.languagePreference ?? null,
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
          confusionTypes: true,
          city: true,
          state: true,
          languagePreference: true,
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
    validatedStep.data,
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
        confusionType: parsed.data.confusionTypes[0] ?? null,
        confusionTypes: parsed.data.confusionTypes,
        city: parsed.data.city,
        state: parsed.data.state,
        languagePreference: parsed.data.languagePreference,
      },
      update: {
        class: parsed.data.class,
        board: parsed.data.board ?? null,
        stream: parsed.data.stream,
        confusionType: parsed.data.confusionTypes[0] ?? null,
        confusionTypes: parsed.data.confusionTypes,
        city: parsed.data.city,
        state: parsed.data.state,
        languagePreference: parsed.data.languagePreference,
      },
      select: {
        class: true,
        board: true,
        stream: true,
        confusionType: true,
        confusionTypes: true,
        city: true,
        state: true,
        languagePreference: true,
      },
    });

    await tx.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        onboardingComplete: true,
        onboardingStep: 5,
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
    savedStep: 5,
    redirectTo: STUDENT_DASHBOARD_PATH,
    profile: result,
  });
}, "/api/onboarding/student");

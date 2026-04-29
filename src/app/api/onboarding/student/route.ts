import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { invalidateMatchingCacheForStudent } from "@/server/matching";
import { studentOnboardingSchema } from "@/server/validations/student";

const STUDENT_DASHBOARD_PATH = "/dashboard/student";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  return NextResponse.json({
    onboardingComplete: true,
    redirectTo: STUDENT_DASHBOARD_PATH,
    profile: result,
  });
}

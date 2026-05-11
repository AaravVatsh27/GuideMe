import { Prisma, type MentorTier } from "@prisma/client";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/server/db";
import {
  detectMentorTier,
  EMPTY_MENTOR_DRAFT,
  type MentorExamEntry,
  type MentorOnboardingDraft,
} from "@/server/mentor-onboarding";

import { MentorOnboardingWizard } from "./mentor-onboarding-wizard";

function isJsonObject(
  value: Prisma.JsonValue | null | undefined,
): value is Prisma.JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function buildInitialDraft(data: {
  image: string | null;
  mentorProfile: {
    college: string | null;
    degree: string | null;
    branch: string | null;
    yearOfStudy: number | null;
    expectedGraduationYear: number | null;
    tier: MentorTier;
    bio: string | null;
    headline: string | null;
    examsCleared: string[];
    examYears: Prisma.JsonValue | null;
    specialisations: string[];
    priceMin: number | null;
    priceMax: number | null;
    linkedinUrl: string | null;
  } | null;
  availabilities: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    timezone: string;
  }>;
}) {
  const examYears = isJsonObject(data.mentorProfile?.examYears)
    ? data.mentorProfile.examYears
    : {};

  const exams: MentorExamEntry[] =
    data.mentorProfile?.examsCleared.map((exam) => ({
      exam: exam as MentorExamEntry["exam"],
      year: typeof examYears[exam] === "number" ? (examYears[exam] as number) : undefined,
    })) ?? [];

  const draft: MentorOnboardingDraft = {
    ...EMPTY_MENTOR_DRAFT,
    college: data.mentorProfile?.college ?? undefined,
    tier:
      data.mentorProfile?.tier ??
      (data.mentorProfile?.college
        ? detectMentorTier(data.mentorProfile.college).tier
        : undefined),
    degree: data.mentorProfile?.degree as MentorOnboardingDraft["degree"],
    branch: data.mentorProfile?.branch ?? undefined,
    yearOfStudy: data.mentorProfile?.yearOfStudy as MentorOnboardingDraft["yearOfStudy"],
    expectedGraduationYear: data.mentorProfile?.expectedGraduationYear ?? undefined,
    exams,
    specialisations:
      (data.mentorProfile?.specialisations as MentorOnboardingDraft["specialisations"]) ?? [],
    priceMin: data.mentorProfile?.priceMin ?? EMPTY_MENTOR_DRAFT.priceMin,
    priceMax: data.mentorProfile?.priceMax ?? EMPTY_MENTOR_DRAFT.priceMax,
    headline: data.mentorProfile?.headline ?? undefined,
    bio: data.mentorProfile?.bio ?? undefined,
    avatarUrl: data.image ?? undefined,
    linkedinUrl: data.mentorProfile?.linkedinUrl ?? undefined,
    timezone: data.availabilities[0]?.timezone ?? EMPTY_MENTOR_DRAFT.timezone,
    availabilitySlots: data.availabilities.map((slot) => ({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
    })),
  };

  return draft;
}

export default async function MentorOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=%2Fonboarding%2Fmentor");
  }

  // If session says student, double check DB to avoid stale session redirect
  // especially right after a role change in complete-signup
  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
      image: true,
      onboardingComplete: true,
      onboardingStep: true,
      mentorProfile: {
        select: {
          college: true,
          degree: true,
          branch: true,
          yearOfStudy: true,
          expectedGraduationYear: true,
          tier: true,
          bio: true,
          headline: true,
          examsCleared: true,
          examYears: true,
          specialisations: true,
          priceMin: true,
          priceMax: true,
          linkedinUrl: true,
        },
      },
      availabilities: {
        where: {
          isRecurring: true,
          isActive: true,
        },
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          timezone: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!user) {
    redirect("/auth/signin?callbackUrl=%2Fonboarding%2Fmentor");
  }

  if (user.role !== "MENTOR") {
    redirect("/onboarding/student");
  }

  if (user.onboardingComplete) {
    redirect("/dashboard/mentor");
  }

  return (
    <MentorOnboardingWizard
      userName={session.user.name ?? "mentor"}
      initialDraft={buildInitialDraft(user)}
      savedStep={Math.max(user.onboardingStep, 0)}
    />
  );
}

import { redirect } from "next/navigation";

import { auth } from "@/Backend/auth";
import { db } from "@/Backend/server/db";
import { getOnboardingPath } from "@/Backend/server/auth-flow";
import {
  type BoardValue,
  type ConfusionTypeValue,
  type IndianStateValue,
  type LanguageValue,
  type StreamValue,
  type StudentClassValue,
} from "@/Backend/server/student-onboarding";

import { StudentOnboardingWizard } from "@/Frontend/views/onboarding/student-onboarding-wizard";

type StudentOnboardingDraft = {
  class?: StudentClassValue;
  board?: BoardValue;
  stream?: StreamValue;
  confusionTypes: ConfusionTypeValue[];
  city: string;
  state?: IndianStateValue;
  languagePreference?: LanguageValue;
};

function getEmptyDraft(): StudentOnboardingDraft {
  return {
    confusionTypes: [],
    city: "",
  };
}

function buildInitialDraft(data: {
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
}) {
  const draft = getEmptyDraft();
  const profile = data.studentProfile;

  if (!profile) {
    return draft;
  }

  if (data.onboardingStep >= 1) {
    draft.class = profile.class;
  }

  if (data.onboardingStep >= 2) {
    draft.board = profile.board ?? undefined;
  }

  if (data.onboardingStep >= 3) {
    draft.stream = profile.stream;
  }

  if (data.onboardingStep >= 4) {
    draft.confusionTypes = profile.confusionTypes;
  }

  if (data.onboardingStep >= 5) {
    draft.city = profile.city ?? "";
    draft.state = (profile.state as IndianStateValue | null) ?? undefined;
    draft.languagePreference =
      (profile.languagePreference as LanguageValue | null) ?? undefined;
  }

  return draft;
}

export default async function StudentOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=%2Fonboarding%2Fstudent");
  }

  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
      onboardingComplete: true,
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

  if (!user) {
    redirect("/auth/signin?callbackUrl=%2Fonboarding%2Fstudent");
  }

  if (user.role !== "STUDENT") {
    if (user.role === "ADMIN") {
      redirect("/admin");
    }

    redirect(getOnboardingPath(user.role));
  }

  if (user.onboardingComplete) {
    redirect("/dashboard/student");
  }

  return (
    <StudentOnboardingWizard
      userName={session.user.name ?? "there"}
      initialDraft={buildInitialDraft(user)}
      savedStep={Math.max(user.onboardingStep, 0)}
    />
  );
}

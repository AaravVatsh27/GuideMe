import { redirect } from "next/navigation";
import {
  CoachingMode,
  DecisionStage,
  MentorshipNeed,
  SchoolingMode,
  TargetExam,
} from "@prisma/client";

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
  schoolingMode?: SchoolingMode;
  coachingMode?: CoachingMode;
  targetExams: TargetExam[];
  mentorshipNeeds: MentorshipNeed[];
  decisionStage?: DecisionStage;
  currentConfusion?: string;
  confusionTypes: ConfusionTypeValue[];
  city: string;
  state?: IndianStateValue;
  languagePreference?: LanguageValue;
};

function getEmptyDraft(): StudentOnboardingDraft {
  return {
    targetExams: [],
    mentorshipNeeds: [],
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
  } | null;
}) {
  const draft = getEmptyDraft();
  const profile = data.studentProfile;

  if (!profile) {
    return draft;
  }

  if (profile.class) {
    draft.class = profile.class;
  }
  if (profile.board) {
    draft.board = profile.board;
  }
  if (profile.stream) {
    draft.stream = profile.stream;
  }
  if (profile.schoolingMode) {
    draft.schoolingMode = profile.schoolingMode;
  }
  if (profile.coachingMode) {
    draft.coachingMode = profile.coachingMode;
  }
  if (Array.isArray(profile.targetExams) && profile.targetExams.length > 0) {
    draft.targetExams = profile.targetExams;
  }
  if (Array.isArray(profile.mentorshipNeeds) && profile.mentorshipNeeds.length > 0) {
    draft.mentorshipNeeds = profile.mentorshipNeeds;
  }
  if (Array.isArray(profile.confusionTypes) && profile.confusionTypes.length > 0) {
    draft.confusionTypes = profile.confusionTypes;
  }
  if (profile.decisionStage) {
    draft.decisionStage = profile.decisionStage;
  }
  if (profile.currentConfusion) {
    draft.currentConfusion = profile.currentConfusion;
  }
  if (profile.city) {
    draft.city = profile.city;
  }
  if (profile.state) {
    draft.state = profile.state as IndianStateValue;
  }
  if (profile.languagePreference) {
    draft.languagePreference = profile.languagePreference as LanguageValue;
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

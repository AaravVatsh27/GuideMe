import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getOnboardingPath } from "@/server/auth-flow";

import { StudentOnboardingWizard } from "./student-onboarding-wizard";

export default async function StudentOnboardingPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=%2Fonboarding%2Fstudent");
  }

  if (session.user.role !== "STUDENT") {
    redirect(getOnboardingPath(session.user.role));
  }

  if (session.user.onboardingComplete) {
    redirect("/dashboard/student");
  }

  return <StudentOnboardingWizard userName={session.user.name ?? "there"} />;
}

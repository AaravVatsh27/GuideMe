import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { MentorShell } from "./_components/mentor-shell";

export default async function MentorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=%2Fdashboard%2Fmentor");
  }

  if (session.user.role !== "MENTOR") {
    redirect("/dashboard/student");
  }

  if (!session.user.onboardingComplete) {
    redirect("/onboarding/mentor");
  }

  return <MentorShell>{children}</MentorShell>;
}

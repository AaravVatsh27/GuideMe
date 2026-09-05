import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/Backend/auth";

import { MentorShell } from "@/Frontend/views/dashboard/mentor/mentor-shell";

export const metadata: Metadata = {
  title: { absolute: "Mentra — Dashboard" },
};

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

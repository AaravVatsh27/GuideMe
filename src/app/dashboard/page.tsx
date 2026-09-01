import { redirect } from "next/navigation";

import { auth } from "@/Backend/auth";

export default async function DashboardEntryPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=%2Fdashboard");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  if (!session.user.onboardingComplete) {
    redirect(session.user.role === "MENTOR" ? "/onboarding/mentor" : "/onboarding/student");
  }

  redirect(session.user.role === "MENTOR" ? "/dashboard/mentor" : "/dashboard/student");
}

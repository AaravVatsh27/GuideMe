import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { StudentShell } from "@/app/dashboard/student/_components/student-shell";

export default async function StudentDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=%2Fdashboard%2Fstudent");
  }
  if (session.user.role !== "STUDENT") {
    redirect("/dashboard/mentor");
  }

  return <StudentShell>{children}</StudentShell>;
}

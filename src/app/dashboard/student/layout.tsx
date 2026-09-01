import { redirect } from "next/navigation";

import { auth } from "@/Backend/auth";
import { StudentShell } from "@/Frontend/views/dashboard/student/student-shell";

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

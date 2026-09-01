import { redirect } from "next/navigation";

import { auth } from "@/Backend/auth";
import { getPendingMentorVerificationCount } from "@/Backend/server/admin";

import { AdminShell } from "@/Frontend/views/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=%2Fadmin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const pendingVerificationCount = await getPendingMentorVerificationCount();

  return (
    <AdminShell
      adminName={session.user.name ?? "Admin"}
      pendingVerificationCount={pendingVerificationCount}
    >
      {children}
    </AdminShell>
  );
}

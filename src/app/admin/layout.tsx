import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getPendingMentorVerificationCount } from "@/server/admin";

import { AdminShell } from "./_components/admin-shell";

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

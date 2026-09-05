import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { auth } from "@/Backend/auth";
import { getPendingMentorVerificationCount } from "@/Backend/server/admin";

import { AdminShell } from "@/Frontend/views/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (headers().get("x-mentra-admin-signin") === "1") {
    return children;
  }

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

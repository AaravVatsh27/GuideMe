import type { Metadata } from "next";

import { isEmailAuthEnabled } from "@/Backend/server/auth";
import { AuthShell } from "@/Frontend/views/auth/auth-shell";
import { AdminSignInView } from "@/Frontend/views/auth/admin-signin-view";

export const metadata: Metadata = {
  title: { absolute: "Mentra — Admin / HR Login" },
};

export default function AdminSignInPage() {
  return (
    <AuthShell>
      <AdminSignInView emailEnabled={isEmailAuthEnabled} />
    </AuthShell>
  );
}

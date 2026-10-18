import { getAdminSettingsData } from "@/Backend/server/admin";
import { cn } from "@/Frontend/lib/utils";

import { adminCardClass, AdminPageHeader } from "@/Frontend/views/admin/admin-ui";

function SettingsSection({ title, rows }: { title: string; rows: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <section>
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">{title}</h2>
      <dl className="mt-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4 border-b border-[#F1F5F9] py-3 text-sm last:border-b-0">
            <dt className="text-[#64748B]">{row.label}</dt>
            <dd className="min-w-0 break-all text-right text-[#0F172A]">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default async function AdminSettingsPage() {
  const settings = await getAdminSettingsData();

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Workspace"
        title="Settings"
        description="System details and a snapshot of platform volume."
      />

      <div className={cn(adminCardClass, "grid gap-8 p-6 sm:p-8 lg:grid-cols-2 lg:gap-12")}>
        <SettingsSection
          title="System"
          rows={[
            { label: "App URL", value: settings.system.appUrl },
            { label: "Support email", value: settings.system.supportEmail },
            { label: "Email auth enabled", value: settings.system.emailAuthEnabled ? "Yes" : "No" },
          ]}
        />
        <SettingsSection
          title="Volume snapshot"
          rows={[
            { label: "Total users", value: settings.counters.userCount.toLocaleString("en-IN") },
            { label: "Mentors", value: settings.counters.mentorCount.toLocaleString("en-IN") },
            { label: "Sessions", value: settings.counters.sessionCount.toLocaleString("en-IN") },
            { label: "Notifications", value: settings.counters.notificationCount.toLocaleString("en-IN") },
          ]}
        />
      </div>
    </div>
  );
}

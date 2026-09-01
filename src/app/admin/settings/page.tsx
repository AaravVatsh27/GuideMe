import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { getAdminSettingsData } from "@/Backend/server/admin";

export default async function AdminSettingsPage() {
  const settings = await getAdminSettingsData();

  return (
    <div className="space-y-5">
      <Card className="rounded-[1.75rem] border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight text-slate-950">Settings</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">System</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>App URL: {settings.system.appUrl}</p>
              <p>Support email: {settings.system.supportEmail}</p>
              <p>Email auth enabled: {settings.system.emailAuthEnabled ? "Yes" : "No"}</p>
            </div>
          </div>

          <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Volume snapshot</p>
            <div className="mt-3 space-y-2 text-sm text-slate-700">
              <p>Total users: {settings.counters.userCount.toLocaleString("en-IN")}</p>
              <p>Mentors: {settings.counters.mentorCount.toLocaleString("en-IN")}</p>
              <p>Sessions: {settings.counters.sessionCount.toLocaleString("en-IN")}</p>
              <p>Notifications: {settings.counters.notificationCount.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

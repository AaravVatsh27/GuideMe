import { Card, CardContent } from "@/Frontend/components/ui/card";

import { getMentorDashboardData } from "@/Frontend/views/dashboard/mentor/mentor-dashboard-data";
import { MentorSessionsPageClient } from "@/Frontend/views/dashboard/mentor/mentor-sessions-page-client";

export default async function MentorSessionsPage() {
  const data = await getMentorDashboardData();

  if (!data) {
    return (
      <Card className="rounded-[1.75rem] border-red-200 bg-white">
        <CardContent className="p-6 text-sm text-red-600">Failed to load mentor sessions.</CardContent>
      </Card>
    );
  }

  return <MentorSessionsPageClient sessions={data.sessions} />;
}

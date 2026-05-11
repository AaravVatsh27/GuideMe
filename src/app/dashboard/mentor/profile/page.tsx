import { Card, CardContent } from "@/client/components/ui/card";

import { getMentorDashboardData } from "../_components/mentor-dashboard-data";
import { MentorProfilePageClient } from "../_components/mentor-profile-page-client";

export default async function MentorProfilePage() {
  const data = await getMentorDashboardData();

  if (!data) {
    return (
      <Card className="rounded-[1.75rem] border-red-200 bg-white">
        <CardContent className="p-6 text-sm text-red-600">Failed to load mentor profile.</CardContent>
      </Card>
    );
  }

  return <MentorProfilePageClient mentor={data.mentor} />;
}

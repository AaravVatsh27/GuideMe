import { Card, CardContent } from "@/client/components/ui/card";

import { MentorAvailabilityPageClient } from "../_components/mentor-availability-page-client";
import { getMentorDashboardData } from "../_components/mentor-dashboard-data";

export default async function MentorAvailabilityPage() {
  const data = await getMentorDashboardData();

  if (!data) {
    return (
      <Card className="rounded-[1.75rem] border-red-200 bg-white">
        <CardContent className="p-6 text-sm text-red-600">Failed to load mentor availability.</CardContent>
      </Card>
    );
  }

  return <MentorAvailabilityPageClient mentorId={data.mentor.id} availability={data.availability} />;
}

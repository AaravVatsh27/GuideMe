import { Card, CardContent } from "@/client/components/ui/card";

import { MentorEarningsPageClient } from "../_components/mentor-earnings-page-client";
import { getMentorDashboardData } from "../_components/mentor-dashboard-data";

export default async function MentorEarningsPage() {
  const data = await getMentorDashboardData();

  if (!data) {
    return (
      <Card className="rounded-[1.75rem] border-red-200 bg-white">
        <CardContent className="p-6 text-sm text-red-600">Failed to load mentor earnings.</CardContent>
      </Card>
    );
  }

  return <MentorEarningsPageClient mentorId={data.mentor.id} mentorName={data.mentor.name} earnings={data.earnings} />;
}

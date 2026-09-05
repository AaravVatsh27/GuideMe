import { Card, CardContent } from "@/Frontend/components/ui/card";
import type { Metadata } from "next";

import { MentorAvailabilityPageClient } from "@/Frontend/views/dashboard/mentor/mentor-availability-page-client";
import { getMentorDashboardData } from "@/Frontend/views/dashboard/mentor/mentor-dashboard-data";

export const metadata: Metadata = {
  title: { absolute: "Mentra — Availability" },
};

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

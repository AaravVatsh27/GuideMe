import { Card, CardContent } from "@/Frontend/components/ui/card";
import type { Metadata } from "next";

import { getMentorDashboardData } from "@/Frontend/views/dashboard/mentor/mentor-dashboard-data";
import { MentorReviewsPageClient } from "@/Frontend/views/dashboard/mentor/mentor-reviews-page-client";

export const metadata: Metadata = {
  title: { absolute: "Mentra — Reviews" },
};

export default async function MentorReviewsPage() {
  const data = await getMentorDashboardData();

  if (!data) {
    return (
      <Card className="rounded-[1.75rem] border-red-200 bg-white">
        <CardContent className="p-6 text-sm text-red-600">Failed to load mentor reviews.</CardContent>
      </Card>
    );
  }

  return <MentorReviewsPageClient mentorId={data.mentor.id} reviews={data.reviews} />;
}

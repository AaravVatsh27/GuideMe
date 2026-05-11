import { getAdminMentorVerificationQueueData } from "@/server/admin";

import { AdminMentorVerificationPageClient } from "../../_components/admin-mentor-verification-page-client";

export default async function AdminMentorVerificationPage() {
  const queue = await getAdminMentorVerificationQueueData();

  return <AdminMentorVerificationPageClient queue={queue} />;
}

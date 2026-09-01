import { getAdminMentorVerificationQueueData } from "@/Backend/server/admin";

import { AdminMentorVerificationPageClient } from "@/Frontend/views/admin/admin-mentor-verification-page-client";

export default async function AdminMentorVerificationPage() {
  const queue = await getAdminMentorVerificationQueueData();

  return <AdminMentorVerificationPageClient queue={queue} />;
}

import { getAdminMentorsData } from "@/Backend/server/admin";

import { AdminMentorsPageClient } from "@/Frontend/views/admin/admin-mentors-page-client";

export default async function AdminMentorsPage() {
  const mentors = await getAdminMentorsData();

  return <AdminMentorsPageClient mentors={mentors} />;
}

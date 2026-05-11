import { getAdminMentorsData } from "@/server/admin";

import { AdminMentorsPageClient } from "../_components/admin-mentors-page-client";

export default async function AdminMentorsPage() {
  const mentors = await getAdminMentorsData();

  return <AdminMentorsPageClient mentors={mentors} />;
}

import { getAdminSessionsData } from "@/Backend/server/admin";

import { AdminSessionsPageClient } from "@/Frontend/views/admin/admin-sessions-page-client";

export default async function AdminSessionsPage() {
  const sessions = await getAdminSessionsData();

  return <AdminSessionsPageClient sessions={sessions} />;
}

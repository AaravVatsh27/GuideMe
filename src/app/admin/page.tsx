import { getAdminOverviewData } from "@/Backend/server/admin";

import { AdminOverviewClient } from "@/Frontend/views/admin/admin-overview-client";

export default async function AdminOverviewPage() {
  const data = await getAdminOverviewData();

  return <AdminOverviewClient data={data} />;
}

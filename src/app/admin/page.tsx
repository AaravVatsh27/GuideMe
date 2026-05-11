import { getAdminOverviewData } from "@/server/admin";

import { AdminOverviewClient } from "./_components/admin-overview-client";

export default async function AdminOverviewPage() {
  const data = await getAdminOverviewData();

  return <AdminOverviewClient data={data} />;
}

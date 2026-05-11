import { getAdminPaymentsData } from "@/server/admin";

import { AdminPaymentsPageClient } from "../_components/admin-payments-page-client";

export default async function AdminPaymentsPage() {
  const data = await getAdminPaymentsData();

  return <AdminPaymentsPageClient data={data} />;
}

import { getAdminPaymentsData } from "@/Backend/server/admin";

import { AdminPaymentsPageClient } from "@/Frontend/views/admin/admin-payments-page-client";

export default async function AdminPaymentsPage() {
  const data = await getAdminPaymentsData();

  return <AdminPaymentsPageClient data={data} />;
}

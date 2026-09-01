import { getAdminNotificationsData } from "@/Backend/server/admin";

import { AdminNotificationsPageClient } from "@/Frontend/views/admin/admin-notifications-page-client";

export default async function AdminNotificationsPage() {
  const notifications = await getAdminNotificationsData();

  return <AdminNotificationsPageClient notifications={notifications} />;
}

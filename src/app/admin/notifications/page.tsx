import { getAdminNotificationsData } from "@/server/admin";

import { AdminNotificationsPageClient } from "../_components/admin-notifications-page-client";

export default async function AdminNotificationsPage() {
  const notifications = await getAdminNotificationsData();

  return <AdminNotificationsPageClient notifications={notifications} />;
}

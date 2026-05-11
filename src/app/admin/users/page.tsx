import { getAdminUsersData } from "@/server/admin";

import { AdminUsersPageClient } from "../_components/admin-users-page-client";

export default async function AdminUsersPage() {
  const users = await getAdminUsersData();

  return <AdminUsersPageClient users={users} />;
}

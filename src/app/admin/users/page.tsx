import { getAdminUsersData } from "@/Backend/server/admin";

import { AdminUsersPageClient } from "@/Frontend/views/admin/admin-users-page-client";

export default async function AdminUsersPage() {
  const users = await getAdminUsersData();

  return <AdminUsersPageClient users={users} />;
}

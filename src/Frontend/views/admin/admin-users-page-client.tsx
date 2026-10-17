"use client";

import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";

import { Input } from "@/Frontend/components/ui/input";

import type { getAdminUsersData } from "@/Backend/server/admin";

import { AdminDataTable, type AdminTableColumn } from "./admin-data-table";
import { AdminPageHeader, AdminPersonCell, AdminPill, adminSearchInputClass, adminSelectClass } from "./admin-ui";
import { formatDateOnly } from "./admin-utils";

type Props = {
  users: Awaited<ReturnType<typeof getAdminUsersData>>;
};

type UserRow = Props["users"][number];

export function AdminUsersPageClient({ users }: Props) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const matchesSearch =
          search.trim().length === 0 ||
          `${user.name} ${user.email}`.toLowerCase().includes(search.trim().toLowerCase());
        const matchesRole = role === "all" || user.role === role;
        return matchesSearch && matchesRole;
      }),
    [role, search, users],
  );

  const columns: Array<AdminTableColumn<UserRow>> = [
    {
      id: "name",
      header: "User",
      accessor: (row) => row.name,
      sortable: true,
      cell: (row) => <AdminPersonCell name={row.name} secondary={row.email} />,
    },
    {
      id: "role",
      header: "Role",
      accessor: (row) => row.roleLabel,
      sortable: true,
      cell: (row) => <AdminPill tone={row.role === "STUDENT" ? "gray" : "indigo"}>{row.roleLabel}</AdminPill>,
    },
    {
      id: "onboarding",
      header: "Onboarding",
      accessor: (row) => (row.onboardingComplete ? 1 : 0),
      sortable: true,
      cell: (row) => (row.onboardingComplete ? "Complete" : "In progress"),
    },
    {
      id: "verified",
      header: "Verified",
      accessor: (row) => (row.emailVerified ? 1 : 0),
      sortable: true,
      cell: (row) =>
        row.emailVerified ? <AdminPill tone="green">Email verified</AdminPill> : <AdminPill tone="amber">Pending verification</AdminPill>,
    },
    {
      id: "createdAt",
      header: "Joined",
      accessor: (row) => new Date(row.createdAt),
      sortable: true,
      cell: (row) => formatDateOnly(row.createdAt),
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="User directory"
        title="Users"
        description="Every student, mentor and admin account, with search and role filters."
      />

      <AdminDataTable
        rows={filteredUsers}
        columns={columns}
        getRowId={(row) => row.id}
        fileName="admin-users.csv"
        filtersActive={search.trim().length > 0 || role !== "all"}
        emptyStateWithoutFilters={{ icon: Users, title: "No users yet", caption: "New signups will appear here." }}
        renderToolbar={() => (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search user name or email"
                aria-label="Search user name or email"
                className={adminSearchInputClass}
              />
            </div>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              aria-label="Filter by role"
              className={adminSelectClass}
            >
              <option value="all">All roles</option>
              <option value="STUDENT">Student</option>
              <option value="MENTOR">Mentor</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        )}
      />
    </div>
  );
}

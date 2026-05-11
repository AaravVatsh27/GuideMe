"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/client/components/ui/badge";
import { Card, CardContent } from "@/client/components/ui/card";
import { Input } from "@/client/components/ui/input";

import type { getAdminUsersData } from "@/server/admin";

import { AdminDataTable, type AdminTableColumn } from "./admin-data-table";
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
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-950">{row.name}</p>
          <p className="text-xs text-slate-500">{row.email}</p>
        </div>
      ),
    },
    {
      id: "role",
      header: "Role",
      accessor: (row) => row.roleLabel,
      sortable: true,
      cell: (row) => (
        <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
          {row.roleLabel}
        </Badge>
      ),
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
      cell: (row) => (row.emailVerified ? "Email verified" : "Pending verification"),
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
      <Card className="rounded-[1.75rem] border-slate-200 bg-white">
        <CardContent className="p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">User directory</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Users</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
            Inspect signups across students, mentors, and admins with lightweight filtering across the whole account base.
          </p>
        </CardContent>
      </Card>

      <AdminDataTable
        rows={filteredUsers}
        columns={columns}
        getRowId={(row) => row.id}
        fileName="admin-users.csv"
        renderToolbar={() => (
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search user name or email"
                className="pl-9"
              />
            </div>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"
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

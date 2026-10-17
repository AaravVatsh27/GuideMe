"use client";

import { useMemo, useState } from "react";
import { Bell, Search } from "lucide-react";

import { Input } from "@/Frontend/components/ui/input";

import type { getAdminNotificationsData } from "@/Backend/server/admin";

import { AdminDataTable, type AdminTableColumn } from "./admin-data-table";
import { AdminPageHeader, AdminPill, adminSearchInputClass, adminSelectClass } from "./admin-ui";
import { formatDateTime } from "./admin-utils";

type Props = {
  notifications: Awaited<ReturnType<typeof getAdminNotificationsData>>;
};

type NotificationRow = Props["notifications"][number];

export function AdminNotificationsPageClient({ notifications }: Props) {
  const [search, setSearch] = useState("");
  const [readState, setReadState] = useState("all");

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((notification) => {
        const matchesSearch =
          search.trim().length === 0 ||
          `${notification.title} ${notification.body} ${notification.user?.name ?? ""}`.toLowerCase().includes(search.trim().toLowerCase());
        const matchesReadState =
          readState === "all" || (readState === "read" ? notification.isRead : !notification.isRead);
        return matchesSearch && matchesReadState;
      }),
    [notifications, readState, search],
  );

  const columns: Array<AdminTableColumn<NotificationRow>> = [
    {
      id: "title",
      header: "Notification",
      accessor: (row) => row.title,
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-[#0F172A]">{row.title}</p>
          <p className="text-xs text-[#64748B]">{row.body}</p>
        </div>
      ),
    },
    {
      id: "user",
      header: "Recipient",
      accessor: (row) => row.user?.name ?? "System",
      sortable: true,
      cell: (row) => row.user?.name ?? "System",
    },
    {
      id: "type",
      header: "Type",
      accessor: (row) => row.type,
      sortable: true,
      cell: (row) => <AdminPill tone="gray">{row.type}</AdminPill>,
    },
    {
      id: "isRead",
      header: "Read state",
      accessor: (row) => (row.isRead ? 1 : 0),
      sortable: true,
      cell: (row) =>
        row.isRead ? <AdminPill tone="green">Read</AdminPill> : <AdminPill tone="amber">Unread</AdminPill>,
    },
    {
      id: "createdAt",
      header: "Created",
      accessor: (row) => new Date(row.createdAt),
      sortable: true,
      cell: (row) => formatDateTime(row.createdAt),
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Notification stream"
        title="Notifications"
        description="Every notification sent to users, with read state."
      />

      <AdminDataTable
        rows={filteredNotifications}
        columns={columns}
        getRowId={(row) => row.id}
        fileName="admin-notifications.csv"
        filtersActive={search.trim().length > 0 || readState !== "all"}
        emptyStateWithoutFilters={{ icon: Bell, title: "No notifications yet", caption: "Notifications sent to users will appear here." }}
        renderToolbar={() => (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, body, or recipient"
                aria-label="Search title, body, or recipient"
                className={adminSearchInputClass}
              />
            </div>
            <select
              value={readState}
              onChange={(event) => setReadState(event.target.value)}
              aria-label="Filter by read state"
              className={adminSelectClass}
            >
              <option value="all">All</option>
              <option value="read">Read</option>
              <option value="unread">Unread</option>
            </select>
          </div>
        )}
      />
    </div>
  );
}

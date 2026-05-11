"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Badge } from "@/client/components/ui/badge";
import { Card, CardContent } from "@/client/components/ui/card";
import { Input } from "@/client/components/ui/input";

import type { getAdminNotificationsData } from "@/server/admin";

import { AdminDataTable, type AdminTableColumn } from "./admin-data-table";
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
          <p className="font-medium text-slate-950">{row.title}</p>
          <p className="text-xs text-slate-500">{row.body}</p>
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
      cell: (row) => (
        <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
          {row.type}
        </Badge>
      ),
    },
    {
      id: "isRead",
      header: "Read state",
      accessor: (row) => (row.isRead ? 1 : 0),
      sortable: true,
      cell: (row) =>
        row.isRead ? (
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
            Read
          </Badge>
        ) : (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            Unread
          </Badge>
        ),
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
      <Card className="rounded-[1.75rem] border-slate-200 bg-white">
        <CardContent className="p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Notification stream</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Notifications</h2>
        </CardContent>
      </Card>

      <AdminDataTable
        rows={filteredNotifications}
        columns={columns}
        getRowId={(row) => row.id}
        fileName="admin-notifications.csv"
        renderToolbar={() => (
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title, body, or recipient"
                className="pl-9"
              />
            </div>
            <select
              value={readState}
              onChange={(event) => setReadState(event.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"
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

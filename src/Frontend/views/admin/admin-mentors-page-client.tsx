"use client";

import type { Route } from "next";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/Frontend/components/ui/badge";
import { Button } from "@/Frontend/components/ui/button";
import { Card, CardContent } from "@/Frontend/components/ui/card";
import { Input } from "@/Frontend/components/ui/input";

import type { getAdminMentorsData } from "@/Backend/server/admin";

import { AdminDataTable, type AdminTableColumn } from "./admin-data-table";
import { AdminStatusBadge } from "./admin-status-badge";
import { formatDateOnly } from "./admin-utils";

type Props = {
  mentors: Awaited<ReturnType<typeof getAdminMentorsData>>;
};

type MentorRow = Props["mentors"][number];

export function AdminMentorsPageClient({ mentors }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("all");
  const [status, setStatus] = useState("all");
  const [bulkTier, setBulkTier] = useState("RISING");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredMentors = useMemo(() => {
    return mentors.filter((mentor) => {
      const matchesSearch =
        search.trim().length === 0 ||
        `${mentor.name} ${mentor.email} ${mentor.college}`.toLowerCase().includes(search.trim().toLowerCase());
      const matchesTier = tier === "all" || mentor.tier === tier;
      const matchesStatus =
        status === "all" ||
        (status === "pending" && (mentor.status === "PENDING" || mentor.status === "REJECTED")) ||
        (status === "verified" && mentor.status === "VERIFIED") ||
        (status === "suspended" && mentor.status === "SUSPENDED");

      return matchesSearch && matchesTier && matchesStatus;
    });
  }, [mentors, search, status, tier]);

  const columns: Array<AdminTableColumn<MentorRow>> = [
    {
      id: "name",
      header: "Mentor",
      accessor: (row) => row.name,
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-slate-950">{row.name}</p>
          <p className="text-xs text-slate-500">{row.college}</p>
        </div>
      ),
      csvValue: (row) => row.name,
    },
    {
      id: "tier",
      header: "Tier",
      accessor: (row) => row.tier,
      sortable: true,
      cell: (row) => (
        <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
          {row.tier}
        </Badge>
      ),
    },
    {
      id: "sessions",
      header: "Sessions",
      accessor: (row) => row.sessions,
      sortable: true,
    },
    {
      id: "rating",
      header: "Rating",
      accessor: (row) => row.rating,
      sortable: true,
      cell: (row) => `${row.rating.toFixed(1)} / 5`,
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => row.status,
      sortable: true,
      cell: (row) => <AdminStatusBadge status={row.status} kind="mentor" />,
    },
    {
      id: "joinedAt",
      header: "Joined",
      accessor: (row) => new Date(row.joinedAt),
      sortable: true,
      cell: (row) => formatDateOnly(row.joinedAt),
    },
  ];

  async function runBulkAction(action: "verify" | "suspend" | "change-tier", mentorIds: string[]) {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/mentors/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          action === "change-tier"
            ? { action, mentorIds, tier: bulkTier }
            : { action, mentorIds },
        ),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Bulk action failed");
      }

      toast.success("Mentor records updated");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Bulk action failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-[1.75rem] border-slate-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f8fafc_58%,_#eef6ff_100%)]">
        <CardContent className="flex flex-col gap-4 p-6 sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Mentor operations</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Mentors</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
              Review mentor quality, verify profiles in batches, suspend listings, and adjust marketplace tiering from one table.
            </p>
          </div>
        </CardContent>
      </Card>

      <AdminDataTable
        rows={filteredMentors}
        columns={columns}
        getRowId={(row) => row.id}
        fileName="admin-mentors.csv"
        onRowClick={(row) => router.push(`/admin/mentors/${row.id}` as Route)}
        renderToolbar={({ selectedRows }) => (
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search mentor, email, or college"
                className="pl-9"
              />
            </div>
            <select
              value={tier}
              onChange={(event) => setTier(event.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"
            >
              <option value="all">All tiers</option>
              <option value="RISING">Rising</option>
              <option value="VERIFIED">Verified</option>
              <option value="ELITE">Elite</option>
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="suspended">Suspended</option>
            </select>

            {selectedRows.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" disabled={isSubmitting} onClick={() => runBulkAction("verify", selectedRows.map((row) => row.id))}>
                  Verify
                </Button>
                <Button variant="outline" size="sm" disabled={isSubmitting} onClick={() => runBulkAction("suspend", selectedRows.map((row) => row.id))}>
                  Suspend
                </Button>
                <select
                  value={bulkTier}
                  onChange={(event) => setBulkTier(event.target.value)}
                  className="h-8 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-950"
                >
                  <option value="RISING">Rising</option>
                  <option value="VERIFIED">Verified</option>
                  <option value="ELITE">Elite</option>
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isSubmitting}
                  onClick={() => runBulkAction("change-tier", selectedRows.map((row) => row.id))}
                >
                  Change tier
                </Button>
              </div>
            ) : null}
          </div>
        )}
      />
    </div>
  );
}

"use client";

import type { Route } from "next";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/Frontend/components/ui/button";
import { Input } from "@/Frontend/components/ui/input";

import type { getAdminMentorsData } from "@/Backend/server/admin";
import { cn } from "@/Frontend/lib/utils";

import { AdminDataTable, type AdminTableColumn } from "./admin-data-table";
import { AdminStatusBadge } from "./admin-status-badge";
import { AdminPageHeader, AdminPersonCell, AdminPill, adminSearchInputClass, adminSelectClass } from "./admin-ui";
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
      cell: (row) => <AdminPersonCell name={row.name} secondary={row.college} image={row.image} />,
      csvValue: (row) => row.name,
    },
    {
      id: "tier",
      header: "Tier",
      accessor: (row) => row.tier,
      sortable: true,
      cell: (row) => (
        <AdminPill tone={row.tier === "VERIFIED" ? "green" : row.tier === "ELITE" ? "indigo" : "gray"}>{row.tier}</AdminPill>
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
      <AdminPageHeader
        eyebrow="Mentor operations"
        title="Mentors"
        description="Review mentor quality, verify or suspend profiles, and adjust tiers."
        stats={[{ label: "Total mentors", value: mentors.length }]}
      />

      <AdminDataTable
        rows={filteredMentors}
        columns={columns}
        getRowId={(row) => row.id}
        fileName="admin-mentors.csv"
        filtersActive={search.trim().length > 0 || tier !== "all" || status !== "all"}
        emptyStateWithoutFilters={{ icon: GraduationCap, title: "No mentors yet", caption: "Mentors appear here once they sign up." }}
        onRowClick={(row) => router.push(`/admin/mentors/${row.id}` as Route)}
        renderToolbar={({ selectedRows }) => (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search mentor, email, or college"
                aria-label="Search mentor, email, or college"
                className={adminSearchInputClass}
              />
            </div>
            <select
              value={tier}
              onChange={(event) => setTier(event.target.value)}
              aria-label="Filter by tier"
              className={adminSelectClass}
            >
              <option value="all">All tiers</option>
              <option value="RISING">Rising</option>
              <option value="VERIFIED">Verified</option>
              <option value="ELITE">Elite</option>
            </select>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
              className={adminSelectClass}
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="suspended">Suspended</option>
            </select>

            {selectedRows.length > 0 ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button size="sm" disabled={isSubmitting} onClick={() => runBulkAction("verify", selectedRows.map((row) => row.id))}>
                  Verify
                </Button>
                <Button variant="outline" size="sm" disabled={isSubmitting} onClick={() => runBulkAction("suspend", selectedRows.map((row) => row.id))}>
                  Suspend
                </Button>
                <select
                  value={bulkTier}
                  onChange={(event) => setBulkTier(event.target.value)}
                  aria-label="New tier"
                  className={cn(adminSelectClass, "h-9")}
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

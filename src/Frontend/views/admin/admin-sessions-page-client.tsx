"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Video } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/Frontend/components/ui/dialog";
import { Input } from "@/Frontend/components/ui/input";
import { Textarea } from "@/Frontend/components/ui/textarea";

import type { getAdminSessionsData } from "@/Backend/server/admin";
import { cn } from "@/Backend/server/utils";

import { AdminDataTable, type AdminTableColumn } from "./admin-data-table";
import { AdminStatusBadge } from "./admin-status-badge";
import {
  adminDangerButtonClass,
  AdminDetailRows,
  AdminPageHeader,
  adminPrimaryButtonClass,
  adminSearchInputClass,
  adminSecondaryButtonClass,
  adminSectionLabelClass,
  adminSelectClass,
} from "./admin-ui";
import { formatCurrency, formatDateTime, isDateInRange } from "./admin-utils";

type Props = {
  sessions: Awaited<ReturnType<typeof getAdminSessionsData>>;
};

type SessionRow = Props["sessions"][number];

export function AdminSessionsPageClient({ sessions }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedSession, setSelectedSession] = useState<SessionRow | null>(null);
  const [actionReason, setActionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch =
        search.trim().length === 0 ||
        `${session.student.name} ${session.mentor.name} ${session.id}`.toLowerCase().includes(search.trim().toLowerCase());
      const matchesStatus = status === "all" || session.status === status;
      const matchesRange = isDateInRange(session.scheduledAt, startDate || undefined, endDate || undefined);

      return matchesSearch && matchesStatus && matchesRange;
    });
  }, [endDate, search, sessions, startDate, status]);

  const columns: Array<AdminTableColumn<SessionRow>> = [
    {
      id: "session",
      header: "Session",
      accessor: (row) => row.id,
      sortable: true,
      cell: (row) => (
        <div>
          <p className="font-medium text-[#0F172A]">{row.student.name}</p>
          <p className="text-xs text-[#64748B]">{row.mentor.name}</p>
        </div>
      ),
      csvValue: (row) => row.id,
    },
    {
      id: "type",
      header: "Type",
      accessor: (row) => row.type,
      sortable: true,
      cell: (row) => row.typeLabel,
    },
    {
      id: "scheduledAt",
      header: "Scheduled",
      accessor: (row) => new Date(row.scheduledAt),
      sortable: true,
      cell: (row) => formatDateTime(row.scheduledAt),
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => row.status,
      sortable: true,
      cell: (row) => <AdminStatusBadge status={row.status} kind="session" />,
    },
    {
      id: "payment",
      header: "Payment",
      accessor: (row) => row.payment?.status ?? "NONE",
      sortable: true,
      cell: (row) =>
        row.payment ? <AdminStatusBadge status={row.payment.status} kind="payment" /> : <span className="text-[#64748B]">No payment</span>,
    },
    {
      id: "amount",
      header: "Amount",
      accessor: (row) => row.price,
      sortable: true,
      cell: (row) => formatCurrency(row.price),
    },
  ];

  async function runAdminAction(action: "complete" | "no_show" | "refund") {
    if (!selectedSession) {
      return;
    }

    if ((action === "no_show" || action === "refund") && !actionReason.trim()) {
      toast.error("Add a reason before running this action.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response =
        action === "refund"
          ? await fetch("/api/payment/refund", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                sessionId: selectedSession.id,
                reason: actionReason.trim(),
              }),
            })
          : await fetch(`/api/admin/sessions/${selectedSession.id}/action`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(
                action === "complete"
                  ? { action }
                  : { action, reason: actionReason.trim() },
              ),
            });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Session action failed");
      }

      toast.success("Session updated");
      setSelectedSession(null);
      setActionReason("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Session action failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Session operations"
        title="Sessions"
        description="Every session, with outcomes, refunds and no-shows one click away."
      />

      <AdminDataTable
        rows={filteredSessions}
        columns={columns}
        getRowId={(row) => row.id}
        fileName="admin-sessions.csv"
        filtersActive={search.trim().length > 0 || status !== "all" || Boolean(startDate) || Boolean(endDate)}
        emptyStateWithoutFilters={{ icon: Video, title: "No sessions yet", caption: "Sessions appear here once students book mentors." }}
        onRowClick={(row) => setSelectedSession(row)}
        renderToolbar={() => (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div className="relative min-w-[130px] flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, mentor, or session ID"
                aria-label="Search student, mentor, or session ID"
                className={adminSearchInputClass}
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
              className={cn(adminSelectClass, "w-[144px] shrink-0")}
            >
              <option value="all">All statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No show</option>
            </select>
            <div
              role="group"
              aria-label="Scheduled date range"
              className="flex h-11 shrink-0 items-center rounded-[12px] border border-[#CBD5E1] bg-white pl-3 focus-within:border-[#4F46E5] focus-within:ring-2 focus-within:ring-[#4F46E5]/20"
            >
              <label className="flex items-center gap-1.5 text-xs font-medium text-[#64748B]">
                From
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-9 w-[120px] rounded-lg border-0 bg-transparent px-1 text-[13px] text-[#0F172A] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </label>
              <span className="mx-1 h-5 w-px bg-[#E2E8F0]" aria-hidden="true" />
              <label className="flex items-center gap-1.5 pl-1.5 text-xs font-medium text-[#64748B]">
                To
                <Input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-9 w-[120px] rounded-lg border-0 bg-transparent px-1 text-[13px] text-[#0F172A] shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </label>
            </div>
          </div>
        )}
      />

      <Dialog open={Boolean(selectedSession)} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-[24px] bg-white p-0 text-[#0F172A] ring-[#EEF2FF] sm:max-w-3xl [&_[data-slot=dialog-close]]:top-4 [&_[data-slot=dialog-close]]:right-4 [&_[data-slot=dialog-close]]:text-[#64748B]">
          {selectedSession ? (
            <>
              <DialogHeader className="gap-1 border-b border-[#F1F5F9] px-6 pb-5 pt-6 pr-14">
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle className="break-all text-lg font-semibold text-[#0F172A]">Session {selectedSession.id}</DialogTitle>
                  <AdminStatusBadge status={selectedSession.status} kind="session" />
                </div>
                <DialogDescription className="text-sm text-[#64748B]">
                  {selectedSession.student.name} with {selectedSession.mentor.name} on {formatDateTime(selectedSession.scheduledAt)}.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-x-10 gap-y-6 px-6 py-5 md:grid-cols-2">
                <section>
                  <h3 className={adminSectionLabelClass}>Participants</h3>
                  <div className="mt-2">
                    <AdminDetailRows
                      rows={[
                        { label: "Student", value: `${selectedSession.student.name} (${selectedSession.student.email})` },
                        { label: "Mentor", value: `${selectedSession.mentor.name} (${selectedSession.mentor.email})` },
                        { label: "Type", value: selectedSession.typeLabel },
                        { label: "Duration", value: `${selectedSession.durationMinutes} min` },
                        { label: "Meeting link", value: selectedSession.meetingLink || "Not assigned" },
                      ]}
                    />
                  </div>
                </section>

                <section>
                  <h3 className={adminSectionLabelClass}>Financials</h3>
                  <div className="mt-2">
                    <AdminDetailRows
                      rows={[
                        { label: "Price", value: formatCurrency(selectedSession.price) },
                        { label: "Mentor earning", value: formatCurrency(selectedSession.mentorEarning) },
                        {
                          label: "Payment",
                          value: selectedSession.payment ? (
                            <AdminStatusBadge status={selectedSession.payment.status} kind="payment" />
                          ) : (
                            "No payment"
                          ),
                        },
                        {
                          label: "Payout",
                          value: selectedSession.payout ? (
                            <AdminStatusBadge status={selectedSession.payout.status} kind="payment" />
                          ) : (
                            "Not created"
                          ),
                        },
                      ]}
                    />
                  </div>
                </section>

                <section>
                  <h3 className={adminSectionLabelClass}>Summary</h3>
                  <p className="mt-2 text-sm leading-6 text-[#334155]">
                    {selectedSession.aiSummary || "No AI summary generated yet."}
                  </p>
                </section>

                <section>
                  <h3 className={adminSectionLabelClass}>Notes</h3>
                  <div className="mt-2 space-y-2 text-sm leading-6 text-[#334155]">
                    {selectedSession.notes.length > 0 ? (
                      selectedSession.notes.map((note) => (
                        <p key={note.id}>{note.content}</p>
                      ))
                    ) : (
                      <p className="text-[#64748B]">No notes saved.</p>
                    )}
                  </div>
                </section>
              </div>

              <div className="sticky bottom-0 border-t border-[#F1F5F9] bg-white px-6 pb-6 pt-4">
                <label htmlFor="session-action-reason" className="text-xs font-semibold text-[#64748B]">
                  Reason (required for refund and no-show)
                </label>
                <Textarea
                  id="session-action-reason"
                  rows={2}
                  value={actionReason}
                  onChange={(event) => setActionReason(event.target.value)}
                  placeholder="Required for refund and no-show actions. Example: Mentor did not join within 15 minutes."
                  className="mt-2 min-h-0 rounded-[12px] border-[#CBD5E1] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:border-[#4F46E5] focus-visible:ring-2 focus-visible:ring-[#4F46E5]/20"
                />

                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={adminPrimaryButtonClass}
                      disabled={isSubmitting || selectedSession.status === "COMPLETED"}
                      onClick={() => runAdminAction("complete")}
                    >
                      Mark completed
                    </button>
                    <button
                      type="button"
                      className={adminSecondaryButtonClass}
                      disabled={isSubmitting || !selectedSession.payment}
                      onClick={() => runAdminAction("refund")}
                    >
                      Trigger refund
                    </button>
                    <button
                      type="button"
                      className={adminDangerButtonClass}
                      disabled={isSubmitting}
                      onClick={() => runAdminAction("no_show")}
                    >
                      Flag as no-show
                    </button>
                  </div>
                  <button type="button" className={adminSecondaryButtonClass} onClick={() => setSelectedSession(null)}>
                    Close
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

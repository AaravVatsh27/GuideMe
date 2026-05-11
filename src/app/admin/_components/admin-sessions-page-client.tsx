"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/client/components/ui/button";
import { Card, CardContent } from "@/client/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/client/components/ui/dialog";
import { Input } from "@/client/components/ui/input";
import { Textarea } from "@/client/components/ui/textarea";

import type { getAdminSessionsData } from "@/server/admin";

import { AdminDataTable, type AdminTableColumn } from "./admin-data-table";
import { AdminStatusBadge } from "./admin-status-badge";
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
          <p className="font-medium text-slate-950">{row.student.name}</p>
          <p className="text-xs text-slate-500">{row.mentor.name}</p>
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
        row.payment ? <AdminStatusBadge status={row.payment.status} kind="payment" /> : <span className="text-slate-500">No payment</span>,
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
      <Card className="rounded-[1.75rem] border-slate-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f8fafc_58%,_#eef6ff_100%)]">
        <CardContent className="p-6 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Session operations</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Sessions</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            Inspect every session, filter by status and date range, then jump into detail to mark outcomes, issue refunds, or record mentor no-shows.
          </p>
        </CardContent>
      </Card>

      <AdminDataTable
        rows={filteredSessions}
        columns={columns}
        getRowId={(row) => row.id}
        fileName="admin-sessions.csv"
        onRowClick={(row) => setSelectedSession(row)}
        renderToolbar={() => (
          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative min-w-[240px] flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search student, mentor, or session ID"
                className="pl-9"
              />
            </div>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950"
            >
              <option value="all">All statuses</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ONGOING">Ongoing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No show</option>
            </select>
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
        )}
      />

      <Dialog open={Boolean(selectedSession)} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="max-w-3xl">
          {selectedSession ? (
            <>
              <DialogHeader>
                <DialogTitle>Session {selectedSession.id}</DialogTitle>
                <DialogDescription>
                  {selectedSession.student.name} with {selectedSession.mentor.name} on {formatDateTime(selectedSession.scheduledAt)}.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Participants</p>
                  <p className="mt-2">Student: {selectedSession.student.name} ({selectedSession.student.email})</p>
                  <p className="mt-1">Mentor: {selectedSession.mentor.name} ({selectedSession.mentor.email})</p>
                  <p className="mt-3">Type: {selectedSession.typeLabel}</p>
                  <p className="mt-1">Duration: {selectedSession.durationMinutes} min</p>
                  <p className="mt-1">Meeting link: {selectedSession.meetingLink || "Not assigned"}</p>
                </div>

                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Financials</p>
                  <p className="mt-2">Price: {formatCurrency(selectedSession.price)}</p>
                  <p className="mt-1">Mentor earning: {formatCurrency(selectedSession.mentorEarning)}</p>
                  <p className="mt-1">
                    Payment:{" "}
                    {selectedSession.payment ? selectedSession.payment.status : "No payment"}
                  </p>
                  <p className="mt-1">
                    Payout: {selectedSession.payout ? selectedSession.payout.status : "Not created"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                  <p className="font-medium text-slate-950">Summary</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {selectedSession.aiSummary || "No AI summary generated yet."}
                  </p>
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-white p-4">
                  <p className="font-medium text-slate-950">Notes</p>
                  <div className="mt-2 space-y-2 text-sm text-slate-600">
                    {selectedSession.notes.length > 0 ? (
                      selectedSession.notes.map((note) => (
                        <p key={note.id}>{note.content}</p>
                      ))
                    ) : (
                      <p>No notes saved.</p>
                    )}
                  </div>
                </div>
              </div>

              <Textarea
                value={actionReason}
                onChange={(event) => setActionReason(event.target.value)}
                placeholder="Required for refund and no-show actions. Example: Mentor did not join within 15 minutes."
                className="min-h-28"
              />

              <DialogFooter>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    <Button disabled={isSubmitting || selectedSession.status === "COMPLETED"} onClick={() => runAdminAction("complete")}>
                      Mark completed
                    </Button>
                    <Button
                      variant="outline"
                      disabled={isSubmitting || !selectedSession.payment}
                      onClick={() => runAdminAction("refund")}
                    >
                      Trigger refund
                    </Button>
                    <Button variant="destructive" disabled={isSubmitting} onClick={() => runAdminAction("no_show")}>
                      Flag as no-show
                    </Button>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedSession(null)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

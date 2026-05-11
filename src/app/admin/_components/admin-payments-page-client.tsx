"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card";
import { Input } from "@/client/components/ui/input";

import type { getAdminPaymentsData } from "@/server/admin";

import { AdminDataTable, type AdminTableColumn } from "./admin-data-table";
import { AdminStatusBadge } from "./admin-status-badge";
import { formatCurrency, formatDateTime } from "./admin-utils";

type Props = {
  data: Awaited<ReturnType<typeof getAdminPaymentsData>>;
};

type PaymentRow = Props["data"]["payments"][number];

export function AdminPaymentsPageClient({ data }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [upiId, setUpiId] = useState("");
  const [selectedPayoutIds, setSelectedPayoutIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredPayments = useMemo(
    () =>
      data.payments.filter((payment) =>
        `${payment.user.name} ${payment.session.mentor.name} ${payment.id}`.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [data.payments, search],
  );

  const columns: Array<AdminTableColumn<PaymentRow>> = [
    {
      id: "amount",
      header: "Amount",
      accessor: (row) => row.amount,
      sortable: true,
      cell: (row) => formatCurrency(row.amount),
    },
    {
      id: "student",
      header: "Student",
      accessor: (row) => row.user.name,
      sortable: true,
      cell: (row) => row.user.name,
    },
    {
      id: "mentor",
      header: "Mentor",
      accessor: (row) => row.session.mentor.name,
      sortable: true,
      cell: (row) => row.session.mentor.name,
    },
    {
      id: "status",
      header: "Status",
      accessor: (row) => row.status,
      sortable: true,
      cell: (row) => <AdminStatusBadge status={row.status} kind="payment" />,
    },
    {
      id: "date",
      header: "Date",
      accessor: (row) => new Date(row.paidAt ?? row.createdAt),
      sortable: true,
      cell: (row) => formatDateTime(row.paidAt ?? row.createdAt),
    },
  ];

  async function processPayouts() {
    if (!transactionId.trim()) {
      toast.error("Transaction ID is required before processing payouts.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payouts/process", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payoutIds: selectedPayoutIds.length > 0 ? selectedPayoutIds : undefined,
          transactionId: transactionId.trim(),
          upiId: upiId.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to process payouts");
      }

      toast.success("Payouts processed");
      setSelectedPayoutIds([]);
      setTransactionId("");
      setUpiId("");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to process payouts");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Total collected", value: formatCurrency(data.analytics.totalCollected) },
          { label: "Total paid out", value: formatCurrency(data.analytics.totalPaidOut) },
          { label: "Platform retained", value: formatCurrency(data.analytics.platformRetained) },
        ].map((item) => (
          <Card key={item.label} className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="rounded-[1.75rem] border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-slate-950">Pending payouts queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
            <Input
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              placeholder="Transaction ID"
            />
            <Input value={upiId} onChange={(event) => setUpiId(event.target.value)} placeholder="UPI confirmation ID" />
            <Button disabled={isSubmitting || data.pendingPayouts.length === 0} onClick={processPayouts}>
              Process payout
            </Button>
          </div>

          <div className="overflow-x-auto rounded-[1.25rem] border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium" />
                  <th className="px-4 py-3 font-medium">Mentor</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Scheduled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.pendingPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                      No pending payouts.
                    </td>
                  </tr>
                ) : (
                  data.pendingPayouts.map((payout) => {
                    const isSelected = selectedPayoutIds.includes(payout.id);

                    return (
                      <tr key={payout.id}>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() =>
                              setSelectedPayoutIds((current) =>
                                current.includes(payout.id)
                                  ? current.filter((id) => id !== payout.id)
                                  : [...current, payout.id],
                              )
                            }
                          />
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-950">{payout.mentor.name}</td>
                        <td className="px-4 py-4 text-slate-700">{payout.session.student.name}</td>
                        <td className="px-4 py-4 text-slate-700">{formatCurrency(payout.amount)}</td>
                        <td className="px-4 py-4 text-slate-700">{formatDateTime(payout.scheduledAt ?? payout.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <AdminDataTable
        rows={filteredPayments}
        columns={columns}
        getRowId={(row) => row.id}
        fileName="admin-payments.csv"
        renderToolbar={() => (
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, mentor, or payment ID"
              className="pl-9"
            />
          </div>
        )}
      />
    </div>
  );
}

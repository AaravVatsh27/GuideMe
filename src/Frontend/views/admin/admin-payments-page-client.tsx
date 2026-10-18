"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, IndianRupee, PiggyBank, Search, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/Frontend/components/ui/input";

import type { getAdminPaymentsData } from "@/Backend/server/admin";
import { cn } from "@/Frontend/lib/utils";

import { AdminDataTable, type AdminTableColumn } from "./admin-data-table";
import { AdminStatusBadge } from "./admin-status-badge";
import {
  adminCardClass,
  AdminCheckbox,
  adminFieldClass,
  AdminPageHeader,
  adminSearchInputClass,
} from "./admin-ui";
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
      cell: (row) => <span className="font-medium text-[#0F172A]">{row.user.name}</span>,
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

    if (selectedPayoutIds.length === 0) {
      toast.error("Select the payouts covered by this transaction.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/payouts/process", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          payoutIds: selectedPayoutIds,
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
      <AdminPageHeader
        eyebrow="Payment operations"
        title="Payments"
        description="Track collected funds and process mentor payouts."
      />

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Total collected",
            value: formatCurrency(data.analytics.totalCollected),
            caption: "Gross amount received",
            icon: IndianRupee,
            tone: "bg-[#EEF2FF] text-[#4F46E5]",
          },
          {
            label: "Total paid out",
            value: formatCurrency(data.analytics.totalPaidOut),
            caption: "Paid to mentors",
            icon: Wallet,
            tone: "bg-[#DCFCE7] text-[#166534]",
          },
          {
            label: "Platform retained",
            value: formatCurrency(data.analytics.platformRetained),
            caption: "Kept by Mentra",
            icon: PiggyBank,
            tone: "bg-[#FEF3C7] text-[#92400E]",
          },
        ].map((item) => (
          <div key={item.label} className={cn(adminCardClass, "p-5")}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#64748B]">{item.label}</p>
              <span className={cn("flex size-9 items-center justify-center rounded-xl", item.tone)}>
                <item.icon className="size-[18px]" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">{item.value}</p>
            <p className="mt-1 text-[13px] text-[#64748B]">{item.caption}</p>
          </div>
        ))}
      </section>

      <section className={cn(adminCardClass, "space-y-5 p-5 sm:p-6")}>
        <h2 className="text-lg font-semibold text-[#0F172A]">Pending payouts queue</h2>
        <div className="grid items-end gap-3 lg:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#64748B]">Transaction ID</span>
            <Input
              value={transactionId}
              onChange={(event) => setTransactionId(event.target.value)}
              placeholder="Enter the transaction ID"
              className={adminFieldClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#64748B]">UPI confirmation ID</span>
            <Input
              value={upiId}
              onChange={(event) => setUpiId(event.target.value)}
              placeholder="Optional"
              className={adminFieldClass}
            />
          </label>
          <button
            type="button"
            disabled={isSubmitting || data.pendingPayouts.length === 0}
            onClick={processPayouts}
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#4F46E5] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#4F46E5]"
          >
            Process payout
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[12px] uppercase tracking-[0.05em] text-[#64748B]">
                <th className="w-12 px-4 py-3 text-left font-medium">
                  <span className="sr-only">Select</span>
                </th>
                <th className="px-4 py-3 text-left font-medium">Mentor</th>
                <th className="px-4 py-3 text-left font-medium">Student</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Scheduled</th>
              </tr>
            </thead>
            <tbody>
                {data.pendingPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#64748B]">
                      No pending payouts.
                    </td>
                  </tr>
                ) : (
                  data.pendingPayouts.map((payout) => {
                    const isSelected = selectedPayoutIds.includes(payout.id);

                    return (
                      <tr key={payout.id} className="h-16 border-b border-[#F1F5F9] transition-colors last:border-b-0 hover:bg-[#F8FAFC]">
                        <td className="px-4 py-3">
                          <AdminCheckbox
                            aria-label={`Select payout for ${payout.mentor.name}`}
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
                        <td className="px-4 py-3 font-medium text-[#0F172A]">{payout.mentor.name}</td>
                        <td className="px-4 py-3 text-[#334155]">{payout.session.student.name}</td>
                        <td className="px-4 py-3 text-[#334155]">{formatCurrency(payout.amount)}</td>
                        <td className="px-4 py-3 text-[#334155]">{formatDateTime(payout.scheduledAt ?? payout.createdAt)}</td>
                      </tr>
                    );
                  })
                )}
            </tbody>
          </table>
        </div>
      </section>

      <AdminDataTable
        rows={filteredPayments}
        columns={columns}
        getRowId={(row) => row.id}
        fileName="admin-payments.csv"
        filtersActive={search.trim().length > 0}
        emptyStateWithoutFilters={{ icon: CreditCard, title: "No payments yet", caption: "Payments appear here once students pay for sessions." }}
        renderToolbar={() => (
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search student, mentor, or payment ID"
              aria-label="Search student, mentor, or payment ID"
              className={adminSearchInputClass}
            />
          </div>
        )}
      />
    </div>
  );
}

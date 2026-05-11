"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, IndianRupee, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";

import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card";
import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";

import type { MentorDashboardData } from "./mentor-dashboard-data";
import { formatCurrency, formatDateOnly, formatShortDateTime } from "./mentor-dashboard-utils";

type Props = {
  mentorId: string;
  mentorName: string;
  earnings: MentorDashboardData["earnings"];
};

type LocalUpiState = {
  upiId: string;
  verified: boolean;
};

function escapePdfText(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function createPdfBlob(title: string, lines: string[]) {
  const pageLineCapacity = 42;
  const pages = Array.from({ length: Math.max(1, Math.ceil(lines.length / pageLineCapacity)) }, (_, index) =>
    lines.slice(index * pageLineCapacity, (index + 1) * pageLineCapacity),
  );
  const pageObjectIds = pages.map((_, index) => 3 + index * 2);
  const contentObjectIds = pages.map((_, index) => 4 + index * 2);
  const fontObjectId = 3 + pages.length * 2;
  const objects: string[] = [];

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj");
  objects.push(`2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] >>\nendobj`);

  pages.forEach((pageLines, index) => {
    const pageId = pageObjectIds[index];
    const contentId = contentObjectIds[index];
    const content = [
      "BT",
      "/F1 16 Tf",
      "50 760 Td",
      `(${escapePdfText(index === 0 ? title : `${title} (cont.)`)}) Tj`,
      "/F1 10 Tf",
      "0 -22 Td",
      `(${escapePdfText(`Generated on ${new Date().toLocaleString("en-IN")}`)}) Tj`,
      ...pageLines.flatMap((line) => ["0 -16 Td", `(${escapePdfText(line)}) Tj`]),
      "ET",
    ].join("\n");

    objects.push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj`,
    );
    objects.push(`${contentId} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`);
  });

  objects.push(`${fontObjectId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`);

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += `${object}\n`;
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "PAID":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "PROCESSING":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

export function MentorEarningsPageClient({ mentorId, mentorName, earnings }: Props) {
  const [upiState, setUpiState] = useState<LocalUpiState>({
    upiId: earnings.payouts.find((item) => item.upiId)?.upiId ?? "",
    verified: false,
  });

  useEffect(() => {
    const raw = window.localStorage.getItem(`mentor-dashboard:${mentorId}:upi`);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<LocalUpiState>;
      setUpiState({
        upiId: parsed.upiId ?? "",
        verified: Boolean(parsed.verified),
      });
    } catch {
      // ignore malformed local state
    }
  }, [mentorId]);

  useEffect(() => {
    window.localStorage.setItem(`mentor-dashboard:${mentorId}:upi`, JSON.stringify(upiState));
  }, [mentorId, upiState]);

  const chartData = useMemo(
    () =>
      earnings.weeklyEarnings.map((item) => ({
        label: formatDateOnly(item.weekOf).slice(0, 6),
        amount: item.amount,
      })),
    [earnings.weeklyEarnings],
  );

  function verifyUpi() {
    const normalized = upiState.upiId.trim();
    const isValid = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z]{2,64}$/.test(normalized);

    if (!isValid) {
      setUpiState((current) => ({ ...current, verified: false }));
      toast.error("Enter a valid UPI ID before verifying.");
      return;
    }

    setUpiState({ upiId: normalized, verified: true });
    toast.success("UPI ID verified");
  }

  function downloadStatementPdf() {
    const lines = [
      `Mentor: ${mentorName}`,
      `All time earnings: ${formatCurrency(earnings.totalEarned)}`,
      `This month: ${formatCurrency(earnings.thisMonthEarnings)}`,
      `Pending payout: ${formatCurrency(earnings.pendingPayout)}`,
      "",
      "Sessions",
      ...earnings.statementSessions.map(
        (session) =>
          `${formatDateOnly(session.completedAt)} | ${session.studentName} | ${session.sessionType} ${session.durationMinutes}m | Gross ${formatCurrency(session.grossAmount)} | Net ${formatCurrency(session.mentorEarning)} | ${session.payoutStatus}${session.transactionId ? ` | ${session.transactionId}` : ""}`,
      ),
    ];

    const blob = createPdfBlob("GuideMe Mentor Statement", lines);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mentor-statement.pdf";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-[1.75rem] border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_24%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_60%,_#ecfeff_100%)]">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
              Payout desk
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Earnings</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Track weekly earnings velocity, keep payout history clean, and export a full statement without leaving the dashboard.
            </p>
          </div>
          <Button variant="outline" onClick={downloadStatementPdf}>
            <Download className="size-4" />
            Download statement
          </Button>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          { label: "All time", value: formatCurrency(earnings.totalEarned), icon: IndianRupee },
          { label: "This month", value: formatCurrency(earnings.thisMonthEarnings), icon: Wallet },
          { label: "Pending payout", value: formatCurrency(earnings.pendingPayout), icon: CheckCircle2 },
        ].map((item) => (
          <Card key={item.label} className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <span className="flex size-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                  <item.icon className="size-4" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="text-lg text-slate-950">Last 8 weeks</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis
                  tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: "#f1f5f9" }}
                  formatter={(value) => [formatCurrency(typeof value === "number" ? value : Number(value ?? 0)), "Earnings"]}
                />
                <Bar dataKey="amount" fill="#14b8a6" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">UPI ID management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mentor-upi">UPI ID</Label>
                <Input
                  id="mentor-upi"
                  value={upiState.upiId}
                  onChange={(event) =>
                    setUpiState((current) => ({ ...current, upiId: event.target.value, verified: false }))
                  }
                  placeholder="name@upi"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={verifyUpi}>Verify</Button>
                <Button variant="outline" onClick={() => toast.success("UPI ID updated")}>
                  Save UPI ID
                </Button>
                {upiState.verified ? (
                  <Badge className="bg-emerald-600 text-white">Verified</Badge>
                ) : (
                  <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                    Not verified
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Next payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-3xl font-semibold tracking-tight text-slate-950">
                {earnings.nextPayout ? formatCurrency(earnings.nextPayout.amount) : formatCurrency(0)}
              </p>
              <p className="text-sm text-slate-600">
                {earnings.nextPayout
                  ? `Scheduled ${formatShortDateTime(earnings.nextPayout.date)}`
                  : "No payout is scheduled yet."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-[1.75rem] border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-slate-950">Payout history</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="py-3 pr-4 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Transaction ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {earnings.payouts.map((payout) => (
                <tr key={payout.id}>
                  <td className="py-4 pr-4 text-slate-700">{formatDateOnly(payout.date)}</td>
                  <td className="px-4 py-4 font-medium text-slate-950">{formatCurrency(payout.amount)}</td>
                  <td className="px-4 py-4">
                    <Badge variant="outline" className={getStatusBadgeClass(payout.status)}>
                      {payout.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{payout.transactionId ?? "Pending"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { AlertTriangle, BarChart3, CheckCircle2, IndianRupee, TrendingUp, UserCheck, Users, Video } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/Frontend/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";

import type { getAdminOverviewData } from "@/Backend/server/admin";

import { AdminStatusBadge } from "./admin-status-badge";
import { formatCurrency, formatDateTime } from "./admin-utils";

type Props = {
  data: Awaited<ReturnType<typeof getAdminOverviewData>>;
};

export function AdminOverviewClient({ data }: Props) {
  const alertCount =
    data.alerts.failedPayments.length + data.alerts.mentorNoShows.length + data.alerts.flaggedReviews.length;
  const totalRevenueLast30Days = data.revenueLast30Days.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total users",
            value: data.kpis.totalUsersToday.toLocaleString("en-IN"),
            caption: "Students and mentors",
            icon: Users,
            tone: "bg-sky-50 text-sky-700",
          },
          {
            label: "Sessions today",
            value: data.kpis.sessionsToday.toLocaleString("en-IN"),
            caption: "Scheduled for today",
            icon: Video,
            tone: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Revenue today",
            value: formatCurrency(data.kpis.revenueToday),
            caption: "Collected today",
            icon: IndianRupee,
            tone: "bg-amber-50 text-amber-700",
          },
          {
            label: "Active mentors",
            value: data.kpis.activeMentors.toLocaleString("en-IN"),
            caption: "Approved and live",
            icon: UserCheck,
            tone: "bg-violet-50 text-violet-700",
          },
        ].map((item) => (
          <Card key={item.label} className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">{item.label}</p>
                <span className={`flex size-10 items-center justify-center rounded-xl ${item.tone}`}>
                  <item.icon className="size-5" />
                </span>
              </div>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-[#0F172A]">{item.value}</p>
              <p className="mt-1 text-[13px] text-[#64748B]">{item.caption}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid items-stretch gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <TrendingUp className="size-5 text-teal-700" />
              Revenue last 30 days
            </CardTitle>
            <span className="text-sm text-[#64748B]">
              ₹{totalRevenueLast30Days.toLocaleString("en-IN")} total
            </span>
          </CardHeader>
          <CardContent className={totalRevenueLast30Days === 0 ? "flex items-center justify-center py-12" : "h-[320px]"}>
            {totalRevenueLast30Days === 0 ? (
              <div className="flex flex-col items-center text-center">
                <BarChart3 className="size-8 text-slate-300" aria-hidden="true" />
                <p className="mt-3 text-base font-semibold text-[#0F172A]">No revenue yet</p>
                <p className="mt-1 text-[13px] text-[#64748B]">
                  Revenue will appear here after the first paid session.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueLast30Days} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                  <YAxis
                    domain={[0, "auto"]}
                    allowDecimals={false}
                    tickCount={4}
                    tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#0f766e"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <AlertTriangle className="size-5 text-amber-700" />
              Alerts
            </CardTitle>
            <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
              {alertCount}
            </Badge>
          </CardHeader>
          <CardContent>
            {alertCount === 0 ? (
              <div className="flex min-h-[140px] flex-col items-center justify-center text-center">
                <CheckCircle2 className="size-8 text-emerald-500" aria-hidden="true" />
                <p className="mt-3 text-base font-semibold text-[#0F172A]">All clear</p>
                <p className="mt-1 text-[13px] text-[#64748B]">
                  No failed payments, no-shows, or flagged reviews right now.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.alerts.failedPayments.length > 0 ? (
                  <Link
                    href="/admin/payments"
                    className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-rose-100"
                  >
                    <span>Failed payments</span>
                    <span className="font-semibold text-rose-700">{data.alerts.failedPayments.length}</span>
                  </Link>
                ) : null}
                {data.alerts.mentorNoShows.length > 0 ? (
                  <Link
                    href="/admin/sessions"
                    className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-amber-100"
                  >
                    <span>Mentor no-shows</span>
                    <span className="font-semibold text-amber-700">{data.alerts.mentorNoShows.length}</span>
                  </Link>
                ) : null}
                {data.alerts.flaggedReviews.length > 0 ? (
                  <Link
                    href="/admin/notifications"
                    className="flex items-center justify-between rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-medium text-slate-950 transition-colors hover:bg-sky-100"
                  >
                    <span>Flagged reviews</span>
                    <span className="font-semibold text-sky-700">{data.alerts.flaggedReviews.length}</span>
                  </Link>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.75rem] border-slate-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-lg text-slate-950">Recent sessions</CardTitle>
          {data.recentSessions.length > 0 ? (
            <Link
              href="/admin/sessions"
              className="text-sm font-medium text-[#4F46E5] transition-colors hover:text-[#3730A3] hover:underline"
            >
              View all
            </Link>
          ) : null}
        </CardHeader>
        <CardContent className={data.recentSessions.length === 0 ? "flex items-center justify-center py-4" : "overflow-x-auto"}>
          {data.recentSessions.length === 0 ? (
            <div className="flex flex-col items-center text-center">
              <Video className="size-8 text-slate-300" aria-hidden="true" />
              <p className="mt-3 text-base font-semibold text-[#0F172A]">No sessions yet</p>
              <p className="mt-1 text-[13px] text-[#64748B]">
                Sessions will appear here once students start booking mentors.
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
              <thead>
                <tr className="text-[12px] uppercase tracking-[0.05em] text-[#64748B]">
                  <th className="py-3 pr-4 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Mentor</th>
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.recentSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="py-4 pr-4 font-medium text-slate-950">{session.studentName}</td>
                    <td className="px-4 py-4 text-slate-700">{session.mentorName}</td>
                    <td className="px-4 py-4 text-slate-700">{formatDateTime(session.scheduledAt)}</td>
                    <td className="px-4 py-4">
                      <AdminStatusBadge status={session.status} kind="session" />
                    </td>
                    <td className="px-4 py-4">
                      {session.paymentStatus ? (
                        <AdminStatusBadge status={session.paymentStatus} kind="payment" />
                      ) : (
                        <span className="text-slate-500">No payment</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

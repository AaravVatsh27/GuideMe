"use client";

import { AlertTriangle, IndianRupee, TrendingUp, UserCheck, Users, Video } from "lucide-react";
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

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total users today",
            value: data.kpis.totalUsersToday.toLocaleString("en-IN"),
            icon: Users,
            tone: "bg-sky-50 text-sky-700",
          },
          {
            label: "Sessions today",
            value: data.kpis.sessionsToday.toLocaleString("en-IN"),
            icon: Video,
            tone: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Revenue today",
            value: formatCurrency(data.kpis.revenueToday),
            icon: IndianRupee,
            tone: "bg-amber-50 text-amber-700",
          },
          {
            label: "Active mentors",
            value: data.kpis.activeMentors.toLocaleString("en-IN"),
            icon: UserCheck,
            tone: "bg-violet-50 text-violet-700",
          },
        ].map((item) => (
          <Card key={item.label} className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
                <span className={`flex size-11 items-center justify-center rounded-2xl ${item.tone}`}>
                  <item.icon className="size-5" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <TrendingUp className="size-5 text-teal-700" />
              Revenue last 30 days
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueLast30Days} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis
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
                  dot={{ r: 2, fill: "#14b8a6" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
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
          <CardContent className="space-y-4">
            <div className="rounded-[1.25rem] border border-rose-200 bg-rose-50 p-4">
              <p className="font-medium text-slate-950">Failed payments</p>
              <p className="mt-1 text-sm text-slate-600">{data.alerts.failedPayments.length} unresolved records.</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {data.alerts.failedPayments.slice(0, 3).map((payment) => (
                  <p key={payment.id}>
                    {payment.studentName} • {formatCurrency(payment.amount)}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50 p-4">
              <p className="font-medium text-slate-950">Mentor no-shows</p>
              <p className="mt-1 text-sm text-slate-600">{data.alerts.mentorNoShows.length} recent incidents.</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {data.alerts.mentorNoShows.slice(0, 3).map((session) => (
                  <p key={session.id}>
                    {session.mentorName} • {formatDateTime(session.scheduledAt)}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-sky-200 bg-sky-50 p-4">
              <p className="font-medium text-slate-950">Flagged reviews</p>
              <p className="mt-1 text-sm text-slate-600">{data.alerts.flaggedReviews.length} pending moderation items.</p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                {data.alerts.flaggedReviews.slice(0, 3).map((entry) => (
                  <p key={entry.id}>
                    {entry.actorName} • review {entry.reviewId.slice(0, 8)}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.75rem] border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-lg text-slate-950">Recent sessions</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
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
        </CardContent>
      </Card>
    </div>
  );
}

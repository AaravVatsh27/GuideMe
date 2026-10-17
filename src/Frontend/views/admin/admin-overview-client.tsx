"use client";

import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock,
  IndianRupee,
  PlayCircle,
  RotateCcw,
  TrendingUp,
  Video,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Badge } from "@/Frontend/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";

import type { getAdminOverviewData } from "@/Backend/server/admin";

import { usePendingVerificationCount } from "./admin-shell";
import { formatCurrency } from "./admin-utils";

type Props = {
  data: Awaited<ReturnType<typeof getAdminOverviewData>>;
};

type OverviewSession = Props["data"]["recentSessions"][number];

const pillTones = {
  indigo: "bg-[#EEF2FF] text-[#4F46E5]",
  amber: "bg-[#FEF3C7] text-[#92400E]",
  green: "bg-[#DCFCE7] text-[#166534]",
  red: "bg-[#FEE2E2] text-[#991B1B]",
} as const;

type Pill = { label: string; tone: keyof typeof pillTones; icon: LucideIcon };

const sessionStatusPills: Record<OverviewSession["status"], Pill> = {
  SCHEDULED: { label: "Scheduled", tone: "indigo", icon: CalendarClock },
  ONGOING: { label: "In progress", tone: "amber", icon: PlayCircle },
  COMPLETED: { label: "Completed", tone: "green", icon: CheckCircle2 },
  CANCELLED: { label: "Cancelled", tone: "red", icon: XCircle },
  NO_SHOW: { label: "No-show", tone: "red", icon: XCircle },
};

const paymentStatusPills: Record<NonNullable<OverviewSession["paymentStatus"]>, Pill> = {
  CAPTURED: { label: "Paid", tone: "green", icon: CheckCircle2 },
  PENDING: { label: "Pending", tone: "amber", icon: Clock },
  FAILED: { label: "Failed", tone: "red", icon: XCircle },
  REFUNDED: { label: "Refunded", tone: "red", icon: RotateCcw },
  PARTIALLY_REFUNDED: { label: "Partially refunded", tone: "red", icon: RotateCcw },
};

const sessionTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

// e.g. "6 Mon, 4:00 PM"
function formatSessionTime(value: Date | string) {
  const parts = Object.fromEntries(
    sessionTimeFormatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]),
  );

  return `${parts.day} ${parts.weekday}, ${parts.hour}:${parts.minute} ${(parts.dayPeriod ?? "").toUpperCase()}`.trim();
}

function StatusPill({ label, tone, icon: Icon }: Pill) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${pillTones[tone]}`}>
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}

function PersonCell({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";

  return (
    <span className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] text-xs font-semibold text-[#4F46E5]" aria-hidden="true">
        {initials}
      </span>
      <span className="truncate text-sm text-[#0F172A]">{name}</span>
    </span>
  );
}

export function AdminOverviewClient({ data }: Props) {
  const alertCount =
    data.alerts.failedPayments.length + data.alerts.mentorNoShows.length + data.alerts.flaggedReviews.length;
  const totalRevenueLast30Days = data.revenueLast30Days.reduce((sum, entry) => sum + entry.amount, 0);
  const pendingVerificationCount = usePendingVerificationCount();
  const headerStats = [
    { label: "Pending reviews", value: pendingVerificationCount },
    { label: "Active mentors", value: data.kpis.activeMentors },
    { label: "Total users", value: data.kpis.totalUsersToday },
  ];

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-8 rounded-[24px] border border-[#EEF2FF] bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[36px] font-bold leading-tight tracking-tight text-[#0F172A]">Platform overview</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <p className="text-sm text-[#64748B]">
              {pendingVerificationCount > 0
                ? `${pendingVerificationCount.toLocaleString("en-IN")} mentor ${pendingVerificationCount === 1 ? "application" : "applications"} waiting for review`
                : "No applications waiting. You're all caught up."}
            </p>
            {pendingVerificationCount > 0 ? (
              <Link
                href="/admin/mentors/verification"
                className="inline-flex h-9 items-center rounded-full bg-[#4F46E5] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2"
              >
                Review applications
              </Link>
            ) : null}
          </div>
        </div>

        <dl className="flex shrink-0 divide-x divide-[#E2E8F0]">
          {headerStats.map((stat) => (
            <div key={stat.label} className="flex flex-col px-4 first:pl-0 last:pr-0 sm:px-8">
              <dt className="mt-1 text-sm text-[#64748B]">{stat.label}</dt>
              <dd className="order-first text-[40px] font-bold leading-none tracking-tight text-[#0F172A]">{stat.value.toLocaleString("en-IN")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {[
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
        <Card className="rounded-[24px] border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <TrendingUp className="size-5 text-teal-700" />
              Revenue last 30 days
            </CardTitle>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm text-[#64748B]">
                ₹{totalRevenueLast30Days.toLocaleString("en-IN")} total
              </span>
              <span className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-0.5 text-xs font-medium text-[#334155]">
                Last 30 days
              </span>
            </div>
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
                <AreaChart data={data.revenueLast30Days} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="admin-revenue-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#E2E8F0" />
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
                    cursor={{ stroke: "#E2E8F0" }}
                    contentStyle={{ backgroundColor: "#0F172A", border: "none", borderRadius: 12, padding: "8px 12px" }}
                    labelStyle={{ color: "#FFFFFF", fontSize: 12, fontWeight: 600 }}
                    itemStyle={{ color: "#FFFFFF", fontSize: 12 }}
                    formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    fill="url(#admin-revenue-fill)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#4F46E5", stroke: "#FFFFFF", strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[24px] border-transparent! bg-[linear-gradient(135deg,#4F46E5_0%,#7C3AED_100%)] text-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <AlertTriangle className="size-5 text-white" />
              Alerts
            </CardTitle>
            <Badge variant="outline" className="rounded-full border-transparent bg-white/20 text-white">
              {alertCount}
            </Badge>
          </CardHeader>
          <CardContent>
            {alertCount === 0 ? (
              <div className="flex min-h-[140px] flex-col items-center justify-center text-center">
                <CheckCircle2 className="size-8 text-white" aria-hidden="true" />
                <p className="mt-3 text-base font-semibold text-white">All clear</p>
                <p className="mt-1 text-[13px] text-white/80">
                  No failed payments, no-shows, or flagged reviews right now.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.alerts.failedPayments.length > 0 ? (
                  <Link
                    href="/admin/payments"
                    className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-red-400" aria-hidden="true" />
                      Failed payments
                    </span>
                    <span className="font-semibold text-white">{data.alerts.failedPayments.length}</span>
                  </Link>
                ) : null}
                {data.alerts.mentorNoShows.length > 0 ? (
                  <Link
                    href="/admin/sessions"
                    className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-amber-300" aria-hidden="true" />
                      Mentor no-shows
                    </span>
                    <span className="font-semibold text-white">{data.alerts.mentorNoShows.length}</span>
                  </Link>
                ) : null}
                {data.alerts.flaggedReviews.length > 0 ? (
                  <Link
                    href="/admin/notifications"
                    className="flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-white/15"
                  >
                    <span className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-sky-300" aria-hidden="true" />
                      Flagged reviews
                    </span>
                    <span className="font-semibold text-white">{data.alerts.flaggedReviews.length}</span>
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
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[12px] uppercase tracking-[0.05em] text-[#64748B]">
                  <th className="px-3 py-3 font-medium">Student</th>
                  <th className="px-3 py-3 font-medium">Mentor</th>
                  <th className="px-3 py-3 font-medium">Time</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Payment</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSessions.map((session) => (
                  <tr key={session.id} className="h-16 border-b border-[#F1F5F9] transition-colors last:border-b-0 hover:bg-[#F8FAFC]">
                    <td className="px-3">
                      <PersonCell name={session.studentName} />
                    </td>
                    <td className="px-3">
                      <PersonCell name={session.mentorName} />
                    </td>
                    <td className="whitespace-nowrap px-3 text-sm text-[#334155]">{formatSessionTime(session.scheduledAt)}</td>
                    <td className="px-3">
                      <StatusPill {...sessionStatusPills[session.status]} />
                    </td>
                    <td className="px-3">
                      {session.paymentStatus ? (
                        <StatusPill {...paymentStatusPills[session.paymentStatus]} />
                      ) : (
                        <span className="text-sm text-[#64748B]">No payment</span>
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

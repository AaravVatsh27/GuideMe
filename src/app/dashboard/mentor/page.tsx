import Link from "next/link";
import { CalendarClock, Clock3, IndianRupee, ShieldAlert, Sparkles, Star, Trophy, Users } from "lucide-react";

import { Badge } from "@/client/components/ui/badge";
import { buttonVariants } from "@/client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card";
import { cn } from "@/server/utils";

import { getMentorDashboardData } from "./_components/mentor-dashboard-data";
import { formatCurrency, formatShortDateTime, formatTrend, formatResponseRate } from "./_components/mentor-dashboard-utils";

export default async function MentorDashboardPage() {
  const data = await getMentorDashboardData();

  if (!data) {
    return (
      <Card className="rounded-[1.75rem] border-red-200 bg-white">
        <CardContent className="p-6 text-sm text-red-600">Failed to load mentor dashboard data.</CardContent>
      </Card>
    );
  }

  const quickStats = [
    {
      label: "Total sessions",
      value: data.overview.totalSessions.toLocaleString("en-IN"),
      detail: "Completed sessions that reached the finish line.",
      icon: Users,
    },
    {
      label: "Avg rating",
      value: `${data.overview.avgRating.toFixed(1)} / 5`,
      detail: `${data.mentor.profile.totalReviews.toLocaleString("en-IN")} public reviews so far.`,
      icon: Star,
    },
    {
      label: "This week earnings",
      value: formatCurrency(data.overview.thisWeekEarnings),
      detail: `Response rate is holding at ${formatResponseRate(data.overview.responseRate)}.`,
      icon: IndianRupee,
    },
    {
      label: "Rank",
      value: `#${data.overview.rank}`,
      detail: "Position among active mentors by rating and delivered sessions.",
      icon: Trophy,
    },
  ];

  return (
    <div className="space-y-5">
      {!data.overview.isVerified ? (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4 text-amber-950">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <ShieldAlert className="size-5" />
              </span>
              <div>
                <p className="font-semibold">Your profile is under review</p>
                <p className="mt-1 text-sm text-amber-800">
                  We are checking trust signals, profile quality, and availability before turning your listing live.
                </p>
              </div>
            </div>
            <Link href="/dashboard/mentor/profile" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Review profile
            </Link>
          </div>
        </div>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.16),_transparent_24%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_56%,_#ecfeff_100%)]">
          <CardContent className="p-6 sm:p-8">
            <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
              Mentor overview
            </Badge>
            <div className="mt-5 max-w-2xl space-y-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  Keep sessions sharp and earnings visible.
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  Today&apos;s session queue, payout momentum, and profile quality signals are all surfaced in one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/mentor/sessions" className={buttonVariants({ size: "lg" })}>
                  Open sessions
                </Link>
                <Link href="/dashboard/mentor/availability" className={buttonVariants({ variant: "outline", size: "lg" })}>
                  Edit availability
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-emerald-200 bg-emerald-50/80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <IndianRupee className="size-5 text-emerald-700" />
              Earnings this month
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-slate-950">
                {formatCurrency(data.overview.thisMonthEarnings)}
              </p>
              <p
                className={cn(
                  "mt-2 text-sm font-medium",
                  data.overview.thisMonthEarnings >= data.overview.lastMonthEarnings ? "text-emerald-700" : "text-amber-700",
                )}
              >
                {formatTrend(data.overview.thisMonthEarnings, data.overview.lastMonthEarnings)}
              </p>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-emerald-200/70 bg-white/80 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pending payout</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {formatCurrency(data.earnings.pendingPayout)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Next payout</p>
                <p className="mt-2 text-sm font-medium text-slate-900">
                  {data.earnings.nextPayout
                    ? `${formatShortDateTime(data.earnings.nextPayout.date)} • ${formatCurrency(data.earnings.nextPayout.amount)}`
                    : "No payout queued"}
                </p>
              </div>
            </div>

            <Link href="/dashboard/mentor/earnings" className={buttonVariants({ variant: "outline" })}>
              View earnings
            </Link>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <div>
              <CardTitle className="text-lg text-slate-950">Upcoming sessions today</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Every session due before midnight in your current queue.</p>
            </div>
            <Link href="/dashboard/mentor/sessions" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.overview.upcomingToday.length === 0 ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                No sessions scheduled for today.
              </div>
            ) : (
              data.overview.upcomingToday.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950">{session.studentName}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-2">
                        <CalendarClock className="size-4 text-slate-500" />
                        {formatShortDateTime(session.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock3 className="size-4 text-slate-500" />
                        {session.durationMinutes} min
                      </span>
                    </div>
                  </div>
                  {session.meetingLink ? (
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonVariants({ size: "sm" })}
                    >
                      Join
                    </a>
                  ) : (
                    <span className={buttonVariants({ variant: "outline", size: "sm" })}>Room pending</span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {data.overview.performanceTips.length > 0 ? (
          <Card className="rounded-[1.75rem] border-amber-200 bg-amber-50/70">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <Sparkles className="size-5 text-amber-700" />
                Performance tips
              </CardTitle>
              <p className="text-sm text-amber-800">
                Triggered because rating is below 4.5 or response rate is below 80%.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.overview.performanceTips.map((tip) => (
                <div key={tip} className="rounded-[1.25rem] border border-amber-200 bg-white/75 p-4 text-sm leading-6 text-slate-700">
                  {tip}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[1.75rem] border-slate-200 bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-slate-950">Quality is holding</CardTitle>
              <p className="text-sm text-slate-500">No intervention flags on rating or response rate right now.</p>
            </CardHeader>
            <CardContent className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-5 text-sm leading-6 text-slate-600">
              Keep the same operating rhythm: confirm prep fast, join on time, and close each session with one clear next step.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <span className="flex size-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700">
                  <stat.icon className="size-4" />
                </span>
              </div>
              <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

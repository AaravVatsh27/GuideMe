import type { Route } from "next";
import Link from "next/link";
import {
  CalendarClock,
  CalendarRange,
  Clock3,
  FileText,
  Globe,
  IndianRupee,
  MapPin,
  ShieldAlert,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import { MentorAvatar } from "@/Frontend/components/MentorAvatar";
import { Badge } from "@/Frontend/components/ui/badge";
import { buttonVariants } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { cn } from "@/Backend/server/utils";
import { getMentorDashboardData } from "@/Frontend/views/dashboard/mentor/mentor-dashboard-data";
import {
  formatCurrency,
  formatResponseRate,
  formatShortDateTime,
  formatTrend,
  getInitials,
} from "@/Frontend/views/dashboard/mentor/mentor-dashboard-utils";

function getSlotCount(startTime: string, endTime: string) {
  const startHour = Number.parseInt(startTime.split(":")[0] ?? "0", 10);
  const endHour = Number.parseInt(endTime.split(":")[0] ?? "0", 10);
  return Math.max(0, endHour - startHour);
}

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
  const upcomingPreview = data.sessions.upcoming.slice(0, 3);
  const availabilityByDay = data.availability.days.map((day) => {
    const openSlots = data.availability.recurringSlots
      .filter((slot) => slot.dayOfWeek === day.value)
      .reduce((sum, slot) => sum + getSlotCount(slot.startTime, slot.endTime), 0);
    const bookedSlots = data.availability.bookedSlotKeys.filter((key) => key.startsWith(`${day.value}-`)).length;

    return {
      ...day,
      openSlots,
      bookedSlots,
    };
  });
  const totalOpenSlots = availabilityByDay.reduce((sum, day) => sum + day.openSlots, 0);
  const totalBookedSlots = availabilityByDay.reduce((sum, day) => sum + day.bookedSlots, 0);
  const payoutPreview = data.earnings.payouts.slice(0, 4);
  const publicProfileHref = data.mentor.profile.username
    ? (`/mentor/${data.mentor.profile.username}` as Route)
    : null;

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
              <CardTitle className="text-lg text-slate-950">Upcoming sessions with student context</CardTitle>
              <p className="mt-1 text-sm text-slate-500">The next calls in your queue, with enough context to prep fast.</p>
            </div>
            <Link href="/dashboard/mentor/sessions" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingPreview.length === 0 ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                No upcoming sessions are scheduled yet.
              </div>
            ) : (
              upcomingPreview.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col gap-4 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-950">{session.student.name}</p>
                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                        {session.type === "INTRO" ? "Free intro" : "Paid session"}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                      {session.student.classLabel ? (
                        <span className="flex items-center gap-2">
                          <FileText className="size-4 text-slate-500" />
                          {session.student.classLabel}
                        </span>
                      ) : null}
                      {session.student.city ? (
                        <span className="flex items-center gap-2">
                          <MapPin className="size-4 text-slate-500" />
                          {session.student.city}
                        </span>
                      ) : null}
                      <span className="flex items-center gap-2">
                        <CalendarClock className="size-4 text-slate-500" />
                        {formatShortDateTime(session.scheduledAt)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock3 className="size-4 text-slate-500" />
                        {session.durationMinutes} min
                      </span>
                    </div>

                    <div className="mt-3 rounded-[1rem] border border-slate-200 bg-white p-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prep tip</p>
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {session.prepTips[0] ?? "Start with the student's immediate decision, then close with one clear next step."}
                      </p>
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

      <section className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <CalendarRange className="size-5 text-teal-700" />
                Availability manager
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Weekly grid preview from your live recurring schedule in {data.availability.timezone}.
              </p>
            </div>
            <Link href="/dashboard/mentor/availability" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Edit grid
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Open slots</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{totalOpenSlots}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Booked slots</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{totalBookedSlots}</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-7">
              {availabilityByDay.map((day) => (
                <div
                  key={day.value}
                  className={cn(
                    "rounded-[1rem] border p-3",
                    day.openSlots > 0 ? "border-teal-200 bg-teal-50/70" : "border-slate-200 bg-slate-50",
                  )}
                >
                  <p className="text-sm font-semibold text-slate-900">{day.label}</p>
                  <p className="mt-2 text-xs text-slate-600">{day.openSlots} open</p>
                  <p className="mt-1 text-xs text-slate-500">{day.bookedSlots} booked</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <div>
              <CardTitle className="text-lg text-slate-950">Payout history</CardTitle>
              <p className="mt-1 text-sm text-slate-500">Latest payout movements and your next transfer target.</p>
            </div>
            <Link href="/dashboard/mentor/earnings" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Open desk
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Next payout</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {data.earnings.nextPayout
                  ? `${formatCurrency(data.earnings.nextPayout.amount)} • ${formatShortDateTime(data.earnings.nextPayout.date)}`
                  : "No payout queued"}
              </p>
            </div>

            {payoutPreview.length === 0 ? (
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                No payout history yet.
              </div>
            ) : (
              payoutPreview.map((payout) => (
                <div
                  key={payout.id}
                  className="flex flex-col gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-950">{formatCurrency(payout.amount)}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatShortDateTime(payout.date)} • {payout.studentFirstName}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "border",
                        payout.status === "PAID"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : payout.status === "PROCESSING"
                            ? "border-sky-200 bg-sky-50 text-sky-700"
                            : "border-amber-200 bg-amber-50 text-amber-700",
                      )}
                    >
                      {payout.status}
                    </Badge>
                    <span className="text-xs text-slate-500">{payout.transactionId ?? "Pending"}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <Globe className="size-5 text-teal-700" />
                Profile editor with live preview
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Your public listing snapshot, pulled from the same data students see.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {publicProfileHref ? (
                <Link href={publicProfileHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  View public page
                </Link>
              ) : null}
              <Link href="/dashboard/mentor/profile" className={buttonVariants({ size: "sm" })}>
                Edit profile
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-5">
                <div className="flex items-center gap-4">
                  <MentorAvatar
                    src={data.mentor.image}
                    alt={data.mentor.name}
                    fallback={getInitials(data.mentor.name)}
                    className="size-16"
                  />
                  <div>
                    <p className="text-xl font-semibold text-slate-950">{data.mentor.name}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {data.mentor.profile.headline ?? "Add a sharper headline from the profile editor."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                    {data.mentor.profile.tier}
                  </Badge>
                  {data.mentor.profile.specialisationLabels.slice(0, 3).map((topic) => (
                    <Badge key={topic} variant="outline" className="border-slate-300 bg-white text-slate-700">
                      {topic}
                    </Badge>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Education</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {data.mentor.profile.college ?? "College"} • {data.mentor.profile.degreeLabel}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{data.mentor.profile.branch ?? "Branch"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pricing</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {formatCurrency(data.mentor.profile.priceMin)} / 30 min
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatCurrency(data.mentor.profile.priceMax)} / 45 min
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Public bio</p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {data.mentor.profile.bio ?? "Add a stronger public bio from the profile editor."}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Public rating</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{data.mentor.profile.avgRating.toFixed(1)}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reviews</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{data.mentor.profile.totalReviews}</p>
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Profile views</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{data.mentor.profile.profileViews}</p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">SEO preview</p>
                  <p className="mt-2 text-sm text-emerald-700">{data.mentor.seo.url}</p>
                  <p className="mt-1 text-lg text-sky-700">{data.mentor.seo.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{data.mentor.seo.description}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

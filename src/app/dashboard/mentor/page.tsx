import Link from "next/link";
import {
  CalendarClock,
  CalendarRange,
  Globe,
  IndianRupee,
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

const secondaryActionClass =
  "inline-flex min-h-10 items-center justify-center rounded-full border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-900 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20";

const topicLabelMap: Record<string, string> = {
  STREAM_SELECTION: "Stream selection",
  COLLEGE_SELECTION: "College selection",
  JEE_PREP_STRATEGY: "JEE prep strategy",
  COACHING_SELECTION: "Coaching selection",
  "JEE prep strategy": "JEE prep strategy",
  "NEET prep strategy": "NEET prep strategy",
  "CA/Commerce path": "CA/Commerce path",
  "Hostel & college life": "Hostel & college life",
  "Engineering branch selection": "Engineering branch selection",
  "MBA preparation": "MBA preparation",
  "MS abroad": "MS abroad",
  "Internship guidance": "Internship guidance",
  "Placement preparation": "Placement preparation",
  "Career switching": "Career switching",
  "Study planning": "Study planning",
  "Coaching selection": "Coaching selection",
  "Subject combinations": "Subject combinations",
};

function formatTopicLabel(value: string) {
  const normalized = value.trim();
  const knownLabel = topicLabelMap[normalized];

  if (knownLabel) {
    return knownLabel;
  }

  return normalized
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? `${lower.charAt(0).toUpperCase()}${lower.slice(1)}` : lower;
    })
    .join(" ");
}

export default async function MentorDashboardPage() {
  const data = await getMentorDashboardData();

  if (!data) {
    return (
      <Card className="rounded-2xl border-red-200 bg-white">
        <CardContent className="p-6 text-sm text-red-600">Failed to load mentor dashboard data.</CardContent>
      </Card>
    );
  }

  const verificationStatus = data.mentor.verification?.status ?? "PENDING";
  const isApproved = data.overview.isVerified;
  const isRejected = verificationStatus === "REJECTED";
  const hasMeaningfulActivity = data.overview.totalSessions > 0 || data.mentor.profile.totalReviews > 0;
  const hasReviews = data.mentor.profile.totalReviews > 0;
  const quickStats = [
    {
      label: "Total sessions",
      value: data.overview.totalSessions.toLocaleString("en-IN"),
      detail: "Completed sessions that reached the finish line.",
      icon: Users,
    },
    {
      label: "Avg rating",
      value: hasReviews ? `${data.overview.avgRating.toFixed(1)} / 5` : "No reviews yet",
      detail: hasReviews
        ? `${data.mentor.profile.totalReviews.toLocaleString("en-IN")} public reviews so far.`
        : "Reviews appear after your first verified session.",
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
      value: isApproved && hasMeaningfulActivity ? `#${data.overview.rank}` : "Not ranked yet",
      detail: isApproved && hasMeaningfulActivity
        ? "Position among active mentors by rating and delivered sessions."
        : "Rank appears after your profile is approved and you have meaningful activity.",
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
  const headline = data.mentor.profile.headline;
  const displayHeadline = headline && headline.trim() ? headline : "Mentor profile headline";
  const bio = data.mentor.profile.bio;
  const displayBio = bio && bio.trim()
    ? bio
    : "Add a clear public bio so students understand what you can help them with.";

  return (
    <div className="min-h-full min-w-0 max-w-full space-y-3 bg-[#FAF5FF]">
      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.08),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.06),transparent_40%),linear-gradient(135deg,#ffffff_0%,#faf5ff_60%,#fdf2f8_100%)]">
          <CardContent className="p-5 sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7C3AED]">
              {isApproved ? "Mentor overview" : isRejected ? "Action required" : "Submitted for review"}
            </p>
            <div className="mt-3 max-w-2xl space-y-2">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {!isApproved
                    ? isRejected
                      ? "Update your mentor profile to continue"
                      : "You're almost ready to mentor"
                    : "Keep sessions sharp and earnings visible."}
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
                  {!isApproved
                    ? isRejected
                      ? data.mentor.verification?.rejectionReason ?? "Review the requested updates before resubmitting your profile."
                      : "Your profile is under review. We'll let you know when your mentor listing is ready to go live."
                    : "Today&apos;s session queue, payout momentum, and profile quality signals are all surfaced in one place."}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isApproved ? (
                  <Link href="/dashboard/mentor/profile" className={secondaryActionClass}>
                    Review profile
                  </Link>
                ) : (
                  <>
                    <Link href="/dashboard/mentor/sessions" className={secondaryActionClass}>
                      Open sessions
                    </Link>
                    <Link
                      href="/dashboard/mentor/availability"
                      className={secondaryActionClass}
                    >
                      Edit availability
                    </Link>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isApproved ? <Card className="rounded-2xl border-violet-200 bg-violet-50/80">
          <CardHeader className="px-4 pb-1.5 pt-3 sm:px-5">
            <CardTitle className="flex items-center gap-2 text-base text-slate-950">
              <IndianRupee className="size-4 text-violet-700" />
              Earnings this month
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 pt-0 sm:px-5">
            <p className="text-2xl font-semibold tracking-tight text-slate-950">
              {formatCurrency(data.overview.thisMonthEarnings)}
            </p>
            <p
              className={cn(
                "mt-0.5 text-xs font-medium",
                data.overview.thisMonthEarnings >= data.overview.lastMonthEarnings ? "text-violet-700" : "text-amber-700",
              )}
            >
              {formatTrend(data.overview.thisMonthEarnings, data.overview.lastMonthEarnings)}
            </p>
            <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-violet-200/70 bg-white/80 px-3 py-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Pending</span>
              <span className="text-sm font-semibold text-slate-900">{formatCurrency(data.earnings.pendingPayout)}</span>
            </div>
            <Link
              href="/dashboard/mentor/earnings"
              className={buttonVariants({ className: "mt-2 w-full bg-[#7C3AED] text-white hover:bg-[#6D28D9]" })}
            >
              View earnings
            </Link>
          </CardContent>
        </Card> : isRejected ? (
          <Card className="rounded-2xl border-rose-200 bg-rose-50/70">
            <CardHeader className="px-4 pb-1.5 pt-3 sm:px-5">
              <CardTitle className="text-base text-slate-950">Action required</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 text-sm leading-5 text-slate-700 sm:px-5">
              Make the requested updates to your profile, then submit it for review again.
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-violet-200 bg-violet-50/70">
            <CardHeader className="px-4 pb-1.5 pt-3 sm:px-5">
              <CardTitle className="flex items-center gap-2 text-base text-slate-950">
                <Sparkles className="size-4 text-violet-700" />
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pb-3 pt-0 sm:px-5">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <svg className="size-3" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Profile submitted</p>
                  <p className="text-[11px] text-slate-500">Your details are in the review queue.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-violet-400 bg-white">
                  <span className="size-1.5 rounded-full bg-violet-500" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Verification in progress</p>
                  <p className="text-[11px] text-slate-500">Our team reviews details and qualifications.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-400">
                  <span className="size-1.5 rounded-full bg-slate-300" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-500">Listing goes live</p>
                  <p className="text-[11px] text-slate-400">Students can discover and book sessions with you.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid items-start gap-3 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-2xl border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 pb-1.5 pt-3 sm:px-5">
            <div>
              <CardTitle className="text-base text-slate-950">Upcoming sessions</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">Next calls with prep context.</p>
            </div>
            <Link
              href="/dashboard/mentor/sessions"
              className={secondaryActionClass}
            >
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-1.5 px-4 pb-3 pt-0 sm:px-5">
            {upcomingPreview.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                No upcoming sessions are scheduled yet.
              </div>
            ) : (
              upcomingPreview.slice(0, 2).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-950">{session.student.name}</p>
                      <Badge variant="outline" className="shrink-0 border-slate-300 bg-white text-[10px] text-slate-700">
                        {session.type === "INTRO" ? "Free" : "Paid"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-600">
                      <CalendarClock className="size-3 text-slate-500" />
                      {formatShortDateTime(session.scheduledAt)}
                      <span className="text-slate-300">·</span>
                      {session.durationMinutes} min
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
                    <span className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-500">
                      Pending
                    </span>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {isApproved && hasMeaningfulActivity && data.overview.performanceTips.length > 0 ? (
          <Card className="rounded-2xl border-amber-200 bg-amber-50/70">
            <CardHeader className="px-4 pb-1.5 pt-3 sm:px-5">
              <CardTitle className="flex items-center gap-2 text-base text-slate-950">
                <Sparkles className="size-4 text-amber-700" />
                Performance tips
              </CardTitle>
              <p className="mt-0.5 text-[11px] text-amber-800">
                Rating below 4.5 or response rate below 80%.
              </p>
            </CardHeader>
            <CardContent className="space-y-1.5 px-4 pb-3 pt-0 sm:px-5">
              {data.overview.performanceTips.slice(0, 2).map((tip) => (
                <div key={tip} className="rounded-lg border border-amber-200 bg-white/75 px-3 py-2 text-xs leading-5 text-slate-700">
                  {tip}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : !isApproved || !hasMeaningfulActivity ? (
          <Card className="rounded-2xl border-violet-200 bg-violet-50/70">
            <CardHeader className="px-4 pb-1.5 pt-3 sm:px-5">
              <CardTitle className="flex items-center gap-2 text-base text-slate-950">
                <Sparkles className="size-4 text-violet-700" />
                Get ready to go live
              </CardTitle>
              <p className="mt-0.5 text-[11px] text-slate-600">Steps to complete before you start taking sessions.</p>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 sm:px-5">
              <div className="grid gap-1.5 sm:grid-cols-2">
                {[
                  { label: "Review your mentor profile", actionable: true },
                  { label: "Set your availability", actionable: true },
                  { label: "Keep profile details complete", actionable: true },
                  { label: "Wait for verification", actionable: false },
                ].map((step) => (
                  <div
                    key={step.label}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-[11px] leading-5",
                      step.actionable
                        ? "border-violet-200 bg-white/80 text-slate-700"
                        : "border-slate-200 bg-slate-50/70 text-slate-500",
                    )}
                  >
                    {step.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl border-slate-200 bg-white">
            <CardHeader className="px-4 pb-1.5 pt-3 sm:px-5">
              <CardTitle className="text-base text-slate-950">Quality is holding</CardTitle>
              <p className="mt-0.5 text-[11px] text-slate-500">No flags on rating or response rate.</p>
            </CardHeader>
            <CardContent className="px-4 pb-3 pt-0 text-xs leading-5 text-slate-600 sm:px-5">
              Keep the same operating rhythm: confirm prep fast, join on time, close with one clear next step.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="rounded-xl border-slate-200 bg-white">
            <CardContent className="px-3 py-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-slate-500">{stat.label}</p>
                <span className="flex size-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-600">
                  <stat.icon className="size-3.5" />
                </span>
              </div>
              <p className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{stat.value}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-slate-500">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="rounded-2xl border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 pb-1.5 pt-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-slate-950">
                <CalendarRange className="size-4 text-violet-700" />
                Availability
              </CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">
                {isApproved
                  ? `Weekly schedule in ${data.availability.timezone}.`
                  : `Hours students can book in ${data.availability.timezone}.`}
              </p>
            </div>
            <Link
              href="/dashboard/mentor/availability"
              className={secondaryActionClass}
            >
              Edit
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 px-4 pb-3 pt-0">
            <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
              <p className="text-base font-semibold text-slate-950">{totalOpenSlots}</p>
              <span className="text-[11px] text-slate-500">open slots</span>
              <span className="text-slate-300">·</span>
              <p className="text-base font-semibold text-slate-950">{totalBookedSlots}</p>
              <span className="text-[11px] text-slate-500">booked</span>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {availabilityByDay.map((day) => (
                <div
                  key={day.value}
                  className={cn(
                    "rounded-lg border px-1.5 py-1.5 text-center",
                    day.openSlots > 0 ? "border-violet-200 bg-violet-50/70" : "border-slate-200 bg-slate-50",
                  )}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">{day.label}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-950">{day.openSlots}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-2 px-4 pb-1.5 pt-3">
            <div>
              <CardTitle className="text-base text-slate-950">Payouts</CardTitle>
              <p className="mt-0.5 text-xs text-slate-500">Latest transfers and your next target.</p>
            </div>
            <Link
              href="/dashboard/mentor/earnings"
              className={secondaryActionClass}
            >
              Open
            </Link>
          </CardHeader>
          <CardContent className="space-y-1.5 px-4 pb-3 pt-0">
            <div className="rounded-lg bg-slate-50 px-3 py-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Next payout</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-950">
                {data.earnings.nextPayout
                  ? `${formatCurrency(data.earnings.nextPayout.amount)} · ${formatShortDateTime(data.earnings.nextPayout.date)}`
                  : "No payout queued"}
              </p>
            </div>

            {payoutPreview.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                No payout history yet.
              </div>
            ) : (
              payoutPreview.slice(0, 2).map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-950">{formatCurrency(payout.amount)}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatShortDateTime(payout.date)} · {payout.studentFirstName}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[10px]",
                      payout.status === "PAID"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : payout.status === "PROCESSING"
                          ? "border-sky-200 bg-sky-50 text-sky-700"
                          : "border-amber-200 bg-amber-50 text-amber-700",
                    )}
                  >
                    {payout.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="rounded-2xl border-violet-100 bg-white shadow-sm shadow-violet-900/5">
          <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <Globe className="size-5 text-violet-600" />
                Profile preview
              </CardTitle>

              <p className="mt-1 text-sm text-slate-500">
                Your profile preview while your mentor listing is under review.
              </p>
            </div>

            <Link
              href="/dashboard/mentor/profile"
              className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-[#7C3AED] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Edit profile
            </Link>
          </CardHeader>

          <CardContent className="min-w-0 max-w-full overflow-hidden pt-0">
            <div className="min-w-0 space-y-5">
              {/* Identity */}
              <div className="flex min-w-0 flex-col gap-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-4 sm:flex-row sm:items-start sm:p-5">
                <MentorAvatar
                  src={data.mentor.image}
                  alt={data.mentor.name}
                  fallback={getInitials(data.mentor.name)}
                  className="size-16 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold tracking-tight text-slate-950">
                        {data.mentor.name}
                      </h3>

                      <p className="mt-1 break-words text-sm leading-6 text-slate-600">
                        {displayHeadline}
                      </p>
                    </div>

                    <span className="inline-flex w-fit shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                      Under review
                    </span>
                  </div>

                  {data.mentor.profile.specialisationLabels.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {data.mentor.profile.specialisationLabels.slice(0, 4).map((topic) => (
                        <Badge
                          key={topic}
                          variant="outline"
                          className="border-violet-200 bg-white text-violet-800"
                        >
                      {formatTopicLabel(topic)}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Key information */}
              <div className="min-w-0 grid gap-3 sm:grid-cols-2">
                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Education
                  </p>

                  <p className="mt-2 min-w-0 break-words text-sm font-semibold leading-5 text-slate-950">
                    {data.mentor.profile.college ?? "Education not added yet"}
                  </p>

                  <p className="mt-1 min-w-0 break-words text-sm text-slate-600">
                    {data.mentor.profile.degreeLabel}
                    {data.mentor.profile.branch
                      ? ` · ${data.mentor.profile.branch}`
                      : ""}
                  </p>
                </div>

                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Pricing
                  </p>

                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {formatCurrency(data.mentor.profile.priceMin)} / 30 min
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {formatCurrency(data.mentor.profile.priceMax)} / 45 min
                  </p>
                </div>
              </div>

              {/* Bio */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Public bio
                </p>

                <p className="mt-2 max-w-4xl break-words text-sm leading-6 text-slate-700">
                  {displayBio}
                </p>
              </div>

              {/* Social proof */}
              <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Student feedback
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-950">
                    {data.mentor.profile.totalReviews > 0
                      ? `${data.mentor.profile.avgRating.toFixed(1)} / 5`
                      : "No reviews yet"}
                  </p>
                </div>

                <p className="text-sm text-slate-500">
                  {data.mentor.profile.totalReviews > 0
                    ? `${data.mentor.profile.totalReviews} public reviews`
                    : "Reviews will appear after completed sessions."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

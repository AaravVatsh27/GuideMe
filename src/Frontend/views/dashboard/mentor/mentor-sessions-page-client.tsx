"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Download, FileText, MapPin, Star, Video } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/Frontend/components/ui/avatar";
import { Badge } from "@/Frontend/components/ui/badge";
import { Button, buttonVariants } from "@/Frontend/components/ui/button";
import { Card, CardContent } from "@/Frontend/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/Frontend/components/ui/tabs";
import { cn } from "@/Backend/server/utils";

import type { MentorDashboardData } from "./mentor-dashboard-data";
import {
  escapeCsvValue,
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  formatEnumLabel,
  getInitials,
} from "./mentor-dashboard-utils";

type SessionTab = "upcoming" | "completed" | "cancelled";

type Props = {
  sessions: MentorDashboardData["sessions"];
};

type UpcomingSession = MentorDashboardData["sessions"]["upcoming"][number];
type CompletedSession = MentorDashboardData["sessions"]["completed"][number];
type CancelledSession = MentorDashboardData["sessions"]["cancelled"][number];

function getStatusBadgeClass(status: string) {
  switch (status) {
    case "ONGOING":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "COMPLETED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "CANCELLED":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "NO_SHOW":
      return "border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border-violet-200 bg-violet-50 text-violet-700";
  }
}

export function MentorSessionsPageClient({ sessions }: Props) {
  const [tab, setTab] = useState<SessionTab>("upcoming");

  const csvRows = useMemo(
    () =>
      [...sessions.upcoming, ...sessions.completed, ...sessions.cancelled].map((session) => ({
        student: session.student.name,
        class: session.student.classLabel || "",
        city: session.student.city || "",
        status: session.status,
        type: session.type,
        scheduledAt: formatDateTime(session.scheduledAt),
        durationMinutes: session.durationMinutes,
        earnings: session.mentorEarning,
      })),
    [sessions],
  );

  function downloadCsv() {
    const headers = ["Student", "Class", "City", "Status", "Session Type", "Scheduled At", "Duration Minutes", "Earnings"];
    const lines = [
      headers.join(","),
      ...csvRows.map((row) =>
        [
          row.student,
          row.class,
          row.city,
          formatEnumLabel(row.status),
          formatEnumLabel(row.type),
          row.scheduledAt,
          row.durationMinutes,
          row.earnings,
        ]
          .map(escapeCsvValue)
          .join(","),
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mentor-sessions.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function renderSessionFrame(
    session: UpcomingSession | CompletedSession | CancelledSession,
    details: React.ReactNode,
    action: React.ReactNode,
  ) {
    return (
      <Card key={session.id} className="min-w-0 overflow-hidden rounded-2xl border border-[#E9D5FF] bg-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-start gap-3">
                <Avatar className="size-12">
                  <AvatarImage src={session.student.image ?? ""} alt={session.student.name} />
                  <AvatarFallback>{getInitials(session.student.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-slate-950">{session.student.firstName}</p>
                    <Badge variant="outline" className={cn("border", getStatusBadgeClass(session.status))}>
                      {formatEnumLabel(session.status)}
                    </Badge>
                    <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                      {formatEnumLabel(session.type)}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-600">
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
                      {formatDateTime(session.scheduledAt)}
                    </span>
                  </div>

                  {details}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">{action}</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderUpcomingSession(session: UpcomingSession) {
    return renderSessionFrame(
      session,
      <div className="mt-4 grid gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Prep tips</p>
          <div className="mt-2 space-y-2 text-sm text-slate-700">
            {session.prepTips.map((tip: string) => (
              <p key={tip}>{tip}</p>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Session type</p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {formatEnumLabel(session.type)} • {session.durationMinutes} min
          </p>
          <p className="mt-2 text-sm text-slate-600">Expected mentor earning {formatCurrency(session.mentorEarning)}</p>
        </div>
      </div>,
      session.meetingLink ? (
        <a
          href={session.meetingLink}
          target="_blank"
          rel="noreferrer"
          className={buttonVariants({
            size: "sm",
            className: "h-10 rounded-full bg-[#7C3AED] text-white hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20",
          })}
        >
          <Video className="size-4" />
          Join
        </a>
      ) : (
        <span
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "h-10 rounded-full border-violet-200 bg-white text-violet-900 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900",
          })}
        >
          Room pending
        </span>
      ),
    );
  }

  function renderCompletedSession(session: CompletedSession) {
    return renderSessionFrame(
      session,
      <div className="mt-4 grid gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 lg:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Earnings</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{formatCurrency(session.mentorEarning)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Rating received</p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {session.review?.rating ? `${session.review.rating} / 5` : "No rating yet"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Notes</p>
          <p className="mt-2 text-sm text-slate-700">
            {session.notes[0]?.content ?? session.aiSummary?.slice(0, 140) ?? "No notes saved for this session."}
          </p>
        </div>
      </div>,
      session.review?.rating ? (
        <span
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "h-10 rounded-full border-violet-200 bg-white text-violet-900 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900",
          })}
        >
          <Star className="size-4" />
          {session.review.rating} / 5
        </span>
      ) : null,
    );
  }

  function renderCancelledSession(session: CancelledSession) {
    return renderSessionFrame(
      session,
      <div className="mt-4 grid gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Cancelled on</p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {session.cancelledAt ? formatDateOnly(session.cancelledAt) : "Not recorded"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Refund status</p>
          <p className="mt-2 text-sm font-medium text-slate-900">
            {formatEnumLabel(session.payment?.refundStatus) || "No refund"}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Refund amount</p>
          <p className="mt-2 text-sm font-medium text-slate-900">{formatCurrency(session.payment?.refundAmount)}</p>
        </div>
        {session.cancellationReason ? (
          <div className="sm:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reason</p>
            <p className="mt-2 text-sm text-slate-700">{session.cancellationReason}</p>
          </div>
        ) : null}
      </div>,
      null,
    );
  }

  const activeCount =
    tab === "upcoming" ? sessions.upcoming.length : tab === "completed" ? sessions.completed.length : sessions.cancelled.length;

  return (
    <div className="min-w-0 max-w-full space-y-4 bg-[#FAF5FF]">
      <Card className="overflow-hidden rounded-2xl border border-[#E9D5FF] bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.08),transparent_30%),linear-gradient(135deg,#ffffff_0%,#faf5ff_55%,#fdf2f8_100%)]">
        <CardContent className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-6">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7C3AED]">
              Session operations
            </p>
            <h2 className="mt-3 text-[clamp(1.75rem,3vw,2.25rem)] font-bold tracking-[-0.03em] text-slate-950">My sessions</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Manage upcoming mentor conversations and review completed sessions in one place.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={downloadCsv}
            className="min-h-10 rounded-full border-violet-200 bg-white px-4 text-sm font-semibold text-violet-900 transition-colors hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20"
          >
            <Download className="size-4" />
            Export sessions as CSV
          </Button>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as SessionTab)} className="min-w-0">
        <TabsList variant="line" className="max-w-full flex-wrap rounded-none p-0">
          <TabsTrigger value="upcoming" className="min-h-10 rounded-xl px-3 font-medium !text-[#1E1B4B] opacity-100 hover:bg-violet-50 hover:!text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20 data-active:bg-violet-100 data-active:!text-violet-900 data-active:font-semibold">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="completed" className="min-h-10 rounded-xl px-3 font-medium !text-[#1E1B4B] opacity-100 hover:bg-violet-50 hover:!text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20 data-active:bg-violet-100 data-active:!text-violet-900 data-active:font-semibold">
            Completed
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="min-h-10 rounded-xl px-3 font-medium !text-[#1E1B4B] opacity-100 hover:bg-violet-50 hover:!text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20 data-active:bg-violet-100 data-active:!text-violet-900 data-active:font-semibold">
            Cancelled
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {activeCount === 0 ? (
        <div className={cn("min-w-0", tab === "upcoming" && "grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]")}>
          <Card className="min-w-0 overflow-hidden rounded-2xl border border-[#E9D5FF] bg-white">
            <CardContent className="p-4 sm:p-5">
              <h3 className="text-lg font-semibold text-slate-950">
                {tab === "upcoming" ? "No upcoming sessions" : tab === "completed" ? "No completed sessions yet" : "No cancelled sessions"}
              </h3>
              <p className="mt-2 text-sm leading-5 text-slate-600">
                {tab === "upcoming"
                  ? "Your next mentor conversation will appear here after a student books a session."
                  : tab === "completed"
                    ? "Completed conversations and their summaries will appear here."
                    : "Cancelled sessions will appear here when a booking is cancelled."}
              </p>
            </CardContent>
          </Card>
          {tab === "upcoming" ? (
            <Card className="min-w-0 overflow-hidden rounded-2xl border border-[#E9D5FF] bg-white">
              <CardContent className="p-4 sm:p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7C3AED]">Next step</p>
                <h3 className="mt-2 text-lg font-semibold text-slate-950">Open your availability</h3>
                <p className="mt-2 text-sm leading-5 text-slate-600">
                  Students can only book times that are open on your schedule.
                </p>
                <Link
                  href="/dashboard/mentor/availability"
                  className="mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[#7C3AED] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20"
                >
                  Manage availability
                </Link>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : tab === "upcoming" ? (
        sessions.upcoming.map(renderUpcomingSession)
      ) : tab === "completed" ? (
        sessions.completed.map(renderCompletedSession)
      ) : (
        sessions.cancelled.map(renderCancelledSession)
      )}
    </div>
  );
}

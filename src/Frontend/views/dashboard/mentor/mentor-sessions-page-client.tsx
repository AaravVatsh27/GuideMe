"use client";

import { useMemo, useState } from "react";
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
      return "border-slate-300 bg-slate-100 text-slate-700";
    case "CANCELLED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "NO_SHOW":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-sky-200 bg-sky-50 text-sky-700";
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
      <Card key={session.id} className="rounded-[1.5rem] border-slate-200 bg-white">
        <CardContent className="p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-4">
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

                  <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600">
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
        <a href={session.meetingLink} target="_blank" rel="noreferrer" className={buttonVariants({ size: "sm" })}>
          <Video className="size-4" />
          Join
        </a>
      ) : (
        <span className={buttonVariants({ variant: "outline", size: "sm" })}>Room pending</span>
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
        <span className={buttonVariants({ variant: "outline", size: "sm" })}>
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
    <div className="space-y-5">
      <Card className="rounded-[1.75rem] border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_24%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_60%,_#f0fdfa_100%)]">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
              Session operations
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">My sessions</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Keep the upcoming queue actionable, export session records fast, and review the quality signals attached to finished calls.
            </p>
          </div>
          <Button variant="outline" onClick={downloadCsv}>
            <Download className="size-4" />
            Export sessions as CSV
          </Button>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as SessionTab)}>
        <TabsList variant="line" className="rounded-none p-0">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeCount === 0 ? (
        <Card className="rounded-[1.5rem] border-slate-200 bg-white">
          <CardContent className="p-6 text-sm text-slate-600">No sessions in this tab yet.</CardContent>
        </Card>
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

"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  RotateCcw,
  Video,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { MentorAvatar } from "@/Frontend/components/MentorAvatar";
import {
  formatCurrency,
  formatDateOnly,
  formatDateTime,
  formatEnumLabel,
  getInitials,
} from "@/Frontend/views/dashboard/student/student-dashboard-utils";
import { Badge } from "@/Frontend/components/ui/badge";
import { Button, buttonVariants } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardTitle } from "@/Frontend/components/ui/card";
import { Skeleton } from "@/Frontend/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/Frontend/components/ui/tabs";
import { queryKeys } from "@/Frontend/lib/react-query";
import { cn } from "@/Backend/server/utils";

type SessionStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
type SessionTab = "upcoming" | "past" | "cancelled";

type SessionItem = {
  id: string;
  mentorId: string;
  status: SessionStatus;
  type: "INTRO" | "PAID";
  scheduledAt: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  price: number;
  aiSummary?: string | null;
  meetingLink?: string | null;
  mentor: {
    id: string;
    name: string;
    image?: string | null;
    mentorProfile?: {
      username?: string | null;
      headline?: string | null;
      college?: string | null;
    } | null;
  };
  review?: { rating: number } | null;
  payment?: {
    amount?: number | null;
    refundAmount?: number | null;
    refundStatus?: string | null;
    status?: string | null;
  } | null;
};

const sessionGroups: Record<SessionTab, SessionStatus[]> = {
  upcoming: ["SCHEDULED", "ONGOING"],
  past: ["COMPLETED"],
  cancelled: ["CANCELLED", "NO_SHOW"],
};

const sessionTabClass =
  "min-h-10 flex-none rounded-xl px-4 text-sm font-semibold text-[#475569] opacity-100 transition-colors duration-200 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 data-active:bg-violet-100 data-active:text-violet-900 data-active:shadow-sm dark:text-[#475569] dark:hover:bg-violet-50 dark:hover:text-violet-900 dark:data-active:bg-violet-100 dark:data-active:text-violet-900";

async function fetchSessionsByStatus(status: SessionStatus) {
  const res = await fetch(`/api/sessions?status=${status}&limit=10&page=1`);
  if (!res.ok) throw new Error("Failed to load sessions");
  const json = (await res.json()) as { data: SessionItem[] };
  return json.data;
}

async function fetchSessions(tab: SessionTab) {
  const rows = await Promise.all(sessionGroups[tab].map((status) => fetchSessionsByStatus(status)));
  const merged = rows.flat();
  const deduped = Array.from(new Map(merged.map((session) => [session.id, session])).values());

  return deduped.sort((left, right) => {
    const leftTime = new Date(left.scheduledAt).getTime();
    const rightTime = new Date(right.scheduledAt).getTime();

    return tab === "upcoming" ? leftTime - rightTime : rightTime - leftTime;
  });
}

async function fetchSessionSummary() {
  const [upcoming, completed, cancelled] = await Promise.all([
    fetchSessions("upcoming"),
    fetchSessions("past"),
    fetchSessions("cancelled"),
  ]);

  return {
    upcoming: upcoming.length,
    completed: completed.length,
    cancelled: cancelled.length,
  };
}

async function cancelSession(sessionId: string) {
  const res = await fetch(`/api/sessions/${sessionId}/cancel`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "cancel", reason: "Cancelled from student dashboard." }),
  });
  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Unable to cancel session");
  }
  return res.json();
}

function getStatusBadgeClass(status: SessionStatus) {
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

function getQuickBookHref(mentorId: string, sessionId?: string): Route {
  const rescheduleQuery = sessionId ? `&reschedule=${sessionId}` : "";
  return `/dashboard/student/find-mentor?mentorId=${mentorId}${rescheduleQuery}#mentor-${mentorId}` as Route;
}

export default function StudentSessionsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<SessionTab>("upcoming");
  const { data = [], isLoading, isError } = useQuery({
    queryKey: queryKeys.sessions.student.list(tab),
    queryFn: () => fetchSessions(tab),
  });
  const {
    data: sessionSummary,
    isLoading: isSummaryLoading,
  } = useQuery({
    queryKey: ["student-session-summary"],
    queryFn: fetchSessionSummary,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSession,
    onSuccess: () => {
      toast.success("Session cancelled");
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.student.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.dashboard });
      queryClient.invalidateQueries({ queryKey: ["student-session-summary"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to cancel session");
    },
  });

  const showHeroAction = tab !== "upcoming" || data.length > 0;
  const heroActionLabel = tab === "upcoming" ? "View session" : "Book another mentor";

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border-violet-100 bg-white shadow-sm shadow-violet-900/5">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <Badge
                  variant="outline"
                  className="border-violet-200 bg-violet-50 text-violet-800"
                >
                  Session timeline
                </Badge>

                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  My sessions
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
                  Your mentor conversations, upcoming bookings, and session history — all in one place.
                </p>
              </div>

              {showHeroAction ? (
                <Link
                  href={tab === "upcoming" ? "#session-list" : "/dashboard/student/find-mentor"}
                  className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-5 text-sm font-semibold text-violet-900 shadow-sm transition-colors duration-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900 active:bg-violet-100 active:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                >
                  {heroActionLabel}
                  <ArrowRight className="size-4" />
                </Link>
              ) : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <CalendarClock className="size-4 text-violet-600" />
                  Upcoming
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {isSummaryLoading ? "—" : sessionSummary?.upcoming ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  Completed
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {isSummaryLoading ? "—" : sessionSummary?.completed ?? 0}
                </p>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <XCircle className="size-4 text-rose-500" />
                  Cancelled
                </div>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {isSummaryLoading ? "—" : sessionSummary?.cancelled ?? 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as SessionTab)}>
        <TabsList className="w-fit max-w-full gap-1 rounded-2xl border border-violet-100 bg-white p-1 shadow-sm shadow-violet-900/5">
          <TabsTrigger
            value="upcoming"
            className={sessionTabClass}
          >
            Upcoming
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className={sessionTabClass}
          >
            Past
          </TabsTrigger>
          <TabsTrigger
            value="cancelled"
            className={sessionTabClass}
          >
            Cancelled
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div id="session-list">
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-44 rounded-[1.5rem]" />
          ))}
        </div>
      ) : isError ? (
        <Card className="rounded-[1.5rem] border-red-200 bg-white">
          <CardContent className="p-5 text-sm text-red-600">Failed to load sessions.</CardContent>
        </Card>
      ) : data.length === 0 ? (
        <div className={tab === "upcoming" ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]" : ""}>
          <Card className="rounded-2xl border-violet-100 bg-white shadow-sm shadow-violet-900/5">
            <CardContent className="p-6 sm:p-7">
              {tab === "upcoming" ? (
                <>
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                    <CalendarClock className="size-5" />
                  </div>
                  <p className="mt-4 text-lg font-bold text-slate-950">No upcoming conversations</p>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-slate-600">
                    Your next mentor session will appear here after booking.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold text-slate-950">No {tab} sessions</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Sessions in this tab will appear here when available.
                  </p>
                </>
              )}
              {tab === "upcoming" ? (
                <Link
                  href="/dashboard/student/find-mentor"
                  className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-5 text-sm font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.5)] transition-colors duration-200 hover:bg-[#6D28D9] hover:text-white hover:shadow-[0_12px_32px_-12px_rgba(124,58,237,0.65)] active:bg-[#5B21B6] active:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 sm:w-auto"
                >
                  Find a mentor
                  <ArrowRight className="size-4" />
                </Link>
              ) : null}
            </CardContent>
          </Card>
          {tab === "upcoming" ? (
            <Card className="rounded-2xl border-violet-200 bg-violet-50/60 shadow-sm shadow-violet-900/5">
              <CardContent className="flex h-full min-h-[280px] flex-col justify-between p-6 sm:p-7">
                <div>
                  <Badge
                    variant="outline"
                    className="border-violet-200 bg-white text-violet-800"
                  >
                    Next step
                  </Badge>
                  <p className="mt-4 text-xl font-bold text-slate-950">Find your next mentor</p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    Explore mentors matched to your current goals and preferences, then choose a conversation that
                    feels useful right now.
                  </p>
                </div>
                <Link
                  href="/dashboard/student/find-mentor"
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-5 text-sm font-semibold text-violet-900 shadow-sm transition-colors duration-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900 active:border-violet-300 active:bg-violet-100 active:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                >
                  Find a mentor
                  <ArrowRight className="size-4" />
                </Link>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : (
        data.map((session) => {
          const quickBookHref = getQuickBookHref(session.mentorId, tab === "upcoming" ? session.id : undefined);
          const isCancelling =
            cancelMutation.isPending && cancelMutation.variables === session.id;

          return (
            <Card key={session.id} className="rounded-[1.5rem] border-slate-200 bg-white">
              <CardContent className="p-5">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-4">
                      <MentorAvatar
                        src={session.mentor.image}
                        alt={session.mentor.name}
                        fallback={getInitials(session.mentor.name)}
                        className="size-12"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base text-slate-950">{session.mentor.name}</CardTitle>
                          <Badge
                            variant="outline"
                            className={cn("border", getStatusBadgeClass(session.status))}
                          >
                            {formatEnumLabel(session.status)}
                          </Badge>
                          <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                            {formatEnumLabel(session.type)}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {session.mentor.mentorProfile?.headline ??
                            session.mentor.mentorProfile?.college ??
                            "Mentor session"}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <CalendarClock className="size-4 text-slate-500" />
                            <span>{formatDateTime(session.scheduledAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Video className="size-4 text-slate-500" />
                            <span>{session.meetingLink ? "Meeting room ready" : "Room details pending"}</span>
                          </div>
                        </div>

                        {tab === "past" ? (
                          <div className="mt-4 grid gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Rating given
                              </p>
                              <p className="mt-2 text-sm font-medium text-slate-900">
                                {session.review?.rating ? `${session.review.rating} / 5` : "Not submitted yet"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                AI summary
                              </p>
                              <p className="mt-2 text-sm text-slate-700">
                                {session.aiSummary?.slice(0, 130) ?? "Summary is still being generated."}
                              </p>
                            </div>
                          </div>
                        ) : null}

                        {tab === "cancelled" ? (
                          <div className="mt-4 grid gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Refund status
                              </p>
                              <p className="mt-2 text-sm font-medium text-slate-900">
                                {formatEnumLabel(session.payment?.refundStatus) || "No refund"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Refund amount
                              </p>
                              <p className="mt-2 text-sm font-medium text-slate-900">
                                {formatCurrency(session.payment?.refundAmount ?? 0)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                Cancelled on
                              </p>
                              <p className="mt-2 text-sm font-medium text-slate-900">
                                {session.cancelledAt ? formatDateOnly(session.cancelledAt) : "Not recorded"}
                              </p>
                            </div>
                            {session.cancellationReason ? (
                              <div className="sm:col-span-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                                  Reason
                                </p>
                                <p className="mt-2 text-sm text-slate-700">{session.cancellationReason}</p>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
                    {tab === "upcoming" ? (
                      <>
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
                          <Button size="sm" disabled>
                            Join
                          </Button>
                        )}
                        <Link href={quickBookHref} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                          Reschedule
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancelMutation.mutate(session.id)}
                          disabled={isCancelling}
                        >
                          {isCancelling ? "Cancelling..." : "Cancel"}
                        </Button>
                      </>
                    ) : null}

                    {tab === "past" ? (
                      <Link href={quickBookHref} className={buttonVariants({ variant: "secondary", size: "sm" })}>
                        <RotateCcw className="size-3.5" />
                        Rebook
                      </Link>
                    ) : null}

                    {tab === "cancelled" ? (
                      <Link href={quickBookHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        Book again
                      </Link>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
      </div>
    </div>
  );
}

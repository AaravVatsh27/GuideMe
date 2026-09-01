"use client";

import type { Route } from "next";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock, RotateCcw, Video } from "lucide-react";
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

  const cancelMutation = useMutation({
    mutationFn: cancelSession,
    onSuccess: () => {
      toast.success("Session cancelled");
      queryClient.invalidateQueries({ queryKey: queryKeys.sessions.student.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.dashboard });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to cancel session");
    },
  });

  return (
    <div className="space-y-5">
      <Card className="rounded-[1.75rem] border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(125,211,252,0.16),_transparent_24%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_60%,_#eef2ff_100%)]">
        <CardContent className="p-6 sm:p-7">
          <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
            Session timeline
          </Badge>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">My sessions</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Track what is next, revisit summaries from finished calls, and keep refund status visible when plans change.
              </p>
            </div>
            <Link href="/dashboard/student/find-mentor" className={buttonVariants({ variant: "outline" })}>
              Book another mentor
            </Link>
          </div>
        </CardContent>
      </Card>

      <Tabs value={tab} onValueChange={(value) => setTab(value as SessionTab)}>
        <TabsList variant="line" className="rounded-none p-0">
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

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
        <Card className="rounded-[1.5rem] border-slate-200 bg-white">
          <CardContent className="p-6 text-sm text-slate-600">
            No sessions in this tab yet.
          </CardContent>
        </Card>
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
  );
}

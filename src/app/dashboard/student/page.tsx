"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Clock3, Compass, Heart, RotateCcw, Sparkles, Star, Users } from "lucide-react";

import { MentorAvatar } from "@/Frontend/components/MentorAvatar";
import {
  formatActivityLabel,
  formatCurrency,
  formatDateTime,
  formatShortDateTime,
  getInitials,
} from "@/Frontend/views/dashboard/student/student-dashboard-utils";
import { Badge } from "@/Frontend/components/ui/badge";
import { buttonVariants } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { Skeleton } from "@/Frontend/components/ui/skeleton";
import { queryKeys } from "@/Frontend/lib/react-query";
import { cn } from "@/Backend/server/utils";

type DashboardResponse = {
  greetingName: string;
  upcomingSession: {
    id: string;
    scheduledAt: string;
    meetingLink?: string | null;
    mentor: {
      id: string;
      name: string;
      image?: string | null;
      mentorProfile?: {
        headline?: string | null;
        college?: string | null;
        username?: string | null;
      } | null;
    };
    payment?: {
      amount?: number | null;
      status?: string | null;
    } | null;
  } | null;
  quickStats: {
    sessionsCompleted: number;
    moneySpent: number;
    mentorsTried: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
  }>;
};

type MentorMatch = {
  mentor: {
    id: string;
    name: string;
    image?: string | null;
    college?: string | null;
    tier: string;
    headline?: string | null;
    avgRating: number;
    totalReviews: number;
    priceMin?: number | null;
    availableThisWeek: boolean;
  };
  matchScore: number;
  matchReasons: string[];
};

type MatchingResponse = {
  cached: boolean;
  generatedAt: string;
  matches: MentorMatch[];
};

type SavedMentor = {
  id: string;
  mentorId: string;
  createdAt: string;
  mentor: {
    name: string;
    image?: string | null;
    mentorProfile?: {
      headline?: string | null;
      college?: string | null;
      tier?: string | null;
      avgRating?: number | null;
      priceMin?: number | null;
    } | null;
  };
};

type PastSessionItem = {
  id: string;
  mentorId: string;
  scheduledAt: string;
  type: "INTRO" | "PAID";
  aiSummary?: string | null;
  mentor: {
    name: string;
    image?: string | null;
    mentorProfile?: {
      headline?: string | null;
      college?: string | null;
    } | null;
  };
  review?: { rating: number } | null;
};

async function getDashboard() {
  const res = await fetch("/api/student/dashboard");
  if (!res.ok) throw new Error("Failed to load dashboard");
  return (await res.json()) as DashboardResponse;
}

async function getMatches() {
  const res = await fetch("/api/matching", { method: "POST" });
  if (!res.ok) throw new Error("Failed to load mentor matches");
  return (await res.json()) as MatchingResponse;
}

async function getSavedMentors() {
  const res = await fetch("/api/student/saved-mentors");
  if (!res.ok) throw new Error("Failed to load saved mentors");
  const json = (await res.json()) as { data: SavedMentor[] };
  return json.data;
}

async function getPastSessions() {
  const res = await fetch("/api/sessions?status=COMPLETED&limit=3&page=1");
  if (!res.ok) throw new Error("Failed to load past sessions");
  const json = (await res.json()) as { data: PastSessionItem[] };
  return json.data;
}

function useCountdown(targetDate?: string | null) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!targetDate) {
      return undefined;
    }

    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  return useMemo(() => {
    if (!targetDate) {
      return null;
    }

    const diff = Math.max(0, new Date(targetDate).getTime() - now);
    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      label: `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`,
      totalSeconds,
    };
  }, [now, targetDate]);
}

function getMentorDiscoveryHref(mentorId: string): Route {
  return `/dashboard/student/find-mentor?mentorId=${mentorId}#mentor-${mentorId}` as Route;
}

export default function StudentDashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.student.dashboard,
    queryFn: getDashboard,
  });
  const { data: matchesData, isLoading: matchesLoading, isError: matchesError } = useQuery({
    queryKey: queryKeys.student.matching,
    queryFn: getMatches,
  });
  const {
    data: savedMentors = [],
    isLoading: savedMentorsLoading,
    isError: savedMentorsError,
  } = useQuery({
    queryKey: queryKeys.student.savedMentors,
    queryFn: getSavedMentors,
    select: (items: SavedMentor[]) => items.slice(0, 3),
  });
  const {
    data: pastSessions = [],
    isLoading: pastSessionsLoading,
    isError: pastSessionsError,
  } = useQuery({
    queryKey: queryKeys.student.dashboardPastSessions,
    queryFn: getPastSessions,
  });

  const countdown = useCountdown(data?.upcomingSession?.scheduledAt);
  const greetingPeriod = useMemo(() => {
    const hour = new Date().getHours();

    if (hour < 12) {
      return "Good morning";
    }

    if (hour < 18) {
      return "Good afternoon";
    }

    return "Good evening";
  }, []);
  const greeting = `${greetingPeriod}, ${data?.greetingName ?? "Student"}`;
  const mentors = (matchesData?.matches ?? []).slice(0, 3);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
          <Skeleton className="h-56 rounded-[1.75rem]" />
          <Skeleton className="h-56 rounded-[1.75rem]" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-[1.5rem]" />
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <Skeleton className="h-96 rounded-[1.75rem]" />
          <Skeleton className="h-96 rounded-[1.75rem]" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="rounded-[1.75rem] border-red-200 bg-white">
        <CardContent className="p-6 text-sm text-red-600">Failed to load dashboard data.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <Card className="overflow-hidden rounded-[1.75rem] border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_22%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_55%,_#eef2ff_100%)]">
          <CardContent className="p-6 sm:p-8">
            <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
              Student overview
            </Badge>
            <div className="mt-5 max-w-2xl space-y-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{greeting}</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                  Track the next session, review your recent moves, and move the strongest mentor matches straight into discovery.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/dashboard/student/find-mentor" className={buttonVariants({ size: "lg" })}>
                  Find mentor
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/dashboard/student/sessions"
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Review sessions
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {data.upcomingSession ? (
          <Card className="rounded-[1.75rem] border-emerald-200 bg-emerald-50/80">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <CalendarClock className="size-5 text-emerald-700" />
                Upcoming in the next 24 hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-3">
                <MentorAvatar
                  src={data.upcomingSession.mentor.image}
                  alt={data.upcomingSession.mentor.name}
                  fallback={getInitials(data.upcomingSession.mentor.name)}
                  className="size-12"
                />
                <div>
                  <p className="font-semibold text-slate-950">{data.upcomingSession.mentor.name}</p>
                  <p className="text-sm text-slate-600">
                    {data.upcomingSession.mentor.mentorProfile?.headline ??
                      data.upcomingSession.mentor.mentorProfile?.college ??
                      "Mentor session"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 rounded-[1.5rem] border border-emerald-200/70 bg-white/80 p-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Scheduled</p>
                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatDateTime(data.upcomingSession.scheduledAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Countdown</p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Clock3 className="size-4 text-emerald-700" />
                    {countdown?.label ?? "Starting soon"}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {data.upcomingSession.meetingLink ? (
                  <a
                    href={data.upcomingSession.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ size: "lg" })}
                  >
                    Join session
                  </a>
                ) : (
                  <Link href="/dashboard/student/sessions" className={buttonVariants({ size: "lg" })}>
                    Open sessions
                  </Link>
                )}
                <Link
                  href={getMentorDiscoveryHref(data.upcomingSession.mentor.id)}
                  className={buttonVariants({ variant: "outline", size: "lg" })}
                >
                  Find similar mentors
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-[1.75rem] border-slate-200 bg-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <Compass className="size-5 text-sky-600" />
                No session due in the next 24 hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">
                Use your matching recommendations or saved mentors to line up the next high-signal conversation.
              </p>
              <Link href="/dashboard/student/find-mentor" className={buttonVariants({ variant: "outline" })}>
                Explore mentor matches
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Sessions completed",
            value: data.quickStats.sessionsCompleted.toLocaleString("en-IN"),
            detail: "Completed calls that reached the finish line.",
          },
          {
            label: "Money spent",
            value: formatCurrency(data.quickStats.moneySpent),
            detail: "Total captured payments across your mentoring sessions.",
          },
          {
            label: "Mentors tried",
            value: data.quickStats.mentorsTried.toLocaleString("en-IN"),
            detail: "Distinct mentors you have already learned from.",
          },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{stat.value}</p>
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
                <Heart className="size-5 text-rose-600" />
                Saved mentors
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">Your shortlist stays visible here for faster rebooking.</p>
            </div>
            <Link href="/dashboard/student/saved" className={buttonVariants({ variant: "outline", size: "sm" })}>
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {savedMentorsLoading ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-[1.25rem]" />)
            ) : savedMentorsError ? (
              <div className="rounded-[1.25rem] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                Saved mentors are unavailable right now.
              </div>
            ) : savedMentors.length === 0 ? (
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
                <p className="font-medium text-slate-900">No saved mentors yet.</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Build a shortlist while browsing mentor matches so the next booking starts with real options.
                </p>
                <Link href="/dashboard/student/find-mentor" className={cn(buttonVariants({ variant: "outline" }), "mt-4")}>
                  Find mentors
                </Link>
              </div>
            ) : (
              savedMentors.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <MentorAvatar
                        src={item.mentor.image}
                        alt={item.mentor.name}
                        fallback={getInitials(item.mentor.name)}
                        className="size-11"
                      />
                      <div>
                        <p className="font-semibold text-slate-950">{item.mentor.name}</p>
                        <p className="text-sm text-slate-600">
                          {item.mentor.mentorProfile?.headline ?? item.mentor.mentorProfile?.college ?? "Mentor"}
                        </p>
                      </div>
                    </div>
                    {item.mentor.mentorProfile?.tier ? (
                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                        {item.mentor.mentorProfile.tier}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-slate-500">Rating</p>
                      <p className="mt-1 font-semibold text-slate-950">
                        {item.mentor.mentorProfile?.avgRating?.toFixed(1) ?? "0.0"} / 5
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-white p-3">
                      <p className="text-slate-500">Starting price</p>
                      <p className="mt-1 font-semibold text-slate-950">
                        {formatCurrency(item.mentor.mentorProfile?.priceMin)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      Saved {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </p>
                    <Link
                      href={getMentorDiscoveryHref(item.mentorId)}
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      Quick book
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <RotateCcw className="size-5 text-sky-700" />
                Past sessions to rebook
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Revisit AI summaries from finished sessions and go straight back to the same mentor.
              </p>
            </div>
            <Link href="/dashboard/student/sessions" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Open history
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pastSessionsLoading ? (
              Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-36 rounded-[1.25rem]" />)
            ) : pastSessionsError ? (
              <div className="rounded-[1.25rem] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                Past sessions are unavailable right now.
              </div>
            ) : pastSessions.length === 0 ? (
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                No completed sessions yet. Once a session finishes, its summary and rebook option will appear here.
              </div>
            ) : (
              pastSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <MentorAvatar
                        src={session.mentor.image}
                        alt={session.mentor.name}
                        fallback={getInitials(session.mentor.name)}
                        className="size-11"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-950">{session.mentor.name}</p>
                        <p className="text-sm text-slate-600">
                          {session.mentor.mentorProfile?.headline ?? session.mentor.mentorProfile?.college ?? "Mentor"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{formatShortDateTime(session.scheduledAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                        {session.type}
                      </Badge>
                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                        <Star className="mr-1 size-3.5 text-amber-500" />
                        {session.review?.rating ? `${session.review.rating} / 5` : "No rating"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1rem] border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">AI summary</p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {session.aiSummary?.slice(0, 180) ?? "Summary is still being generated for this session."}
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Link
                      href={getMentorDiscoveryHref(session.mentorId)}
                      className={buttonVariants({ variant: "secondary", size: "sm" })}
                    >
                      <RotateCcw className="size-3.5" />
                      Rebook mentor
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <div>
              <CardTitle className="text-lg text-slate-950">Recommended mentors</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Ranked from your current onboarding and recent matching cache.
              </p>
            </div>
            <Link
              href="/dashboard/student/find-mentor"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Explore all
            </Link>
          </CardHeader>
          <CardContent>
            {matchesLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-72 min-w-[280px] rounded-[1.5rem]" />
                ))}
              </div>
            ) : matchesError ? (
              <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                Mentor matching is unavailable right now.
              </div>
            ) : mentors.length === 0 ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                <p className="font-medium text-slate-900">No strong mentor matches yet.</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Refresh your onboarding preferences from profile to improve the recommendations.
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {mentors.map((entry) => (
                  <article
                    key={entry.mentor.id}
                    className="min-w-[280px] rounded-[1.5rem] border border-slate-200 bg-slate-50/60 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <MentorAvatar
                          src={entry.mentor.image}
                          alt={entry.mentor.name}
                          fallback={getInitials(entry.mentor.name)}
                          className="size-11"
                        />
                        <div>
                          <p className="font-semibold text-slate-950">{entry.mentor.name}</p>
                          <p className="text-sm text-slate-600">
                            {entry.mentor.headline ?? entry.mentor.college ?? "Mentor"}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                        {entry.matchScore}/100
                      </Badge>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                        {entry.mentor.tier}
                      </Badge>
                      {entry.mentor.availableThisWeek ? (
                        <Badge className="bg-emerald-600 text-white">Available this week</Badge>
                      ) : null}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-slate-500">Starting price</p>
                        <p className="mt-1 font-semibold text-slate-950">{formatCurrency(entry.mentor.priceMin)}</p>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-slate-500">Rating</p>
                        <p className="mt-1 font-semibold text-slate-950">
                          {entry.mentor.avgRating.toFixed(1)} / 5
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {entry.matchReasons.slice(0, 3).map((reason) => (
                        <div key={reason} className="flex items-start gap-2 text-sm text-slate-600">
                          <Sparkles className="mt-0.5 size-3.5 shrink-0 text-teal-600" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    <Link
                      href={getMentorDiscoveryHref(entry.mentor.id)}
                      className={cn(buttonVariants({ variant: "outline" }), "mt-5 w-full")}
                    >
                      View in discovery
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-950">Recent activity</CardTitle>
            <p className="text-sm text-slate-500">Latest five actions from your student account.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                No recent activity yet.
              </div>
            ) : (
              data.recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-[1.25rem] border border-slate-200 bg-slate-50/70 p-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-slate-950">{formatActivityLabel(item.action)}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatActivityLabel(item.entityType)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
                    <Users className="size-3.5" />
                    <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

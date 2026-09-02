"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CalendarClock, Clock3, Compass, Heart, RotateCcw, Sparkles, Star, Users } from "lucide-react";

import { MentorAvatar } from "@/Frontend/components/MentorAvatar";
import {
  buildHeroSubtitle,
  formatAcademicContext,
  formatActivityLabel,
  formatCurrency,
  formatDateTime,
  formatDecisionStage,
  formatMentorshipNeeds,
  formatShortDateTime,
  formatTargetExamLabel,
  getInitials,
  truncateSentence,
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

type StudentProfileSnapshot = {
  class?: string | null;
  board?: string | null;
  stream?: string | null;
  schoolingMode?: string | null;
  coachingMode?: string | null;
  targetExam?: string | null;
  targetExams?: string[] | null;
  mentorshipNeeds?: string[] | null;
  decisionStage?: string | null;
  currentConfusion?: string | null;
  confusionType?: string | null;
  confusionTypes?: string[] | null;
  city?: string | null;
  state?: string | null;
  languagePreference?: string | null;
};

type StudentProfileResponse = {
  user: { id: string; name: string; email: string; image?: string | null };
  studentProfile: StudentProfileSnapshot | null;
  settings: { notificationsEnabled: boolean; profileVisibility: string };
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

async function getStudentProfile() {
  const res = await fetch("/api/student/profile");
  if (!res.ok) return null;
  return (await res.json()) as StudentProfileResponse;
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
  const { data: profileData } = useQuery({
    queryKey: queryKeys.student.profile,
    queryFn: getStudentProfile,
    retry: false,
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

  const profile = profileData?.studentProfile ?? null;
  const academicContext = formatAcademicContext(profile);
  const targetExamLabel = formatTargetExamLabel(profile);
  const focusTags = formatMentorshipNeeds(profile?.mentorshipNeeds ?? null);
  const decisionStageLabel = formatDecisionStage(profile?.decisionStage ?? null);
  const heroSubtitle = buildHeroSubtitle(profile);

  if (isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-56 rounded-[1.9rem]" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32 rounded-[1.5rem]" />
          <Skeleton className="h-32 rounded-[1.5rem]" />
        </div>
        <Skeleton className="h-48 rounded-[1.75rem]" />
        <Skeleton className="h-80 rounded-[1.9rem]" />
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
      {/* Hero */}
      <Card className="overflow-hidden rounded-[1.9rem] border-violet-200 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.18),_transparent_28%),radial-gradient(circle_at_right,_rgba(236,72,153,0.14),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#faf5ff_38%,_#f5f3ff_100%)] shadow-[0_26px_70px_-40px_rgba(124,58,237,0.5)]">
        <CardContent className="p-6 sm:p-8">
          <div className="max-w-2xl space-y-4">
            {focusTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {focusTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/40 bg-white/20 px-3 py-1.5 text-sm font-medium text-violet-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.06em] text-slate-950 sm:text-4xl">{greeting}</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                {heroSubtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard/student/find-mentor" className={buttonVariants({ size: "lg" })}>
                Find a mentor
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

      {/* Current Focus — only shown when profile data exists */}
      {profileData?.studentProfile && (
        <Card className="rounded-[1.75rem] border-violet-200 bg-white shadow-[0_20px_60px_-38px_rgba(124,58,237,0.35)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-950">
              <Sparkles className="size-4 text-violet-600" />
              Your current focus
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              {academicContext && (
                <p className="text-sm font-medium text-slate-600">{academicContext}</p>
              )}
              {targetExamLabel && (
                <p className="mt-1 text-lg font-semibold text-slate-950">Preparing for {targetExamLabel}</p>
              )}
              {decisionStageLabel && (
                <p className="mt-1 text-sm text-slate-500">{decisionStageLabel}</p>
              )}
            </div>
            {profileData.studentProfile.currentConfusion && (
              <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  What you&apos;re working through
                </p>
                <p className="mt-1.5 text-sm leading-6 text-slate-700">
                  {truncateSentence(profileData.studentProfile.currentConfusion, 120)}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick stats */}
      <section className="grid gap-4 sm:grid-cols-2">
        {[
          {
            label: "Sessions completed",
            value: data.quickStats.sessionsCompleted.toLocaleString("en-IN"),
            detail: "Meaningful conversations that moved clarity forward.",
          },
          {
            label: "Mentors tried",
            value: data.quickStats.mentorsTried.toLocaleString("en-IN"),
            detail: "Distinct mentors who helped you sharpen your path.",
          },
        ].map((stat) => (
          <Card key={stat.label} className="rounded-[1.5rem] border-violet-100 bg-white shadow-[0_18px_50px_-36px_rgba(124,58,237,0.3)]">
            <CardContent className="p-5">
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-slate-950">{stat.value}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600">{stat.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Upcoming session */}
      {data.upcomingSession ? (
        <Card className="rounded-[1.9rem] border-violet-200 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 text-white shadow-[0_28px_70px_-36px_rgba(168,85,247,0.8)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-white">
              <CalendarClock className="size-5 text-violet-100" />
              Next session
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <MentorAvatar
                src={data.upcomingSession.mentor.image}
                alt={data.upcomingSession.mentor.name}
                fallback={getInitials(data.upcomingSession.mentor.name)}
                className="size-12 ring-2 ring-white/30"
              />
              <div>
                <p className="font-semibold text-white">{data.upcomingSession.mentor.name}</p>
                <p className="text-sm text-violet-100">
                  {data.upcomingSession.mentor.mentorProfile?.headline ??
                    data.upcomingSession.mentor.mentorProfile?.college ??
                    "Mentor session"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.5rem] border border-white/20 bg-white/10 p-4 backdrop-blur-sm sm:grid-cols-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-100">Scheduled</p>
                <p className="mt-2 text-sm font-medium text-white">
                  {formatDateTime(data.upcomingSession.scheduledAt)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-100">Countdown</p>
                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white">
                  <Clock3 className="size-4 text-violet-100" />
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
                View mentor
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-[1.9rem] border-violet-200 bg-white shadow-[0_20px_60px_-38px_rgba(124,58,237,0.35)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <Compass className="size-5 text-violet-600" />
              No session in the next 24 hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              Use mentor matches or your saved list to plan the next conversation with maximum signal.
            </p>
            <Link href="/dashboard/student/find-mentor" className={buttonVariants({ variant: "outline" })}>
              Explore mentor matches
            </Link>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="rounded-[1.9rem] border-violet-100 bg-white shadow-[0_20px_60px_-38px_rgba(124,58,237,0.35)]">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <Heart className="size-5 text-rose-500" />
                Saved mentors
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">People you want to revisit when the next decision matters.</p>
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
              <div className="rounded-[1.25rem] border border-violet-100 bg-violet-50/40 p-5">
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
                <div key={item.id} className="rounded-[1.25rem] border border-violet-100 bg-violet-50/30 p-4">
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
                      <Badge variant="outline" className="border-violet-200 bg-white text-violet-700">
                        {item.mentor.mentorProfile.tier}
                      </Badge>
                    ) : null}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-violet-100 bg-white p-3">
                      <p className="text-slate-500">Rating</p>
                      <p className="mt-1 font-semibold text-slate-950">
                        {item.mentor.mentorProfile?.avgRating?.toFixed(1) ?? "0.0"} / 5
                      </p>
                    </div>
                    <div className="rounded-xl border border-violet-100 bg-white p-3">
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
                      View mentor
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.9rem] border-violet-100 bg-white shadow-[0_20px_60px_-38px_rgba(124,58,237,0.35)]">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <RotateCcw className="size-5 text-violet-600" />
                Past sessions
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">Helpful context you can revisit before the next decision.</p>
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
              <div className="rounded-[1.25rem] border border-violet-100 bg-violet-50/30 p-5 text-sm leading-6 text-slate-600">
                No completed sessions yet. Once a session finishes, its summary and rebook option will appear here.
              </div>
            ) : (
              pastSessions.map((session) => (
                <div key={session.id} className="rounded-[1.25rem] border border-violet-100 bg-violet-50/30 p-4">
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
                      <Badge variant="outline" className="border-violet-200 bg-white text-violet-700">
                        {session.type}
                      </Badge>
                      <Badge variant="outline" className="border-violet-200 bg-white text-violet-700">
                        <Star className="mr-1 size-3.5 text-amber-500" />
                        {session.review?.rating ? `${session.review.rating} / 5` : "No rating"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 rounded-[1rem] border border-violet-100 bg-white p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-600">AI summary</p>
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

      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.9rem] border-violet-100 bg-white shadow-[0_20px_60px_-38px_rgba(124,58,237,0.35)]">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
            <div>
              <CardTitle className="text-lg text-slate-950">Recommended mentors</CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Ranked for your current path and recent guidance needs.
              </p>
            </div>
            <Link href="/dashboard/student/find-mentor" className={buttonVariants({ variant: "outline", size: "sm" })}>
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
              <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50/30 p-5">
                <p className="font-medium text-slate-900">No strong mentor matches yet.</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Refresh your onboarding preferences from profile to improve the recommendations.
                </p>
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {mentors.map((entry) => (
                  <article key={entry.mentor.id} className="min-w-[280px] rounded-[1.5rem] border border-violet-100 bg-violet-50/30 p-4">
                    <div className="flex items-start gap-3">
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

                    {entry.mentor.availableThisWeek && (
                      <p className="mt-2 text-xs font-medium text-emerald-600">● Available this week</p>
                    )}

                    <div className="mt-3 flex gap-3 text-sm text-slate-500">
                      <span>From {formatCurrency(entry.mentor.priceMin)}</span>
                      <span className="text-slate-300">·</span>
                      <span>★ {entry.mentor.avgRating.toFixed(1)}</span>
                    </div>

                    {entry.matchReasons.length > 0 && (
                      <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-600">
                        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
                        <span>{entry.matchReasons[0]}</span>
                      </p>
                    )}

                    <Link
                      href={getMentorDiscoveryHref(entry.mentor.id)}
                      className={cn(buttonVariants({ variant: "outline" }), "mt-4 w-full")}
                    >
                      View mentor
                    </Link>
                  </article>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.9rem] border-violet-100 bg-white shadow-[0_20px_60px_-38px_rgba(124,58,237,0.35)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-slate-950">Recent activity</CardTitle>
            <p className="text-sm text-slate-500">Latest actions from your student account.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentActivity.length === 0 ? (
              <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50/30 p-5 text-sm text-slate-600">
                No recent activity yet.
              </div>
            ) : (
              data.recentActivity.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-[1.25rem] border border-violet-100 bg-violet-50/30 p-4">
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

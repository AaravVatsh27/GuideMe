"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Lock,
  MessageSquareText,
  PhoneOff,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { queryKeys } from "@/Frontend/lib/react-query";
import { formatDateTime } from "@/Frontend/views/dashboard/student/student-dashboard-utils";
import { MentorAvatar } from "@/Frontend/components/MentorAvatar";
import { Badge } from "@/Frontend/components/ui/badge";
import { Button } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/Frontend/components/ui/dialog";
import { Label } from "@/Frontend/components/ui/label";
import { Skeleton } from "@/Frontend/components/ui/skeleton";
import { Textarea } from "@/Frontend/components/ui/textarea";
import { SESSION_JOIN_EARLY_WINDOW_MINUTES } from "@/Backend/server/constants";
import { cn } from "@/Backend/server/utils";

type SessionStatus = "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
type SessionType = "INTRO" | "PAID";

type SessionDetails = {
  id: string;
  studentId: string;
  mentorId: string;
  status: SessionStatus;
  type: SessionType;
  scheduledAt: string;
  startedAt?: string | null;
  endedAt?: string | null;
  durationMinutes: number;
  price: number;
  mentorEarning: number;
  meetingLink?: string | null;
  aiSummary?: string | null;
  mentor: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  student: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
  notes: Array<{
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      name: string;
      email: string;
      role: string;
      image?: string | null;
    };
  }>;
  review?: {
    id: string;
    rating: number;
    reviewText?: string | null;
    wouldRebook: boolean;
    isPublic: boolean;
  } | null;
  payout?: {
    id: string;
    amount: number;
    status: string;
    scheduledAt?: string | null;
    processedAt?: string | null;
    transactionId?: string | null;
  } | null;
  payment?: {
    status: string;
    amount: number;
  } | null;
};

type Props = {
  sessionId: string;
  currentUserId: string;
  initialSession: SessionDetails;
  shouldPromptReview?: boolean;
};

type DailyTokenResponse = {
  joinUrl: string;
  roomOpensAt: string;
};

const ACTIVE_SESSION_STATUSES = new Set<SessionStatus>(["SCHEDULED", "ONGOING"]);

async function fetchSession(sessionId: string) {
  const response = await fetch(`/api/sessions/${sessionId}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to load session");
  }

  return (await response.json()) as SessionDetails;
}

async function fetchDailyToken(sessionId: string) {
  const response = await fetch(`/api/sessions/${sessionId}/daily-token`, {
    credentials: "include",
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to prepare Daily room");
  }

  return (await response.json()) as DailyTokenResponse;
}

async function patchSession(sessionId: string, payload: Record<string, unknown>) {
  const response = await fetch(`/api/sessions/${sessionId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to update session");
  }

  return (await response.json()) as SessionDetails;
}

async function createSessionNote(sessionId: string, content: string) {
  const response = await fetch(`/api/sessions/${sessionId}/notes`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to save note");
  }

  return response.json();
}

async function submitReview(sessionId: string, payload: {
  rating: number;
  reviewText: string;
  wouldRebook: boolean;
}) {
  const response = await fetch("/api/reviews", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      sessionId,
      rating: payload.rating,
      reviewText: payload.reviewText.trim() || undefined,
      tags: [],
      wouldRebook: payload.wouldRebook,
      isPublic: true,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to submit review");
  }

  return response.json();
}

function formatCurrency(value: number | null | undefined) {
  return `INR ${(value ?? 0).toLocaleString("en-IN")}`;
}

function formatShortTimestamp(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}

function getCountdownLabel(totalSeconds: number) {
  const seconds = Math.max(0, totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m ${remainingSeconds.toString().padStart(2, "0")}s`;
  }

  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
}

function getCountdownState(session: SessionDetails, now: number) {
  const scheduledAt = new Date(session.scheduledAt).getTime();
  const roomOpensAt = scheduledAt - SESSION_JOIN_EARLY_WINDOW_MINUTES * 60 * 1000;
  const startBase = new Date(session.startedAt ?? session.scheduledAt).getTime();
  const endsAt = startBase + session.durationMinutes * 60 * 1000;

  if (session.status === "COMPLETED") {
    return {
      label: "Session completed",
      tone: "emerald" as const,
    };
  }

  if (session.status === "CANCELLED" || session.status === "NO_SHOW") {
    return {
      label: "Session closed",
      tone: "slate" as const,
    };
  }

  if (now < roomOpensAt) {
    return {
      label: `Room opens in ${getCountdownLabel(Math.floor((roomOpensAt - now) / 1000))}`,
      tone: "amber" as const,
    };
  }

  if (now < scheduledAt) {
    return {
      label: `Session starts in ${getCountdownLabel(Math.floor((scheduledAt - now) / 1000))}`,
      tone: "sky" as const,
    };
  }

  if (now <= endsAt) {
    return {
      label: `Time remaining ${getCountdownLabel(Math.floor((endsAt - now) / 1000))}`,
      tone: "emerald" as const,
    };
  }

  return {
    label: `Overtime ${getCountdownLabel(Math.floor((now - endsAt) / 1000))}`,
    tone: "rose" as const,
  };
}

function getCountdownClass(tone: "amber" | "sky" | "emerald" | "rose" | "slate") {
  switch (tone) {
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "sky":
      return "border-sky-200 bg-sky-50 text-sky-800";
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "rose":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getStatusBadgeClass(status: SessionStatus) {
  switch (status) {
    case "ONGOING":
      return "bg-emerald-600 text-white";
    case "COMPLETED":
      return "bg-slate-200 text-slate-900";
    case "CANCELLED":
      return "bg-amber-100 text-amber-900";
    case "NO_SHOW":
      return "bg-rose-100 text-rose-900";
    default:
      return "bg-sky-100 text-sky-900";
  }
}

export function SessionRoomPageClient({
  sessionId,
  currentUserId,
  initialSession,
  shouldPromptReview = false,
}: Props) {
  const queryClient = useQueryClient();
  const [now, setNow] = useState(() => Date.now());
  const [noteDraft, setNoteDraft] = useState("");
  const [dailyJoinUrl, setDailyJoinUrl] = useState<string | null>(null);
  const [dailyJoinError, setDailyJoinError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(shouldPromptReview);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [wouldRebook, setWouldRebook] = useState(true);

  const sessionQuery = useQuery({
    queryKey: queryKeys.sessions.detail(sessionId),
    queryFn: () => fetchSession(sessionId),
    initialData: initialSession,
    refetchInterval: (query) => {
      const status = (query.state.data as SessionDetails | undefined)?.status;
      return status && ACTIVE_SESSION_STATUSES.has(status) ? 5000 : false;
    },
  });

  const session = sessionQuery.data;
  const isMentor = session ? session.mentorId === currentUserId : false;
  const isStudent = session ? session.studentId === currentUserId : false;

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const countdown = useMemo(() => {
    if (!session) {
      return null;
    }

    return getCountdownState(session, now);
  }, [now, session]);

  const roomOpensAt = useMemo(() => {
    if (!session) {
      return null;
    }

    return new Date(
      new Date(session.scheduledAt).getTime() - SESSION_JOIN_EARLY_WINDOW_MINUTES * 60 * 1000,
    );
  }, [session]);

  const canOpenRoom = useMemo(() => {
    if (!session || !roomOpensAt) {
      return false;
    }

    if (!ACTIVE_SESSION_STATUSES.has(session.status)) {
      return false;
    }

    return now >= roomOpensAt.getTime();
  }, [now, roomOpensAt, session]);

  useEffect(() => {
    if (!session || !isStudent) {
      return;
    }

    if (session.status === "COMPLETED" && !session.review) {
      setReviewOpen(true);
    }
  }, [isStudent, session]);

  useEffect(() => {
    let active = true;

    if (!session || !canOpenRoom || !session.meetingLink || !ACTIVE_SESSION_STATUSES.has(session.status)) {
      setDailyJoinUrl(null);
      setDailyJoinError(null);
      return () => {
        active = false;
      };
    }

    fetchDailyToken(session.id)
      .then((payload) => {
        if (!active) {
          return;
        }

        setDailyJoinUrl(payload.joinUrl);
        setDailyJoinError(null);
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setDailyJoinUrl(null);
        setDailyJoinError(error instanceof Error ? error.message : "Unable to prepare the Daily room");
      });

    return () => {
      active = false;
    };
  }, [canOpenRoom, session]);

  const startMutation = useMutation({
    mutationFn: () => patchSession(sessionId, { action: "start" }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.sessions.detail(sessionId), updated);
      toast.success("Session started");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to start session");
    },
  });

  const completeMutation = useMutation({
    mutationFn: () => patchSession(sessionId, { action: "complete" }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.sessions.detail(sessionId), updated);
      setDailyJoinUrl(null);
      toast.success("Session completed");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to complete session");
    },
  });

  const noteMutation = useMutation({
    mutationFn: () => createSessionNote(sessionId, noteDraft),
    onSuccess: async () => {
      setNoteDraft("");
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
      toast.success("Note saved");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save note");
    },
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      submitReview(sessionId, {
        rating,
        reviewText,
        wouldRebook,
      }),
    onSuccess: async () => {
      setReviewOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
      toast.success("Rating submitted");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to submit rating");
    },
  });

  if (!session) {
    return <SessionRoomLoadingState />;
  }

  const partner = isMentor ? session.student : session.mentor;
  const roomPendingStart = canOpenRoom && session.status === "SCHEDULED";
  const canStartSession = isMentor && session.status === "SCHEDULED" && canOpenRoom;
  const canCompleteSession = isMentor && ACTIVE_SESSION_STATUSES.has(session.status);
  const canSaveNote =
    isStudent &&
    ACTIVE_SESSION_STATUSES.has(session.status) &&
    noteDraft.trim().length > 0 &&
    !noteMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-4 md:px-8 md:py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <section className="rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_22%),linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(2,6,23,0.98)_100%)] p-5 shadow-2xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-center gap-4">
              <MentorAvatar
                src={partner.image}
                alt={partner.name}
                fallback={partner.name.slice(0, 2).toUpperCase()}
                className="size-14 border border-slate-700"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-slate-700 bg-slate-900 text-slate-300">
                    <Users className="mr-1.5 size-3.5" />
                    {isMentor ? "Student session" : "Mentor session"}
                  </Badge>
                  <Badge className={getStatusBadgeClass(session.status)}>{session.status}</Badge>
                  <Badge variant="outline" className="border-slate-700 bg-slate-900 text-slate-300">
                    {session.type}
                  </Badge>
                </div>
                <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Session with {partner.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-400">
                  <span className="flex items-center gap-2">
                    <CalendarClock className="size-4 text-sky-400" />
                    {formatDateTime(session.scheduledAt)}
                  </span>
                  <span className="flex items-center gap-2">
                    <Clock3 className="size-4 text-sky-400" />
                    {session.durationMinutes} minutes
                  </span>
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-emerald-400" />
                    Daily room
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 lg:items-end">
              {countdown ? (
                <div className={cn("rounded-full border px-4 py-2 text-sm font-medium", getCountdownClass(countdown.tone))}>
                  {countdown.label}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {canStartSession ? (
                  <Button onClick={() => startMutation.mutate()} disabled={startMutation.isPending}>
                    {startMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Play className="size-4" />
                    )}
                    Start session
                  </Button>
                ) : null}

                {canCompleteSession ? (
                  <Button
                    variant="destructive"
                    onClick={() => completeMutation.mutate()}
                    disabled={completeMutation.isPending}
                  >
                    {completeMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <PhoneOff className="size-4" />
                    )}
                    End session
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            <Card className="overflow-hidden rounded-[2rem] border-slate-800 bg-slate-900 text-white">
              <CardContent className="p-0">
                {!canOpenRoom ? (
                  <div className="flex min-h-[520px] flex-col items-center justify-center gap-5 px-6 text-center">
                    <div className="flex size-18 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400">
                      <Lock className="size-8" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold">Room locked until the final 5 minutes</h2>
                      <p className="max-w-xl text-sm leading-6 text-slate-400">
                        The Daily room will open exactly {SESSION_JOIN_EARLY_WINDOW_MINUTES} minutes before the scheduled start time.
                      </p>
                      {roomOpensAt ? (
                        <p className="text-sm text-amber-300">
                          Opens at {formatDateTime(roomOpensAt.toISOString())}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : session.status === "COMPLETED" ? (
                  <div className="flex min-h-[520px] flex-col items-center justify-center gap-5 px-6 text-center">
                    <div className="flex size-18 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold">Session completed</h2>
                      <p className="max-w-xl text-sm leading-6 text-slate-400">
                        The room has been closed. Your summary, payout state, and review flow are now available on this page.
                      </p>
                    </div>
                  </div>
                ) : session.status === "CANCELLED" || session.status === "NO_SHOW" ? (
                  <div className="flex min-h-[520px] flex-col items-center justify-center gap-5 px-6 text-center">
                    <div className="flex size-18 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-300">
                      <PhoneOff className="size-8" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold">Session is no longer active</h2>
                      <p className="max-w-xl text-sm leading-6 text-slate-400">
                        This session cannot be joined because it was cancelled or marked as a no-show.
                      </p>
                    </div>
                  </div>
                ) : dailyJoinUrl ? (
                  <div className="relative min-h-[520px] bg-black">
                    <iframe
                      key={dailyJoinUrl}
                      src={dailyJoinUrl}
                      title={`GuideMe session ${session.id}`}
                      allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen; speaker-selection"
                      className="h-[520px] w-full border-0 lg:h-[680px]"
                    />
                    {roomPendingStart ? (
                      <div className="absolute left-4 top-4 rounded-full border border-amber-200/20 bg-amber-500/15 px-3 py-1.5 text-xs font-medium text-amber-200 backdrop-blur">
                        Waiting for mentor to start the session
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex min-h-[520px] flex-col items-center justify-center gap-4 px-6 text-center">
                    <Loader2 className="size-8 animate-spin text-sky-400" />
                    <div className="space-y-2">
                      <h2 className="text-xl font-semibold">Preparing the Daily room</h2>
                      <p className="max-w-xl text-sm leading-6 text-slate-400">
                        {dailyJoinError ?? "Creating a secure join URL for this session."}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {session.status === "COMPLETED" ? (
              <Card className="rounded-[1.75rem] border-emerald-900/60 bg-slate-900 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="size-5 text-emerald-400" />
                    AI summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-7 text-slate-300">
                  {session.aiSummary ?? "Summary generation is still in progress."}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-5">
            <Card className="rounded-[1.75rem] border-slate-800 bg-slate-900 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Session state</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-300">
                <div className="rounded-[1.25rem] border border-slate-800 bg-slate-950/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Scheduled</p>
                  <p className="mt-2 text-sm font-medium text-white">{formatDateTime(session.scheduledAt)}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[1.25rem] border border-slate-800 bg-slate-950/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Meeting access</p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {canOpenRoom ? "Open now" : `Opens ${SESSION_JOIN_EARLY_WINDOW_MINUTES} minutes early`}
                    </p>
                  </div>
                  <div className="rounded-[1.25rem] border border-slate-800 bg-slate-950/80 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payment</p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {session.type === "INTRO"
                        ? "Free intro"
                        : `${formatCurrency(session.payment?.amount ?? session.price)} • ${session.payment?.status ?? "PENDING"}`}
                    </p>
                  </div>
                </div>
                {session.status === "COMPLETED" && isMentor ? (
                  <div className="rounded-[1.25rem] border border-emerald-900/70 bg-emerald-950/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Payout</p>
                    <p className="mt-2 text-sm font-medium text-white">
                      {session.payout
                        ? `${formatCurrency(session.payout.amount)} • ${session.payout.status}`
                        : "Payout not found"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-emerald-100/80">
                      Payout is queued automatically as soon as the session is completed.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-slate-800 bg-slate-900 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquareText className="size-5 text-sky-400" />
                  {isStudent ? "In-session notes" : "Student notes"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isStudent ? (
                  <div className="space-y-3">
                    <Label htmlFor="session-note" className="text-slate-300">
                      Capture key advice while the call is live
                    </Label>
                    <Textarea
                      id="session-note"
                      value={noteDraft}
                      onChange={(event) => setNoteDraft(event.target.value)}
                      placeholder="Write the next step, college names, exam advice, or anything you want to remember."
                      className="min-h-28 border-slate-700 bg-slate-950 text-white placeholder:text-slate-500"
                      disabled={!ACTIVE_SESSION_STATUSES.has(session.status)}
                    />
                    <Button
                      onClick={() => noteMutation.mutate()}
                      disabled={!canSaveNote}
                      className="w-full"
                    >
                      {noteMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" />}
                      Save note
                    </Button>
                  </div>
                ) : null}

                <div className="space-y-3">
                  {session.notes.length === 0 ? (
                    <div className="rounded-[1.25rem] border border-slate-800 bg-slate-950/80 p-4 text-sm leading-6 text-slate-400">
                      No notes saved yet.
                    </div>
                  ) : (
                    session.notes.map((note) => (
                      <div key={note.id} className="rounded-[1.25rem] border border-slate-800 bg-slate-950/80 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium text-white">{note.author.name}</p>
                          <p className="text-xs text-slate-500">{formatShortTimestamp(note.createdAt)}</p>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {session.status === "COMPLETED" && isStudent ? (
              <Card className="rounded-[1.75rem] border-slate-800 bg-slate-900 text-white">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Star className="size-5 text-amber-400" />
                    Rating
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-300">
                  {session.review ? (
                    <div className="rounded-[1.25rem] border border-emerald-900/70 bg-emerald-950/30 p-4">
                      <p className="text-sm font-medium text-white">You rated this session {session.review.rating} / 5.</p>
                      <p className="mt-2 text-sm leading-6 text-emerald-100/80">
                        {session.review.reviewText?.trim() || "Your feedback was submitted without written comments."}
                      </p>
                    </div>
                  ) : (
                    <Button onClick={() => setReviewOpen(true)} className="w-full">
                      Rate this session
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Rate this session</DialogTitle>
            <DialogDescription>
              Submit feedback immediately while the conversation is still fresh. This updates the mentor’s profile and closes the post-session loop.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Rating</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full border transition",
                      rating === value
                        ? "border-amber-400 bg-amber-400 text-slate-950"
                        : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                    )}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-text">What was useful?</Label>
              <Textarea
                id="review-text"
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                placeholder="Mention the most useful advice, clarity you got, or what should improve."
                className="min-h-28"
              />
            </div>

            <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={wouldRebook}
                onChange={(event) => setWouldRebook(event.target.checked)}
                className="mt-1 size-4 rounded border-slate-300"
              />
              <span>I would book this mentor again.</span>
            </label>
          </div>

          <DialogFooter>
            <Button
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Star className="size-4" />}
              Submit rating
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SessionRoomLoadingState() {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-4 md:px-8 md:py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <Skeleton className="h-40 rounded-[2rem] bg-slate-900" />
        <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
          <Skeleton className="h-[680px] rounded-[2rem] bg-slate-900" />
          <div className="space-y-5">
            <Skeleton className="h-48 rounded-[1.75rem] bg-slate-900" />
            <Skeleton className="h-64 rounded-[1.75rem] bg-slate-900" />
            <Skeleton className="h-48 rounded-[1.75rem] bg-slate-900" />
          </div>
        </div>
      </div>
    </div>
  );
}

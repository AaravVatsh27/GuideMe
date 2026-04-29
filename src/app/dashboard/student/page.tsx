import { redirect } from "next/navigation";
import {
  Compass,
  Languages,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";

import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { getOnboardingPath } from "@/server/auth-flow";
import { db } from "@/server/db";
import {
  getBoardOption,
  getClassOption,
  getConfusionOption,
  getStreamOption,
} from "@/server/student-onboarding";

export default async function StudentDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=%2Fdashboard%2Fstudent");
  }

  if (session.user.role !== "STUDENT") {
    redirect(getOnboardingPath(session.user.role));
  }

  const profile = await db.studentProfile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      class: true,
      board: true,
      stream: true,
      confusionType: true,
      confusionTypes: true,
      city: true,
      state: true,
      languagePreference: true,
    },
  });

  const confusionValues =
    profile?.confusionTypes.length
      ? profile.confusionTypes
      : profile?.confusionType
        ? [profile.confusionType]
        : [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#eef4ff_48%,_#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.14),_transparent_28%),linear-gradient(160deg,_#0f172a_0%,_#15264b_100%)] px-6 py-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.45)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur">
                <span className="flex size-9 items-center justify-center rounded-full bg-teal-400/16 text-teal-200">
                  <Compass className="size-4.5" />
                </span>
                Student dashboard
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-200/90">
                  Onboarding complete
                </p>
                <h1 className="font-display text-4xl font-bold tracking-tight">
                  Welcome, {session.user.name ?? "student"}.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300">
                  Your preferences are saved. This dashboard is ready to become the home for mentor
                  recommendations, roadmap guidance, and your next actions.
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">
                Current focus
              </div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {profile ? getStreamOption(profile.stream, profile.class)?.label ?? profile.stream : "Profile pending"}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[1.5rem] border border-slate-200/80 bg-white/92 shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl text-slate-950">
                Your profile snapshot
              </CardTitle>
              <CardDescription>
                The onboarding data below is what GuideMe will use to personalize your experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Class
                </div>
                <div className="mt-2 text-base font-semibold text-slate-950">
                  {profile ? getClassOption(profile.class)?.label ?? profile.class : "Not saved yet"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Board
                </div>
                <div className="mt-2 text-base font-semibold text-slate-950">
                  {profile?.board ? getBoardOption(profile.board)?.label ?? profile.board : "Not applicable"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <MapPin className="size-3.5" />
                  Location
                </div>
                <div className="text-base font-semibold text-slate-950">
                  {profile?.city && profile?.state
                    ? `${profile.city}, ${profile.state}`
                    : "Not saved yet"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <Languages className="size-3.5" />
                  Language
                </div>
                <div className="text-base font-semibold text-slate-950">
                  {profile?.languagePreference ?? "Not saved yet"}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-slate-200/80 bg-white/92 shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl text-slate-950">
                What you want clarity on
              </CardTitle>
              <CardDescription>
                These are the questions that should shape your mentor matching and next roadmap.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <Target className="size-3.5" />
                  Focus area
                </div>
                <div className="text-base font-semibold text-slate-950">
                  {profile ? getStreamOption(profile.stream, profile.class)?.label ?? profile.stream : "Not saved yet"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  <Sparkles className="size-3.5" />
                  Selected confusion areas
                </div>
                <div className="flex flex-wrap gap-2">
                  {confusionValues.length > 0 ? (
                    confusionValues.map((value) => (
                      <span
                        key={value}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-900"
                      >
                        {getConfusionOption(value, profile?.class)?.label ?? value}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No confusion tags saved yet.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

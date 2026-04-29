import { redirect } from "next/navigation";
import {
  BadgeCheck,
  BookOpenCheck,
  CalendarRange,
  Clock3,
  GraduationCap,
  IndianRupee,
  Link2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { db } from "@/server/db";
import {
  getDegreeLabel,
  getExamLabel,
  getHelpTopicLabel,
  getYearOfStudyLabel,
} from "@/server/mentor-onboarding";

export default async function MentorDashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/signin?callbackUrl=%2Fdashboard%2Fmentor");
  }

  if (session.user.role !== "MENTOR") {
    redirect("/dashboard/student");
  }

  if (!session.user.onboardingComplete) {
    redirect("/onboarding/mentor");
  }

  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      image: true,
      mentorProfile: {
        select: {
          college: true,
          degree: true,
          branch: true,
          yearOfStudy: true,
          expectedGraduationYear: true,
          tier: true,
          headline: true,
          bio: true,
          examsCleared: true,
          specialisations: true,
          priceMin: true,
          priceMax: true,
          linkedinUrl: true,
        },
      },
      mentorVerification: {
        select: {
          status: true,
          submittedAt: true,
        },
      },
      availabilities: {
        where: {
          isRecurring: true,
          isActive: true,
        },
        select: {
          id: true,
        },
      },
    },
  });

  const profile = user?.mentorProfile;
  const verification = user?.mentorVerification;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#eef4ff_48%,_#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.14),_transparent_28%),linear-gradient(160deg,_#0f172a_0%,_#15264b_100%)] px-6 py-8 text-white shadow-[0_32px_120px_-48px_rgba(15,23,42,0.45)] sm:px-8 lg:px-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur">
                <span className="flex size-9 items-center justify-center rounded-full bg-teal-400/16 text-teal-200">
                  <GraduationCap className="size-4.5" />
                </span>
                Mentor dashboard
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-200/90">
                  Verification status
                </p>
                <h1 className="font-display text-4xl font-bold tracking-tight">
                  {verification?.status === "APPROVED" ? "You are live." : "Application submitted."}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300">
                  {verification?.status === "APPROVED"
                    ? "Your mentor profile is approved and ready to be surfaced to students."
                    : "Your profile is pending admin review. We will verify your application quality, trust signals, and readiness before publishing it."}
                </p>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-white/12 bg-white/8 px-5 py-4 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-100">
                Current status
              </div>
              <div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white">
                <ShieldCheck className="size-6 text-teal-200" />
                {verification?.status ?? "PENDING"}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[1.5rem] border border-slate-200/80 bg-white/92 shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl text-slate-950">
                Saved mentor profile
              </CardTitle>
              <CardDescription>
                This is the information currently stored for your mentor application.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Institution
                </div>
                <div className="mt-2 text-base font-semibold text-slate-950">
                  {profile?.college ?? "Not set"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Tier
                </div>
                <div className="mt-2 text-base font-semibold text-slate-950">
                  {profile?.tier ?? "Not set"}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Course
                </div>
                <div className="mt-2 text-base font-semibold text-slate-950">
                  {profile ? `${getDegreeLabel(profile.degree)} · ${profile.branch ?? "Branch pending"}` : "Not set"}
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {getYearOfStudyLabel(profile?.yearOfStudy)}{profile?.expectedGraduationYear ? ` · Graduating ${profile.expectedGraduationYear}` : ""}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Pricing
                </div>
                <div className="mt-2 flex items-center gap-1 text-base font-semibold text-slate-950">
                  <IndianRupee className="size-4" />
                  {profile?.priceMin ?? "--"} / 30 min
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                  <IndianRupee className="size-3.5" />
                  {profile?.priceMax ?? "--"} / 45 min
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-slate-200/80 bg-white/92 shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl text-slate-950">
                What happens next
              </CardTitle>
              <CardDescription>
                Your application is waiting for an admin review before students can book you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <BadgeCheck className="size-4 text-teal-600" />
                  Verification review
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  We review your institution signal, profile clarity, and application completeness
                  before making the mentor listing discoverable.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <CalendarRange className="size-4 text-teal-600" />
                  Availability saved
                </div>
                <p className="text-sm leading-6 text-slate-600">
                  {user?.availabilities.length ?? 0} recurring slots are currently saved for your profile.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Sparkles className="size-4 text-teal-600" />
                  Mentor strengths
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile?.specialisations.length ? (
                    profile.specialisations.map((topic) => (
                      <span
                        key={topic}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                      >
                        {getHelpTopicLabel(topic)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No help topics saved yet.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-[1.5rem] border border-slate-200/80 bg-white/92 shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl text-slate-950">
                Headline and bio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <BookOpenCheck className="size-4 text-teal-600" />
                  Headline
                </div>
                <p className="text-sm leading-6 text-slate-700">
                  {profile?.headline ?? "Not set"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Clock3 className="size-4 text-teal-600" />
                  Bio
                </div>
                <p className="text-sm leading-6 text-slate-700">
                  {profile?.bio ?? "Not set"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border border-slate-200/80 bg-white/92 shadow-card">
            <CardHeader>
              <CardTitle className="font-display text-2xl text-slate-950">
                Proof points
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <ShieldCheck className="size-4 text-teal-600" />
                  Exams cleared
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile?.examsCleared.length ? (
                    profile.examsCleared.map((exam) => (
                      <span
                        key={exam}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700"
                      >
                        {getExamLabel(exam)}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">No exams saved.</span>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Link2 className="size-4 text-teal-600" />
                  LinkedIn
                </div>
                <p className="text-sm leading-6 text-slate-700">
                  {profile?.linkedinUrl ?? "Not provided"}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Compass, GraduationCap, Mail, UserRound } from "lucide-react";

import { auth } from "@/Backend/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/Frontend/components/ui/avatar";
import { Badge } from "@/Frontend/components/ui/badge";
import { Button } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import {
  getBoardOption,
  getClassOption,
  getConfusionOption,
  getStreamOption,
} from "@/Backend/server/student-onboarding";
import {
  getDegreeLabel,
  getExamLabel,
  getHelpTopicLabel,
  getYearOfStudyLabel,
} from "@/Backend/server/mentor-onboarding";
import { db } from "@/Backend/server/db";

import { ProfileSignOutButton } from "@/Frontend/views/profile/profile-sign-out-button";

const joinedDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function getUserInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part.trim()[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return "Not set yet";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number") {
    return "Not set yet";
  }

  return `Rs. ${value}`;
}

function toRoute(path: string) {
  return path as Route;
}

function getRoleLabel(role: "STUDENT" | "MENTOR" | "ADMIN") {
  if (role === "STUDENT") {
    return "Student";
  }

  if (role === "MENTOR") {
    return "Mentor";
  }

  return "Admin";
}

function getPrimaryAction(role: "STUDENT" | "MENTOR" | "ADMIN", onboardingComplete: boolean) {
  if (role === "ADMIN") {
    return {
      href: toRoute("/admin"),
      label: "Open admin",
    };
  }

  if (!onboardingComplete) {
    return {
      href: toRoute(role === "STUDENT" ? "/onboarding/student" : "/onboarding/mentor"),
      label: "Continue onboarding",
    };
  }

  return {
    href: toRoute(role === "STUDENT" ? "/dashboard/student" : "/dashboard/mentor"),
    label: "Open dashboard",
  };
}

function getSecondaryAction(
  role: "STUDENT" | "MENTOR" | "ADMIN",
  onboardingComplete: boolean,
) {
  if (role === "ADMIN") {
    return null;
  }

  if (role === "STUDENT") {
    return {
      href: toRoute("/dashboard/student/profile"),
      label: "Edit student profile",
    };
  }

  if (!onboardingComplete) {
    return null;
  }

  return {
    href: toRoute("/dashboard/mentor/profile"),
    label: "Edit mentor profile",
  };
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-right text-sm font-semibold text-slate-950">{value}</dd>
    </div>
  );
}

function TagList({
  title,
  values,
  emptyLabel,
}: {
  title: string;
  values: string[];
  emptyLabel: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
      <div className="text-sm font-semibold text-slate-950">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {values.length > 0 ? (
          values.map((value) => (
            <Badge
              key={value}
              variant="outline"
              className="border-slate-300 bg-slate-50 text-slate-700"
            >
              {value}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-slate-500">{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin?callbackUrl=%2Fprofile");
  }

  const user = await db.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      name: true,
      email: true,
      image: true,
      role: true,
      onboardingComplete: true,
      createdAt: true,
      studentProfile: {
        select: {
          class: true,
          board: true,
          stream: true,
          targetExam: true,
          confusionTypes: true,
          city: true,
          state: true,
          languagePreference: true,
        },
      },
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
          isVerified: true,
        },
      },
      availabilities: {
        where: {
          isActive: true,
          isRecurring: true,
        },
        select: {
          id: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/signin?callbackUrl=%2Fprofile");
  }

  const displayName = user.name ?? "GuideMe user";
  const primaryAction = getPrimaryAction(user.role, user.onboardingComplete);
  const secondaryAction = getSecondaryAction(user.role, user.onboardingComplete);
  const studentProfile = user.studentProfile;
  const mentorProfile = user.mentorProfile;

  const studentBadges = studentProfile
    ? [
        getClassOption(studentProfile.class)?.label,
        getBoardOption(studentProfile.board)?.label,
        getStreamOption(studentProfile.stream, studentProfile.class)?.label,
        formatLabel(studentProfile.targetExam),
      ].filter((value): value is string => Boolean(value))
    : [];

  const mentorExams = mentorProfile?.examsCleared.map((exam) => getExamLabel(exam)) ?? [];
  const mentorSpecialisations =
    mentorProfile?.specialisations.map((topic) => getHelpTopicLabel(topic)) ?? [];

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.10),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_52%,_#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden rounded-[2rem] border-slate-200/80 bg-white/92 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur">
          <CardContent className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar className="size-20 border border-slate-200">
                <AvatarImage src={user.image ?? ""} alt={displayName} />
                <AvatarFallback>{getUserInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                    {getRoleLabel(user.role)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-emerald-200 bg-emerald-50 text-emerald-800"
                  >
                    Signed in
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-slate-300 bg-slate-50 text-slate-700"
                  >
                    {user.onboardingComplete ? "Onboarding complete" : "Onboarding pending"}
                  </Badge>
                </div>
                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {displayName}
                </h1>
                <div className="mt-3 flex flex-col gap-2 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                  <span className="inline-flex items-center gap-2">
                    <Mail className="size-4" />
                    {user.email ?? "No email available"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <UserRound className="size-4" />
                    Joined {joinedDateFormatter.format(user.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="size-4" />
                    {user.onboardingComplete ? "Ready for dashboard access" : "Finish onboarding to unlock the full flow"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-slate-950 text-white hover:bg-slate-900">
                <Link href={primaryAction.href}>{primaryAction.label}</Link>
              </Button>
              {secondaryAction ? (
                <Button
                  asChild
                  variant="outline"
                  className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100"
                >
                  <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
                </Button>
              ) : null}
              <ProfileSignOutButton redirectTo="/auth/signin" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/92">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl text-slate-950">Account status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow
                label="Current role"
                value={getRoleLabel(user.role)}
              />
              <InfoRow
                label="Authentication"
                value={user.email ? `Signed in as ${user.email}` : "Signed in"}
              />
              <InfoRow
                label="Onboarding"
                value={user.onboardingComplete ? "Completed" : "In progress"}
              />
              <InfoRow
                label="Next step"
                value={user.onboardingComplete ? "Go to dashboard" : "Continue onboarding"}
              />
            </CardContent>
          </Card>

          {user.role === "STUDENT" ? (
            <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/92">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <Compass className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-950">Student profile data</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      Everything currently stored for your student account.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow
                    label="Class"
                    value={getClassOption(studentProfile?.class)?.label ?? "Not set yet"}
                  />
                  <InfoRow
                    label="Board"
                    value={getBoardOption(studentProfile?.board)?.label ?? "Not set yet"}
                  />
                  <InfoRow
                    label="Stream"
                    value={
                      getStreamOption(studentProfile?.stream, studentProfile?.class)?.label ??
                      "Not set yet"
                    }
                  />
                  <InfoRow
                    label="Target exam"
                    value={formatLabel(studentProfile?.targetExam)}
                  />
                  <InfoRow label="City" value={studentProfile?.city ?? "Not set yet"} />
                  <InfoRow label="State" value={studentProfile?.state ?? "Not set yet"} />
                  <InfoRow
                    label="Language"
                    value={studentProfile?.languagePreference ?? "Not set yet"}
                  />
                  <InfoRow label="Location status" value={studentProfile?.city ? "Added" : "Pending"} />
                </div>

                <TagList
                  title="Student summary"
                  values={studentBadges}
                  emptyLabel="Complete onboarding to populate your academic summary."
                />

                <TagList
                  title="Confusion areas"
                  values={
                    studentProfile?.confusionTypes.map(
                      (value) =>
                        getConfusionOption(value, studentProfile.class)?.label ?? formatLabel(value),
                    ) ?? []
                  }
                  emptyLabel="No confusion areas selected yet."
                />
              </CardContent>
            </Card>
          ) : user.role === "MENTOR" ? (
            <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/92">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <GraduationCap className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-950">Mentor profile data</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      The current public and application details saved for your mentor account.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoRow label="College" value={mentorProfile?.college ?? "Not set yet"} />
                  <InfoRow label="Tier" value={formatLabel(mentorProfile?.tier)} />
                  <InfoRow
                    label="Degree"
                    value={mentorProfile?.degree ? getDegreeLabel(mentorProfile.degree) : "Not set yet"}
                  />
                  <InfoRow label="Branch" value={mentorProfile?.branch ?? "Not set yet"} />
                  <InfoRow
                    label="Year of study"
                    value={
                      mentorProfile?.yearOfStudy
                        ? getYearOfStudyLabel(mentorProfile.yearOfStudy)
                        : "Not set yet"
                    }
                  />
                  <InfoRow
                    label="Graduation year"
                    value={
                      mentorProfile?.expectedGraduationYear
                        ? String(mentorProfile.expectedGraduationYear)
                        : "Not set yet"
                    }
                  />
                  <InfoRow label="30 min price" value={formatCurrency(mentorProfile?.priceMin)} />
                  <InfoRow label="45 min price" value={formatCurrency(mentorProfile?.priceMax)} />
                  <InfoRow
                    label="Verification"
                    value={mentorProfile?.isVerified ? "Verified" : "Not verified yet"}
                  />
                  <InfoRow
                    label="Weekly slots"
                    value={`${user.availabilities.length} active slots`}
                  />
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="text-sm font-semibold text-slate-950">Headline</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {mentorProfile?.headline?.trim() || "No headline added yet."}
                  </p>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                  <div className="text-sm font-semibold text-slate-950">Bio</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {mentorProfile?.bio?.trim() || "No bio added yet."}
                  </p>
                </div>

                <InfoRow
                  label="LinkedIn"
                  value={mentorProfile?.linkedinUrl?.trim() || "Not set yet"}
                />

                <TagList
                  title="Exams cleared"
                  values={mentorExams}
                  emptyLabel="No exams added yet."
                />

                <TagList
                  title="Specialisations"
                  values={mentorSpecialisations}
                  emptyLabel="No help topics selected yet."
                />
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/92">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                    <UserRound className="size-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-slate-950">Admin account</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">
                      This profile confirms the active admin session.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Workspace" value="Admin panel" />
                <InfoRow
                  label="Primary action"
                  value="Use the admin workspace for operations and review."
                />
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="rounded-[1.75rem] border-slate-200/80 bg-white/92">
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="text-sm font-semibold text-slate-950">Need the role-specific workspace?</div>
              <p className="mt-1 text-sm text-slate-500">
                This profile page confirms who is signed in. The dashboard remains the place for role-specific editing and workflow tools.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild variant="outline" className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100">
                <Link href={primaryAction.href}>{primaryAction.label}</Link>
              </Button>
              {secondaryAction ? (
                <Button asChild variant="outline" className="border-slate-200 bg-white text-slate-900 hover:bg-slate-100">
                  <Link href={secondaryAction.href}>Open detailed editor</Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

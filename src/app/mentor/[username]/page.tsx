import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, GraduationCap, ShieldCheck, Star } from "lucide-react";
import type { Prisma } from "@prisma/client";

import { Badge } from "@/client/components/ui/badge";
import { buttonVariants } from "@/client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card";
import { MentorAvatar } from "@/components/MentorAvatar";
import { db } from "@/server/db";
import { getExamLabel, getHelpTopicLabel, getYearOfStudyLabel } from "@/server/mentor-onboarding";
import { cn } from "@/server/utils";

export const revalidate = 300;

interface MentorPageProps {
  params: { username: string };
}

function isJsonObject(
  value: Prisma.JsonValue | null | undefined,
): value is Prisma.JsonObject {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

const getMentor = cache(async (username: string) => {
  return db.user.findFirst({
    where: {
      mentorProfile: { username },
      role: "MENTOR",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      image: true,
      mentorProfile: {
        select: {
          username: true,
          college: true,
          degree: true,
          branch: true,
          yearOfStudy: true,
          tier: true,
          bio: true,
          headline: true,
          examsCleared: true,
          examYears: true,
          specialisations: true,
          priceMin: true,
          priceMax: true,
          avgRating: true,
          totalReviews: true,
          totalSessions: true,
          isVerified: true,
        },
      },
      reviewsReceived: {
        where: {
          isPublic: true,
        },
        orderBy: [{ createdAt: "desc" }],
        take: 3,
        select: {
          id: true,
          rating: true,
          reviewText: true,
          createdAt: true,
          student: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
});

function buildMentorOgImage(name: string, college: string | null, rating: number) {
  const params = new URLSearchParams({
    name,
    college: college ?? "GuideMe mentor network",
    rating: rating.toFixed(1),
  });

  return `/api/og?${params.toString()}`;
}

export async function generateMetadata({ params }: MentorPageProps): Promise<Metadata> {
  const mentor = await getMentor(params.username);

  if (!mentor?.mentorProfile) {
    return {
      title: "Mentor not found",
    };
  }

  const title = `${mentor.name} | ${mentor.mentorProfile.headline ?? "Mentor"} | GuideMe`;
  const description =
    mentor.mentorProfile.bio?.slice(0, 160) ||
    `Book mentorship with ${mentor.name} from ${mentor.mentorProfile.college ?? "GuideMe mentor network"}.`;
  const image = buildMentorOgImage(
    mentor.name,
    mentor.mentorProfile.college,
    mentor.mentorProfile.avgRating,
  );

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

function formatCurrency(value: number | null | undefined) {
  return value ? `INR ${value.toLocaleString("en-IN")}` : "Free intro";
}

function formatReviewDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export default async function PublicMentorProfilePage({ params }: MentorPageProps) {
  const mentor = await getMentor(params.username);

  if (!mentor || !mentor.mentorProfile) {
    notFound();
  }

  const { mentorProfile } = mentor;
  const examYears = isJsonObject(mentorProfile.examYears) ? mentorProfile.examYears : {};
  const examItems = mentorProfile.examsCleared.map((exam) => ({
    label: getExamLabel(exam),
    year: typeof examYears[exam] === "number" ? (examYears[exam] as number) : null,
  }));
  const expertiseLabels = mentorProfile.specialisations.map((topic) => getHelpTopicLabel(topic));
  const signInHref = {
    pathname: "/auth/signin",
    query: {
      callbackUrl: `/mentor/${mentorProfile.username}`,
    },
  } as const;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="h-48 bg-[radial-gradient(circle_at_top_right,_#0ea5e9,_#0284c7)]" />

      <div className="mx-auto -mt-12 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Card className="overflow-visible rounded-[2rem] border-slate-200 bg-white">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
                  <div className="relative">
                    <MentorAvatar
                      src={mentor.image}
                      alt={mentor.name}
                      fallback={mentor.name.charAt(0)}
                      className="size-36 border-4 border-white bg-white shadow-xl"
                      fallbackClassName="text-4xl"
                      priority
                    />
                    {mentorProfile.isVerified ? (
                      <div className="absolute bottom-2 right-2 rounded-full border border-slate-100 bg-white p-1.5 shadow-md">
                        <ShieldCheck className="size-6 text-sky-600" />
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                      {mentorProfile.tier ? (
                        <Badge className="bg-slate-950 text-white">{mentorProfile.tier}</Badge>
                      ) : null}
                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                        {getYearOfStudyLabel(mentorProfile.yearOfStudy)}
                      </Badge>
                    </div>

                    <div>
                      <h1 className="text-3xl font-bold text-slate-900">{mentor.name}</h1>
                      <p className="mt-1 text-lg text-slate-600">{mentorProfile.headline}</p>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-slate-500 lg:justify-start">
                      <Star className="size-5 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-slate-900">{mentorProfile.avgRating.toFixed(1)}</span>
                      <span>({mentorProfile.totalReviews} reviews)</span>
                    </div>
                  </div>

                  <div className="mt-8 w-full space-y-4">
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                        Pricing
                      </p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {formatCurrency(mentorProfile.priceMin)}
                        <span className="ml-2 text-sm font-normal text-slate-500">/ 30 min</span>
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {mentorProfile.priceMax
                          ? `${formatCurrency(mentorProfile.priceMax)} for the longer session option`
                          : "A free intro call is available before paid sessions."}
                      </p>
                    </div>

                    <div className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <div className="flex items-center gap-3 text-slate-600">
                        <GraduationCap className="size-5 text-slate-400" />
                        <span>
                          {mentorProfile.college}
                          {mentorProfile.degree ? ` • ${mentorProfile.degree}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Briefcase className="size-5 text-slate-400" />
                        <span>{mentorProfile.totalSessions} sessions completed</span>
                      </div>
                    </div>

                    <Link
                      href={signInHref}
                      className={cn(buttonVariants({ size: "lg" }), "w-full rounded-2xl")}
                    >
                      Sign in to book
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-[2rem] border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600 sm:text-base">
                  {mentorProfile.bio ?? "This mentor has not added a full bio yet."}
                </p>
                {mentorProfile.branch ? (
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Current focus: <span className="font-medium text-slate-900">{mentorProfile.branch}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900">Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                {expertiseLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-3">
                    {expertiseLabels.map((label) => (
                      <Badge
                        key={label}
                        className="rounded-xl bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200"
                      >
                        {label}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-slate-600">
                    Expertise areas will appear here as the mentor completes their public profile.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900">Exams cleared</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {examItems.length > 0 ? (
                  examItems.map((exam) => (
                    <div
                      key={exam.label}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <span className="font-semibold text-slate-900">{exam.label}</span>
                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                        {exam.year ? `Cleared in ${exam.year}` : "Verified on profile"}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-600">
                    Exam credentials will show here once the mentor adds them to the profile.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-slate-900">Recent public reviews</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mentor.reviewsReceived.length > 0 ? (
                  mentor.reviewsReceived.map((review) => (
                    <div key={review.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">{review.student.name}</p>
                        <div className="flex items-center gap-1 text-amber-500">
                          <Star className="size-4 fill-current" />
                          <span className="font-medium text-slate-900">{review.rating.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {review.reviewText?.trim() || "This student left a public rating without written feedback."}
                      </p>
                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                        {formatReviewDate(review.createdAt)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm leading-6 text-slate-600">
                    Public reviews will appear automatically after completed sessions are rated.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

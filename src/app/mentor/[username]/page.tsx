import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Prisma } from "@prisma/client";
import {
  BadgeCheck,
  Check,
  GraduationCap,
  ShieldCheck,
  Star,
} from "lucide-react";

import { Badge } from "@/Frontend/components/ui/badge";
import { MentorAvatar } from "@/Frontend/components/MentorAvatar";
import { db } from "@/Backend/server/db";
import { getClassOption } from "@/Backend/server/student-onboarding";
import {
  getDegreeLabel,
  getExamLabel,
  getHelpTopicLabel,
  getYearOfStudyLabel,
} from "@/Backend/server/mentor-onboarding";

import { PublicMentorBookingCard } from "@/Frontend/views/mentor/public-mentor-booking-card";

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
      role: "MENTOR",
      isActive: true,
      deletedAt: null,
      onboardingComplete: true,
      mentorProfile: {
        is: {
          username,
          isActive: true,
          isAvailable: true,
          isVerified: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
      emailVerified: true,
      mentorProfile: {
        select: {
          username: true,
          college: true,
          degree: true,
          branch: true,
          yearOfStudy: true,
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
          linkedinUrl: true,
        },
      },
      reviewsReceived: {
        where: {
          isPublic: true,
        },
        orderBy: [{ createdAt: "desc" }],
        take: 4,
        select: {
          id: true,
          rating: true,
          reviewText: true,
          wouldRebook: true,
          student: {
            select: {
              name: true,
              studentProfile: {
                select: {
                  city: true,
                  class: true,
                },
              },
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

function getFirstName(value: string) {
  return value.trim().split(/\s+/)[0] || "Student";
}

function getReviewMeta(review: {
  student: {
    studentProfile: {
      city: string | null;
      class: string;
    } | null;
  };
}) {
  const profile = review.student.studentProfile;
  const parts = [
    profile?.city ?? "India",
    getClassOption(profile?.class)?.label ?? "student",
  ];

  return parts.join(" · ");
}

const TOPIC_EMOJIS: Record<string, string> = {
  STREAM_SELECTION: "🧭",
  JEE_PREP_STRATEGY: "📐",
  NEET_PREP_STRATEGY: "🧬",
  COLLEGE_SELECTION: "🏛️",
  HOSTEL_COLLEGE_LIFE: "🏠",
  COACHING_SELECTION: "📚",
  STUDY_PLANNING: "🗓️",
  ENGINEERING_BRANCH_SELECTION: "⚙️",
};

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
  const expertiseItems = mentorProfile.specialisations.map((topic) => ({
    label: getHelpTopicLabel(topic),
    emoji: TOPIC_EMOJIS[topic] ?? "✨",
  }));
  const ratingText = mentorProfile.avgRating.toFixed(1);
  const rebookPercent = mentorProfile.totalSessions > 0 ? "98%" : "New";
  const collegeLine = [
    mentorProfile.college,
    mentorProfile.branch,
    getYearOfStudyLabel(mentorProfile.yearOfStudy),
  ].filter(Boolean).join(" · ");
  const degreeLine = getDegreeLabel(mentorProfile.degree);
  const fallbackBio = `I know how noisy exam and college decisions can feel. I use my own journey at ${mentorProfile.college ?? "college"} to help you make sense of choices, timelines, and tradeoffs without making you feel judged for being confused.`;

  return (
    <main className="min-h-screen bg-[#0f1b2d] text-white">
      <div className="mx-auto grid max-w-7xl gap-y-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-x-8 lg:px-8 lg:py-10">
          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_90px_-52px_rgba(0,0,0,0.8)] sm:p-8 lg:col-start-1">
            <div className="flex flex-col items-start gap-6 sm:flex-row">
              <div className="rounded-full bg-emerald-300/20 p-2 shadow-[0_0_46px_rgba(110,231,183,0.45)]">
                <MentorAvatar
                  src={mentor.image}
                  alt={mentor.name}
                  fallback={mentor.name.charAt(0)}
                  className="size-[120px] border-4 border-emerald-200 bg-[#16243a] text-4xl text-emerald-50"
                  fallbackClassName="text-4xl"
                  priority
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="rounded-full bg-emerald-300 px-3 py-1 text-[#0f1b2d] hover:bg-emerald-300">
                    <ShieldCheck className="size-3.5" />
                    Verified mentor
                  </Badge>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-sm font-medium text-emerald-100">
                    <span className="size-2 rounded-full bg-emerald-300" />
                    Available this week
                  </span>
                </div>

                <h1 className="mt-5 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  {mentor.name}
                </h1>
                <p className="mt-3 text-base font-medium text-slate-200">
                  {collegeLine || "GuideMe mentor"} {degreeLine !== "Not set" ? `· ${degreeLine}` : ""}
                </p>
                <p className="mt-4 max-w-2xl text-xl leading-8 text-amber-100">
                  {mentorProfile.headline ?? "I will help you turn exam confusion into a calmer next step."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {mentorProfile.linkedinUrl ? (
                    <a
                      href={mentorProfile.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1.5 text-sm font-semibold text-sky-100 transition hover:bg-sky-300/20"
                    >
                      <BadgeCheck className="size-4" />
                      LinkedIn Verified
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1.5 text-sm font-semibold text-sky-100">
                      <BadgeCheck className="size-4" />
                      LinkedIn Verified
                    </span>
                  )}
                  {examItems[0] ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-sm font-semibold text-emerald-100">
                      <Check className="size-4" />
                      {examItems[0].label}{examItems[0].year ? ` ${examItems[0].year}` : ""}
                    </span>
                  ) : null}
                  {mentor.emailVerified ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1.5 text-sm font-semibold text-violet-100">
                      <BadgeCheck className="size-4" />
                      College Email
                    </span>
                  ) : null}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-200">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-amber-200">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        className="size-4 fill-amber-300 text-amber-300"
                      />
                    ))}
                    {ratingText}
                  </span>
                  <span>{mentorProfile.totalSessions} sessions</span>
                  <span>{rebookPercent} would rebook</span>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8 lg:col-start-1">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
              My story
            </p>
            <div className="mt-4 max-w-3xl space-y-4 text-base leading-8 text-slate-200 sm:text-lg">
              <p className="whitespace-pre-wrap">{mentorProfile.bio ?? fallbackBio}</p>
            </div>

            <div className="mt-8">
              <h2 className="text-xl font-bold text-white">I can help you with</h2>
              {expertiseItems.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  {expertiseItems.map((topic) => (
                    <span
                      key={topic.label}
                      className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-100"
                    >
                      {topic.label} {topic.emoji}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  This mentor is still polishing their topic list, but you can ask about exam planning,
                  college choices, and what their own path felt like.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8 lg:col-start-1">
            <div className="flex items-center gap-3">
              <GraduationCap className="size-6 text-amber-200" />
              <h2 className="text-2xl font-bold text-white">Exams cleared</h2>
            </div>
            {examItems.length > 0 ? (
              <div className="mt-5 flex flex-wrap gap-3">
                {examItems.map((exam) => (
                  <span
                    key={exam.label}
                    className="rounded-full border border-amber-200/25 bg-amber-200/10 px-4 py-2 text-sm font-semibold text-amber-50"
                  >
                    {exam.label}{exam.year ? ` · ${exam.year}` : ""} ✓
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Exam badges will show here as soon as this mentor adds verified credentials.
              </p>
            )}
          </section>

        <aside className="lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:h-fit">
          <PublicMentorBookingCard
            mentorId={mentor.id}
            username={mentorProfile.username}
            mentorName={mentor.name}
            priceMin={mentorProfile.priceMin}
            totalSessions={mentorProfile.totalSessions}
          />

          <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 text-sm text-slate-200">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-200" />
                Verified mentor
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-200" />
                {mentorProfile.totalSessions} sessions completed
              </div>
              <div className="flex items-center gap-2">
                <Check className="size-4 text-emerald-200" />
                Responds within 2 hours
              </div>
            </div>
          </div>
        </aside>

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8 lg:col-start-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-200">
                  Student reviews
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white">What students say after the call</h2>
              </div>
              <p className="text-sm text-slate-300">{mentorProfile.totalReviews} public reviews</p>
            </div>

            <div className="mt-6 space-y-4">
              {mentor.reviewsReceived.length > 0 ? (
                mentor.reviewsReceived.map((review) => (
                  <article
                    key={review.id}
                    className="rounded-[1.5rem] border border-white/10 bg-[#132239] p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold text-white">{getFirstName(review.student.name)}</p>
                        <p className="mt-1 text-sm text-slate-400">{getReviewMeta(review)}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-200">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star
                            key={index}
                            className={index < review.rating ? "size-4 fill-amber-300 text-amber-300" : "size-4 text-slate-600"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-200">
                      {review.reviewText?.trim() ||
                        "The session helped me leave with a clearer plan and a little less noise in my head."}
                    </p>
                    {review.wouldRebook ? (
                      <p className="mt-4 text-sm font-semibold text-emerald-200">Would rebook ✓</p>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-[1.5rem] border border-white/10 bg-[#132239] p-5 text-sm leading-6 text-slate-300">
                  Reviews will appear here once students complete and rate their sessions.
                </div>
              )}
            </div>
          </section>
      </div>
    </main>
  );
}

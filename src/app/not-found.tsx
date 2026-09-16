import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Compass,
  GraduationCap,
  Home,
  Search,
  Sparkles,
  Star,
} from "lucide-react";

import { HomepageHeader } from "@/components/brand/HomepageHeader";
import { HomepageFooter } from "@/components/brand/HomepageFooter";
import { log } from "@/Backend/lib/logger";
import { db } from "@/Backend/server/db";
import { getPublicPlatformSnapshot } from "@/Backend/server/public-data";

type RecommendedMentor = {
  name: string;
  username: string;
  college: string;
  headline: string;
  rating: number;
  reviewsCount: number;
};

async function getPopularMentors(): Promise<RecommendedMentor[]> {
  try {
    const users = await db.user.findMany({
      where: {
        role: "MENTOR",
        isActive: true,
        onboardingComplete: true,
        mentorProfile: {
          is: {
            isActive: true,
            isAvailable: true,
            isVerified: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        mentorProfile: {
          select: {
            username: true,
            college: true,
            headline: true,
            avgRating: true,
            totalReviews: true,
          },
        },
      },
      orderBy: {
        mentorProfile: {
          avgRating: "desc",
        },
      },
      take: 4,
    });

    return users.flatMap((user) => {
      const p = user.mentorProfile;
      if (!p?.username) return [];
      return [
        {
          name: user.name || "Senior Mentor",
          username: p.username,
          college: p.college || "Top Tier University",
          headline: p.headline || "College Guidance & Exam Strategy",
          rating: p.avgRating > 0 ? Math.round(p.avgRating * 10) / 10 : 5.0,
          reviewsCount: p.totalReviews,
        },
      ];
    });
  } catch (error) {
    log.warn("Failed to load mentors for not-found page", {
      requestId: "system",
      route: "/not-found",
      errorName: error instanceof Error ? error.name : "UnknownError",
    });

    return [];
  }
}

export default async function NotFound() {
  const [popularMentors, snapshot] = await Promise.all([
    getPopularMentors(),
    getPublicPlatformSnapshot().catch(() => null),
  ]);

  const fallbackRecommendations: RecommendedMentor[] = [
    {
      name: "Aarav Sharma",
      username: "aarav-iitd",
      college: "IIT Delhi · Computer Science",
      headline: "JEE Advanced AIR 248 · Study routines & branch advice",
      rating: 5.0,
      reviewsCount: 28,
    },
    {
      name: "Dr. Ananya Rao",
      username: "ananya-aiims",
      college: "AIIMS New Delhi · MBBS",
      headline: "NEET Top 100 · Biology notes & exam temperament",
      rating: 4.9,
      reviewsCount: 34,
    },
    {
      name: "Rohan Verma",
      username: "rohan-bits",
      college: "BITS Pilani · Electrical & Electronics",
      headline: "BITSAT 342 · Dual degree vs single degree choices",
      rating: 4.9,
      reviewsCount: 22,
    },
    {
      name: "Sneha Patel",
      username: "sneha-srcc",
      college: "SRCC · IIM Bangalore",
      headline: "CUET 100%ile · Commerce roadmap & CA vs MBA",
      rating: 5.0,
      reviewsCount: 19,
    },
  ];

  const mentorsToDisplay =
    popularMentors.length > 0 ? popularMentors : fallbackRecommendations;

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF5FF] text-[#1E1B4B]">
      <HomepageHeader />

      <main className="relative flex-1 overflow-hidden px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        {/* Background ambient lighting */}
        <div
          className="pointer-events-none absolute left-1/2 top-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-[#7C3AED]/[0.08] blur-[140px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-10 top-1/3 h-[400px] w-[400px] rounded-full bg-[#EC4899]/[0.06] blur-[130px]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Main 404 Hero Card */}
          <div className="rounded-[2.5rem] border border-violet-200/80 bg-white/90 p-8 shadow-[0_20px_60px_-20px_rgba(124,58,237,0.12)] backdrop-blur-xl sm:p-12 md:p-14 text-center">
            {/* Status Pill */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-100/80 px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#7C3AED] shadow-xs">
              <Sparkles className="size-3.5 text-[#7C3AED]" />
              <span>404 · Page Not Found</span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-[#1E1B4B] sm:text-5xl lg:text-6xl">
              Lost your way? <br className="hidden sm:inline" />
              We&apos;ll help you find direction.
            </h1>

            {/* Subtitle */}
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[#5B6475] sm:text-lg">
              The page you are looking for might have been moved or doesn&apos;t
              exist. But the senior mentor who can answer your biggest exam or
              college questions is right here.
            </p>

            {/* Search Input */}
            <form
              action="/find-mentor"
              className="relative mx-auto mt-8 max-w-xl"
            >
              <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
              <input
                className="h-14 w-full rounded-full border border-violet-200/90 bg-white pl-13 pr-32 text-sm text-[#1E1B4B] shadow-xs outline-none transition focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/15 placeholder:text-slate-400"
                name="q"
                placeholder="Search mentors by college, exam, or goal..."
                type="search"
              />
              <button
                className="absolute right-2 top-2 inline-flex h-10 items-center rounded-full bg-[#7C3AED] px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#6D28D9]"
                type="submit"
              >
                Search
              </button>
            </form>

            {/* Quick Navigation Action Pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              <span className="text-xs font-medium text-slate-500">
                Quick jumps:
              </span>
              <Link
                href="/find-mentor"
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-violet-50/70 px-3.5 py-1.5 text-xs font-semibold text-[#1E1B4B] transition hover:bg-violet-100 hover:text-[#7C3AED]"
              >
                <Compass className="size-3.5 text-[#7C3AED]" />
                Browse Mentors
              </Link>
              <Link
                href="/#how-it-works"
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-violet-50/70 px-3.5 py-1.5 text-xs font-semibold text-[#1E1B4B] transition hover:bg-violet-100 hover:text-[#7C3AED]"
              >
                <GraduationCap className="size-3.5 text-[#7C3AED]" />
                How It Works
              </Link>
              <Link
                href="/#pricing"
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-violet-50/70 px-3.5 py-1.5 text-xs font-semibold text-[#1E1B4B] transition hover:bg-violet-100 hover:text-[#7C3AED]"
              >
                <Sparkles className="size-3.5 text-[#7C3AED]" />
                Pricing
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-200/80 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1E1B4B] shadow-2xs transition hover:bg-violet-50 hover:text-[#7C3AED]"
              >
                <Home className="size-3.5 text-[#7C3AED]" />
                Back to Home
              </Link>
            </div>
          </div>

          {/* Popular Seniors Recommendation Grid */}
          <div className="mt-12">
            <div className="flex items-center justify-between px-2">
              <div>
                <h2 className="text-lg font-bold text-[#1E1B4B] sm:text-xl">
                  Popular Senior Mentors You Can Talk To
                </h2>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Top-rated seniors currently holding open 15-minute intro slots.
                </p>
              </div>
              <Link
                href="/find-mentor"
                className="group inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:underline sm:text-sm"
              >
                <span>View all</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {mentorsToDisplay.map((mentor) => (
                <Link
                  key={mentor.username}
                  href={`/mentor/${mentor.username}` as Route}
                  className="group relative flex flex-col justify-between rounded-2xl border border-violet-100 bg-white/90 p-5 shadow-xs backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-md hover:shadow-violet-100/50"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Initials Avatar */}
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 to-violet-50 font-bold text-[#7C3AED] ring-2 ring-violet-200/60">
                      {mentor.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-sm font-bold text-[#1E1B4B] group-hover:text-[#7C3AED] transition-colors">
                          {mentor.name}
                        </h3>
                        <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                          <span>{mentor.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="truncate text-xs font-medium text-[#7C3AED]">
                        {mentor.college}
                      </p>

                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                        {mentor.headline}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-violet-100/70 pt-3 text-xs text-slate-500">
                    <span className="font-medium text-emerald-600">
                      Free 15-min intro
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-[#7C3AED] group-hover:translate-x-0.5 transition-transform">
                      View Profile
                      <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <HomepageFooter />
    </div>
  );
}

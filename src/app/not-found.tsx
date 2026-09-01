import type { Route } from "next";
import Link from "next/link";
import type { ComponentProps } from "react";
import { ArrowRight, Search } from "lucide-react";

import { log } from "@/Backend/lib/logger";
import { db } from "@/Backend/server/db";
import { getPublicPlatformSnapshot } from "@/Backend/server/public-data";

type NotFoundLink = {
  href: ComponentProps<typeof Link>["href"];
  label: string;
  description: string;
};

async function getPopularMentors() {
  try {
    return await db.user.findMany({
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
    getPublicPlatformSnapshot(),
  ]);
  const mentorLinks: NotFoundLink[] = popularMentors.flatMap((mentor) => {
    const username = mentor.mentorProfile?.username;
    if (!username) {
      return [];
    }

    return [
      {
        href: `/mentor/${username}` as Route,
        label: mentor.name,
        description:
          mentor.mentorProfile?.headline ??
          mentor.mentorProfile?.college ??
          "Explore this mentor profile",
      },
    ];
  });
  const fallbackLinks: NotFoundLink[] = snapshot.searchLinks.slice(0, 3).map((item) => ({
    href: { pathname: "/find-mentor", query: { q: item.query } },
    label: item.label,
    description: `Explore live mentor profiles match this topic right now.`,
  }));
  const discoveryLinks =
    mentorLinks.length > 0
      ? mentorLinks
      : fallbackLinks.length > 0
        ? fallbackLinks
        : [
            {
              href: "/find-mentor" as Route,
              label: "Browse all mentors",
              description: "Jump into the live mentor directory.",
            },
          ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_32%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 rounded-[2.5rem] border border-white/70 bg-white/80 p-8 shadow-2xl shadow-slate-200/70 backdrop-blur md:p-12">
        <div className="max-w-2xl">
          <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            404
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
            This page is missing, but the right mentor probably is not.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Search the mentor network, jump back to discovery, or start with a few profiles other
            students visit often.
          </p>
        </div>

        <form action="/find-mentor" className="relative max-w-2xl">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
          <input
            className="h-14 w-full rounded-full border border-slate-200 bg-white pl-14 pr-36 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
            name="q"
            placeholder="Search mentors by college, exam, or goal"
            type="search"
          />
          <button
            className="absolute right-2 top-2 inline-flex h-10 items-center rounded-full bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="submit"
          >
            Search
          </button>
        </form>

        <div className="grid gap-4 md:grid-cols-2">
          {discoveryLinks.map((item) => (
            <Link
              className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lg hover:shadow-sky-100/60"
              href={item.href}
              key={typeof item.href === "string" ? item.href : `${item.label}-${item.description}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-slate-950">{item.label}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </div>
                <ArrowRight className="mt-1 size-5 text-slate-400 transition group-hover:text-sky-600" />
              </div>
            </Link>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 text-sm font-semibold text-slate-700">
          <Link className="rounded-full border border-slate-300 px-4 py-2 transition hover:bg-white" href="/find-mentor">
            Browse all mentors
          </Link>
          <Link className="rounded-full border border-slate-300 px-4 py-2 transition hover:bg-white" href="/">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}

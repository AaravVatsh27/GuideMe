import type { Route } from "next";
import Link from "next/link";
import {
  Search, Star, Shield, TrendingUp,
  Users, ArrowRight, CheckCircle,
} from "lucide-react";
import { getPublicMentorDirectory, getPublicPlatformSnapshot } from "@/server/public-data";
import type { PublicMentorCard, PlatformSnapshot } from "@/server/public-data";
import { MentorAvatar } from "@/components/MentorAvatar";
import { cn } from "@/server/utils";

export const revalidate = 300;

// ── Types ──────────────────────────────────────────────────────────────

type PageProps = {
  searchParams?: {
    q?: string | string[];
    stream?: string | string[];
    exam?: string | string[];
    tier?: string | string[];
    priceMax?: string | string[];
    available?: string | string[];
    forClass?: string | string[];
  };
};

// ── Helpers ────────────────────────────────────────────────────────────

function p(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function formatPrice(v: number | null | undefined): string {
  if (!v) return "Not listed";
  return `₹${v.toLocaleString("en-IN")}`;
}

function tierStyle(tier: string | null) {
  if (tier === "ELITE")    return "border-amber-400/30 bg-amber-400/10 text-amber-300";
  if (tier === "VERIFIED") return "border-teal-400/30 bg-teal-400/10 text-teal-300";
  return "border-white/10 bg-white/5 text-white/50";
}

function tierLabel(tier: string | null) {
  const map: Record<string, string> = {
    ELITE: "Elite", VERIFIED: "Verified", RISING: "Rising",
  };
  return tier ? (map[tier] ?? tier) : "";
}

// ── Sub-components ─────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent = "teal",
}: {
  label: string; value: string; sub: string; accent?: "teal" | "amber" | "mint";
}) {
  const num =
    accent === "amber" ? "text-amber-400"
    : accent === "mint" ? "text-emerald-400"
    : "text-teal-400";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#0d2137] p-5">
      <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl bg-gradient-to-b from-teal-400/50 to-transparent" />
      <p className="text-xs font-medium uppercase tracking-widest text-white/30">{label}</p>
      <p className={cn("mt-3 text-3xl font-bold tracking-tight", num)}>{value}</p>
      <p className="mt-2 text-xs leading-5 text-white/30">{sub}</p>
    </div>
  );
}

function MentorCard({ mentor }: { mentor: PublicMentorCard }) {
  const profileHref = (mentor.username
    ? `/mentor/${mentor.username}`
    : `/mentor/${mentor.id}`) as Route;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-white/5 bg-[#0d2137] transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/25 hover:shadow-[0_8px_40px_rgba(2,128,144,0.12)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-400/0 to-transparent transition-all duration-500 group-hover:via-teal-400/40" />

      <div className="flex flex-1 flex-col p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-teal-400/15 blur-sm" />
              <MentorAvatar
                src={mentor.image}
                alt={mentor.name}
                fallback={mentor.firstName.charAt(0)}
                className="relative size-12 ring-2 ring-teal-400/20"
              />
              {mentor.availableThisWeek && (
                <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-[#0d2137] bg-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-[#edf3fb]">{mentor.name}</p>
              <p className="mt-0.5 truncate text-sm text-white/40">
                {mentor.headline ?? mentor.yearLabel}
              </p>
            </div>
          </div>
          {mentor.tier && (
            <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium", tierStyle(mentor.tier))}>
              {tierLabel(mentor.tier)}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {mentor.availableThisWeek && (
            <span className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
              Available now
            </span>
          )}
          {mentor.examLabels.slice(0, 2).map((label) => (
            <span key={label} className="rounded-full border border-teal-500/15 bg-teal-500/5 px-2.5 py-1 text-xs text-teal-300/70">
              {label}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-[#0f1b2d] p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="text-xs text-white/30">Rating</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#edf3fb]">
              {mentor.avgRating > 0 ? mentor.avgRating.toFixed(1) : "New"}
            </p>
          </div>
          <div className="rounded-xl bg-[#0f1b2d] p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <Users className="size-3 text-white/30" />
              <span className="text-xs text-white/30">Sessions</span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#edf3fb]">
              {mentor.totalSessions > 0 ? mentor.totalSessions : "—"}
            </p>
          </div>
          <div className="rounded-xl bg-[#0f1b2d] p-3 text-center">
            <p className="text-xs text-white/30">From</p>
            <p className="mt-1 text-sm font-semibold text-amber-400">
              {formatPrice(mentor.priceMin)}
            </p>
          </div>
        </div>

        {/* Topics */}
        {mentor.topicLabels.length > 0 && (
          <p className="mt-4 text-xs leading-5 text-white/30">
            {mentor.topicLabels.slice(0, 3).join(" · ")}
          </p>
        )}

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-white/5 pt-4">
          <span className="text-xs text-white/25">
            {mentor.totalReviews > 0
              ? `${mentor.totalReviews} review${mentor.totalReviews !== 1 ? "s" : ""}`
              : "New mentor"}
          </span>
          <Link
            href={profileHref}
            className="group/link flex items-center gap-1 text-sm font-medium text-amber-400 transition hover:text-amber-300"
          >
            View profile
            <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ searchLinks }: { searchLinks: PlatformSnapshot["searchLinks"] }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-[1.75rem] border border-white/5 bg-[#0d2137] px-8 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-teal-500/20 bg-teal-500/10">
        <Search className="size-7 text-teal-400/50" />
      </div>
      <p className="mt-5 text-lg font-semibold text-[#edf3fb]">No mentors matched that search</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-white/40">
        Try a college name, exam, or topic area instead.
      </p>
      {searchLinks.length > 0 ? (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {searchLinks.slice(0, 5).map((item) => (
            <Link
              key={item.label}
              href={{ pathname: "/find-mentor", query: { q: item.query } }}
              className="rounded-full border border-teal-500/15 bg-teal-500/5 px-3 py-1.5 text-sm text-teal-300 transition hover:border-teal-400/30"
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : (
        <Link
          href="/find-mentor"
          className="mt-6 rounded-full border border-white/10 px-4 py-2 text-sm text-white/50 transition hover:border-white/20 hover:text-white/80"
        >
          Browse the full directory
        </Link>
      )}
    </div>
  );
}

function ComingSoonState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-[1.75rem] border border-white/5 bg-[#0d2137] px-8 py-20 text-center">
      <div className="flex size-16 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10">
        <Users className="size-7 text-amber-400" />
      </div>
      <p className="mt-5 text-xl font-semibold text-[#edf3fb]">The directory is still empty</p>
      <p className="mt-3 max-w-md text-sm leading-6 text-white/40">
        Verified mentor cards will appear here as soon as the first profiles complete onboarding.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/auth/signup?role=MENTOR"
          className="rounded-full bg-amber-400 px-5 py-3 text-sm font-semibold text-[#0f1b2d] transition hover:bg-amber-300"
        >
          Apply as mentor
        </Link>
        <Link
          href="/auth/signup"
          className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white/70 transition hover:border-white/20 hover:text-white"
        >
          Create student account
        </Link>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────

export default async function FindMentorPage({ searchParams }: PageProps) {
  const query    = p(searchParams?.q).trim();
  const stream   = p(searchParams?.stream);
  const exam     = p(searchParams?.exam);
  const tier     = p(searchParams?.tier);
  const priceMax = Number(p(searchParams?.priceMax)) || undefined;
  const available = p(searchParams?.available) === "true";
  const forClass = p(searchParams?.forClass) as "school" | "ug" | "";

  const filterCount = [stream, exam, tier, priceMax, available, forClass]
    .filter(Boolean).length;

  const [snapshot, directory] = await Promise.all([
    getPublicPlatformSnapshot(),
    getPublicMentorDirectory({
      query:    query    || undefined,
      stream:   stream   || undefined,
      exam:     exam     || undefined,
      tier:     tier     || undefined,
      priceMax,
      available: available || undefined,
      forClass: (forClass as "school" | "ug") || undefined,
      limit: 12,
    }),
  ]);

  const sharedQuery = query ? { q: query } : {};

  return (
    <div className="min-h-screen bg-[#040913]">

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/5 bg-[#0f1b2d]">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[700px] -translate-x-1/2 rounded-full bg-teal-500/6 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">

          {/* Badge */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-300">
              <span className="size-1.5 animate-pulse rounded-full bg-teal-400" />
              Live mentor directory
            </span>
            {snapshot.totalMentors > 0 && (
              <span className="text-xs text-white/25">
                {snapshot.totalMentors} verified mentor{snapshot.totalMentors !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Heading */}
          <h1 className="mt-5 max-w-2xl text-4xl font-bold tracking-tight text-[#edf3fb] sm:text-5xl">
            Find your{" "}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              senior friend
            </span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
            Connect with college students who recently cracked the same exams, chose the same
            stream, and came out the other side.
          </p>

          {/* Search */}
          <form action="/find-mentor" className="mt-7 max-w-2xl">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-white/25" />
              <input
                className="h-14 w-full rounded-full border border-white/8 bg-[#0d2137] pl-12 pr-36 text-sm text-[#edf3fb] placeholder-white/20 outline-none transition focus:border-teal-400/40 focus:ring-4 focus:ring-teal-400/8"
                defaultValue={query}
                name="q"
                placeholder="College, exam, topic, or mentor name…"
                type="search"
                autoComplete="off"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 h-10 rounded-full bg-amber-400 px-5 text-sm font-semibold text-[#0f1b2d] transition hover:bg-amber-300"
              >
                Search
              </button>
            </div>
          </form>

          {/* Quick search chips */}
          {snapshot.searchLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {snapshot.searchLinks.map((item) => {
                const isActive = query.localeCompare(item.query, undefined, { sensitivity: "accent" }) === 0;
                return (
                  <Link
                    key={item.label}
                    href={{ pathname: "/find-mentor", query: { q: item.query } }}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                      isActive
                        ? "border-teal-400/40 bg-teal-400/10 text-teal-300"
                        : "border-white/8 text-white/40 hover:border-white/15 hover:text-white/70"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Filter row */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(
              [
                {
                  label: "Available this week",
                  active: available,
                  href: { ...sharedQuery, available: available ? undefined : "true" },
                  icon: CheckCircle,
                  style: "emerald",
                },
                {
                  label: "For school students",
                  active: forClass === "school",
                  href: { ...sharedQuery, forClass: forClass === "school" ? undefined : "school" },
                  style: "teal",
                },
                {
                  label: "For UG students",
                  active: forClass === "ug",
                  href: { ...sharedQuery, forClass: forClass === "ug" ? undefined : "ug" },
                  style: "teal",
                },
                {
                  label: "Elite mentors",
                  active: tier === "ELITE",
                  href: { ...sharedQuery, tier: tier === "ELITE" ? undefined : "ELITE" },
                  style: "amber",
                },
                {
                  label: "Under ₹199",
                  active: priceMax === 199,
                  href: { ...sharedQuery, priceMax: priceMax === 199 ? undefined : "199" },
                  style: "teal",
                },
              ] as const
            ).map(({ label, active, href, style }) => (
              <Link
                key={label}
                href={{ pathname: "/find-mentor", query: href }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  active && style === "emerald" && "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
                  active && style === "amber"   && "border-amber-400/30 bg-amber-400/10 text-amber-300",
                  active && style === "teal"    && "border-teal-400/30 bg-teal-400/10 text-teal-300",
                  !active && "border-white/8 text-white/40 hover:border-white/15 hover:text-white/70"
                )}
              >
                {label}
              </Link>
            ))}

            {filterCount > 0 && (
              <Link
                href="/find-mentor"
                className="ml-1 text-xs text-white/30 underline underline-offset-2 hover:text-white/60"
              >
                Clear {filterCount} filter{filterCount !== 1 ? "s" : ""}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Matching mentors"
            value={directory.total.toLocaleString("en-IN")}
            sub="In current search result"
            accent="teal"
          />
          <StatCard
            label="Available this week"
            value={directory.totalAvailableThisWeek.toLocaleString("en-IN")}
            sub="Ready to take bookings"
            accent="mint"
          />
          <StatCard
            label="Total verified"
            value={snapshot.totalMentors.toLocaleString("en-IN")}
            sub="All streams and exams"
            accent="teal"
          />
          <StatCard
            label="Starting price"
            value={snapshot.minPrice > 0 ? formatPrice(snapshot.minPrice) : "Not listed"}
            sub={
              snapshot.maxPrice > 0
                ? `Up to ${formatPrice(snapshot.maxPrice)} for elite`
                : "Live pricing appears when mentors publish paid sessions"
            }
            accent="amber"
          />
        </div>

        {/* Results header */}
        <div className="mt-10 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#edf3fb]">
              {query ? `Results for "${query}"` : "Top mentors right now"}
            </h2>
            <p className="mt-1 text-sm text-white/30">
              {directory.total > 0
                ? `Showing ${Math.min(12, directory.total)} of ${directory.total} · Ranked by rating`
                : "No mentors matched"}
            </p>
          </div>
          {(query || filterCount > 0) && (
            <Link
              href="/find-mentor"
              className="shrink-0 rounded-full border border-white/8 px-4 py-2 text-sm text-white/40 transition hover:border-white/15 hover:text-white/70"
            >
              Clear all
            </Link>
          )}
        </div>

        {/* Mentor grid */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {snapshot.totalMentors === 0 ? (
            <ComingSoonState />
          ) : directory.mentors.length > 0 ? (
            directory.mentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))
          ) : (
            <EmptyState searchLinks={snapshot.searchLinks} />
          )}
        </div>

        {directory.total > 12 && (
          <p className="mt-8 text-center text-xs text-white/25">
            Showing 12 of {directory.total} ·{" "}
            <span className="text-teal-400/50">Refine your search to narrow down</span>
          </p>
        )}

        {/* Why GuideMe strip */}
        <div className="mt-16 rounded-[1.75rem] border border-white/5 bg-[#0d2137] p-8">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-white/25">
            Why GuideMe mentors are different
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {[
              {
                icon: TrendingUp,
                title: "Fresh experience",
                body: "Every mentor recently lived the exact decisions you're facing. Their advice is current, not theoretical.",
              },
              {
                icon: Shield,
                title: "Verified profiles",
                body: "College, exams, and year are all manually verified before a mentor goes live on the platform.",
              },
              {
                icon: Star,
                title: "Rated after every session",
                body: "A mentor with 4.8★ from 40 sessions earned it. Every review is from a real student.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-teal-400/15 bg-teal-400/8">
                  <Icon className="size-4 text-teal-400" />
                </div>
                <div>
                  <p className="font-semibold text-[#edf3fb]">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-white/40">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

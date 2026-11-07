/** Landing page hero and the trust strip under it. */

import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, HeartHandshake, ShieldCheck, Star, Users } from "lucide-react";
import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";
import dynamic from "next/dynamic";

import { formatNumber, getMentorContext, getMentorGroup, getMentorInitials, getMentorPrice, getMentorProof, getMentorTopic, getStartingPrice } from "@/Frontend/views/home/home-helpers";

const HeroBackground = dynamic(() => import("./hero-background"), {
  ssr: false,
});

export function HeroSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const previewMentors = snapshot.featuredMentors.slice(0, 3);
  const startingPrice = getStartingPrice(snapshot);

  const colleges = snapshot.mentorColleges;

  return (
    <section
      id="top"
      className="mentra-hero-depth isolate relative overflow-hidden bg-[var(--bg)] pt-16 text-[var(--text)]"
    >
      <HeroBackground />
      <div
        className="pointer-events-none absolute bottom-0 left-1/2 z-[1] w-screen -translate-x-1/2"
        style={{
          height: 160,
          background:
            "linear-gradient(to bottom, transparent 0%, color-mix(in srgb, var(--bg) 48%, transparent) 38%, color-mix(in srgb, var(--bg) 82%, transparent) 72%, var(--bg) 100%)",
        }}
        aria-hidden="true"
      />
      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>

      <div className="relative z-20 mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-18 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Hero copy */}
          <div className="max-w-3xl">
            <div className="home-section-label text-xs font-semibold">
              Your senior friend for every big decision
            </div>

            <h1 className="mt-7 max-w-4xl text-balance text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-[var(--text)] sm:text-6xl lg:text-[5.2rem]">
              Find your mantra.
              <span className="block">Find your</span>
              <span className="mt-1 block text-[var(--accent)]">
                mentor.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-[var(--muted)] sm:text-lg sm:leading-8">
              One honest conversation can change everything. Talk to a
              college senior who has recently walked the same road and can
              help you choose with more clarity.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/find-mentor"
                className="home-primary-button group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition duration-200 hover:-translate-y-0.5"
              >
                Find My Senior Friend
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/auth/signup"
                className="home-secondary-button inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition duration-200 hover:-translate-y-0.5"
              >
                Create free account
              </Link>
            </div>

            <div className="relative z-20 mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
              <span className="font-semibold text-[var(--accent)]">
                {startingPrice} / session
              </span>
              <span aria-hidden="true">·</span>
              <span>Free {snapshot.introMinutes}-min intro</span>
              <span aria-hidden="true">·</span>
              <span>
                {formatNumber(snapshot.totalMentors)} verified mentors
              </span>
            </div>

            {/* Social proof from real data; hidden until there is something real to show */}
            {snapshot.totalPublicReviews > 0 || snapshot.totalStudents > 0 ? (
              <div className="mt-8 flex items-center gap-2.5 pt-1 sm:gap-3.5">
                {previewMentors.length > 0 ? (
                  <div className="flex shrink-0 -space-x-2 sm:-space-x-2.5" aria-hidden="true">
                    {previewMentors.map((mentor) => (
                      <span
                        key={mentor.id}
                        className="flex size-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-xs font-bold text-[var(--accent)] ring-2 ring-[var(--bg)] sm:size-10"
                      >
                        {getMentorInitials(mentor.name)}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-left text-xs font-bold text-[var(--text)]">
                  {snapshot.totalPublicReviews > 0 ? (
                    <>
                      <Star className="size-3.5 fill-[var(--accent)] text-[var(--accent)]" aria-hidden="true" />
                      <span className="font-extrabold">{snapshot.averageRating.toFixed(1)}/5</span>
                      <span className="font-medium text-[var(--muted)]">
                        from {formatNumber(snapshot.totalPublicReviews)}{" "}
                        {snapshot.totalPublicReviews === 1 ? "review" : "reviews"}
                      </span>
                    </>
                  ) : null}
                  {snapshot.totalPublicReviews > 0 && snapshot.totalStudents > 0 ? (
                    <span className="size-1 rounded-full bg-slate-300" aria-hidden="true" />
                  ) : null}
                  {snapshot.totalStudents > 0 ? (
                  <span className="font-bold text-[var(--accent)]">
                      {formatNumber(snapshot.totalStudents)}{" "}
                      {snapshot.totalStudents === 1 ? "student has" : "students have"} joined
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* Mentor preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div className="home-glass-card relative animate-[hero-float_8s_ease-in-out_infinite] p-5 transition-transform duration-500 hover:-translate-y-1 motion-reduce:animate-none sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                    Start with someone who has been there
                  </p>

                  <h2 className="mt-2 text-xl font-bold tracking-tight text-[var(--text)]">
                    Find a mentor who gets it.
                  </h2>
                </div>

                <div className="home-accent-surface flex size-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)]">
                  <HeartHandshake className="size-5" />
                </div>
              </div>

              {previewMentors.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {previewMentors.map((mentor) => {
                    const group = getMentorGroup(mentor);

                    return (
                      <Link
                        key={mentor.username ?? mentor.name}
                        href={
                          mentor.username
                            ? `/mentor/${encodeURIComponent(
                                mentor.username,
                              )}`
                            : "/find-mentor"
                        }
                        className="home-glass-card group flex items-center gap-3 p-3.5 transition duration-200 hover:-translate-y-0.5"
                      >
                        <div
                          className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            group === "school"
                            ? "home-accent-surface"
                            : "home-accent-surface"
                          }`}
                        >
                          {getMentorInitials(mentor.name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[var(--text)]">
                              {mentor.name}
                            </p>

                            {mentor.totalReviews > 0 && (
                              <ShieldCheck className="size-3.5 shrink-0 text-[var(--accent)]" />
                            )}
                          </div>

                          <p className="truncate text-xs text-[var(--muted)]">
                            {getMentorContext(mentor)}
                          </p>

                          <p className="mt-1 text-xs font-medium text-[var(--accent)]">
                            {getMentorTopic(mentor)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-[var(--text)]">
                            {getMentorPrice(mentor)}
                          </p>

                          <p className="mt-1 text-[11px] text-[var(--muted)]">
                            {getMentorProof(mentor)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}

                  <Link
                    href="/find-mentor"
                    className="home-secondary-button group flex min-h-11 items-center justify-between rounded-2xl border-dashed px-4 text-sm font-semibold backdrop-blur transition"
                  >
                    Explore all mentors
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ) : (
                <div className="home-glass-card mt-6 p-6">
                <p className="text-sm font-semibold text-[var(--text)]">
                    Mentor profiles are opening now.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    Search the mentor network and see who is currently live.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* College marquee: real colleges of verified mentors, hidden when there are none */}
        {colleges.length > 0 ? (
        <div className="home-glass-card relative mt-14 overflow-hidden py-5 sm:mt-16">
          <div className="flex items-center gap-5 px-5 sm:px-6">
            <div className="z-10 shrink-0 border-r border-[var(--border)] pr-5 sm:pr-7">
              <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
                Mentors from
              </p>
            </div>

            <div className="relative min-w-0 flex-1 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[var(--bg)] to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[var(--bg)] to-transparent" />

              <div
                className="mentra-college-marquee"
                aria-label={`Mentors from ${colleges.join(", ")}`}
              >
                <div className="mentra-college-marquee-track">
                  {[...colleges, ...colleges].map((college, index) => (
                    <span
                      key={`${college}-${index}`}
                      className="inline-flex shrink-0 items-center gap-4 whitespace-nowrap text-sm font-semibold text-[var(--muted)]"
                    >
                      {college}
                      <span
                        className="size-1 rounded-full bg-[var(--accent)]"
                        aria-hidden="true"
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : null}
      </div>
    </section>
  );
}

export function TrustStrip({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const realStats = [
    { key: "mentors", value: snapshot.totalMentors, label: "Verified mentors", Icon: ShieldCheck },
    { key: "students", value: snapshot.totalStudents, label: "Students onboarded", Icon: Users },
    { key: "sessions", value: snapshot.completedSessions, label: "Sessions completed", Icon: CheckCircle2 },
  ].filter((stat) => stat.value > 0);

  const valuePoints = [
    { label: "Verified mentors, reviewed before they go live", Icon: ShieldCheck },
    { label: "Free 10-minute intro call", Icon: Clock3 },
    { label: "Real students, real experience", Icon: Users },
  ];

  return (
    <section className="relative z-10 -mt-px overflow-hidden bg-[var(--bg)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="home-glass-card group relative overflow-hidden transition-colors duration-200 motion-reduce:transition-none">
          <div
            className="relative grid grid-cols-1 divide-y divide-[var(--border)] md:grid-cols-3 md:divide-x md:divide-y-0"
          >
            {realStats.length === 3
              ? realStats.map((stat) => {
                  const Icon = stat.Icon;
                  return (
                    <div key={stat.key} className="flex min-h-[88px] items-center gap-4 px-5 py-5 sm:px-7">
                      <span className="home-accent-surface flex size-10 shrink-0 items-center justify-center rounded-2xl">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-2xl font-bold tracking-[-0.03em] text-[var(--text)]">
                          {formatNumber(stat.value)}
                        </p>
                        <p className="mt-1 text-sm font-medium text-[var(--muted)]">
                          {stat.label}
                        </p>
                      </div>
                    </div>
                  );
                })
              : valuePoints.map(({ label, Icon }) => (
                  <div key={label} className="flex min-h-[88px] items-center gap-4 px-5 py-5 sm:px-7">
                    <span className="home-accent-surface flex size-10 shrink-0 items-center justify-center rounded-2xl">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-semibold leading-5 text-[var(--text)] sm:text-base">
                      {label}
                    </p>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
}

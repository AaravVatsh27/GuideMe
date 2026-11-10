/** Landing page hero and the trust strip under it. */

import Link from "next/link";
import { ArrowRight, Briefcase, Compass, GraduationCap, HeartHandshake, Laptop, School, Star, Users } from "lucide-react";
import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";
import dynamic from "next/dynamic";

import { formatNumber, getMentorInitials, getStartingPrice } from "@/Frontend/views/home/home-helpers";

const HeroBackground = dynamic(() => import("./hero-background"), {
  ssr: false,
});

/**
 * Topic chips beside the light column (1024px and up), staggered: two upper-right chips with a
 * connector line fading downward, and two lower-right chips without one.
 * Positions are relative to the right-hand grid column.
 */
const heroTopicChips = [
  { label: "Higher Studies", Icon: GraduationCap, position: "left-[4%] top-[14%]", delay: "0s", connector: true },
  { label: "Exam Prep", Icon: Laptop, position: "left-[46%] top-[4%]", delay: "-3s", connector: true },
  { label: "Career Guidance", Icon: Briefcase, position: "left-[12%] top-[62%]", delay: "-1.5s", connector: false },
  { label: "College & More", Icon: School, position: "left-[54%] top-[76%]", delay: "-4.5s", connector: false },
];

export function HeroSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const previewMentors = snapshot.featuredMentors.slice(0, 3);
  const hasRealPrice =
    snapshot.minPricePaise > 0 || snapshot.averagePaidSessionPricePaise > 0;

  const colleges = snapshot.mentorColleges;

  return (
    <section
      id="top"
      className="mentra-hero-depth isolate relative overflow-hidden bg-[var(--bg)] pt-16 text-[var(--text)] lg:flex lg:min-h-[100svh] lg:flex-col"
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

      {/* On large screens the hero fills the viewport and the copy block is centred vertically in it */}
      <div className="relative z-20 mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-18 lg:flex lg:w-full lg:flex-1 lg:flex-col lg:justify-center lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-16">
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

            {/* Price and mentor count only appear once there is real data behind them */}
            <div className="relative z-20 mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[var(--muted)]">
              {hasRealPrice ? (
                <>
                  <span className="font-semibold text-[var(--accent)]">
                    From {getStartingPrice(snapshot)} / session
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              ) : null}
              <span>Free {snapshot.introMinutes}-min intro</span>
              {snapshot.totalMentors > 0 ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>
                    {formatNumber(snapshot.totalMentors)} verified{" "}
                    {snapshot.totalMentors === 1 ? "mentor" : "mentors"}
                  </span>
                </>
              ) : null}
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

          {/* Topic chips: the right-hand grid column starts just right of the light column,
              so the chips sit beside the beam and can never overlap the headline block. */}
          <div className="relative hidden lg:block" aria-hidden="true">
            {heroTopicChips.map(({ label, Icon, position, delay, connector }) => (
              <div
                key={label}
                className={`pointer-events-none absolute flex flex-col items-center ${position}`}
              >
                <div
                  className="home-glass-card flex animate-[hero-float_9s_ease-in-out_infinite] items-center gap-2 whitespace-nowrap px-3.5 py-2 text-xs font-semibold text-[var(--text)] motion-reduce:animate-none"
                  style={{ animationDelay: delay }}
                >
                  <Icon className="size-3.5 text-[var(--accent)]" strokeWidth={1.75} />
                  {label}
                </div>
                {connector ? (
                  <span
                    className="h-12 w-px"
                    style={{
                      background:
                        "linear-gradient(to bottom, color-mix(in srgb, var(--accent) 40%, transparent), transparent)",
                    }}
                  />
                ) : null}
              </div>
            ))}
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
  const points = [
    {
      title: "Real Guidance",
      subline: "From college seniors who recently walked the same road.",
      Icon: Compass,
    },
    {
      title: "Personalized Support",
      subline: `1:1 sessions, starting with a free ${snapshot.introMinutes}-minute intro.`,
      Icon: HeartHandshake,
    },
    {
      title: "Reviewed Mentors",
      subline: "Approved by our team before they go live.",
      Icon: Users,
    },
  ];

  return (
    <section className="relative z-10 -mt-px overflow-hidden bg-[var(--bg)] py-6 sm:py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="home-glass-card relative overflow-hidden">
          <div className="grid grid-cols-1 divide-y divide-[var(--border)] md:grid-cols-3 md:divide-x md:divide-y-0">
            {points.map(({ title, subline, Icon }) => (
              <div key={title} className="flex min-h-[88px] items-center gap-4 px-5 py-5 sm:px-7">
                <Icon className="size-6 shrink-0 text-[var(--accent)]" strokeWidth={1.5} aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-[var(--text)] sm:text-base">
                    {title}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-[var(--muted)]">
                    {subline}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Landing page: what mentors can earn. */

import Link from "next/link";
import { ArrowRight, Check, GraduationCap } from "lucide-react";
import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";
import { formatPaise } from "@/shared/format";

import { EXAMPLE_SESSIONS_PER_WEEK, getMentorIncomeEstimate } from "@/Frontend/views/home/home-helpers";
import { PLATFORM_CUT } from "@/shared/constants";

export function MentorIncomeSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const estimate = getMentorIncomeEstimate(snapshot);
  const mentorSharePercent = Math.round((1 - PLATFORM_CUT) * 100);
  const platformFeePercent = Math.round(PLATFORM_CUT * 100);

  return (
    <section
      id="for-mentors"
      className="relative overflow-hidden bg-[var(--bg)] py-20 sm:py-24 lg:py-28"
    >
      <div
        className="home-ambient-glow pointer-events-none absolute -left-32 top-20 size-[26rem] rounded-full blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="max-w-xl">
            <p className="home-section-label text-xs font-semibold uppercase tracking-[0.2em]">
              For mentors
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] text-[var(--text)] sm:text-4xl lg:text-5xl">
              Turn your experience into income.
            </h2>

            <p className="mt-5 text-base leading-7 text-[var(--muted)]">
              You just figured something out that another student is about to
              face. Share the path that worked for you and build meaningful
              experience while doing it.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Help students make decisions with more context.",
                "Build proof of communication and leadership.",
                "Earn from sessions that fit your schedule.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3"
                >
                  <span className="home-accent-surface mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3.5" />
                  </span>

                  <p className="text-sm leading-6 text-[var(--muted)]">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/auth/signup?role=MENTOR"
              className="home-primary-button group mt-8 inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
            >
              Apply to Become a Mentor
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
            </Link>
          </div>

          <div className="relative">
            <div
              className="home-glass-card relative overflow-hidden p-6 sm:p-8"
            >
              <div className="relative">
                <div className="flex items-start justify-between gap-5">
                  <div className="max-w-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                      Earnings snapshot
                    </p>

                    <h3 className="mt-2 text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
                      What consistent mentoring can look like
                    </h3>
                  </div>

                  <div className="home-accent-surface flex size-11 shrink-0 items-center justify-center rounded-2xl">
                    <GraduationCap className="size-5" />
                  </div>
                </div>

                <div
                  className="home-glass-card mt-8 p-6"
                >
                  {/* The earnings example only appears once a mentor has set a real price */}
                  {estimate ? (
                    <>
                      <p className="text-sm font-medium text-[var(--muted)]">
                        Example at {EXAMPLE_SESSIONS_PER_WEEK} sessions / week
                      </p>

                      <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <p className="text-4xl font-bold tracking-[-0.04em] text-[var(--accent)] sm:text-5xl">
                          {formatPaise(estimate.monthlyPaise)}
                        </p>

                        <span className="text-sm font-medium text-[var(--muted)]">
                          / month
                        </span>
                      </div>

                      <p className="mt-4 max-w-lg text-sm leading-6 text-[var(--muted)]">
                        Example: {EXAMPLE_SESSIONS_PER_WEEK} sessions a week at the lowest current mentor price ({formatPaise(estimate.pricePaise)}), after the {platformFeePercent}% platform fee.
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                        Illustrative estimate. Actual earnings depend on the sessions you complete.
                      </p>
                    </>
                  ) : null}

                  <div className={`home-glass-card p-4 ${estimate ? "mt-7" : ""}`}>
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
                      <span>Mentor share</span>
                      <span className="text-[var(--text)]">{mentorSharePercent}%</span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-[var(--card)]">
                      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${mentorSharePercent}%` }} />
                    </div>

                    <div className="mt-3 flex justify-between text-[11px] text-[var(--muted)]">
                      <span>Platform</span>
                      <span>Mentor</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3">
                  <div className="home-accent-surface mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full">
                    <Check className="size-3.5" />
                  </div>

                  <p className="text-xs leading-5 text-[var(--muted)]">
                    Actual earnings vary with session price, availability, and
                    bookings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

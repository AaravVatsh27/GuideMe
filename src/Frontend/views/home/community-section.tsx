/** Landing page: community invite. */

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function HomeCommunitySection() {
  return (
    <section
      id="community"
      className="relative overflow-hidden bg-[var(--bg)] py-20 sm:py-24 lg:py-28"
    >
      <div
        className="home-ambient-glow pointer-events-none absolute -left-32 top-20 size-[26rem] rounded-full blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="home-ambient-glow pointer-events-none absolute -right-32 bottom-0 size-[26rem] rounded-full blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column: Copy & Stats */}
          <div className="max-w-xl">
            <div className="home-section-label text-xs font-semibold">
              <span>Mentra Student Community</span>
            </div>

            <h2 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[var(--text)] sm:text-4xl lg:text-5xl">
              You&apos;re not figuring this out{" "}
              <span className="text-[var(--accent)]">
                alone.
              </span>
            </h2>

            <p className="mt-5 text-base leading-7 text-[var(--muted)] sm:text-lg">
              Navigate the same big decisions — stream choices, competitive exams, college realities, and branch trade-offs. Connect with seniors reviewed before they go live who walked your exact road.
            </p>

            <div
              className="home-glass-card mt-8 grid grid-cols-3 gap-3 p-4"
            >
              <div className="text-center">
                <p className="text-2xl font-black text-[var(--text)]">Real seniors, real experience</p>
              </div>
              <div className="border-x border-[var(--border)] text-center">
                <p className="text-2xl font-black text-[var(--text)]">Free 10-minute intro call</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[var(--text)]">Honest one-to-one conversations</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/community"
                className="home-primary-button group inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
              >
                Join WhatsApp Community
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
              </Link>

              <Link
                href="/community"
                className="home-secondary-button inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-semibold transition duration-200 motion-reduce:transition-none"
              >
                Explore Community Hub
              </Link>
            </div>
          </div>

          {/* Right Column: Community details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <article
              className="home-glass-card p-6 sm:col-span-2"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">
                Campus Chapters Across India
              </p>
              <p className="mt-3 text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
                IIT · DU · BITS · AIIMS
              </p>
            </article>

            <article
              className="home-glass-card p-6"
            >
              <p className="text-sm font-semibold text-[var(--text)]">
                Local Meetups &amp; Circles
              </p>
            </article>

            <article
              className="home-glass-card p-6"
            >
              <p className="text-sm font-semibold text-[var(--text)]">
                1:1 Senior Advice
              </p>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}

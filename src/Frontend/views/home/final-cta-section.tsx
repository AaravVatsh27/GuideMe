/** Landing page: closing call to action. */

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";

export function FinalCtaSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  return (
    <section id="cta" className="relative bg-[var(--bg)] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="home-glass-card px-6 py-12 text-center sm:px-10 sm:py-14">
          {/* Tighter letter-spacing below 768px keeps the pill on one line */}
          <p className="home-section-label whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.1em] md:text-xs md:tracking-[0.22em]">
            Your senior friend · your guide
          </p>

          <h2 className="mx-auto mt-5 max-w-3xl text-balance text-3xl font-bold leading-tight tracking-[-0.04em] text-[var(--text)] sm:text-4xl lg:text-5xl">
            Find the{" "}
            <span className="text-[var(--accent)]">right guidance</span> for
            your next step.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base">
            Start with a free {snapshot.introMinutes}-minute conversation
            and see whether the mentor feels right for you.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/find-mentor"
              className="home-primary-button group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none sm:w-auto"
            >
              Find My Senior Friend
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
            </Link>

            {/* Same mentor sign-up link as the For Mentors section */}
            <Link
              href="/auth/signup?role=MENTOR"
              className="home-secondary-button inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 text-sm font-semibold transition duration-200 motion-reduce:transition-none sm:w-auto"
            >
              Become a Mentor
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Landing page: featured mentors. */

import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";

import { getMentorContext, getMentorGroup, getMentorInitials, getMentorPrice, getMentorProof } from "@/Frontend/views/home/home-helpers";

export function MentorsSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  return (
    <section
      id="mentors"
      className="relative overflow-hidden bg-[var(--bg)] py-20 sm:py-24 lg:py-28"
    >
      <div
        className="home-ambient-glow pointer-events-none absolute -left-32 top-20 size-[26rem] rounded-full blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="home-section-label text-xs font-semibold uppercase tracking-[0.2em]">
              Meet your mentors
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] text-[var(--text)] sm:text-4xl">
              Real students. Real experience. Real guidance.
            </h2>

            <p className="mt-4 text-base leading-7 text-[var(--muted)]">
              Every live mentor brings recent, relevant experience to the
              decisions students are trying to make right now.
            </p>
          </div>

          <Link
            href="/find-mentor"
            className="home-secondary-button group inline-flex min-h-11 items-center gap-2 self-start rounded-full px-5 text-sm font-semibold transition duration-200 motion-reduce:transform-none motion-reduce:transition-none lg:self-auto"
          >
            See all mentors
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" />
          </Link>
        </div>

        {snapshot.featuredMentors.length > 0 ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {snapshot.featuredMentors.slice(0, 8).map((mentor) => {
              const group = getMentorGroup(mentor);

              return (
                <article
                  key={mentor.username ?? mentor.name}
                  className="home-glass-card group relative flex flex-col overflow-hidden p-5 transition duration-200 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <div className="relative flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`flex size-12 items-center justify-center rounded-2xl text-sm font-bold ${
                          group === "school"
                            ? "home-accent-surface"
                            : "home-accent-surface"
                        }`}
                      >
                        {getMentorInitials(mentor.name)}
                      </div>

                      <div className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
                        {mentor.availableThisWeek ? "Available" : "Profile live"}
                      </div>
                    </div>

                    <div className="mt-5">
                      <p className="truncate text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--accent)]">
                        {mentor.college ?? "Mentra mentor"}
                      </p>

                      <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight text-[var(--text)]">
                        {mentor.name}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {getMentorContext(mentor)}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {[mentor.examLabels[0], mentor.topicLabels[0]]
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((label) => (
                            <span
                              key={label}
                              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-[11px] font-medium text-[var(--accent)]"
                            >
                              {label}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="mt-auto pt-6">
                      <div className="flex items-end justify-between gap-3 border-t border-[var(--border)] pt-4">
                        <div>
                          <p className="text-sm font-bold text-[var(--text)]">
                            {getMentorPrice(mentor)}
                            {mentor.priceMinPaise && mentor.priceMinPaise > 0 && (
                              <span className="ml-1 text-xs font-medium text-[var(--muted)]">
                                / session
                              </span>
                            )}
                          </p>

                          <p className="mt-1 text-xs text-[var(--muted)]">
                            {getMentorProof(mentor)}
                          </p>
                        </div>

                        <Link
                          href={
                            mentor.username
                              ? `/mentor/${encodeURIComponent(
                                  mentor.username,
                                )}`
                              : "/find-mentor"
                          }
                          className="home-accent-surface inline-flex size-10 items-center justify-center rounded-full transition-colors duration-200 motion-reduce:transition-none"
                          aria-label={`View ${mentor.name}'s profile`}
                        >
                          <ArrowRight className="size-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div
            className="home-glass-card relative mt-12 overflow-hidden p-10 text-center"
          >
            <Users className="mx-auto size-8 text-[var(--accent)]" />

            <h3 className="mt-4 text-lg font-semibold text-[var(--text)]">
              Mentor profiles are opening now.
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--muted)]">
              Browse the mentor marketplace as profiles become available.
            </p>

            <Link
              href="/find-mentor"
              className="home-primary-button mt-6 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
            >
              Browse mentor directory
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

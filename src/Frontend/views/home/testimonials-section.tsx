/** Landing page: student reviews. */

import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";

import { formatDate, getReviewInitials } from "@/Frontend/views/home/home-helpers";

export function TestimonialsSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const reviews = snapshot.reviewSpotlights
    .filter((review) => Boolean(review.reviewText?.trim()))
    .slice(0, 6);

  if (reviews.length === 0) return null;

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-[var(--bg)] py-20 sm:py-24 lg:py-28"
    >
      <div
        className="home-ambient-glow pointer-events-none absolute -right-32 top-10 size-[26rem] rounded-full blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="home-section-label text-xs font-semibold uppercase tracking-[0.2em]">
            Student stories
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[var(--text)] sm:text-4xl">
            Students who found clarity.
          </h2>

          <p className="mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
            The best proof is what happens after the conversation.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review) => (
            <article
              key={`${review.studentFirstName}-${review.createdAt.toISOString()}`}
              className="home-glass-card group relative overflow-hidden p-6 transition duration-200 motion-reduce:transform-none motion-reduce:transition-none"
            >
              <div
                className="pointer-events-none absolute -right-10 -top-10 text-[9rem] font-serif leading-none text-[var(--accent)]"
                aria-hidden="true"
              >
                “
              </div>

              <div className="relative">
                {review.rating > 0 ? (
                  <div className="flex items-center gap-1 text-[var(--accent)]">
                    {"★★★★★".slice(
                      0,
                      Math.min(5, Math.round(review.rating)),
                    )}
                  </div>
                ) : null}

                <p className="mt-6 text-[15px] leading-7 text-[var(--text)]">
                  “{review.reviewText?.trim()}”
                </p>

                <div className="mt-8 flex items-center gap-3 border-t border-[var(--border)] pt-4">
                  <div className="home-accent-surface flex size-10 items-center justify-center rounded-full text-xs font-bold">
                    {getReviewInitials(review)}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)]">
                      {review.studentFirstName}
                      {review.studentCity
                        ? `, ${review.studentCity}`
                        : ""}
                    </p>

                    <p className="truncate text-xs text-[var(--muted)]">
                      Mentored by {review.mentorName}
                    </p>
                  </div>

                  <p className="ml-auto shrink-0 text-[11px] text-[var(--muted)]">
                    {formatDate(review.createdAt)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

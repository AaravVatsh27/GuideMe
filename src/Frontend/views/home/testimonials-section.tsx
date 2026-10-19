/** Landing page: student reviews. */

import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";

import { formatDate, getReviewInitials } from "@/Frontend/views/home/home-helpers";

export function TestimonialsSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const reviews = snapshot.reviewSpotlights.slice(0, 6);

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-300/[0.08] blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
            Student stories
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[#1E1B4B] sm:text-4xl">
            Students who found clarity.
          </h2>

          <p className="mt-4 max-w-xl text-base leading-7 text-[#5B6475]">
            The best proof is what happens after the conversation.
          </p>
        </div>

        {reviews.length > 0 ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={`${review.studentFirstName}-${review.createdAt.toISOString()}`}
                className="group relative overflow-hidden rounded-[1.75rem] border border-violet-100/80 bg-white/65 p-6 shadow-[0_20px_55px_-38px_rgba(30,27,75,0.30)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_26px_65px_-38px_rgba(124,58,237,0.30)]"
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 text-[9rem] font-serif leading-none text-violet-100/70"
                  aria-hidden="true"
                >
                  “
                </div>

                <div className="relative">
                  <div className="flex items-center gap-1 text-amber-500">
                    {"★★★★★".slice(
                      0,
                      Math.max(1, Math.min(5, Math.round(review.rating))),
                    )}
                  </div>

                  <p className="mt-6 text-[15px] leading-7 text-[#3D4A6B]">
                    “
                    {review.reviewText?.trim() ||
                      `${review.studentFirstName} shared their experience after a Mentra session.`}
                    ”
                  </p>

                  <div className="mt-8 flex items-center gap-3 border-t border-violet-100/80 pt-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-[#7C3AED]">
                      {getReviewInitials(review)}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E1B4B]">
                        {review.studentFirstName}
                        {review.studentCity
                          ? `, ${review.studentCity}`
                          : ""}
                      </p>

                      <p className="truncate text-xs text-slate-400">
                        Mentored by {review.mentorName}
                      </p>
                    </div>

                    <p className="ml-auto shrink-0 text-[11px] text-slate-400">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-[1.75rem] border border-dashed border-violet-200 bg-violet-50/40 p-10 text-center">
            <p className="text-sm font-medium text-slate-600">
              Public student reviews will appear here after the first
              completed sessions.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

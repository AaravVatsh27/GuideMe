"use client";

/**
 * Landing page: student reviews.
 * Renders nothing at all until real public reviews exist (reviewSpotlights only holds reviews
 * marked public, with text and a rating of 4 or more). Client component for the review dots.
 */

import { useState } from "react";
import { Star } from "lucide-react";
import type { PublicPlatformSnapshot } from "@/Backend/server/public-data";

export function TestimonialsSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const reviews = snapshot.reviewSpotlights
    .filter((review) => Boolean(review.reviewText?.trim()))
    .slice(0, 6);
  const [activeIndex, setActiveIndex] = useState(0);

  if (reviews.length === 0) return null;

  const review = reviews[Math.min(activeIndex, reviews.length - 1)];
  const stars = Math.min(5, Math.round(review.rating));

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-[var(--bg)] py-20 sm:py-24 lg:py-28"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="home-section-label text-xs font-semibold uppercase tracking-[0.2em]">
            What students say
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[var(--text)] sm:text-4xl">
            Students who found clarity.
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[var(--muted)]">
            The best proof is what happens after the conversation.
          </p>
        </div>

        <figure
          className="home-glass-card mx-auto mt-12 w-full max-w-3xl px-6 py-10 text-center sm:px-12 sm:py-12"
          aria-live="polite"
        >
          <span
            className="block font-serif text-7xl leading-none text-[var(--accent)]"
            aria-hidden="true"
          >
            “
          </span>

          {/* Stars only when the review carries a real rating */}
          {stars > 0 ? (
            <div
              className="mt-2 flex justify-center gap-1"
              role="img"
              aria-label={`Rated ${stars} out of 5`}
            >
              {Array.from({ length: stars }, (_, index) => (
                <Star
                  key={index}
                  className="size-4 fill-[var(--accent)] text-[var(--accent)]"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : null}

          <blockquote className="mt-6 text-lg leading-8 text-[var(--text)] sm:text-xl sm:leading-9">
            “{review.reviewText?.trim()}”
          </blockquote>

          {/* The review data has the student's first name but no semester or college */}
          <figcaption className="mt-8 text-sm font-semibold text-[var(--muted)]">
            {review.studentFirstName}
          </figcaption>
        </figure>

        {reviews.length > 1 ? (
          <div className="mt-4 flex justify-center" role="group" aria-label="Choose a review">
            {reviews.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className="flex size-11 items-center justify-center rounded-full"
                aria-label={`Show review ${index + 1} of ${reviews.length}`}
                aria-current={index === activeIndex ? "true" : undefined}
              >
                <span
                  className={`block size-2 rounded-full transition-colors duration-200 motion-reduce:transition-none ${
                    index === activeIndex ? "bg-[var(--accent)]" : "bg-[color-mix(in_srgb,var(--muted)_45%,transparent)]"
                  }`}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

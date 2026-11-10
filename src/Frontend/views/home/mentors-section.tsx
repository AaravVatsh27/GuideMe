/**
 * Landing page: explore mentors.
 * Shows up to three real, approved mentors when there are any; otherwise a row of topic pills,
 * so the section never shows empty cards or a zero count.
 */

import Link from "next/link";
import { ArrowRight, Briefcase, Compass, GraduationCap, Laptop, School, Star } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { type PublicMentorCard, type PublicPlatformSnapshot } from "@/Backend/server/public-data";
import { getHelpTopicLabel } from "@/shared/mentor-onboarding";

import { formatNumber, getMentorInitials } from "@/Frontend/views/home/home-helpers";

/**
 * Shown while no approved mentors exist. These topics don't match the stored mentor topic values
 * and Find a Mentor has no topic filter, so each pill links to the plain directory.
 */
const topicPills: { label: string; Icon: LucideIcon }[] = [
  { label: "Higher Studies", Icon: GraduationCap },
  { label: "Placements", Icon: Briefcase },
  { label: "Careers", Icon: Compass },
  { label: "Exam Prep", Icon: Laptop },
  { label: "College Life", Icon: School },
];

/**
 * Account names sometimes carry a class or roll code after the name (for example
 * "Aarav Vatsh AIML-6-2024-28"). The card shows only the name words, dropping any word with a digit.
 */
function getDisplayName(name: string) {
  const words = name.split(/\s+/).filter((word) => word && !/\d/.test(word));
  return words.length > 0 ? words.join(" ") : name;
}

function MentorCard({ mentor }: { mentor: PublicMentorCard }) {
  const name = getDisplayName(mentor.name);
  const tags = Array.from(
    new Set(
      [mentor.examLabels[0], mentor.topicLabels[0] ? getHelpTopicLabel(mentor.topicLabels[0]) : null].filter(
        (tag): tag is string => Boolean(tag),
      ),
    ),
  ).slice(0, 2);
  const hasRating = mentor.totalReviews > 0 && mentor.avgRating > 0;

  return (
    <article className="home-glass-card flex w-full flex-col p-6">
      <div className="flex items-center gap-4">
        <span
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--card)] text-sm font-bold text-[var(--accent)]"
          aria-hidden="true"
        >
          {getMentorInitials(name)}
        </span>

        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-[var(--text)]">
            {name}
          </h3>
          {mentor.college ? (
            <p className="mt-0.5 line-clamp-2 text-sm text-[var(--muted)]">{mentor.college}</p>
          ) : null}
        </div>
      </div>

      {/* Rating only from real reviews; nothing at all when there are none */}
      {hasRating ? (
        <p className="mt-4 flex items-center gap-1.5 text-sm text-[var(--text)]">
          <Star className="size-4 fill-[var(--accent)] text-[var(--accent)]" aria-hidden="true" />
          <span className="font-semibold">{mentor.avgRating.toFixed(1)}</span>
          <span className="text-[var(--muted)]">
            ({formatNumber(mentor.totalReviews)} {mentor.totalReviews === 1 ? "review" : "reviews"})
          </span>
        </p>
      ) : null}

      {tags.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-xs font-medium text-[var(--text)]"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <Link
        href={mentor.username ? `/mentor/${encodeURIComponent(mentor.username)}` : "/find-mentor"}
        className="group mt-auto inline-flex items-center gap-1.5 self-start pt-6 text-sm font-semibold text-[var(--accent)]"
        aria-label={`View ${name}'s profile`}
      >
        View profile
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
      </Link>
    </article>
  );
}

export function MentorsSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  // featuredMentors only contains approved (isVerified) and active mentors.
  const mentors = snapshot.featuredMentors.slice(0, 3);

  return (
    <section
      id="mentors"
      className="relative overflow-hidden bg-[var(--bg)] py-20 sm:py-24 lg:py-28"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="home-section-label text-xs font-semibold uppercase tracking-[0.2em]">
            Explore mentors
          </p>

          <h2 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-[-0.04em] text-[var(--text)] sm:text-4xl">
            Learn from{" "}
            <span className="text-[var(--accent)]">people who have been there</span>.
          </h2>

          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            Every live mentor brings recent, relevant experience to the
            decisions students are trying to make right now.
          </p>
        </div>

        {mentors.length > 0 ? (
          // Three per row on desktop; one or two cards stay centred instead of hugging the left.
          <div className="mt-12 flex flex-col gap-5 md:flex-row md:flex-wrap md:justify-center">
            {mentors.map((mentor) => (
              <div key={mentor.username ?? mentor.id} className="flex md:w-[calc((100%-2.5rem)/3)]">
                <MentorCard mentor={mentor} />
              </div>
            ))}
          </div>
        ) : (
          <ul className="mt-12 flex flex-wrap justify-center gap-3" aria-label="Mentor topics">
            {topicPills.map(({ label, Icon }) => (
              <li key={label}>
                <Link
                  href="/find-mentor"
                  className="home-glass-card inline-flex min-h-11 items-center gap-2.5 px-5 text-sm font-semibold text-[var(--text)] transition-transform duration-200 hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <Icon className="size-4 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href="/find-mentor"
            className="home-secondary-button group inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition duration-200 motion-reduce:transform-none motion-reduce:transition-none"
          >
            View all mentors
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none motion-reduce:transition-none" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

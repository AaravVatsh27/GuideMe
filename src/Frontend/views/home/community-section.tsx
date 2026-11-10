/** Landing page: community invite. */

import Link from "next/link";
import { ArrowRight, MessagesSquare, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { COMMUNITY_WHATSAPP_URL } from "@/shared/site-config";

/**
 * Community items, each shown only while the feature behind it really exists.
 * Events & Workshops and Resources & Tools are left out: there are no scheduled events
 * (the community page says so) and no resources section in the product yet.
 */
const communityItems: { label: string; Icon: LucideIcon; available: boolean }[] = [
  // 1:1 sessions with approved mentors.
  { label: "Mentorship & Guidance", Icon: Users, available: true },
  // Happens in the WhatsApp community, so it appears once the invite link is configured.
  { label: "Peer Discussions & Doubt Solving", Icon: MessagesSquare, available: COMMUNITY_WHATSAPP_URL !== null },
];

// Below 640px the items sit in a grid: one column for a single item, otherwise 2x2.
const gridColumns: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
};

export function HomeCommunitySection() {
  const items = communityItems.filter((item) => item.available);

  return (
    <section
      id="community"
      className="relative overflow-hidden bg-[var(--bg)] py-20 sm:py-24 lg:py-28"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="home-section-label text-xs font-semibold uppercase tracking-[0.2em]">
            Community
          </p>

          <h2 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-[-0.04em] text-[var(--text)] sm:text-4xl">
            A space to ask, share and learn together.
          </h2>

          <p className="mt-4 text-base leading-7 text-[var(--muted)]">
            Navigate the same big decisions — stream choices, competitive exams, college realities, and branch trade-offs. Connect with seniors reviewed before they go live who walked your exact road.
          </p>
        </div>

        {/* Compact row of icon items, no card; thin dividers between items from 640px up */}
        <ul
          className={`mx-auto mt-10 grid w-fit gap-x-6 gap-y-4 sm:flex sm:flex-wrap sm:justify-center sm:gap-0 ${
            gridColumns[Math.min(items.length, 2)]
          }`}
        >
          {items.map(({ label, Icon }) => (
            <li
              key={label}
              className="flex items-center gap-2.5 text-sm font-semibold text-[var(--text)] sm:border-l sm:border-[var(--border)] sm:px-6 sm:first:border-l-0"
            >
              <Icon className="size-5 shrink-0 text-[var(--accent)]" strokeWidth={1.5} aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
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
    </section>
  );
}

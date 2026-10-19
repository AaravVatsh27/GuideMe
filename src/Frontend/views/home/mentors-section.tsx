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
      className="relative overflow-hidden bg-[#FAF5FF] py-20 sm:py-24 lg:py-28"
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-[#EC4899]/[0.07] blur-[100px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#7C3AED]/[0.06] blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
              Meet your mentors
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] text-[#1E1B4B] sm:text-4xl">
              Real students. Real experience. Real guidance.
            </h2>

            <p className="mt-4 text-base leading-7 text-[#5B6475]">
              Every live mentor brings recent, relevant experience to the
              decisions students are trying to make right now.
            </p>
          </div>

          <Link
            href="/find-mentor"
            className="group inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-violet-200 bg-white/80 px-5 text-sm font-semibold text-[#7C3AED] shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white lg:self-auto"
          >
            See all mentors
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {snapshot.featuredMentors.length > 0 ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {snapshot.featuredMentors.slice(0, 8).map((mentor) => {
              const group = getMentorGroup(mentor);

              return (
                <article
                  key={mentor.username ?? mentor.name}
                  className="group flex flex-col rounded-[1.75rem] border border-violet-100 bg-white p-5 shadow-[0_12px_40px_-32px_rgba(30,27,75,0.30)] transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_24px_55px_-32px_rgba(124,58,237,0.32)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex size-12 items-center justify-center rounded-2xl text-sm font-bold ${
                        group === "school"
                          ? "bg-violet-50 text-[#7C3AED]"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {getMentorInitials(mentor.name)}
                    </div>

                    <div className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                      {mentor.availableThisWeek ? "Available" : "Profile live"}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-[0.13em] text-[#7C3AED]">
                      {mentor.college ?? "Mentra mentor"}
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight text-[#1E1B4B]">
                      {mentor.name}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {getMentorContext(mentor)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {[mentor.examLabels[0], mentor.topicLabels[0]]
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((label) => (
                          <span
                            key={label}
                            className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-medium text-[#6D28D9]"
                          >
                            {label}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-sm font-bold text-[#1E1B4B]">
                          {getMentorPrice(mentor)}
                          {mentor.priceMin && mentor.priceMin > 0 && (
                            <span className="ml-1 text-xs font-medium text-slate-400">
                              / session
                            </span>
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
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
                        className="inline-flex size-10 items-center justify-center rounded-full bg-[#1E1B4B] text-white transition duration-200 group-hover:bg-[#7C3AED]"
                        aria-label={`View ${mentor.name}'s profile`}
                      >
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-12 rounded-[1.75rem] border border-dashed border-violet-200 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
            <Users className="mx-auto size-8 text-[#7C3AED]" />

            <h3 className="mt-4 text-lg font-semibold text-[#1E1B4B]">
              Mentor profiles are opening now.
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Browse the mentor marketplace as profiles become available.
            </p>

            <Link
              href="/find-mentor"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#7C3AED] px-5 text-sm font-semibold text-white shadow-[0_10px_28px_-18px_rgba(124,58,237,0.65)] transition hover:-translate-y-0.5 hover:bg-[#6D28D9]"
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

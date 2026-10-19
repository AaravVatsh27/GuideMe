/** Landing page hero and the trust strip under it. */

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, HeartHandshake, ShieldCheck, Star } from "lucide-react";
import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";

import { formatNumber, getMentorContext, getMentorGroup, getMentorInitials, getMentorPrice, getMentorProof, getMentorTopic, getStartingPrice } from "@/Frontend/views/home/home-helpers";

export function HeroSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const previewMentors = snapshot.featuredMentors.slice(0, 3);
  const startingPrice = getStartingPrice(snapshot);

  const colleges = snapshot.mentorColleges;

  return (
    <section
      id="top"
      className="mentra-hero-depth relative overflow-hidden border-b border-violet-100/70 bg-[#FAF5FF]"
    >
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-[#7C3AED]/10 blur-[110px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-32 top-20 h-[32rem] w-[32rem] rounded-full bg-[#EC4899]/10 blur-[120px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[45%] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[#F97316]/[0.06] blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-18 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Hero copy */}
          <div className="max-w-3xl">
            <div className="mentra-clay-pill inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-[#6D28D9] backdrop-blur-xl">
              <span
                className="size-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899]"
                aria-hidden="true"
              />
              Your senior friend for every big decision
            </div>

            <h1 className="mt-7 max-w-4xl text-balance text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-[#1E1B4B] sm:text-6xl lg:text-[5.2rem]">
              Find your mantra.
              <span className="block">Find your</span>
              <span className="mt-1 block bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F97316] bg-clip-text text-transparent">
                mentor.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-[#4B5875] sm:text-lg sm:leading-8">
              One honest conversation can change everything. Talk to a
              college senior who has recently walked the same road and can
              help you choose with more clarity.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/find-mentor"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 text-sm font-semibold text-white shadow-[0_16px_36px_-18px_rgba(124,58,237,0.72)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#6D28D9]"
              >
                Find My Senior Friend
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/auth/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-violet-200 bg-white/75 px-6 text-sm font-semibold text-[#1E1B4B] shadow-sm backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white"
              >
                Create free account
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#667085]">
              <span className="font-semibold text-[#7C3AED]">
                {startingPrice} / session
              </span>
              <span aria-hidden="true">·</span>
              <span>Free {snapshot.introMinutes}-min intro</span>
              <span aria-hidden="true">·</span>
              <span>
                {formatNumber(snapshot.totalMentors)} verified mentors
              </span>
            </div>

            {/* Social proof from real data; hidden until there is something real to show */}
            {snapshot.totalPublicReviews > 0 || snapshot.totalStudents > 0 ? (
              <div className="mt-8 flex items-center gap-2.5 pt-1 sm:gap-3.5">
                {previewMentors.length > 0 ? (
                  <div className="flex shrink-0 -space-x-2 sm:-space-x-2.5" aria-hidden="true">
                    {previewMentors.map((mentor) => (
                      <span
                        key={mentor.id}
                        className="flex size-9 items-center justify-center rounded-full bg-[#EEF2FF] text-xs font-bold text-[#4F46E5] ring-2 ring-white sm:size-10"
                      >
                        {getMentorInitials(mentor.name)}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-left text-xs font-bold text-[#1E1B4B]">
                  {snapshot.totalPublicReviews > 0 ? (
                    <>
                      <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      <span className="font-extrabold">{snapshot.averageRating.toFixed(1)}/5</span>
                      <span className="font-medium text-slate-500">
                        from {formatNumber(snapshot.totalPublicReviews)}{" "}
                        {snapshot.totalPublicReviews === 1 ? "review" : "reviews"}
                      </span>
                    </>
                  ) : null}
                  {snapshot.totalPublicReviews > 0 && snapshot.totalStudents > 0 ? (
                    <span className="size-1 rounded-full bg-slate-300" aria-hidden="true" />
                  ) : null}
                  {snapshot.totalStudents > 0 ? (
                    <span className="font-bold text-[#7C3AED]">
                      {formatNumber(snapshot.totalStudents)}{" "}
                      {snapshot.totalStudents === 1 ? "student has" : "students have"} joined
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>

          {/* Mentor preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div
              className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-[#7C3AED]/12 via-[#EC4899]/10 to-[#F97316]/8 blur-2xl"
              aria-hidden="true"
            />

            <div className="mentra-clay-card relative rounded-[2rem] border bg-white/70 p-5 backdrop-blur-2xl transition-transform duration-500 hover:-translate-y-1 sm:p-6">
              {/* Live Session Photo Banner */}
              <div className="relative mb-5 overflow-hidden rounded-2xl border border-violet-100/90 shadow-xs group">
                <Image
                  src="/hero/senior-mentor-guidance.jpg"
                  alt="Live 1:1 senior mentorship session"
                  width={600}
                  height={338}
                  className="w-full object-cover aspect-[16/9] transition-transform duration-500 group-hover:scale-[1.03]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/85 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-white drop-shadow-sm">Live 1:1 Guidance Session</span>
                  </div>
                  <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10.5px] font-semibold backdrop-blur-md">
                    IIT & AIIMS Seniors
                  </span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7C3AED]">
                    Start with someone who has been there
                  </p>

                  <h2 className="mt-2 text-xl font-bold tracking-tight text-[#1E1B4B]">
                    Find a mentor who gets it.
                  </h2>
                </div>

                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-white/90 text-[#7C3AED] shadow-sm">
                  <HeartHandshake className="size-5" />
                </div>
              </div>

              {previewMentors.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {previewMentors.map((mentor) => {
                    const group = getMentorGroup(mentor);

                    return (
                      <Link
                        key={mentor.username ?? mentor.name}
                        href={
                          mentor.username
                            ? `/mentor/${encodeURIComponent(
                                mentor.username,
                              )}`
                            : "/find-mentor"
                        }
                        className="group flex items-center gap-3 rounded-2xl border border-slate-100/90 bg-white/85 p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-[0_12px_28px_-22px_rgba(124,58,237,0.45)]"
                      >
                        <div
                          className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            group === "school"
                              ? "bg-violet-100 text-[#7C3AED]"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {getMentorInitials(mentor.name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[#1E1B4B]">
                              {mentor.name}
                            </p>

                            {mentor.totalReviews > 0 && (
                              <ShieldCheck className="size-3.5 shrink-0 text-emerald-500" />
                            )}
                          </div>

                          <p className="truncate text-xs text-slate-500">
                            {getMentorContext(mentor)}
                          </p>

                          <p className="mt-1 text-xs font-medium text-[#7C3AED]">
                            {getMentorTopic(mentor)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-[#1E1B4B]">
                            {getMentorPrice(mentor)}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            {getMentorProof(mentor)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}

                  <Link
                    href="/find-mentor"
                    className="group flex min-h-11 items-center justify-between rounded-2xl border border-dashed border-violet-200 bg-white/55 px-4 text-sm font-semibold text-[#7C3AED] backdrop-blur transition hover:bg-violet-50/70"
                  >
                    Explore all mentors
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 p-6">
                  <p className="text-sm font-semibold text-[#1E1B4B]">
                    Mentor profiles are opening now.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Search the mentor network and see who is currently live.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* College marquee: real colleges of verified mentors, hidden when there are none */}
        {colleges.length > 0 ? (
        <div className="relative mt-14 overflow-hidden rounded-[1.75rem] border border-violet-100/80 bg-white/60 py-5 shadow-[0_12px_40px_-30px_rgba(30,27,75,0.25)] backdrop-blur-xl sm:mt-16">
          <div className="flex items-center gap-5 px-5 sm:px-6">
            <div className="z-10 shrink-0 border-r border-violet-100 pr-5 sm:pr-7">
              <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-[#7C3AED]">
                Mentors from
              </p>
            </div>

            <div className="relative min-w-0 flex-1 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white/80 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white/80 to-transparent" />

              <div
                className="mentra-college-marquee"
                aria-label={`Mentors from ${colleges.join(", ")}`}
              >
                <div className="mentra-college-marquee-track">
                  {[...colleges, ...colleges].map((college, index) => (
                    <span
                      key={`${college}-${index}`}
                      className="inline-flex shrink-0 items-center gap-4 whitespace-nowrap text-sm font-semibold text-slate-500"
                    >
                      {college}
                      <span
                        className="size-1 rounded-full bg-violet-200"
                        aria-hidden="true"
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        ) : null}
      </div>
    </section>
  );
}

export function TrustStrip({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  return (
    <section className="relative z-10 -mt-1 bg-[#FAF5FF] px-4 pb-2 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/75 shadow-[0_20px_60px_-40px_rgba(30,27,75,0.28)] backdrop-blur-xl">
          <div className="grid grid-cols-2 divide-x divide-violet-100 sm:grid-cols-4">
            <div className="px-4 py-6 sm:px-7 sm:py-7">
              <p className="text-2xl font-bold tracking-[-0.03em] text-[#7C3AED]">
                {formatNumber(snapshot.totalMentors)}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Verified mentors
              </p>
            </div>

            <div className="px-4 py-6 sm:px-7 sm:py-7">
              <p className="text-2xl font-bold tracking-[-0.03em] text-[#7C3AED]">
                {formatNumber(snapshot.totalStudents)}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Students onboarded
              </p>
            </div>

            <div className="border-t border-violet-100 px-4 py-6 sm:border-t-0 sm:px-7 sm:py-7">
              <p className="text-2xl font-bold tracking-[-0.03em] text-[#7C3AED]">
                {formatNumber(snapshot.completedSessions)}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Sessions completed
              </p>
            </div>

            <div className="border-t border-violet-100 px-4 py-6 sm:border-t-0 sm:px-7 sm:py-7">
              <p className="text-2xl font-bold tracking-[-0.03em] text-[#7C3AED]">
                {snapshot.introMinutes} min
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Free intro conversation
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

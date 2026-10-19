/** Landing page: what mentors can earn. */

import Link from "next/link";
import { ArrowRight, Check, GraduationCap } from "lucide-react";
import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";
import { formatPaise } from "@/shared/format";

import { getMentorIncomeEstimate } from "@/Frontend/views/home/home-helpers";
import { PLATFORM_CUT } from "@/shared/constants";

export function MentorIncomeSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const estimate = getMentorIncomeEstimate(snapshot);

  return (
    <section
      id="for-mentors"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
    >
      <div
        className="pointer-events-none absolute -left-28 top-20 h-80 w-80 rounded-full bg-[#7C3AED]/[0.06] blur-[100px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#EC4899]/[0.06] blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
              For mentors
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] text-[#1E1B4B] sm:text-4xl lg:text-5xl">
              Turn your experience into income.
            </h2>

            <p className="mt-5 text-base leading-7 text-[#5B6475]">
              You just figured something out that another student is about to
              face. Share the path that worked for you and build meaningful
              experience while doing it.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Help students make decisions with more context.",
                "Build proof of communication and leadership.",
                "Earn from sessions that fit your schedule.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[#7C3AED]">
                    <Check className="size-3.5" />
                  </span>

                  <p className="text-sm leading-6 text-[#4B5875]">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/auth/signup?role=MENTOR"
              className="group mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#1E1B4B] px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-20px_rgba(30,27,75,0.6)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#312E81]"
            >
              Apply to Become a Mentor
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-8 rounded-[2.75rem] bg-gradient-to-br from-[#7C3AED]/10 via-[#EC4899]/[0.06] to-[#F97316]/[0.04] blur-2xl"
              aria-hidden="true"
            />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/65 p-6 shadow-[0_30px_90px_-44px_rgba(30,27,75,0.35)] backdrop-blur-2xl sm:p-8">
              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-gradient-to-br from-violet-300/20 via-pink-200/10 to-orange-200/5 blur-3xl" />

              <div className="relative">
                <div className="flex items-start justify-between gap-5">
                  <div className="max-w-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7C3AED]">
                      Earnings snapshot
                    </p>

                    <h3 className="mt-2 text-xl font-bold tracking-tight text-[#1E1B4B] sm:text-2xl">
                      What consistent mentoring can look like
                    </h3>
                  </div>

                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-white/90 text-[#7C3AED] shadow-sm">
                    <GraduationCap className="size-5" />
                  </div>
                </div>

                <div className="mt-8 rounded-[1.5rem] border border-violet-100/80 bg-white/90 p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">
                    Example at 4 sessions / week
                  </p>

                  <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-4xl font-bold tracking-[-0.04em] text-[#1E1B4B] sm:text-5xl">
                      {formatPaise(estimate)}
                    </p>

                    <span className="text-sm font-medium text-slate-400">
                      / month
                    </span>
                  </div>

                  <p className="mt-4 max-w-lg text-sm leading-6 text-slate-500">
                    Estimate based on the current platform booking value and a{" "}
                    {Math.round((1 - PLATFORM_CUT) * 100)}% mentor share.
                  </p>

                  <div className="mt-7 rounded-2xl bg-violet-50/80 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Mentor share</span>
                      <span className="text-[#7C3AED]">80%</span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white shadow-inner">
                      <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F97316]" />
                    </div>

                    <div className="mt-3 flex justify-between text-[11px] text-slate-400">
                      <span>Platform</span>
                      <span>Mentor</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="size-3.5" />
                  </div>

                  <p className="text-xs leading-5 text-slate-500">
                    Actual earnings vary with session price, availability, and
                    bookings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

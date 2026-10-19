/** Landing page: community invite. */

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";

export function HomeCommunitySection() {
  return (
    <section
      id="community"
      className="relative overflow-hidden border-t border-violet-100/80 bg-[#FAF5FF] py-20 sm:py-24 lg:py-28"
    >
      <div
        className="pointer-events-none absolute -left-28 top-20 h-80 w-80 rounded-full bg-[#7C3AED]/[0.08] blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#EC4899]/[0.07] blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column: Copy & Stats */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#6D28D9] shadow-xs backdrop-blur-sm">
              <Users className="size-3.5 text-[#7C3AED]" />
              <span>Mentra Student Community</span>
            </div>

            <h2 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#1E1B4B] sm:text-4xl lg:text-5xl">
              You&apos;re not figuring this out{" "}
              <span className="bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F97316] bg-clip-text text-transparent">
                alone.
              </span>
            </h2>

            <p className="mt-5 text-base leading-7 text-[#4B5875] sm:text-lg">
              Join over 10,000 students navigating the same big decisions — stream choices, competitive exams, college realities, and branch trade-offs. Connect with verified seniors who walked your exact road.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl border border-violet-100 bg-white/80 p-4 shadow-xs">
              <div className="text-center">
                <p className="text-2xl font-black text-[#1E1B4B]">10K+</p>
                <p className="text-xs font-semibold text-[#7C3AED]">Students</p>
              </div>
              <div className="border-x border-violet-100 text-center">
                <p className="text-2xl font-black text-[#1E1B4B]">50+</p>
                <p className="text-xs font-semibold text-[#7C3AED]">Cities</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#1E1B4B]">8</p>
                <p className="text-xs font-semibold text-[#7C3AED]">Streams</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/community"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 text-sm font-semibold text-white shadow-[0_16px_36px_-18px_rgba(124,58,237,0.72)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#6D28D9]"
              >
                Join WhatsApp Community
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/community"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-violet-200 bg-white px-6 text-sm font-semibold text-[#1E1B4B] shadow-xs transition duration-200 hover:border-violet-300 hover:bg-violet-50/70"
              >
                Explore Community Hub
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Image Showcase */}
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#7C3AED]/12 via-[#EC4899]/10 to-[#F97316]/8 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative space-y-3 sm:space-y-4">
              {/* Main Photo: Campus Steps */}
              <div className="group relative overflow-hidden rounded-3xl border border-white/90 bg-white p-2.5 shadow-[0_24px_60px_-30px_rgba(30,27,75,0.22)] backdrop-blur-xl">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-violet-50">
                  <Image
                    src="/hero/community-hero.jpg"
                    alt="Indian university students collaborating on campus"
                    width={720}
                    height={450}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white">
                    <span className="font-semibold text-white drop-shadow-sm">
                      Campus Chapters Across India
                    </span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md">
                      IIT · DU · BITS · AIIMS
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Photo Grid: Lawn Circle & Senior Mentorship */}
              <div className="grid grid-cols-2 gap-3">
                <div className="group relative overflow-hidden rounded-2xl border border-white/90 bg-white p-2 shadow-xs">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-violet-50">
                    <Image
                      src="/hero/campus-lawn-circle.jpg"
                      alt="Student study circles"
                      width={360}
                      height={270}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/75 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2.5 right-2.5 text-[11px] font-bold text-white">
                      Local Meetups & Circles
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-white/90 bg-white p-2 shadow-xs">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-violet-50">
                    <Image
                      src="/hero/senior-junior-mentorship.jpg"
                      alt="1:1 senior mentorship in action"
                      width={360}
                      height={270}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/75 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2.5 right-2.5 text-[11px] font-bold text-white">
                      1:1 Senior Advice
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

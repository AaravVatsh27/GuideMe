/** Landing page: closing call to action. */

import Image from "next/image";
import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";

export function FinalCtaSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  return (
    <section id="cta" className="relative overflow-hidden bg-[#1E1B4B] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      {/* Background image stays untinted; the foreground card preserves text contrast. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/brand/cta-campus-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-90 blur-[1px] scale-105"
          priority={false}
        />
      </div>

      <div
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#7C3AED]/25 blur-[100px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#EC4899]/20 blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#1E1B4B]/45 px-6 py-12 text-center shadow-[0_30px_90px_-50px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:px-10 sm:py-14">
          <div
            className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#EC4899]/50 to-transparent"
            aria-hidden="true"
          />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
              Your senior friend · your guide
            </p>

            <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
              Find the person who can make your next decision clearer.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-violet-100/70 sm:text-base">
              Start with a free {snapshot.introMinutes}-minute conversation
              and see whether the mentor feels right for you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

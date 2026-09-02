"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { MentraLogo } from "@/components/brand/MentraLogo";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FAF5FF] text-[#1E1B4B]">
      {/* Ambient brand atmosphere */}
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[#7C3AED]/[0.07] blur-[110px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-40 bottom-[-8rem] h-[32rem] w-[32rem] rounded-full bg-[#EC4899]/[0.06] blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative min-h-[100svh] px-4 py-5 pb-16 sm:px-6 sm:py-8 sm:pb-16 lg:px-8 lg:pb-20">
        {/* Top brand bar */}
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <Link
            href="/"
            aria-label="Mentra home"
            className="inline-flex w-[120px] items-center sm:w-[135px]"
          >
            <MentraLogo
              variant="color"
              size="sm"
              className="w-full"
            />
          </Link>

          <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
            <span>New to Mentra?</span>

            <Link
              href="/auth/signup"
              className="font-semibold text-[#7C3AED] transition-colors hover:text-[#6D28D9]"
            >
              Create an account
            </Link>
          </div>
        </div>

        {/* Main split layout */}
        <div className="mx-auto flex w-full max-w-6xl items-start py-12 lg:py-20">
          <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/45 shadow-[0_35px_100px_-50px_rgba(30,27,75,0.32)] backdrop-blur-2xl lg:grid-cols-[0.9fr_1.1fr]">

            {/* Brand/editorial side */}
            <div className="relative hidden overflow-hidden border-r border-violet-100/70 bg-gradient-to-br from-[#F5F0FF]/90 via-white/45 to-[#FFF4F8]/80 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
              <div
                className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-[#7C3AED]/10 blur-[100px]"
                aria-hidden="true"
              />

              <div
                className="pointer-events-none absolute -right-24 top-[-5rem] h-72 w-72 rounded-full bg-[#EC4899]/10 blur-[100px]"
                aria-hidden="true"
              />

              <div className="relative">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-white/75 shadow-sm ring-1 ring-violet-100/80 backdrop-blur">
                  <MentraLogo
                    variant="color"
                    size="sm"
                    showTagline={false}
                    className="w-11"
                  />
                </div>

                <p className="mt-10 max-w-md text-sm font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
                  Your senior friend · your guide
                </p>

                <h2 className="mt-5 max-w-lg text-[2.65rem] font-bold leading-[1.05] tracking-[-0.045em] text-[#1E1B4B] xl:text-[2.85rem]">
                  Guidance starts with the right person.
                </h2>

                <p className="mt-6 max-w-md text-base leading-7 text-[#5B6475]">
                  Talk to someone who has already walked the road you are
                  trying to navigate.
                </p>
              </div>

              <div className="relative mt-10 space-y-4">
                {[
                  "Real student experience",
                  "Practical, mentor-led guidance",
                  "Clarity before a big decision",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 text-sm font-medium text-[#4B5875]"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[#7C3AED] shadow-sm ring-1 ring-violet-100">
                      <span className="size-1.5 rounded-full bg-[#7C3AED]" />
                    </span>

                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Authentication side */}
            <div className="flex items-center justify-center bg-white/72 p-6 backdrop-blur-xl sm:p-8 lg:p-12">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-full max-w-[27rem]"
              >
                {children}
              </motion.div>
            </div>
          </div>
        </div>

        <p className="mx-auto max-w-xl text-center text-xs leading-5 text-slate-400">
          Your senior friend · your guide
        </p>
      </div>
    </main>
  );
}
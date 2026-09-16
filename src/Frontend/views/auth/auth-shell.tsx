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
    <main className="relative min-h-dvh overflow-hidden bg-[#F6F8FC] text-[#172033]">
      <div
        className="pointer-events-none absolute -left-40 -top-40 h-[30rem] w-[30rem] rounded-full bg-[#4F46E5]/[0.08] blur-[110px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-40 bottom-[-8rem] h-[32rem] w-[32rem] rounded-full bg-[#0EA5E9]/[0.06] blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative min-h-dvh px-4 py-5 pb-12 sm:px-6 sm:py-7 sm:pb-14 lg:px-8 lg:pb-16">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between border-b border-slate-200/70 pb-5 sm:pb-6">
          <Link
            href="/"
            aria-label="Mentra home"
            className="inline-flex min-h-11 items-center rounded-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2"
          >
            <MentraLogo
              variant="color"
              layout="horizontal"
              size="sm"
            />
          </Link>

          <div className="hidden items-center gap-2 text-sm text-slate-600 sm:flex">
            <span>New to Mentra?</span>

            <Link
              href="/auth/signup"
              className="rounded-md font-semibold text-[#4F46E5] underline-offset-4 transition-colors hover:text-[#3730A3] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2"
            >
              Create an account
            </Link>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-6xl items-start py-8 sm:py-12 lg:py-16">
          <div className="grid w-full overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/70 shadow-[0_28px_80px_-46px_rgba(15,23,42,0.38)] backdrop-blur-2xl lg:grid-cols-[0.9fr_1.1fr]">

            <div className="relative hidden overflow-hidden border-r border-slate-200/80 bg-gradient-to-br from-[#EEF2FF]/90 via-white/60 to-[#F0F9FF]/85 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
              <div
                className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-[#4F46E5]/10 blur-[100px]"
                aria-hidden="true"
              />

              <div
                className="pointer-events-none absolute -right-24 top-[-5rem] h-72 w-72 rounded-full bg-[#0EA5E9]/10 blur-[100px]"
                aria-hidden="true"
              />

              <div className="relative">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-white/85 shadow-sm ring-1 ring-slate-200/80 backdrop-blur">
                  <MentraLogo
                    variant="color"
                    layout="icon"
                    size="sm"
                  />
                </div>

                <p className="mt-10 max-w-md text-sm font-semibold uppercase tracking-[0.2em] text-[#4F46E5]">
                  Your senior friend · your guide
                </p>

                <h2 className="mt-5 max-w-lg text-[2.65rem] font-bold leading-[1.05] tracking-[-0.045em] text-[#172033] xl:text-[2.85rem]">
                  Guidance starts with the right person.
                </h2>

                <p className="mt-6 max-w-md text-base leading-7 text-slate-600">
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
                    className="flex items-center gap-3 text-sm font-medium text-slate-700"
                  >
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[#4F46E5] shadow-sm ring-1 ring-slate-200">
                      <span className="size-1.5 rounded-full bg-[#4F46E5]" />
                    </span>

                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center bg-white/80 p-6 backdrop-blur-xl sm:p-9 lg:p-12">
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

        <p className="mx-auto max-w-xl text-center text-xs leading-5 text-slate-500">
          Your senior friend · your guide
        </p>
      </div>
    </main>
  );
}
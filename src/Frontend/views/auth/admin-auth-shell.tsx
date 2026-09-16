"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import { MentraLogo } from "@/components/brand/MentraLogo";

type AdminAuthShellProps = {
  children: ReactNode;
};

export function AdminAuthShell({ children }: AdminAuthShellProps) {
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
        {/* Top brand bar — logo only, no student copy */}
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

          {/* intentionally blank — no nav needed for internal page */}
          <div className="hidden sm:block" style={{ width: 135 }} />
        </div>

        {/* Main split layout */}
        <div className="mx-auto flex w-full max-w-6xl items-start py-12 lg:py-20">
          <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/45 shadow-[0_35px_100px_-50px_rgba(30,27,75,0.32)] backdrop-blur-2xl lg:grid-cols-[2fr_3fr]">

            {/* Internal-staff informational side */}
            <div
              className="relative hidden overflow-hidden border-r border-violet-100/70 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14"
              style={{
                background:
                  "radial-gradient(circle at top left, rgba(124,58,237,0.08), transparent 40%), radial-gradient(circle at bottom right, rgba(236,72,153,0.06), transparent 40%), linear-gradient(135deg, #ffffff 0%, #FAF5FF 60%, #FDF2F8 100%)",
              }}
            >
              {/* Ambient glow accents */}
              <div
                className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-[#7C3AED]/10 blur-[100px]"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -right-24 top-[-5rem] h-72 w-72 rounded-full bg-[#EC4899]/10 blur-[100px]"
                aria-hidden="true"
              />

              <div className="relative">
                {/* Logo — sits directly on gradient, no white card */}
                <MentraLogo
                  variant="color"
                  size="sm"
                  showTagline={false}
                  className="w-11"
                />

                {/* Internal messaging */}
                <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7C3AED]">
                  Internal access
                </p>

                <h2 className="mt-4 text-2xl font-bold tracking-[-0.03em] text-[#1E1B4B] xl:text-[1.85rem]">
                  Mentra Admin
                </h2>

                <p className="mt-4 max-w-xs text-sm leading-6 text-slate-500">
                  Restricted to authorized Mentra team members.
                </p>
              </div>

              {/* Spacer so the lower section breathes */}
              <div className="relative mt-10" />
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
      </div>
    </main>
  );
}

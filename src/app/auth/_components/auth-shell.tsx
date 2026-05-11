"use client";

import type { ReactNode } from "react";
import { Compass, Quote, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

type AuthShellProps = {
  children: ReactNode;
  stats: Array<{
    value: string;
    label: string;
  }>;
  summaryCards: Array<{
    label: string;
    value: string;
    copy: string;
  }>;
  spotlight: {
    quote: string;
    attribution: string;
  };
};

const panelMotion = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
};

export function AuthShell({
  children,
  stats,
  summaryCards,
  spotlight,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.12),_transparent_32%),linear-gradient(135deg,_#f8fafc_0%,_#eef4ff_48%,_#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/80 shadow-[0_32px_120px_-48px_rgba(15,23,42,0.45)] backdrop-blur xl:grid-cols-[1.04fr_minmax(420px,520px)]">
        <motion.section
          {...panelMotion}
          className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.2),_transparent_30%),linear-gradient(165deg,_#06101f_0%,_#0f172a_55%,_#15264b_100%)] px-6 py-8 text-slate-50 sm:px-8 sm:py-10 lg:px-12 lg:py-12"
        >
          <div className="absolute inset-0">
            <div className="absolute -left-16 top-14 size-40 rounded-full bg-teal-400/10 blur-3xl" />
            <div className="absolute bottom-10 right-[-4rem] size-52 rounded-full bg-cyan-300/10 blur-3xl" />
            <div className="absolute inset-x-10 top-28 h-px bg-white/10" />
          </div>

          <div className="relative flex h-full flex-col justify-between gap-10">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-slate-100 backdrop-blur">
                <span className="flex size-9 items-center justify-center rounded-full bg-teal-400/16 text-teal-200">
                  <Compass className="size-4.5" />
                </span>
                GuideMe Access
              </div>

              <div className="max-w-xl space-y-4">
                <p className="text-sm font-medium uppercase tracking-[0.28em] text-teal-200/90">
                  Live platform snapshot
                </p>
                <h1 className="font-display text-4xl leading-[0.95] font-bold text-white sm:text-5xl lg:text-6xl">
                  Sign in to the current mentor network, not a static mockup.
                </h1>
                <p className="max-w-lg text-base leading-7 text-slate-300 sm:text-lg">
                  The numbers on this panel now come from the same data source that powers mentor
                  discovery, public reviews, and session activity across GuideMe.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {stats.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 + index * 0.08, duration: 0.45 }}
                    className="rounded-2xl border border-white/12 bg-white/8 p-4 backdrop-blur"
                  >
                    <div className="text-2xl font-semibold text-white sm:text-3xl">{stat.value}</div>
                    <div className="mt-2 text-sm text-slate-300">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[1.75rem] border border-white/12 bg-white/8 p-5 backdrop-blur">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-teal-100">
                  <Quote className="size-3.5" />
                  Recent proof
                </div>
                <p className="text-base leading-7 text-slate-100">
                  “{spotlight.quote}”
                </p>
                <p className="mt-4 text-sm font-medium text-teal-100">{spotlight.attribution}</p>
              </div>

              <div className="grid gap-3">
                {summaryCards.map((card, index) => (
                  <div key={card.label} className="rounded-2xl border border-white/12 bg-slate-950/30 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-100">
                      {index === 0 ? (
                        <TrendingUp className="size-4 text-teal-200" />
                      ) : index === 1 ? (
                        <Sparkles className="size-4 text-amber-300" />
                      ) : (
                        <Compass className="size-4 text-cyan-200" />
                      )}
                      {card.label}
                    </div>
                    <p className="text-lg font-semibold text-white">{card.value}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{card.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          {...panelMotion}
          transition={{ ...panelMotion.transition, delay: 0.08 }}
          className="flex items-center justify-center px-4 py-8 sm:px-8 sm:py-10 lg:px-12"
        >
          <div className="w-full max-w-md">{children}</div>
        </motion.section>
      </div>
    </main>
  );
}

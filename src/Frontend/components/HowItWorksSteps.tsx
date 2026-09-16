"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight, Check, Clock, Compass, Flame, Users } from "lucide-react";

import { cn } from "@/Backend/server/utils";

type Step = {
  number: string;
  title: string;
  copy: string;
  solution?: string;
};

const STEP_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "01": Compass,
  "02": Flame,
  "03": Users,
  "04": Clock,
};

const STEP_ACCENTS: Record<string, { bg: string; text: string; ring: string }> = {
  "01": {
    bg: "bg-violet-50 group-hover:bg-[#7C3AED]",
    text: "text-[#7C3AED] group-hover:text-white",
    ring: "ring-violet-200/60",
  },
  "02": {
    bg: "bg-rose-50 group-hover:bg-rose-600",
    text: "text-rose-600 group-hover:text-white",
    ring: "ring-rose-200/60",
  },
  "03": {
    bg: "bg-indigo-50 group-hover:bg-indigo-600",
    text: "text-indigo-600 group-hover:text-white",
    ring: "ring-indigo-200/60",
  },
  "04": {
    bg: "bg-amber-50 group-hover:bg-amber-600",
    text: "text-amber-600 group-hover:text-white",
    ring: "ring-amber-200/60",
  },
};

const DEFAULT_SOLUTIONS: Record<string, string> = {
  "01": "50+ real paths mapped by seniors",
  "02": "Zero-pressure, honest 1-on-1 talks",
  "03": "Verified seniors on demand in minutes",
  "04": "Proactive guidance before deadlines",
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 24,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

export function HowItWorksSteps({ items }: { items: Step[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={containerVariants}
      initial={reduceMotion ? undefined : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.15 }}
      className="grid gap-4 sm:gap-5 sm:grid-cols-2"
    >
      {items.map((item) => {
        const Icon = STEP_ICONS[item.number] ?? Compass;
        const accent = STEP_ACCENTS[item.number] ?? STEP_ACCENTS["01"];
        const solutionText =
          item.solution || DEFAULT_SOLUTIONS[item.number] || "Mentra brings verified clarity";

        return (
          <motion.article
            key={item.number}
            variants={cardVariants}
            whileHover={
              reduceMotion
                ? undefined
                : {
                    y: -6,
                    scale: 1.012,
                    transition: { type: "spring", stiffness: 350, damping: 25 },
                  }
            }
            whileTap={reduceMotion ? undefined : { scale: 0.99 }}
            className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-violet-100/90 bg-white p-6 sm:p-7 shadow-[0_10px_30px_-20px_rgba(30,27,75,0.06)] transition-all duration-300 hover:border-violet-200 hover:shadow-[0_24px_50px_-20px_rgba(124,58,237,0.14)]"
          >
            {/* Top ambient highlight rim */}
            <div className="pointer-events-none absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#7C3AED]/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            {/* Subtle glowing corner orb */}
            <div className="pointer-events-none absolute -right-12 -top-12 size-28 rounded-full bg-[#7C3AED]/[0.05] blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100" />

            <div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-2xl sm:text-3xl font-black tracking-tight text-violet-200 transition-colors duration-300 group-hover:text-[#7C3AED]">
                  {item.number}
                </span>

                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-2xl ring-1 transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]",
                    accent.bg,
                    accent.text,
                    accent.ring
                  )}
                >
                  <Icon className="size-4.5" />
                </div>
              </div>

              <h3 className="mt-5 text-lg font-bold tracking-tight text-[#1E1B4B] transition-colors duration-200 group-hover:text-[#7C3AED]">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.copy}</p>
            </div>

            {/* Bottom Solution Strip */}
            <div className="mt-6 flex items-center justify-between border-t border-violet-50/80 pt-4">
              <div className="flex items-center gap-2">
                <span className="flex size-4.5 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors duration-300 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                  <Check className="size-2.5 stroke-[3]" />
                </span>
                <span className="text-xs font-semibold text-slate-500 transition-colors duration-300 group-hover:text-slate-800">
                  {solutionText}
                </span>
              </div>
              <ArrowRight className="size-4 shrink-0 text-slate-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#7C3AED]" />
            </div>
          </motion.article>
        );
      })}
    </motion.div>
  );
}

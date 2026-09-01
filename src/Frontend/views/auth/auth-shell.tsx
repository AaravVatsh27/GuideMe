"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";

type AuthShellProps = {
  children: ReactNode;
};

export function AuthShell({
  children,
}: AuthShellProps) {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-background">
      {/* Very subtle brand atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-[-18rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[linear-gradient(135deg,var(--brand-indigo-600),var(--brand-purple-500),var(--brand-pink-500))] opacity-[0.045] blur-[110px]" />

        <div className="absolute bottom-[-14rem] right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[linear-gradient(135deg,var(--brand-purple-500),var(--brand-pink-500))] opacity-[0.025] blur-[100px]" />
      </div>

      <div className="relative flex min-h-[100svh] items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="w-full max-w-[28rem]"
        >
          {/* Brand */}
          <div className="mb-8 flex flex-col items-center text-center sm:mb-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: 0.05,
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mentra-gradient flex size-12 items-center justify-center rounded-[1rem] shadow-[0_12px_30px_-18px_rgba(79,70,229,0.55)] sm:size-14"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 32 32"
                fill="none"
                className="size-6 text-white sm:size-7"
              >
                <path
                  d="M16 2L22 8v16l-6 6-6-6V8L16 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 8v16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M10 14h12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-4 text-[2rem] font-semibold tracking-[-0.035em] text-foreground sm:text-[2.25rem]"
            >
              Mentra
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.15,
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground sm:text-[0.95rem]"
            >
              Guidance starts with the right person.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.18,
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {children}
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
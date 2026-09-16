"use client";

import "@/Frontend/styles/globals.css";

import * as React from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, Home, Mail, RotateCcw } from "lucide-react";

import { MentraLogo } from "@/components/brand/MentraLogo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [eventId, setEventId] = React.useState<string>();

  React.useEffect(() => {
    setEventId(Sentry.captureException(error));
  }, [error]);

  return (
    <html lang="en" className="scroll-smooth">
      <body className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF5FF] px-4 py-12 text-[#1E1B4B] antialiased sm:px-6">
        {/* Background ambient lighting */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7C3AED]/[0.08] blur-[140px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute right-10 bottom-10 h-[350px] w-[350px] rounded-full bg-[#EC4899]/[0.06] blur-[120px]"
          aria-hidden="true"
        />

        <main className="relative w-full max-w-xl rounded-[2.25rem] border border-violet-200/80 bg-white/95 p-8 text-center shadow-[0_24px_60px_-20px_rgba(124,58,237,0.14)] backdrop-blur-2xl sm:p-10">
          <div className="flex justify-center">
            <MentraLogo variant="color" layout="horizontal" showTagline={true} size="md" />
          </div>

          <div className="mx-auto mt-7 flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/60 shadow-xs">
            <AlertTriangle className="size-7" />
          </div>

          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-rose-200/70 bg-rose-50 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-rose-700">
            <span>Critical System Error</span>
          </div>

          <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
            Unable to initialize application shell
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-[#5B6475] sm:text-base">
            The core interface encountered an unexpected crash during render. Try reloading the application, or contact our support team with the event ID below.
          </p>

          {eventId && (
            <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-2.5 font-mono text-xs text-slate-600">
              <span className="font-semibold text-[#7C3AED]">Event ID:</span>
              <span className="select-all">{eventId}</span>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => reset()}
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 text-sm font-semibold text-white shadow-[0_10px_22px_-8px_rgba(124,58,237,0.65)] transition-all hover:bg-[#6D28D9] hover:shadow-[0_14px_26px_-8px_rgba(124,58,237,0.75)] hover:-translate-y-0.5 active:translate-y-0"
            >
              <RotateCcw className="size-4" />
              <span>Reload Application</span>
            </button>

            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-violet-200 bg-white px-6 text-sm font-semibold text-[#1E1B4B] shadow-xs transition hover:border-violet-300 hover:bg-violet-50 hover:text-[#7C3AED]"
            >
              <Home className="size-4" />
              <span>Back to Home</span>
            </Link>
          </div>

          <p className="mt-7 text-xs text-slate-500">
            Need direct help?{" "}
            <Link
              href={`mailto:support@mentra.in?subject=Mentra%20Global%20Error&body=Event%20ID:%20${eventId ?? "unknown"}`}
              className="inline-flex items-center gap-1 font-semibold text-[#7C3AED] hover:underline"
            >
              <Mail className="size-3" />
              support@mentra.in
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}

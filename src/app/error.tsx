"use client";

import * as React from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertCircle, Home, Mail, RotateCcw } from "lucide-react";

import { MentraLogo } from "@/components/brand/MentraLogo";

export default function Error({
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#FAF5FF] px-4 py-12 text-[#1E1B4B] sm:px-6">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7C3AED]/[0.08] blur-[130px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-10 bottom-10 h-[350px] w-[350px] rounded-full bg-[#EC4899]/[0.06] blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-xl rounded-[2.25rem] border border-violet-200/80 bg-white/95 p-8 text-center shadow-[0_24px_60px_-20px_rgba(124,58,237,0.14)] backdrop-blur-2xl sm:p-10">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <MentraLogo variant="color" layout="horizontal" showTagline={true} size="md" />
        </div>

        {/* Warning Icon Badge */}
        <div className="mx-auto mt-7 flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-[#7C3AED] ring-8 ring-violet-50/60 shadow-xs">
          <AlertCircle className="size-7 text-[#7C3AED]" />
        </div>

        <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-violet-200/70 bg-violet-100/70 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
          <span>System Notice · Error 500</span>
        </div>

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
          Something went unexpectedly wrong
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-[#5B6475] sm:text-base">
          We encountered an unexpected error while loading this page. Our team has received the automated diagnostic report and is looking into it.
        </p>

        {eventId && (
          <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-violet-100 bg-violet-50/60 px-4 py-2.5 font-mono text-xs text-slate-600">
            <span className="font-semibold text-[#7C3AED]">Event ID:</span>
            <span className="select-all">{eventId}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 text-sm font-semibold text-white shadow-[0_10px_22px_-8px_rgba(124,58,237,0.65)] transition-all hover:bg-[#6D28D9] hover:shadow-[0_14px_26px_-8px_rgba(124,58,237,0.75)] hover:-translate-y-0.5 active:translate-y-0"
          >
            <RotateCcw className="size-4" />
            <span>Try again</span>
          </button>

          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-violet-200 bg-white px-6 text-sm font-semibold text-[#1E1B4B] shadow-xs transition hover:border-violet-300 hover:bg-violet-50 hover:text-[#7C3AED]"
          >
            <Home className="size-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Footer Support Info */}
        <p className="mt-7 text-xs text-slate-500">
          Need immediate help?{" "}
          <Link
            href={`mailto:support@mentra.in?subject=Mentra%20Error%20Report&body=Event%20ID:%20${eventId ?? "unknown"}`}
            className="inline-flex items-center gap-1 font-semibold text-[#7C3AED] hover:underline"
          >
            <Mail className="size-3" />
            support@mentra.in
          </Link>
        </p>
      </div>
    </div>
  );
}

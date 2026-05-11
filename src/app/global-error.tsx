"use client";

import "./globals.css";

import * as React from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

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
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-white antialiased">
        <main className="flex min-h-screen items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur">
            <div className="inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
              GuideMe
            </div>
            <h1 className="mt-5 text-3xl font-black tracking-tight">
              We hit a platform-level error
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              The app shell could not recover cleanly. Retry once. If it fails again, report the
              issue with the event ID below.
            </p>
            {eventId ? (
              <p className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-xs text-slate-300">
                Event ID: {eventId}
              </p>
            ) : null}
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
                onClick={reset}
                type="button"
              >
                Try again
              </button>
              <Link
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
                href={`mailto:support@guideme.app?subject=GuideMe%20global%20error&body=Event%20ID:%20${eventId ?? "pending"}`}
              >
                Report issue
              </Link>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}

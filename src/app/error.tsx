"use client";

import * as React from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

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
    <div className="flex min-h-[70vh] items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.14),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#e2e8f0_100%)] px-6 py-16">
      <div className="w-full max-w-2xl rounded-[2rem] border border-slate-200 bg-white/90 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur">
        <div className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
          GuideMe
        </div>
        <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950">
          Something went wrong
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
          We could not finish loading this page. Try again first. If the problem keeps repeating,
          send us the error report so we can trace it quickly.
        </p>
        {eventId ? (
          <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs text-slate-600">
            Event ID: {eventId}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap gap-3">
          <button
            className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            onClick={reset}
            type="button"
          >
            Try again
          </button>
          <Link
            className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            href={`mailto:support@guideme.app?subject=GuideMe%20error%20report&body=Event%20ID:%20${eventId ?? "pending"}`}
          >
            Report issue
          </Link>
        </div>
      </div>
    </div>
  );
}

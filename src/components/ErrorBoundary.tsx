"use client";

import * as React from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  eventId?: string;
  hasError: boolean;
};

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = {
    hasError: false,
  };

  public static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const eventId = Sentry.withScope((scope) => {
      scope.setContext("react", {
        componentStack: errorInfo.componentStack,
      });

      return Sentry.captureException(error);
    });

    this.setState({ eventId, hasError: true });
  }

  private handleRetry = () => {
    this.setState({ eventId: undefined, hasError: false });
  };

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-16 text-white">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur">
          <div className="mb-6 inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200">
            GuideMe
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Something went wrong.
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            The page hit an unexpected error. Retry the view, or report the issue if it keeps
            happening.
          </p>
          {this.state.eventId ? (
            <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 font-mono text-xs text-slate-300">
              Event ID: {this.state.eventId}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
              onClick={this.handleRetry}
              type="button"
            >
              Retry
            </button>
            <Link
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
              href="mailto:support@guideme.app?subject=GuideMe%20error%20report"
            >
              Report issue
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

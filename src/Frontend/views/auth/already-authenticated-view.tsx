"use client";

import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";


type AlreadyAuthenticatedViewProps = {
  continueHref: string;
  callbackUrl: string;
  role: "STUDENT" | "MENTOR" | "ADMIN";
  onboardingComplete: boolean;
  mode: "signin" | "signup";
};

function toRoute(path: string) {
  return path as Route;
}

function getModeCopy(mode: "signin" | "signup") {
  if (mode === "signup") {
    return {
      eyebrow: "Mentra sign up",
      title: "You are already signed in.",
      description:
        "This browser already has an active Mentra session. Continue with this account or sign out to create another one.",
      alternateLabel: "Sign out & create account",
      authPath: "/auth/signup",
    };
  }

  return {
    eyebrow: "Mentra sign in",
    title: "You're already signed in",
    description:
      "This browser already has an active Mentra session. Continue with this account or sign out to use another one.",
    alternateLabel: "Sign out and use another account",
    authPath: "/auth/signin",
  };
}

export function AlreadyAuthenticatedView({
  continueHref,
  callbackUrl,
  role,
  onboardingComplete,
  mode,
}: AlreadyAuthenticatedViewProps) {
  const copy = getModeCopy(mode);

  async function handleSignOut() {
    await signOut({
      redirectTo: `${copy.authPath}?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    });
  }

  return (
    <div className="bg-white text-[#0F172A]">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#4F46E5]">
          {copy.eyebrow}
        </p>

        <h1 className="text-balance text-[36px] font-bold leading-tight tracking-[-0.03em] text-[#0F172A]">
          {copy.title}
        </h1>

        <p className="max-w-sm text-balance text-sm leading-6 text-[#64748B]">
          {copy.description}
        </p>
      </div>

      <div className="mt-6">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
          Current session
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-[#EEF2FF] px-2.5 py-1 text-xs font-medium text-[#4F46E5]">
            {role.toLowerCase()}
          </span>
          <span className="inline-flex items-center rounded-full bg-[#DCFCE7] px-2.5 py-1 text-xs font-medium text-[#166534]">
            {onboardingComplete ? "onboarding complete" : "onboarding pending"}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href={toRoute(continueHref)}
          className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[12px] bg-[#4F46E5] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          Continue with this account
          <ArrowRight className="size-4 shrink-0" aria-hidden="true" />
        </Link>

        <button
          type="button"
          onClick={handleSignOut}
          className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-[12px] border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#334155] transition-colors hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
        >
          <LogOut className="size-4 shrink-0" aria-hidden="true" />
          {copy.alternateLabel}
        </button>
      </div>

      <p className="mt-6 text-center text-[12px] text-[#64748B]">
        You stay signed in on this browser until you sign out or clear cookies.
      </p>
    </div>
  );
}

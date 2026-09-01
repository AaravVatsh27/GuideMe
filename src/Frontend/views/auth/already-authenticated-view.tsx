"use client";

import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/Frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Frontend/components/ui/card";

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
    title: "You are already signed in.",
    description:
      "This browser already has an active Mentra session. Continue with this account or sign out to use another one.",
    alternateLabel: "Sign out & use another",
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
    <Card className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]">
      <CardHeader className="px-6 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            {copy.eyebrow}
          </p>

          <CardTitle className="text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[2rem]">
            {copy.title}
          </CardTitle>

          <CardDescription className="max-w-sm text-sm leading-6 text-muted-foreground">
            {copy.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 px-6 pb-6 sm:px-8 sm:pb-8">
        <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Current session
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground">
              {role.toLowerCase()}
            </span>
            <span className="inline-flex items-center rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
              {onboardingComplete ? "onboarding complete" : "onboarding pending"}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 w-full min-w-0 flex-1 rounded-xl bg-primary px-3 text-xs font-semibold shadow-[0_12px_28px_-18px_rgba(79,70,229,0.65)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-primary/90 hover:shadow-[0_16px_32px_-18px_rgba(79,70,229,0.7)] active:scale-[0.99] sm:text-sm"
          >
            <Link href={toRoute(continueHref)} className="inline-flex min-w-0 items-center justify-center gap-1.5">
              <span className="whitespace-normal leading-tight text-center">Continue with this account</span>
              <ArrowRight className="size-4 shrink-0" />
            </Link>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={handleSignOut}
            className="h-12 w-full min-w-0 flex-1 rounded-xl border-border bg-background px-3 text-xs font-semibold text-foreground transition-[background-color,border-color,transform] duration-200 hover:bg-muted/60 hover:border-primary/20 active:scale-[0.99] sm:text-sm"
          >
            <LogOut className="mr-1.5 size-4 shrink-0" />
            <span className="whitespace-normal leading-tight text-center">{copy.alternateLabel}</span>
          </Button>
        </div>
      </CardContent>

      <CardFooter className="justify-center border-t border-border/70 bg-muted/20 px-6 py-4 text-center text-xs text-muted-foreground sm:px-8">
        Active sessions persist on <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">localhost</code> until you sign out or clear cookies.
      </CardFooter>
    </Card>
  );
}

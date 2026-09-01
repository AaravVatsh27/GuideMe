"use client";

import type { FormEvent } from "react";
import type { Route } from "next";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { z } from "zod";

import { GoogleIcon } from "@/Frontend/views/auth/google-icon";
import { Button } from "@/Frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Frontend/components/ui/card";
import { Input } from "@/Frontend/components/ui/input";
import { getAuthErrorCopy } from "@/Backend/server/auth-flow";

type SignInViewProps = {
  callbackUrl: string;
  errorCode?: string;
  emailEnabled: boolean;
};

const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address");

export function SignInView({
  callbackUrl,
  errorCode,
  emailEnabled,
}: SignInViewProps) {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] =
    useState<string | null>(null);
  const [formError, setFormError] =
    useState<string | null>(null);
  const [pendingProvider, setPendingProvider] =
    useState<"google" | "email" | null>(null);

  const authError = getAuthErrorCopy(errorCode);

  const signUpHref =
    `/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` as Route;

  async function handleGoogleSignIn() {
    setFormError(null);
    setEmailError(null);
    setPendingProvider("google");

    try {
      await signIn("google", {
        redirectTo: callbackUrl,
      });
    } finally {
      setPendingProvider(null);
    }
  }

  async function handleEmailSignIn(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setFormError(null);

    const parsed = emailSchema.safeParse(email);

    if (!parsed.success) {
      setEmailError(
        parsed.error.issues[0]?.message ??
          "Enter a valid email address",
      );
      return;
    }

    setEmailError(null);
    setPendingProvider("email");

    const result = await signIn("resend", {
      email: parsed.data,
      redirect: false,
      redirectTo: callbackUrl,
    });

    setPendingProvider(null);

    if (!result || result.error) {
      setFormError(
        getAuthErrorCopy(result?.error)?.description ??
          "We could not send the sign-in email right now. Try again.",
      );
      return;
    }

    router.push(
      `/auth/verify?email=${encodeURIComponent(
        parsed.data,
      )}&callbackUrl=${encodeURIComponent(
        callbackUrl,
      )}` as Route,
    );
  }

  return (
    <Card className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)]">
      <CardHeader className="px-6 pb-5 pt-6 sm:px-8 sm:pb-6 sm:pt-8">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/80">
            Welcome back
          </p>

          <CardTitle className="text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-[2rem]">
            Sign in to Mentra
          </CardTitle>

          <CardDescription className="max-w-sm text-sm leading-6 text-muted-foreground">
            Continue to your mentoring journey.
          </CardDescription>
        </div>

        <AnimatePresence mode="wait">
          {(authError || formError) && (
            <motion.div
              key={
                authError
                  ? `auth-${errorCode ?? "error"}`
                  : "form-error"
              }
              initial={{
                opacity: 0,
                height: 0,
                y: -6,
              }}
              animate={{
                opacity: 1,
                height: "auto",
                y: 0,
              }}
              exit={{
                opacity: 0,
                height: 0,
                y: -6,
              }}
              transition={{
                duration: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="mt-5 overflow-hidden rounded-xl border border-destructive/20 bg-destructive/[0.045] p-3.5"
              role="alert"
            >
              <div className="flex items-start gap-3">
                <div
                  className="mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border border-destructive/50 text-[10px] font-bold text-destructive"
                  aria-hidden="true"
                >
                  !
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-destructive">
                    {authError?.title ??
                      "Something went wrong"}
                  </p>

                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {authError?.description ??
                      formError}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardHeader>

      <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
        <div className="space-y-5">
          {/* Primary authentication method */}
          <Button
            type="button"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={pendingProvider !== null}
            aria-busy={
              pendingProvider === "google"
            }
            className="h-12 w-full rounded-xl bg-primary text-[0.95rem] font-semibold shadow-[0_12px_28px_-18px_rgba(79,70,229,0.65)] transition-[transform,background-color,box-shadow] duration-200 hover:bg-primary/90 hover:shadow-[0_16px_32px_-18px_rgba(79,70,229,0.7)] active:scale-[0.99]"
          >
            <GoogleIcon
              className="mr-3 size-5"
              aria-hidden="true"
            />

            {pendingProvider === "google"
              ? "Redirecting to Google…"
              : "Continue with Google"}
          </Button>

          {/* Divider */}
          <div className="relative py-1">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-border" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-card px-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email authentication */}
          <form
            onSubmit={(event) => {
              void handleEmailSignIn(event);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="signin-email"
                className="text-sm font-medium text-foreground"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />

                <Input
                  id="signin-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);

                    if (emailError) {
                      setEmailError(null);
                    }

                    if (formError) {
                      setFormError(null);
                    }
                  }}
                  onBlur={() => {
                    if (
                      email &&
                      !emailSchema.safeParse(
                        email,
                      ).success
                    ) {
                      setEmailError(
                        "Enter a valid email address",
                      );
                    }
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  disabled={
                    !emailEnabled ||
                    pendingProvider !== null
                  }
                  aria-invalid={
                    emailError ? "true" : "false"
                  }
                  aria-describedby={
                    emailError
                      ? "signin-email-error"
                      : "signin-email-hint"
                  }
                  className="h-12 rounded-xl border-input bg-background pl-11 pr-4 text-base transition-[border-color,box-shadow] duration-200 placeholder:text-muted-foreground/55 focus-visible:border-primary"
                />
              </div>

              <AnimatePresence mode="wait">
                {emailError ? (
                  <motion.p
                    key="email-error"
                    id="signin-email-error"
                    initial={{
                      opacity: 0,
                      y: -3,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    exit={{
                      opacity: 0,
                      y: -3,
                    }}
                    transition={{
                      duration: 0.15,
                    }}
                    className="text-sm font-medium text-destructive"
                    role="alert"
                  >
                    {emailError}
                  </motion.p>
                ) : (
                  <motion.p
                    key="email-hint"
                    id="signin-email-hint"
                    initial={{
                      opacity: 0,
                    }}
                    animate={{
                      opacity: 1,
                    }}
                    exit={{
                      opacity: 0,
                    }}
                    transition={{
                      duration: 0.15,
                    }}
                    className="text-sm leading-5 text-muted-foreground"
                  >
                    We&apos;ll send a secure sign-in link
                    to this address.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <Button
              type="submit"
              variant="outline"
              size="lg"
              disabled={
                !emailEnabled ||
                pendingProvider !== null
              }
              aria-busy={
                pendingProvider === "email"
              }
              className="h-12 w-full rounded-xl border-border bg-background text-[0.95rem] font-semibold text-foreground transition-[background-color,border-color,transform] duration-200 hover:bg-muted/60 hover:border-primary/20 active:scale-[0.99]"
            >
              {pendingProvider === "email" ? (
                <>
                  <span
                    className="mr-2 size-4 animate-spin rounded-full border-2 border-current/20 border-t-current"
                    aria-hidden="true"
                  />
                  Sending link…
                </>
              ) : (
                <>
                  Send magic link
                  <ExternalLink
                    className="ml-2 size-4"
                    aria-hidden="true"
                  />
                </>
              )}
            </Button>

            {!emailEnabled && (
              <p
                className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-800"
                role="status"
              >
                Email sign-in is not configured for
                this environment.
              </p>
            )}
          </form>
        </div>
      </CardContent>

      <CardFooter className="justify-center border-t border-border/70 bg-muted/20 px-6 py-4 sm:px-8">
        <p className="text-sm text-muted-foreground">
          New to Mentra?{" "}
          <Link
            href={signUpHref}
            className="font-semibold text-primary underline-offset-4 transition-colors duration-150 hover:text-primary/80 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
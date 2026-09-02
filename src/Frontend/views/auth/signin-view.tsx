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
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pb-7 pt-0">
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7C3AED]">
            Welcome back
          </p>

          <CardTitle className="text-[1.9rem] font-bold tracking-[-0.04em] text-[#1E1B4B] sm:text-[2.1rem]">
            Sign in to Mentra
          </CardTitle>

          <CardDescription className="max-w-sm text-sm leading-6 text-slate-500">
            Continue your mentoring journey.
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

      <CardContent className="px-0 pb-0">
        <div className="space-y-4">
          {/* Primary authentication method */}
          <Button
            type="button"
            size="lg"
            onClick={handleGoogleSignIn}
            disabled={pendingProvider !== null}
            aria-busy={
              pendingProvider === "google"
            }
            className="h-12 w-full rounded-xl bg-[#1E1B4B] text-[0.95rem] font-semibold text-white shadow-[0_14px_30px_-18px_rgba(30,27,75,0.6)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#2A275A] hover:shadow-[0_18px_36px_-18px_rgba(30,27,75,0.55)] active:scale-[0.99]"
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
          <div className="relative py-2">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-violet-100" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white/80 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 backdrop-blur-xl">
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
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
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
                  className="h-12 rounded-xl border-slate-200 bg-white/80 pl-11 pr-4 text-base text-[#1E1B4B] shadow-sm transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-slate-400 focus-visible:border-[#7C3AED] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#7C3AED]/15"
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
              className="h-12 w-full rounded-xl bg-[#7C3AED] text-[0.95rem] font-semibold text-white shadow-[0_14px_30px_-18px_rgba(124,58,237,0.72)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:bg-[#6D28D9] hover:shadow-[0_18px_36px_-18px_rgba(124,58,237,0.7)] active:scale-[0.99]"
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

      <CardFooter className="mt-7 border-t border-violet-100/80 bg-transparent px-0 pt-6">
        <p className="text-sm text-slate-500">
          New to Mentra?{" "}
          <Link
            href={signUpHref}
            className="font-semibold text-[#7C3AED] underline-offset-4 transition-colors hover:text-[#6D28D9] hover:underline"
          >
            Create an account
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
"use client";

import type { FormEvent } from "react";
import type { Route } from "next";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Mail } from "lucide-react";
import { signIn } from "next-auth/react";

import { GoogleIcon } from "@/Frontend/views/auth/google-icon";
import { Button } from "@/Frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/Frontend/components/ui/card";
import { Input } from "@/Frontend/components/ui/input";
import { getAuthErrorCopy } from "@/Backend/server/auth-flow";

type SignInViewProps = {
  callbackUrl: string;
  errorCode?: string;
  emailEnabled: boolean;
  googleEnabled: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInView({
  callbackUrl,
  errorCode,
  emailEnabled,
  googleEnabled,
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

    const normalizedEmail = email.trim();

    if (!emailPattern.test(normalizedEmail)) {
      setEmailError("Enter a valid email address");
      return;
    }

    setEmailError(null);
    setPendingProvider("email");

    const result = await signIn("resend", {
      email: normalizedEmail,
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
        normalizedEmail,
      )}&callbackUrl=${encodeURIComponent(
        callbackUrl,
      )}` as Route,
    );
  }

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pb-4 pt-0">
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4F46E5]">
            Welcome back
          </p>

          <CardTitle className="text-[1.9rem] font-bold tracking-[-0.04em] text-[#172033] sm:text-[2.1rem]">
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
            disabled={!googleEnabled || pendingProvider !== null}
            aria-busy={
              pendingProvider === "google"
            }
            variant="default"
            className="h-12 w-full rounded-[12px] border border-[#E2E8F0] !bg-white text-[0.95rem] font-semibold !text-[#0F172A] shadow-none transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:!bg-[#F8FAFC] hover:shadow-sm active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2"
          >
            <GoogleIcon
              className="mr-3 size-5"
              aria-hidden="true"
            />

            {pendingProvider === "google"
              ? "Redirecting to Google…"
              : googleEnabled
                ? "Continue with Google"
                : "Google sign-in unavailable"}
          </Button>

          {/* Divider */}
          <div className="relative py-2">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-slate-200" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
                or continue with email
              </span>
            </div>
          </div>

          {/* Email authentication */}
          <form
            noValidate
            onSubmit={(event) => {
              void handleEmailSignIn(event);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <label
                htmlFor="signin-email"
                className="text-[14px] font-medium text-[#334155]"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#64748B]"
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
                      !emailPattern.test(email.trim())
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
                  className={`h-12 rounded-[12px] !bg-white pl-11 pr-4 text-base !text-[#0F172A] shadow-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#94A3B8] focus-visible:!bg-white focus-visible:ring-[3px] ${
                    emailError
                      ? "border-[#DC2626] focus-visible:border-[#DC2626] focus-visible:ring-[rgba(220,38,38,0.15)]"
                      : "border-[#CBD5E1] focus-visible:border-[#4F46E5] focus-visible:ring-[rgba(79,70,229,0.15)]"
                  }`}
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
                    className="mt-2 text-[13px] font-medium text-[#DC2626]"
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
                    className="text-[13px] leading-5 text-[#64748B]"
                  >
                    We&apos;ll send a secure sign-in link
                    to this address.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <Button
              type="submit"
              variant="default"
              size="lg"
              disabled={
                !emailEnabled ||
                pendingProvider !== null
              }
              aria-busy={
                pendingProvider === "email"
              }
              className="h-12 w-full rounded-[12px] !bg-[#4F46E5] text-[0.95rem] font-semibold text-white shadow-[0_4px_12px_rgba(79,70,229,0.2)] transition-[transform,background-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:!bg-[#4338CA] hover:shadow-[0_4px_12px_rgba(79,70,229,0.2)] active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2 disabled:!bg-[#A5B4FC] disabled:shadow-none"
            >
              {pendingProvider === "email" ? (
                <>
                  <span
                    className="mr-2 size-4 animate-spin rounded-full border-2 border-current/20 border-t-current"
                    aria-hidden="true"
                  />
                  Sending...
                </>
              ) : (
                <>
                  Send magic link
                  <ArrowRight
                    className="ml-2 size-4"
                    aria-hidden="true"
                  />
                </>
              )}
            </Button>

            <p className="mt-4 text-center text-[12px] text-[#64748B]">
              By continuing, you agree to our{" "}
              <Link
                href="/terms"
                className="font-medium text-[#4F46E5] underline underline-offset-4"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="font-medium text-[#4F46E5] underline underline-offset-4"
              >
                Privacy Policy
              </Link>
            </p>

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

    </Card>
  );
}
"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ExternalLink, Mail } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { z } from "zod";

import { GoogleIcon } from "@/app/auth/_components/google-icon";
import { Button } from "@/client/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { Input } from "@/client/components/ui/input";
import { getAuthErrorCopy } from "@/server/auth-flow";
import { cn } from "@/server/utils";

type SignInViewProps = {
  callbackUrl: string;
  errorCode?: string;
  emailEnabled: boolean;
};

const emailSchema = z.string().trim().email("Enter a valid email address");

export function SignInView({
  callbackUrl,
  errorCode,
  emailEnabled,
}: SignInViewProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [pendingProvider, setPendingProvider] = useState<"google" | "email" | null>(null);
  const [isMagicOpen, setIsMagicOpen] = useState(Boolean(errorCode === "EmailSignin"));
  const [formError, setFormError] = useState<string | null>(null);

  const authError = getAuthErrorCopy(errorCode);
  const signUpHref = {
    pathname: "/auth/signup",
    query: { callbackUrl },
  } as const;

  async function handleGoogleSignIn() {
    setFormError(null);
    setPendingProvider("google");
    await signIn("google", { redirectTo: callbackUrl });
  }

  async function handleMagicLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = emailSchema.safeParse(email);

    if (!parsed.success) {
      setEmailError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
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
      `/auth/verify?email=${encodeURIComponent(parsed.data)}&callbackUrl=${encodeURIComponent(
        callbackUrl,
      )}` as Route,
    );
  }

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/92 py-0 shadow-card backdrop-blur">
      <CardHeader className="gap-4 border-b border-slate-200/80 px-6 py-7 sm:px-7">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            GuideMe sign in
          </p>
          <CardTitle className="font-display text-3xl font-bold text-slate-950">
            Welcome back.
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-600">
            Continue to your dashboard, mentor matches, and onboarding progress.
          </CardDescription>
        </div>

        {authError ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <div className="font-semibold text-red-800">{authError.title}</div>
            <p className="mt-1 leading-6">{authError.description}</p>
          </motion.div>
        ) : null}

        {formError ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {formError}
          </motion.div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4 px-6 py-7 sm:px-7">
        <Button
          onClick={handleGoogleSignIn}
          disabled={pendingProvider !== null}
          className="h-12 w-full rounded-xl bg-slate-950 text-base font-semibold text-white hover:bg-slate-900"
        >
          <GoogleIcon />
          {pendingProvider === "google" ? "Redirecting to Google..." : "Continue with Google"}
        </Button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
              or
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/85 p-1">
          <button
            type="button"
            onClick={() => setIsMagicOpen((value) => !value)}
            className="flex w-full items-center justify-between rounded-[1rem] px-4 py-3 text-left transition hover:bg-white"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-white p-2 text-slate-700 shadow-sm">
                <Mail className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-900">
                  Email magic link
                </span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">
                  Get a secure link in your inbox and sign in without a password.
                </span>
              </span>
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-slate-500 transition-transform",
                isMagicOpen && "rotate-180",
              )}
            />
          </button>

          <AnimatePresence initial={false}>
            {isMagicOpen ? (
              <motion.form
                key="magic-link"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                onSubmit={handleMagicLink}
                className="overflow-hidden"
              >
                <div className="space-y-3 border-t border-slate-200 px-4 pb-4 pt-4">
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-11 rounded-xl border-slate-200 bg-white"
                    disabled={!emailEnabled || pendingProvider !== null}
                  />
                  {emailError ? (
                    <p className="text-sm font-medium text-destructive">{emailError}</p>
                  ) : (
                    <p className="text-sm leading-6 text-slate-500">
                      We will send a one-time sign-in link to this email.
                    </p>
                  )}
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={!emailEnabled || pendingProvider !== null}
                    className="h-11 w-full rounded-xl border-slate-200 bg-white text-sm font-semibold text-slate-900 hover:bg-slate-100"
                  >
                    {pendingProvider === "email" ? "Sending link..." : "Send magic link"}
                    <ExternalLink className="size-4" />
                  </Button>
                  {!emailEnabled ? (
                    <p className="text-sm leading-6 text-amber-700">
                      Email sign-in is not configured yet for this environment.
                    </p>
                  ) : null}
                </div>
              </motion.form>
            ) : null}
          </AnimatePresence>
        </div>
      </CardContent>

      <CardFooter className="justify-center rounded-none border-t border-slate-200 bg-slate-50/80 px-6 py-5 text-center text-sm text-slate-600 sm:px-7">
        New to GuideMe?{" "}
        <Link href={signUpHref} className="font-semibold text-slate-950 underline-offset-4 hover:underline">
          Create an account
        </Link>
      </CardFooter>
    </Card>
  );
}

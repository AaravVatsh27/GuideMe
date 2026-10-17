"use client";

import type { FormEvent } from "react";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
import { signIn } from "next-auth/react";

import { Button } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { Input } from "@/Frontend/components/ui/input";
import { GoogleIcon } from "./google-icon";

type AdminSignInViewProps = {
  emailEnabled: boolean;
  googleEnabled: boolean;
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminSignInView({ emailEnabled, googleEnabled }: AdminSignInViewProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingAction, setPendingAction] = useState<"password" | "email" | "google" | null>(null);

  function clearErrors() {
    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
  }

  function validateCredentials() {
    const normalizedEmail = email.trim();
    let valid = true;

    if (!emailPattern.test(normalizedEmail)) {
      setEmailError("Enter a valid work email address.");
      valid = false;
    }

    if (!password) {
      setPasswordError("Enter your password.");
      valid = false;
    }

    return valid;
  }

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearErrors();

    if (!validateCredentials()) {
      return;
    }

    setPendingAction("password");
    const result = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
      redirectTo: "/admin",
    });
    setPendingAction(null);

    if (!result || result.error) {
      setFormError("Those credentials were not accepted. Try again.");
      return;
    }

    router.push("/admin");
  }

  async function handleEmailSignIn() {
    clearErrors();
    const normalizedEmail = email.trim();

    if (!emailPattern.test(normalizedEmail)) {
      setEmailError("Enter a valid work email address.");
      return;
    }

    setPendingAction("email");
    const result = await signIn("resend", {
      email: normalizedEmail,
      redirect: false,
      redirectTo: "/admin",
    });
    setPendingAction(null);

    if (!result || result.error) {
      setFormError("We could not send the sign-in email right now. Try again.");
      return;
    }

    router.push(
      `/auth/verify?email=${encodeURIComponent(normalizedEmail)}&callbackUrl=${encodeURIComponent("/admin")}`,
    );
  }

  async function handleGoogleSignIn() {
    clearErrors();
    setPendingAction("google");
    await signIn("google", { redirectTo: "/admin" });
  }

  const isPending = pendingAction !== null;

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="px-0 pb-5 pt-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#4F46E5]">Internal access</p>
        <CardTitle className="mt-2 text-[1.9rem] font-bold tracking-[-0.04em] text-[#172033] sm:text-[2.1rem]">
          Admin / HR Login
        </CardTitle>
        <CardDescription className="mt-2 text-sm leading-6 text-slate-500">
          Authorized staff only.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5 px-0 pb-0">
        <Button
          type="button"
          size="lg"
          onClick={() => void handleGoogleSignIn()}
          disabled={!googleEnabled || isPending}
          aria-busy={pendingAction === "google"}
          className="h-12 w-full rounded-[12px] border border-[#E2E8F0] !bg-white text-[0.95rem] font-semibold !text-[#0F172A] shadow-none hover:!bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2"
        >
          <GoogleIcon className="mr-3 size-5" />
          {pendingAction === "google"
            ? "Redirecting to Google..."
            : googleEnabled
              ? "Continue with Google"
              : "Google sign-in unavailable"}
        </Button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#64748B]">
              Or use email
            </span>
          </div>
        </div>

        <form noValidate onSubmit={(event) => void handlePasswordSignIn(event)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="admin-signin-email" className="text-[14px] font-medium text-[#334155]">
              Work email
            </label>
            <Input
              id="admin-signin-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError(null);
                setFormError(null);
              }}
              placeholder="you@company.com"
              autoComplete="email"
              disabled={isPending}
              aria-invalid={emailError ? "true" : "false"}
              className={`h-12 rounded-[12px] !bg-white px-4 text-base !text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:!bg-white focus-visible:ring-[3px] ${
                emailError
                  ? "border-[#DC2626] focus-visible:border-[#DC2626] focus-visible:ring-[rgba(220,38,38,0.15)]"
                  : "border-[#CBD5E1] focus-visible:border-[#4F46E5] focus-visible:ring-[rgba(79,70,229,0.15)]"
              }`}
            />
            {emailError ? <p className="text-[13px] font-medium text-[#DC2626]" role="alert">{emailError}</p> : null}
          </div>

          <div className="space-y-2">
            <label htmlFor="admin-signin-password" className="text-[14px] font-medium text-[#334155]">
              Password
            </label>
            <div className="relative">
              <Input
                id="admin-signin-password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setPasswordError(null);
                  setFormError(null);
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                disabled={isPending}
                aria-invalid={passwordError ? "true" : "false"}
                className={`h-12 rounded-[12px] !bg-white px-4 pr-12 text-base !text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:!bg-white focus-visible:ring-[3px] ${
                  passwordError
                    ? "border-[#DC2626] focus-visible:border-[#DC2626] focus-visible:ring-[rgba(220,38,38,0.15)]"
                    : "border-[#CBD5E1] focus-visible:border-[#4F46E5] focus-visible:ring-[rgba(79,70,229,0.15)]"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                disabled={isPending}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#64748B] transition-colors hover:text-[#334155] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            {passwordError ? <p className="text-[13px] font-medium text-[#DC2626]" role="alert">{passwordError}</p> : null}
          </div>

          {formError ? <p className="text-[13px] font-medium text-[#DC2626]" role="alert">{formError}</p> : null}

          <Button
            type="submit"
            size="lg"
            disabled={isPending}
            aria-busy={pendingAction === "password"}
            className="h-12 w-full rounded-[12px] !bg-[#4F46E5] text-[0.95rem] font-semibold text-white shadow-[0_4px_12px_rgba(79,70,229,0.2)] hover:!bg-[#4338CA] focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2 disabled:!bg-[#A5B4FC] disabled:shadow-none"
          >
            {pendingAction === "password" ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="pt-1 text-center">
          <button
            type="button"
            onClick={() => void handleEmailSignIn()}
            disabled={!emailEnabled || isPending}
            className="text-sm font-medium text-[#4F46E5] underline-offset-4 transition-colors hover:text-[#3730A3] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pendingAction === "email" ? "Sending link..." : "Email me a sign-in link instead"}
          </button>
          {!emailEnabled ? <p className="mt-2 text-xs text-amber-700">Email sign-in is not configured for this environment.</p> : null}
        </div>

        <div className="flex items-center justify-center gap-2 pt-2 text-center text-xs leading-5 text-[#64748B]">
          <LockKeyhole className="size-3.5 shrink-0" aria-hidden="true" />
          <span>Access is limited to authorized Mentra administrators and HR staff.</span>
        </div>
      </CardContent>
    </Card>
  );
}

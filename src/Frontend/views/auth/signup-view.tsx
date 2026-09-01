"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
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
import {
  AUTH_DEFAULT_REDIRECT,
  getAuthErrorCopy,
  getOnboardingPath,
  SIGNUP_ROLE_STORAGE_KEY,
} from "@/Backend/server/auth-flow";
import { cn } from "@/Backend/server/utils";

type SignupViewProps = {
  callbackUrl: string;
  errorCode?: string;
  isCompletingOAuth: boolean;
};

const signupRoleSchema = z.enum(["STUDENT", "MENTOR"]);

const roleOptions = {
  STUDENT: {
    title: "I'm a Student",
    subtitle: "Looking for guidance",
    description:
      "Get clarity on streams, exams, colleges, and next steps from mentors who have already been there.",
    icon: GraduationCap,
    benefits: [
      "Shortlist the right path faster",
      "Avoid random advice and decision fatigue",
      "Get honest mentor-led next steps",
    ],
  },
  MENTOR: {
    title: "I'm a Mentor",
    subtitle: "Want to guide and earn",
    description:
      "Share your journey, help students make better decisions, and build a paid mentoring presence.",
    icon: BriefcaseBusiness,
    benefits: [
      "Monetise your experience responsibly",
      "Build trust with a focused student audience",
      "Run structured sessions without admin chaos",
    ],
  },
} as const;

export function SignupView({
  callbackUrl,
  errorCode,
  isCompletingOAuth,
}: SignupViewProps) {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const hasCompletedRef = useRef(false);
  const [selectedRole, setSelectedRole] = useState<"STUDENT" | "MENTOR" | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [pending, setPending] = useState<"google" | "sync" | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const authError = getAuthErrorCopy(errorCode);
  const signInHref = {
    pathname: "/auth/signin",
    query: { callbackUrl },
  } as const;

  function toRoute(path: string) {
    return path as Route;
  }

  const urlConsumedRef = useRef(false);

  useEffect(() => {
    if (urlConsumedRef.current) return;
    urlConsumedRef.current = true;

    const urlRole = signupRoleSchema.safeParse(
      new URLSearchParams(window.location.search).get("role")
    );

    if (urlRole.success) {
      setSelectedRole(urlRole.data);
      window.sessionStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, urlRole.data);
      setStep(1);
      return;
    }

    if (!isCompletingOAuth) {
      window.sessionStorage.removeItem(SIGNUP_ROLE_STORAGE_KEY);
      setSelectedRole(null);
      setStep(1);
      return;
    }

    const storedRole = signupRoleSchema.safeParse(
      window.sessionStorage.getItem(SIGNUP_ROLE_STORAGE_KEY),
    );

    if (storedRole.success) {
      setSelectedRole(storedRole.data);
      setStep(2);
      return;
    }

    window.sessionStorage.removeItem(SIGNUP_ROLE_STORAGE_KEY);
  }, [isCompletingOAuth]);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user || hasCompletedRef.current) {
      return;
    }

    const urlRole = new URLSearchParams(window.location.search).get("role");

    if (!isCompletingOAuth && !selectedRole && !urlRole) {
      router.replace(
        session.user.onboardingComplete
          ? toRoute(callbackUrl || AUTH_DEFAULT_REDIRECT)
          : toRoute(getOnboardingPath(session.user.role)),
      );
      return;
    }

    const storedRole = signupRoleSchema.safeParse(
      window.sessionStorage.getItem(SIGNUP_ROLE_STORAGE_KEY),
    );

    hasCompletedRef.current = true;
    setPending("sync");

    if (!storedRole.success) {
      window.sessionStorage.removeItem(SIGNUP_ROLE_STORAGE_KEY);
      router.replace(toRoute(getOnboardingPath(session.user.role)));
      return;
    }

    void (async () => {
      const response = await fetch("/api/auth/complete-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: storedRole.data }),
      });

      if (!response.ok) {
        hasCompletedRef.current = false;
        setPending(null);
        setSyncError("We could not finish setting up your account. Please try again.");
        return;
      }

      const payload = (await response.json()) as {
        role: "STUDENT" | "MENTOR";
        onboardingComplete: boolean;
        onboardingPath: string;
      };

      await update({
        user: {
          role: payload.role,
          onboardingComplete: payload.onboardingComplete,
        },
      });

      window.sessionStorage.removeItem(SIGNUP_ROLE_STORAGE_KEY);
      router.replace(toRoute(payload.onboardingPath));
    })();
  }, [callbackUrl, isCompletingOAuth, router, selectedRole, session, status, update]);

  function handleRoleSelect(role: "STUDENT" | "MENTOR") {
    window.sessionStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, role);
    setSelectedRole(role);
    setStep(2);
  }

  function handleBack() {
    setStep(1);
    setSyncError(null);
  }

  async function handleGoogleSignup() {
    if (!selectedRole) {
      return;
    }

    window.sessionStorage.setItem(SIGNUP_ROLE_STORAGE_KEY, selectedRole);
    setPending("google");
    await signIn("google", {
      redirectTo: `/auth/signup?complete=1&callbackUrl=${encodeURIComponent(callbackUrl)}`,
    });
  }

  return (
    <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/92 py-0 shadow-card backdrop-blur">
      <CardHeader className="gap-4 border-b border-slate-200/80 px-6 py-7 sm:px-7">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
            GuideMe sign up
          </p>
          <CardTitle className="font-display text-3xl font-bold text-slate-950">
            Start with the right lane.
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-slate-600">
            Choose your role first so GuideMe can shape the experience around what you need next.
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

        {syncError ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
          >
            {syncError}
          </motion.div>
        ) : null}
      </CardHeader>

      <CardContent className="px-6 py-7 sm:px-7">
        <AnimatePresence mode="wait">
          {isCompletingOAuth ? (
            <motion.div
              key="completing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-6 text-center"
            >
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-slate-950 text-white">
                <CheckCircle2 className="size-6" />
              </div>
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-semibold text-slate-950">
                  Finishing your account
                </h3>
                <p className="text-sm leading-6 text-slate-600">
                  We are attaching your role selection and preparing your onboarding flow.
                </p>
              </div>
              <div className="mx-auto h-2 w-full max-w-[16rem] overflow-hidden rounded-full bg-slate-200">
                <motion.div
                  className="h-full rounded-full bg-slate-950"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.4, ease: "easeInOut" }}
                />
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                {pending === "sync" ? "Syncing role and session" : "Preparing your workspace"}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -18 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              className="space-y-5"
            >
              {step === 1 ? (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Step 1
                    </p>
                    <h3 className="font-display text-2xl font-semibold text-slate-950">
                      Choose how you want to use GuideMe.
                    </h3>
                  </div>

                  <div className="grid gap-4">
                    {(Object.entries(roleOptions) as Array<
                      ["STUDENT" | "MENTOR", (typeof roleOptions)["STUDENT"]]
                    >).map(([role, option]) => {
                      const Icon = option.icon;
                      const isSelected = selectedRole === role;

                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleSelect(role)}
                          className={cn(
                            "rounded-[1.5rem] border bg-white p-5 text-left transition",
                            isSelected
                              ? "border-slate-950 bg-slate-50 shadow-card"
                              : "border-slate-200 hover:-translate-y-0.5 hover:border-slate-950 hover:shadow-card",
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white">
                              <Icon className="size-5" />
                            </span>
                            <div className="flex-1 space-y-3">
                              <div>
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                                    {option.subtitle}
                                  </div>
                                  {isSelected ? (
                                    <span className="rounded-full bg-slate-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                                      Selected
                                    </span>
                                  ) : null}
                                </div>
                                <h4 className="mt-1 font-display text-xl font-semibold text-slate-950">
                                  {option.title}
                                </h4>
                              </div>
                              <p className="text-sm leading-6 text-slate-600">
                                {option.description}
                              </p>
                              <div className="grid gap-2">
                                {option.benefits.map((benefit) => (
                                  <div
                                    key={benefit}
                                    className="flex items-center gap-2 text-sm text-slate-700"
                                  >
                                    <CheckCircle2 className="size-4 text-teal-600" />
                                    {benefit}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedRole ? (
                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                      className="h-12 w-full rounded-xl bg-slate-950 text-base font-semibold text-white hover:bg-slate-900"
                    >
                      Continue as {selectedRole === "STUDENT" ? "Student" : "Mentor"}
                      <ArrowRight className="size-4" />
                    </Button>
                  ) : (
                    <p className="text-sm leading-6 text-slate-500">
                      Pick a role to continue with Google signup.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Step 2
                    </p>
                    <h3 className="font-display text-2xl font-semibold text-slate-950">
                      Continue with Google.
                    </h3>
                  </div>

                  {selectedRole ? (
                    <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                            Selected role
                          </p>
                          <h4 className="mt-1 font-display text-xl font-semibold text-slate-950">
                            {roleOptions[selectedRole].title}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {roleOptions[selectedRole].description}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                          {selectedRole.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleBack}
                      className="h-12 rounded-xl border-slate-200 bg-white px-4 text-slate-900 hover:bg-slate-100"
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleGoogleSignup}
                      disabled={!selectedRole || pending !== null}
                      className="h-12 flex-1 rounded-xl bg-slate-950 text-base font-semibold text-white hover:bg-slate-900"
                    >
                      <GoogleIcon />
                      {pending === "google" ? "Redirecting to Google..." : "Sign up with Google"}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>

                  <p className="text-sm leading-6 text-slate-500">
                    Your selected role is saved before redirect so we can finish account setup
                    when you return.
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="justify-center rounded-none border-t border-slate-200 bg-slate-50/80 px-6 py-5 text-center text-sm text-slate-600 sm:px-7">
        Already have an account?{" "}
        <Link href={signInHref} className="font-semibold text-slate-950 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

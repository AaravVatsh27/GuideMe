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
    <Card className="border-0 bg-transparent py-0 shadow-none">
      <CardHeader className="gap-4 border-0 px-0 pb-7 pt-0">
        <div className="space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7C3AED]">
            Create your account
          </p>
          <CardTitle className="text-[1.9rem] font-bold tracking-[-0.04em] text-[#1E1B4B] sm:text-[2.1rem]">
            What brings you to Mentra?
          </CardTitle>
          <CardDescription className="max-w-md text-sm leading-6 text-slate-500">
            Choose how you want to use Mentra.
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

      <CardContent className="px-0 py-0">
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
              className="space-y-4"
            >
              {step === 1 ? (
                <>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {(Object.entries(roleOptions) as Array<
                      [
                        "STUDENT" | "MENTOR",
                        (typeof roleOptions)["STUDENT"],
                      ]
                    >).map(([role, option]) => {
                      const Icon = option.icon;
                      const isSelected = selectedRole === role;

                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => handleRoleSelect(role)}
                          aria-pressed={isSelected}
                          className={cn(
                            "group relative flex min-h-[200px] flex-col overflow-hidden rounded-[1.5rem] border p-5 text-left transition duration-200 sm:min-h-[205px]",
                            isSelected
                              ? "border-[#7C3AED] bg-[#7C3AED]/[0.045] shadow-[0_20px_42px_-28px_rgba(124,58,237,0.48)]"
                              : "border-slate-200/90 bg-white/90 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-[0_18px_40px_-28px_rgba(30,27,75,0.22)]",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/30 focus-visible:ring-offset-2",
                          )}
                        >
                          {/* Selection indicator */}
                          <div className="flex items-start justify-between">
                            <span
                              className={cn(
                                "flex size-12 items-center justify-center rounded-[1rem] transition duration-200",
                                isSelected
                                  ? "bg-[#7C3AED] text-white shadow-[0_10px_24px_-16px_rgba(124,58,237,0.8)]"
                                  : "bg-violet-50 text-[#7C3AED] group-hover:bg-violet-100",
                              )}
                            >
                              <Icon className="size-5" />
                            </span>

                            <span
                              className={cn(
                                "flex size-6 items-center justify-center rounded-full border-2 transition duration-200",
                                isSelected
                                  ? "border-[#7C3AED] bg-[#7C3AED]"
                                  : "border-slate-300 bg-white group-hover:border-violet-300",
                              )}
                            >
                              {isSelected ? (
                                <span className="size-2 rounded-full bg-white" />
                              ) : null}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="mt-7">
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7C3AED]">
                              {role === "STUDENT" ? "For students" : "For mentors"}
                            </p>

                            <h4 className="mt-2 text-xl font-bold tracking-[-0.03em] text-[#1E1B4B]">
                              {role === "STUDENT"
                                ? "I want guidance"
                                : "I want to mentor"}
                            </h4>

                            <p className="mt-3 text-sm leading-6 text-slate-500">
                              {role === "STUDENT"
                                ? "Find someone who has already walked the road and can help you make a clearer decision."
                                : "Share what you've learned and help another student make a better decision."}
                            </p>
                          </div>

                          {/* Bottom role label */}
                          <div className="mt-auto pt-6">
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold",
                                isSelected
                                  ? "bg-violet-100 text-[#6D28D9]"
                                  : "bg-slate-100 text-slate-500",
                              )}
                            >
                              {role === "STUDENT" ? "Student" : "Mentor"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2">
                    {selectedRole ? (
                      <Button
                        type="button"
                        onClick={() => setStep(2)}
                        className="group h-12 w-full rounded-xl bg-[#7C3AED] text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(124,58,237,0.68)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#6D28D9] hover:shadow-[0_18px_36px_-20px_rgba(124,58,237,0.68)] active:scale-[0.99]"
                      >
                        Continue as{" "}
                        {selectedRole === "STUDENT" ? "Student" : "Mentor"}
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                      </Button>
                    ) : (
                      <p className="py-1 text-center text-xs text-slate-400">
                        Choose a role to continue.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                      Continue
                    </p>
                    <h3 className="text-2xl font-bold tracking-[-0.035em] text-[#1E1B4B]">
                      Continue with Google
                    </h3>
                  </div>

                  {selectedRole ? (
                    <div className="rounded-[1.5rem] border border-violet-100 bg-violet-50/[0.45] p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7C3AED]">
                            Selected role
                          </p>
                          <h4 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#1E1B4B]">
                            {roleOptions[selectedRole].title}
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {roleOptions[selectedRole].description}
                          </p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7C3AED]">
                          {selectedRole.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      onClick={handleBack}
                      className="h-12 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-[#1E1B4B] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/40 active:scale-[0.99]"
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleGoogleSignup}
                      disabled={!selectedRole || pending !== null}
                      className="group h-12 flex-1 rounded-xl bg-[#7C3AED] text-sm font-semibold text-white shadow-[0_14px_30px_-20px_rgba(124,58,237,0.68)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#6D28D9] hover:shadow-[0_18px_36px_-20px_rgba(124,58,237,0.68)] active:scale-[0.99]"
                    >
                      <GoogleIcon />
                      {pending === "google" ? "Redirecting to Google..." : "Continue with Google"}
                      <ArrowRight className="size-4" />
                    </Button>
                  </div>

                  <p className="text-xs leading-5 text-slate-400">
                    Your role is saved securely before Google sign-in so we can finish
                    setting up your account when you return.
                  </p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>

      <CardFooter className="mt-7 border-t border-violet-100/80 bg-transparent px-0 pt-5">
        <p className="w-full text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link href={signInHref} className="font-semibold text-[#7C3AED] underline-offset-4 transition-colors hover:text-[#6D28D9] hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

"use client";

import type { FormEvent } from "react";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ExternalLink, Mail } from "lucide-react";
import { signIn } from "next-auth/react";
import { z } from "zod";

import { Button } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { Input } from "@/Frontend/components/ui/input";

const emailSchema = z.string().trim().email("Enter a valid email address");

type AdminSignInViewProps = {
  emailEnabled: boolean;
};

export function AdminSignInView({ emailEnabled }: AdminSignInViewProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter a valid email address");
      return;
    }

    setIsPending(true);
    const result = await signIn("resend", {
      email: parsed.data,
      redirect: false,
      redirectTo: "/admin",
    });
    setIsPending(false);

    if (!result || result.error) {
      setError("We could not send the sign-in email right now. Try again.");
      return;
    }

    router.push(
      `/auth/verify?email=${encodeURIComponent(parsed.data)}&callbackUrl=${encodeURIComponent("/admin")}`,
    );
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsPending(true);
    await signIn("google", { redirectTo: "/admin" });
  }

  return (
    <Card className="rounded-2xl border border-violet-100 bg-white shadow-[0_24px_70px_-40px_rgba(30,27,75,0.35)]">
      <CardHeader className="p-5 pb-3 sm:p-6 sm:pb-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7C3AED]">Internal access</p>
        <CardTitle className="mt-2 text-2xl font-bold tracking-[-0.03em] text-[#1E1B4B]">
          Admin / HR Login
        </CardTitle>
        <CardDescription className="mt-2 text-sm leading-5 text-slate-600">
          This area is for authorized internal staff only.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 p-5 pt-2 sm:p-6 sm:pt-3">
        <Button
          type="button"
          onClick={() => void handleGoogleSignIn()}
          disabled={isPending}
          className="h-10 w-full rounded-xl bg-[#1E1B4B] font-semibold text-white hover:bg-[#312E81]"
        >
          Continue with Google
        </Button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-violet-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
              or use email
            </span>
          </div>
        </div>

        <form onSubmit={(event) => void handleEmailSignIn(event)} className="space-y-3">
          <label htmlFor="admin-signin-email" className="text-sm font-medium text-[#1E1B4B]">
            Work email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              id="admin-signin-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
              disabled={!emailEnabled || isPending}
              className="h-10 rounded-xl border-slate-200 bg-white pl-10 text-[#1E1B4B] focus-visible:border-[#7C3AED] focus-visible:ring-2 focus-visible:ring-[#7C3AED]/10"
            />
          </div>
          {error ? <p className="text-sm text-rose-600" role="alert">{error}</p> : null}
          <Button
            type="submit"
            disabled={!emailEnabled || isPending}
            className="h-10 w-full rounded-xl bg-[#7C3AED] font-semibold text-white hover:bg-[#6D28D9]"
          >
            {isPending ? "Sending link..." : "Send secure sign-in link"}
            {!isPending ? <ExternalLink className="ml-2 size-4" aria-hidden="true" /> : null}
          </Button>
          {!emailEnabled ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Email sign-in is not configured for this environment.
            </p>
          ) : null}
        </form>
      </CardContent>

      <CardFooter className="border-t border-violet-100 bg-transparent p-5 pt-4 sm:px-6">
        <p className="text-xs leading-5 text-slate-500">
          Access is limited to authorized Mentra administrators and HR staff.
        </p>
      </CardFooter>
    </Card>
  );
}

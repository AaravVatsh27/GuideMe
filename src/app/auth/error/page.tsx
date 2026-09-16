import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { AuthShell } from "@/Frontend/views/auth/auth-shell";
import {
  AuthPageSearchParams,
  getAuthCallbackUrl,
  getFirstSearchParam,
} from "@/Frontend/views/auth/search-params";
import { buttonVariants } from "@/Frontend/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/Frontend/components/ui/card";
import { getAuthErrorCopy } from "@/Backend/server/auth-flow";
import { getAuthShellContent } from "@/Backend/server/public-data";
import { cn } from "@/Backend/server/utils";

type AuthErrorPageProps = {
  searchParams?: AuthPageSearchParams;
};

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const callbackUrl = getAuthCallbackUrl(searchParams);
  const errorCode = getFirstSearchParam(searchParams?.error);
  const errorCopy = getAuthErrorCopy(errorCode) ?? getAuthErrorCopy("Default");
  const shellContent = await getAuthShellContent();
  const signInHref = {
    pathname: "/auth/signin",
    query: { callbackUrl },
  } as const;
  const signUpHref = {
    pathname: "/auth/signup",
    query: { callbackUrl },
  } as const;

  if (!errorCopy) {
    return null;
  }

  return (
    <AuthShell {...shellContent}>
      <Card className="overflow-hidden rounded-[2rem] border border-violet-200/80 bg-white/95 py-0 shadow-[0_20px_50px_-20px_rgba(124,58,237,0.12)] backdrop-blur-xl">
        <CardHeader className="gap-4 border-b border-violet-100/80 px-6 py-7 sm:px-8">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-8 ring-rose-50/60 shadow-xs">
            <AlertTriangle className="size-7" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-rose-600">
              Authentication Notice
            </p>
            <CardTitle className="font-display text-2xl font-bold tracking-tight text-[#1E1B4B] sm:text-3xl">
              {errorCopy.title}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed text-[#5B6475]">
              {errorCopy.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-6 py-6 text-sm leading-relaxed text-[#5B6475] sm:px-8">
          <p>
            Try signing in again, or start a fresh signup flow if you were creating a new
            account. If you linked an account with Google or email, make sure you use the same
            sign-in method.
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 border-t border-violet-100/80 bg-violet-50/40 px-6 py-6 sm:px-8">
          <Link
            href={signInHref}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#7C3AED] text-sm font-semibold text-white shadow-[0_10px_22px_-8px_rgba(124,58,237,0.65)] transition-all hover:-translate-y-0.5 hover:bg-[#6D28D9] hover:shadow-[0_14px_26px_-8px_rgba(124,58,237,0.75)] active:translate-y-0"
          >
            <span>Back to sign in</span>
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={signUpHref}
            className="flex h-12 w-full items-center justify-center rounded-full border border-violet-200 bg-white text-sm font-semibold text-[#1E1B4B] shadow-xs transition hover:border-violet-300 hover:bg-violet-50 hover:text-[#7C3AED]"
          >
            Create an account
          </Link>

          <p className="mt-2 text-center text-xs text-slate-500">
            Having trouble?{" "}
            <a
              href="mailto:support@mentra.in?subject=Authentication%20Help"
              className="font-semibold text-[#7C3AED] hover:underline"
            >
              Contact support@mentra.in
            </a>
          </p>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}

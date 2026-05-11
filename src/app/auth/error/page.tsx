import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

import { AuthShell } from "@/app/auth/_components/auth-shell";
import {
  AuthPageSearchParams,
  getAuthCallbackUrl,
  getFirstSearchParam,
} from "@/app/auth/_lib/search-params";
import { buttonVariants } from "@/client/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/client/components/ui/card";
import { getAuthErrorCopy } from "@/server/auth-flow";
import { getAuthShellContent } from "@/server/public-data";
import { cn } from "@/server/utils";

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
      <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/92 py-0 shadow-card backdrop-blur">
        <CardHeader className="gap-4 border-b border-slate-200/80 px-6 py-7 sm:px-7">
          <div className="flex size-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="size-6" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Authentication error
            </p>
            <CardTitle className="font-display text-3xl font-bold text-slate-950">
              {errorCopy.title}
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-600">
              {errorCopy.description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-6 py-7 text-sm leading-6 text-slate-600 sm:px-7">
          <p>
            Try signing in again, or start a fresh signup flow if you were creating a new
            account.
          </p>
        </CardContent>

        <CardFooter className="grid gap-3 border-t border-slate-200 bg-slate-50/80 px-6 py-5 sm:px-7">
          <Link
            href={signInHref}
            className={cn(
              buttonVariants({}),
              "h-12 rounded-xl bg-slate-950 text-base font-semibold text-white hover:bg-slate-900",
            )}
          >
            Back to sign in
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href={signUpHref}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 rounded-xl border-slate-200 bg-white text-base font-semibold text-slate-900 hover:bg-slate-100",
            )}
          >
            Create an account
          </Link>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}

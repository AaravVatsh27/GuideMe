import Link from "next/link";
import { Inbox, MailCheck } from "lucide-react";

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
import { getAuthShellContent } from "@/Backend/server/public-data";
import { cn } from "@/Backend/server/utils";

type VerifyPageProps = {
  searchParams?: AuthPageSearchParams;
};

export default async function VerifyPage({ searchParams }: VerifyPageProps) {
  const callbackUrl = getAuthCallbackUrl(searchParams);
  const email = getFirstSearchParam(searchParams?.email);
  const shellContent = await getAuthShellContent();
  const signInHref = {
    pathname: "/auth/signin",
    query: { callbackUrl },
  } as const;

  return (
    <AuthShell {...shellContent}>
      <Card className="overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/92 py-0 shadow-card backdrop-blur">
        <CardHeader className="gap-4 border-b border-slate-200/80 px-6 py-7 sm:px-7">
          <div className="flex size-14 items-center justify-center rounded-full bg-teal-50 text-teal-700">
            <MailCheck className="size-6" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
              Check your inbox
            </p>
            <CardTitle className="font-display text-3xl font-bold text-slate-950">
              Magic link sent.
            </CardTitle>
            <CardDescription className="text-sm leading-6 text-slate-600">
              {email
                ? `We sent a secure sign-in link to ${email}.`
                : "We sent a secure sign-in link to your email address."}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 px-6 py-7 text-sm leading-6 text-slate-600 sm:px-7">
          <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/85 p-5">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-10 items-center justify-center rounded-full bg-white text-slate-900 shadow-sm">
                <Inbox className="size-4" />
              </span>
              <div>
                <p className="font-semibold text-slate-900">Open the email on this device.</p>
                <p className="mt-1">
                  The link expires after a while and only works once. If it does not arrive soon,
                  check spam and request a fresh one from sign in.
                </p>
              </div>
            </div>
          </div>
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
          </Link>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-12 rounded-xl border-slate-200 bg-white text-base font-semibold text-slate-900 hover:bg-slate-100",
            )}
          >
            Return home
          </Link>
        </CardFooter>
      </Card>
    </AuthShell>
  );
}

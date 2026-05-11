import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/app/auth/_components/auth-shell";
import { SignupView } from "@/app/auth/_components/signup-view";
import {
  AuthPageSearchParams,
  getAuthCallbackUrl,
  getFirstSearchParam,
  isTruthySearchParam,
} from "@/app/auth/_lib/search-params";
import { getOnboardingPath } from "@/server/auth-flow";
import { getAuthShellContent } from "@/server/public-data";

type SignUpPageProps = {
  searchParams?: AuthPageSearchParams;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const callbackUrl = getAuthCallbackUrl(searchParams);
  const errorCode = getFirstSearchParam(searchParams?.error);
  const isCompletingOAuth = isTruthySearchParam(searchParams?.complete);
  const session = await auth();

  const isForcingRole = !!searchParams?.role;

  if (session?.user && !isCompletingOAuth && !isForcingRole) {
    redirect(
      session.user.onboardingComplete ? callbackUrl : getOnboardingPath(session.user.role),
    );
  }

  const shellContent = await getAuthShellContent();

  return (
    <AuthShell {...shellContent}>
      <SignupView
        callbackUrl={callbackUrl}
        errorCode={errorCode}
        isCompletingOAuth={isCompletingOAuth}
      />
    </AuthShell>
  );
}

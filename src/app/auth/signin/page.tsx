import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuthShell } from "@/app/auth/_components/auth-shell";
import { SignInView } from "@/app/auth/_components/signin-view";
import {
  AuthPageSearchParams,
  getAuthCallbackUrl,
  getFirstSearchParam,
} from "@/app/auth/_lib/search-params";
import { isEmailAuthEnabled } from "@/server/auth";
import { getOnboardingPath } from "@/server/auth-flow";
import { getAuthShellContent } from "@/server/public-data";

type SignInPageProps = {
  searchParams?: AuthPageSearchParams;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const callbackUrl = getAuthCallbackUrl(searchParams);
  const errorCode = getFirstSearchParam(searchParams?.error);
  const session = await auth();

  if (session?.user) {
    redirect(
      session.user.onboardingComplete ? callbackUrl : getOnboardingPath(session.user.role),
    );
  }

  const shellContent = await getAuthShellContent();

  return (
    <AuthShell {...shellContent}>
      <SignInView
        callbackUrl={callbackUrl}
        errorCode={errorCode}
        emailEnabled={isEmailAuthEnabled}
      />
    </AuthShell>
  );
}

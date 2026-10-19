import { auth } from "@/Backend/auth";
import { AlreadyAuthenticatedView } from "@/Frontend/views/auth/already-authenticated-view";
import { AuthShell } from "@/Frontend/views/auth/auth-shell";
import { SignupView } from "@/Frontend/views/auth/signup-view";
import {
  AuthPageSearchParams,
  getAuthCallbackUrl,
  getFirstSearchParam,
  isTruthySearchParam,
} from "@/Frontend/views/auth/search-params";
import { AUTH_DEFAULT_REDIRECT, getOnboardingPath } from "@/shared/auth-flow";
import { isGoogleAuthEnabled } from "@/Backend/server/auth";
import { getPublicStudentCount } from "@/Backend/server/public-data";

type SignUpPageProps = {
  searchParams?: AuthPageSearchParams;
};

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const callbackUrl = getAuthCallbackUrl(searchParams);
  const errorCode = getFirstSearchParam(searchParams?.error);
  const isCompletingOAuth = isTruthySearchParam(searchParams?.complete);
  const session = await auth();

  const isForcingRole = !!searchParams?.role;
  const continueHref =
    session?.user
      ? session.user.onboardingComplete
        ? callbackUrl
        : getOnboardingPath(session.user.role)
      : AUTH_DEFAULT_REDIRECT;

  if (session?.user && !isCompletingOAuth && !isForcingRole) {
    const studentCount = await getPublicStudentCount();

    return (
      <AuthShell studentCount={studentCount}>
        <AlreadyAuthenticatedView
          continueHref={continueHref}
          callbackUrl={callbackUrl}
          role={session.user.role}
          onboardingComplete={session.user.onboardingComplete}
          mode="signup"
        />
      </AuthShell>
    );
  }

  const studentCount = await getPublicStudentCount();

  return (
    <AuthShell studentCount={studentCount}>
      <SignupView
        callbackUrl={callbackUrl}
        errorCode={errorCode}
        isCompletingOAuth={isCompletingOAuth}
        googleEnabled={isGoogleAuthEnabled}
      />
    </AuthShell>
  );
}

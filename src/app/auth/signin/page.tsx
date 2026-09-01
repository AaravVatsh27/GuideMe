import { auth } from "@/Backend/auth";
import { AlreadyAuthenticatedView } from "@/Frontend/views/auth/already-authenticated-view";
import { AuthShell } from "@/Frontend/views/auth/auth-shell";
import { SignInView } from "@/Frontend/views/auth/signin-view";
import {
  AuthPageSearchParams,
  getAuthCallbackUrl,
  getFirstSearchParam,
} from "@/Frontend/views/auth/search-params";
import { isEmailAuthEnabled } from "@/Backend/server/auth";
import {
  AUTH_DEFAULT_REDIRECT,
  getOnboardingPath,
} from "@/Backend/server/auth-flow";

type SignInPageProps = {
  searchParams?: AuthPageSearchParams;
};

export default async function SignInPage({
  searchParams,
}: SignInPageProps) {
  const callbackUrl =
    getAuthCallbackUrl(searchParams);

  const errorCode =
    getFirstSearchParam(searchParams?.error);

  const session = await auth();

  const continueHref =
    session?.user
      ? session.user.onboardingComplete
        ? callbackUrl
        : getOnboardingPath(session.user.role)
      : AUTH_DEFAULT_REDIRECT;

  if (session?.user) {
    return (
      <AuthShell>
        <AlreadyAuthenticatedView
          continueHref={continueHref}
          callbackUrl={callbackUrl}
          role={session.user.role}
          onboardingComplete={
            session.user.onboardingComplete
          }
          mode="signin"
        />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <SignInView
        callbackUrl={callbackUrl}
        errorCode={errorCode}
        emailEnabled={isEmailAuthEnabled}
      />
    </AuthShell>
  );
}
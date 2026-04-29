export const AUTH_DEFAULT_REDIRECT = "/dashboard";
export const SIGNUP_ROLE_STORAGE_KEY = "guideme.signup.role";

const AUTH_ERROR_COPY: Record<string, { title: string; description: string }> = {
  OAuthAccountNotLinked: {
    title: "Use the original sign-in method",
    description:
      "That email is already linked to a different sign-in method. Try the provider you used the first time.",
  },
  EmailSignin: {
    title: "Magic link could not be sent",
    description:
      "We could not send the sign-in email right now. Double-check the address and try again in a moment.",
  },
  CredentialsSignin: {
    title: "Sign-in was rejected",
    description: "Those credentials were not accepted. Try again or use another sign-in method.",
  },
  AccessDenied: {
    title: "Access denied",
    description: "Your sign-in request was blocked. If this keeps happening, try a different account.",
  },
  Verification: {
    title: "That magic link is no longer valid",
    description: "Magic links expire after a while and can only be used once. Request a fresh one.",
  },
  Configuration: {
    title: "Authentication is not configured correctly",
    description: "Something is off in the auth setup. Please try again shortly.",
  },
  Default: {
    title: "We could not sign you in",
    description: "Something went wrong while starting your session. Please try again.",
  },
};

export function getSafeRedirectTo(
  value: string | null | undefined,
  fallback = AUTH_DEFAULT_REDIRECT,
) {
  if (!value || !value.startsWith("/")) {
    return fallback;
  }

  return value;
}

export function getOnboardingPath(role: string | null | undefined) {
  const normalizedRole = typeof role === "string" ? role.toLowerCase() : "student";
  return `/onboarding/${normalizedRole}`;
}

export function getAuthErrorCopy(code: string | null | undefined) {
  if (!code) {
    return null;
  }

  return AUTH_ERROR_COPY[code] ?? AUTH_ERROR_COPY.Default;
}

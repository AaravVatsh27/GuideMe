export const routes = {
  signIn: "/auth/signin",
  signInError: "/auth/error",
  dashboard: "/dashboard",
  admin: "/admin",
  onboarding: "/onboarding",
  session: "/session",
} as const;

export function getOnboardingPathForRole(role?: string | null) {
  const normalizedRole = typeof role === "string" ? role.toLowerCase() : "student";
  return `${routes.onboarding}/${normalizedRole}`;
}

export function getSessionPath(sessionId: string) {
  return `${routes.session}/${sessionId}`;
}

/**
 * Middleware-protected paths. Kept inline in `middleware.ts` because
 * Next.js statically analyses `config.matcher` at build time and only
 * accepts literal arrays.
 */
export const MIDDLEWARE_PROTECTED_PATHS = [
  routes.dashboard,
  routes.session,
  routes.admin,
  routes.onboarding,
] as const;

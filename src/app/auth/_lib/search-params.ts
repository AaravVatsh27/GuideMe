import { AUTH_DEFAULT_REDIRECT, getSafeRedirectTo } from "@/server/auth-flow";

export type AuthPageSearchParams = Record<string, string | string[] | undefined>;

export function getFirstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function getAuthCallbackUrl(
  searchParams: AuthPageSearchParams | undefined,
  fallback = AUTH_DEFAULT_REDIRECT,
) {
  return getSafeRedirectTo(getFirstSearchParam(searchParams?.callbackUrl), fallback);
}

export function isTruthySearchParam(value: string | string[] | undefined) {
  const normalized = getFirstSearchParam(value)?.toLowerCase();

  return normalized === "1" || normalized === "true" || normalized === "yes";
}

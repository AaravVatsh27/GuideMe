import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authEdgeConfig } from "@/Backend/server/auth-edge";
import { getOnboardingPath } from "@/shared/auth-flow";

const { auth } = NextAuth(authEdgeConfig);

const ADMIN_SIGNIN_HEADER = "x-mentra-admin-signin";

function redirectTo(url: URL, pathname: string) {
  return NextResponse.redirect(new URL(pathname, url));
}

export default auth((request) => {
  const { nextUrl } = request;
  const { pathname, search } = nextUrl;
  const session = request.auth;
  const user = session?.user;

  // The admin layout trusts this header, so a copy sent by the client is always dropped
  // and it is only set by the middleware itself, for the admin sign-in page.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete(ADMIN_SIGNIN_HEADER);

  if (pathname === "/admin/signin") {
    requestHeaders.set(ADMIN_SIGNIN_HEADER, "1");

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  if (!user) {
    const signInUrl = new URL("/auth/signin", nextUrl);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  const onboardingPath = getOnboardingPath(user.role);
  const isOnboardingPath =
    pathname === onboardingPath || pathname.startsWith(`${onboardingPath}/`);

  if (!user.onboardingComplete && !isOnboardingPath) {
    return redirectTo(nextUrl, onboardingPath);
  }

  if (pathname.startsWith("/dashboard") && user.role === "ADMIN") {
    return redirectTo(nextUrl, "/admin");
  }

  if (pathname.startsWith("/admin") && user.role !== "ADMIN") {
    return redirectTo(
      nextUrl,
      user.onboardingComplete ? "/dashboard" : onboardingPath,
    );
  }

  if (pathname.startsWith("/onboarding") && !isOnboardingPath) {
    return redirectTo(nextUrl, onboardingPath);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: ["/dashboard/:path*", "/session/:path*", "/admin/:path*", "/onboarding/:path*"],
};

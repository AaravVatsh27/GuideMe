import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authEdgeConfig } from "@/Backend/server/auth-edge";
import { getOnboardingPath } from "@/Backend/server/auth-flow";

const { auth } = NextAuth(authEdgeConfig);

function redirectTo(url: URL, pathname: string) {
  return NextResponse.redirect(new URL(pathname, url));
}

export default auth((request) => {
  const { nextUrl } = request;
  const { pathname, search } = nextUrl;
  const session = request.auth;
  const user = session?.user;

  if (pathname === "/admin/signin") {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-mentra-admin-signin", "1");

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

  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/session/:path*", "/admin/:path*", "/onboarding/:path*"],
};

import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth";
import {
  getOnboardingPathForRole,
  routes,
} from "@/lib/routes";

const { auth } = NextAuth(authConfig);

function redirectTo(url: URL, pathname: string) {
  return NextResponse.redirect(new URL(pathname, url));
}

export default auth((request) => {
  const { nextUrl } = request;
  const { pathname, search } = nextUrl;
  const session = request.auth;
  const user = session?.user;

  if (!user) {
    const signInUrl = new URL(routes.signIn, nextUrl);
    signInUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(signInUrl);
  }

  const onboardingPath = getOnboardingPathForRole(user.role);
  const isOnboardingPath =
    pathname === onboardingPath || pathname.startsWith(`${onboardingPath}/`);

  if (!user.onboardingComplete && !isOnboardingPath) {
    return redirectTo(nextUrl, onboardingPath);
  }

  if (pathname.startsWith(routes.dashboard) && user.role === "ADMIN") {
    return redirectTo(nextUrl, routes.admin);
  }

  if (pathname.startsWith(routes.admin) && user.role !== "ADMIN") {
    return redirectTo(
      nextUrl,
      user.onboardingComplete ? routes.dashboard : onboardingPath,
    );
  }

  if (pathname.startsWith(routes.onboarding) && !isOnboardingPath) {
    return redirectTo(nextUrl, onboardingPath);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/session/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
  ],
};

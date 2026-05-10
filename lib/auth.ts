import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

import { routes } from "@/lib/routes";

const AUTH_ROLES = ["STUDENT", "MENTOR", "ADMIN"] as const;

type AuthRole = (typeof AUTH_ROLES)[number];
type AuthClaims = {
  id?: string;
  role?: string;
  onboardingComplete?: boolean;
};

function isAuthRole(value: unknown): value is AuthRole {
  return typeof value === "string" && AUTH_ROLES.includes(value as AuthRole);
}

export const authConfig = {
  providers: [Google],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: routes.signIn,
    error: routes.signInError,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (!user) {
        return token;
      }

      const claims = user as AuthClaims;

      token.sub = claims.id ?? token.sub;
      token.role = isAuthRole(claims.role) ? claims.role : "STUDENT";
      token.onboardingComplete = Boolean(claims.onboardingComplete);

      return token;
    },
    async session({ session, token }) {
      if (!session.user) {
        return session;
      }

      session.user.id = token.sub ?? "";
      session.user.role = isAuthRole(token.role) ? token.role : "STUDENT";
      session.user.onboardingComplete = Boolean(token.onboardingComplete);

      return session;
    },
  },
} satisfies NextAuthConfig;

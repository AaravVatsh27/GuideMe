import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

const AUTH_ROLES = ["STUDENT", "MENTOR", "ADMIN"] as const;
export const isEmailAuthEnabled = Boolean(
  process.env.RESEND_API_KEY && process.env.EMAIL_FROM,
);

type AuthRole = (typeof AUTH_ROLES)[number];
type AuthClaims = {
  id?: string;
  role?: string;
  onboardingComplete?: boolean;
};
type SessionUpdateClaims = {
  user?: AuthClaims;
};

function isAuthRole(value: unknown): value is AuthRole {
  return typeof value === "string" && AUTH_ROLES.includes(value as AuthRole);
}

export const authConfig = {
  providers: [
    Google,
    ...(isEmailAuthEnabled
      ? [
          Resend({
            apiKey: process.env.RESEND_API_KEY!,
            from: process.env.EMAIL_FROM!,
          }),
        ]
      : []),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update") {
        const update = session as SessionUpdateClaims | undefined;
        const claims = update?.user;

        if (claims?.role && isAuthRole(claims.role)) {
          token.role = claims.role;
        }

        if (typeof claims?.onboardingComplete === "boolean") {
          token.onboardingComplete = claims.onboardingComplete;
        }

        return token;
      }

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

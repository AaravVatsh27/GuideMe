import type { NextAuthConfig } from "next-auth";

const AUTH_ROLES = ["STUDENT", "MENTOR", "ADMIN"] as const;

type AuthRole = (typeof AUTH_ROLES)[number];

function isAuthRole(value: unknown): value is AuthRole {
  return typeof value === "string" && AUTH_ROLES.includes(value as AuthRole);
}

export const authEdgeConfig = {
  trustHost: true,
  providers: [],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
    verifyRequest: "/auth/verify",
  },
  callbacks: {
    async jwt({ token }) {
      // The edge runtime cannot reach the database, so it never changes claims.
      // Session updates are handled by the Node config, which re-reads them from the database.
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
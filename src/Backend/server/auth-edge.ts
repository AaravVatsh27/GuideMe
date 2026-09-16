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
    async jwt({ token, trigger, session }) {
      if (trigger === "update") {
        const update = session as { user?: { role?: unknown; onboardingComplete?: unknown } };
        const claims = update?.user;

        if (claims?.role && isAuthRole(claims.role)) {
          token.role = claims.role;
        }

        if (typeof claims?.onboardingComplete === "boolean") {
          token.onboardingComplete = claims.onboardingComplete;
        }

        return token;
      }

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
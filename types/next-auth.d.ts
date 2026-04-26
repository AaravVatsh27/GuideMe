import type { DefaultSession } from "next-auth";
import "next-auth";
import "next-auth/jwt";

type AppRole = "STUDENT" | "MENTOR" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: AppRole;
      onboardingComplete: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: AppRole;
    onboardingComplete: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    onboardingComplete?: boolean;
  }
}

import NextAuth from "next-auth";

import { GuideMeAuthAdapter } from "@/server/auth-adapter";
import { authConfig } from "@/server/auth";

export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: updateSession,
} = NextAuth({
  adapter: GuideMeAuthAdapter(),
  ...authConfig,
});

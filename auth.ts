import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { authConfig } from "@/lib/auth";
import { db } from "@/lib/db";

// The current Prisma schema still needs the Auth.js adapter tables
// before database-backed auth persistence will function at runtime.
export const {
  handlers,
  auth,
  signIn,
  signOut,
  unstable_update: updateSession,
} = NextAuth({
  adapter: PrismaAdapter(db),
  ...authConfig,
});

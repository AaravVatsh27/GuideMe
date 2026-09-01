import NextAuth from "next-auth";

import { GuideMeAuthAdapter } from "@/Backend/server/auth-adapter";
import { authConfig } from "@/Backend/server/auth";

const LOCAL_DEV_AUTH_ORIGIN = "http://localhost:3000";
const PUBLIC_APP_URL_ENV_KEY = "NEXT_PUBLIC_APP_URL";

function isLocalhostUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

if (process.env.NODE_ENV !== "production") {
  for (const envKey of ["AUTH_URL", "NEXTAUTH_URL"] as const) {
    const envValue = process.env[envKey]?.trim();

    if (!envValue || isLocalhostUrl(envValue)) {
      process.env[envKey] = LOCAL_DEV_AUTH_ORIGIN;
    }
  }

  const publicAppUrl = process.env[PUBLIC_APP_URL_ENV_KEY]?.trim();

  if (!publicAppUrl) {
    process.env[PUBLIC_APP_URL_ENV_KEY] = LOCAL_DEV_AUTH_ORIGIN;
  }
}

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

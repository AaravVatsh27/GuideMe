import type {
  Adapter,
  AdapterAccount,
  AdapterUser,
  VerificationToken,
} from "@auth/core/adapters";
import { Role } from "@prisma/client";

import { db } from "@/server/db";

type AppAdapterUser = AdapterUser & {
  role: Role;
  onboardingComplete: boolean;
};

type StoredUser = {
  id: string;
  email: string;
  name: string;
  image: string | null;
  emailVerified: boolean;
  role: Role;
  onboardingComplete: boolean;
};

type StoredAccount = {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
};

const userSelect = {
  id: true,
  email: true,
  name: true,
  image: true,
  emailVerified: true,
  role: true,
  onboardingComplete: true,
} as const;

const accountSelect = {
  id: true,
  userId: true,
  type: true,
  provider: true,
  providerAccountId: true,
  refresh_token: true,
  access_token: true,
  expires_at: true,
  token_type: true,
  scope: true,
  id_token: true,
  session_state: true,
} as const;

function getFallbackName(email: string) {
  const localPart = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();

  if (!localPart) {
    return "GuideMe User";
  }

  return localPart.replace(/\b\w/g, (character) => character.toUpperCase());
}

function isRole(value: unknown): value is Role {
  return value === Role.STUDENT || value === Role.MENTOR || value === Role.ADMIN;
}

function toAdapterUser(user: StoredUser): AppAdapterUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    emailVerified: user.emailVerified ? new Date(0) : null,
    role: user.role,
    onboardingComplete: user.onboardingComplete,
  };
}

function toAdapterAccount(account: StoredAccount): AdapterAccount {
  return {
    id: account.id,
    userId: account.userId,
    type: account.type as AdapterAccount["type"],
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    refresh_token: account.refresh_token ?? undefined,
    access_token: account.access_token ?? undefined,
    expires_at: account.expires_at ?? undefined,
    token_type: account.token_type
      ? (account.token_type.toLowerCase() as Lowercase<string>)
      : undefined,
    scope: account.scope ?? undefined,
    id_token: account.id_token ?? undefined,
    session_state: account.session_state ?? undefined,
  };
}

export function GuideMeAuthAdapter(): Adapter {
  return {
    async createUser(user) {
      const createdUser = await db.user.create({
        data: {
          email: user.email,
          name:
            (typeof user.name === "string" && user.name.trim()) || getFallbackName(user.email),
          image: user.image ?? null,
          emailVerified: Boolean(user.emailVerified),
          role: Role.STUDENT,
          onboardingComplete: false,
        },
        select: userSelect,
      });

      return toAdapterUser(createdUser);
    },
    async getUser(id) {
      const user = await db.user.findUnique({
        where: { id },
        select: userSelect,
      });

      return user ? toAdapterUser(user) : null;
    },
    async getUserByEmail(email) {
      const user = await db.user.findUnique({
        where: { email },
        select: userSelect,
      });

      return user ? toAdapterUser(user) : null;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const account = await db.account.findFirst({
        where: { provider, providerAccountId },
        select: {
          user: {
            select: userSelect,
          },
        },
      });

      return account?.user ? toAdapterUser(account.user) : null;
    },
    async updateUser(user) {
      const data: {
        email?: string;
        name?: string;
        image?: string | null;
        emailVerified?: boolean;
        role?: Role;
        onboardingComplete?: boolean;
      } = {};

      if (typeof user.email === "string") {
        data.email = user.email;
      }

      if (typeof user.name === "string" && user.name.trim()) {
        data.name = user.name;
      }

      if (user.image !== undefined) {
        data.image = user.image ?? null;
      }

      if (user.emailVerified !== undefined) {
        data.emailVerified = Boolean(user.emailVerified);
      }

      if (isRole((user as Partial<AppAdapterUser>).role)) {
        data.role = (user as Partial<AppAdapterUser>).role;
      }

      if (typeof (user as Partial<AppAdapterUser>).onboardingComplete === "boolean") {
        data.onboardingComplete = (user as Partial<AppAdapterUser>).onboardingComplete;
      }

      const updatedUser = await db.user.update({
        where: { id: user.id },
        data,
        select: userSelect,
      });

      return toAdapterUser(updatedUser);
    },
    async deleteUser(userId) {
      const deletedUser = await db.user.delete({
        where: { id: userId },
        select: userSelect,
      });

      return toAdapterUser(deletedUser);
    },
    async linkAccount(account) {
      const createdAccount = await db.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token ?? null,
          access_token: account.access_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state:
            typeof account.session_state === "string" ? account.session_state : null,
        },
        select: accountSelect,
      });

      return toAdapterAccount(createdAccount);
    },
    async unlinkAccount({ provider, providerAccountId }) {
      const account = await db.account.findFirst({
        where: { provider, providerAccountId },
        select: accountSelect,
      });

      if (!account) {
        return undefined;
      }

      await db.account.delete({
        where: { id: account.id },
      });

      return toAdapterAccount(account);
    },
    async createSession(session) {
      return session;
    },
    async getSessionAndUser() {
      return null;
    },
    async updateSession() {
      return null;
    },
    async deleteSession() {
      return null;
    },
    async createVerificationToken(verificationToken) {
      const createdToken = await db.verificationToken.create({
        data: verificationToken,
      });

      return {
        identifier: createdToken.identifier,
        token: createdToken.token,
        expires: createdToken.expires,
      } satisfies VerificationToken;
    },
    async useVerificationToken({ identifier, token }) {
      const verificationToken = await db.verificationToken.findFirst({
        where: { identifier, token },
      });

      if (!verificationToken) {
        return null;
      }

      await db.verificationToken.deleteMany({
        where: { identifier, token },
      });

      return {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires,
      } satisfies VerificationToken;
    },
    async getAccount(providerAccountId, provider) {
      const account = await db.account.findFirst({
        where: { provider, providerAccountId },
        select: accountSelect,
      });

      return account ? toAdapterAccount(account) : null;
    },
  };
}

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  const datasourceUrl = process.env.DATABASE_URL;

  if (!datasourceUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  return new PrismaClient({
    adapter: new PrismaPg(datasourceUrl),
  });
}

function getPrismaClient() {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const prisma = createPrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
}

export const db =
  globalForPrisma.prisma ??
  new Proxy({} as PrismaClient, {
    get(_target, property, receiver) {
      const prisma = getPrismaClient();
      const value = Reflect.get(prisma, property, receiver);

      return typeof value === "function" ? value.bind(prisma) : value;
    },
  });

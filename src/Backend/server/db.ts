import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

/**
 * Supabase appends `?pgbouncer=true` to the DATABASE_URL so Prisma skips
 * prepared statements when talking to PgBouncer / Supavisor. However `pg.Pool`
 * doesn't understand that query-string parameter and will fail if it's left in.
 * Strip it before handing the URL to the pool.
 */
function cleanPoolUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("pgbouncer");
    return parsed.toString();
  } catch {
    return url;
  }
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  pool?: Pool;
};

function buildDb(): PrismaClient {
  const datasourceUrl = process.env.DATABASE_URL;

  if (!datasourceUrl) {
    throw new Error("Missing DATABASE_URL environment variable");
  }

  // Reuse the pool across HMR reloads in dev so we never open more than
  // `max` connections to Supabase's pooler, regardless of how many times
  // Next.js re-evaluates this module.
  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: cleanPoolUrl(datasourceUrl),
      // Keep well below Supabase's 15-connection session-mode cap.
      // Supavisor (port 5432) doesn't have this cap, but a low max is
      // still good practice for a dev / small-instance setup.
      max: 5,
      idleTimeoutMillis: 10_000,      // release idle connections after 10 s
      connectionTimeoutMillis: 5_000, // fail fast rather than queue indefinitely
    });

  // Always persist the pool on globalThis so it survives HMR re-evaluation.
  globalForPrisma.pool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// Single, cached PrismaClient for the lifetime of the Node process.
// In dev, Next.js HMR re-evaluates modules but globalThis persists, so
// the first run creates the client and every subsequent hot-reload reuses it.
export const db: PrismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = buildDb());

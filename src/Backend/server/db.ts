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

function readPositiveInt(name: string, fallback: number): number {
  const value = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
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
      max: readPositiveInt("DATABASE_POOL_MAX", 5),
      // Opening a connection to the pooler takes ~2 s (TLS handshake to a distant
      // region), so keep connections warm instead of dropping them after a few
      // seconds and paying that cost again on the next request.
      idleTimeoutMillis: readPositiveInt("DATABASE_POOL_IDLE_TIMEOUT_MS", 60_000),
      keepAlive: true,
      // Allow for slow handshakes; 5 s was too tight and pages like the admin
      // overview (many queries in parallel) failed with "connection timeout".
      connectionTimeoutMillis: readPositiveInt("DATABASE_CONNECT_TIMEOUT_MS", 20_000),
    });

  // Always persist the pool on globalThis so it survives HMR re-evaluation.
  globalForPrisma.pool = pool;

  // @prisma/adapter-pg ships its own copy of @types/pg, so the two Pool types don't line up.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter });
}

// Single, cached PrismaClient for the lifetime of the Node process.
// In dev, Next.js HMR re-evaluates modules but globalThis persists, so
// the first run creates the client and every subsequent hot-reload reuses it.
export const db: PrismaClient =
  globalForPrisma.prisma ?? (globalForPrisma.prisma = buildDb());

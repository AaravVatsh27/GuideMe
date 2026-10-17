/**
 * Resolves the client IP in a way a client cannot spoof by sending its own
 * X-Forwarded-For header.
 *
 * - On Vercel, the platform overwrites X-Forwarded-For / X-Real-IP with the real client IP.
 * - Elsewhere, each trusted proxy appends the address it received the request from, so the
 *   client IP is the entry TRUSTED_PROXY_HOPS positions from the right (default 1: one proxy).
 *   Entries further left were supplied by the client and are ignored.
 */
export function getClientIp(request: Request): string | null {
  const headers = request.headers;

  if (process.env.VERCEL) {
    return (
      headers.get("x-real-ip")?.trim() ||
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      null
    );
  }

  const forwardedFor = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (forwardedFor && forwardedFor.length > 0) {
    const configuredHops = Number.parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10);
    const hops = Number.isFinite(configuredHops) && configuredHops > 0 ? configuredHops : 1;
    return forwardedFor[Math.max(forwardedFor.length - hops, 0)] ?? null;
  }

  return headers.get("x-real-ip")?.trim() || null;
}

/**
 * Public contact details, set per deployment. Both values are NEXT_PUBLIC_ so the same
 * settings reach client components (error pages, error boundary) and the server.
 */

/** Where people write for help. Set NEXT_PUBLIC_SUPPORT_EMAIL; this default is used until then. */
export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@mentra.in";

/** The real WhatsApp community invite link, or null when it hasn't been set up. */
export const COMMUNITY_WHATSAPP_URL = process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL?.trim() || null;

/** A mailto: link to support with a subject (and optional body), safely encoded. */
export function supportMailto(subject: string, body?: string): `mailto:${string}` {
  const params = new URLSearchParams({ subject, ...(body ? { body } : {}) });
  return `mailto:${SUPPORT_EMAIL}?${params.toString().replace(/\+/g, "%20")}`;
}

/**
 * Where "Join the community" buttons go: the WhatsApp invite when one is set, otherwise an
 * email to support asking for an invite (instead of a WhatsApp link that leads nowhere).
 */
export const COMMUNITY_JOIN_URL = COMMUNITY_WHATSAPP_URL ?? supportMailto("Community invite request");

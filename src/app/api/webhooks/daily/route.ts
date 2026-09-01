import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { log } from "@/Backend/lib/logger";

/**
 * Daily.co sends a HMAC-SHA256 signature in the `Daily-Webhook-Timestamp` and
 * `Daily-Webhook-Signature` headers. Verification uses the raw request body.
 *
 * Header format: Daily-Webhook-Signature: sha256=<hex>
 * See: https://docs.daily.co/reference/webhooks
 */
function verifyDailySignature(body: string, signature: string): boolean {
  const secret = process.env.DAILY_WEBHOOK_SECRET;

  if (!secret) {
    return false;
  }

  // Strip leading "sha256=" prefix if present
  const receivedHex = signature.startsWith("sha256=") ? signature.slice(7) : signature;

  const expected = createHmac("sha256", secret).update(body).digest("hex");

  const expectedBuf = Buffer.from(expected, "utf8");
  const receivedBuf = Buffer.from(receivedHex, "utf8");

  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  // Read raw body for signature verification — must happen before any JSON parse
  const body = await request.text();

  const signature =
    request.headers.get("daily-webhook-signature") ??
    request.headers.get("Daily-Webhook-Signature") ??
    "";

  if (!verifyDailySignature(body, signature)) {
    log.warn("Daily webhook signature verification failed", {
      requestId: metadata.requestId,
      route: "/api/webhooks/daily",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(body) as { type: string; payload?: unknown };

  switch (event.type) {
    case "meeting.started":
    case "meeting.ended":
    case "participant.joined":
    case "participant.left":
      // Extend here with DB updates (e.g., update session.meetingStartedAt)
      log.info("Daily webhook received supported event", {
        requestId: metadata.requestId,
        route: "/api/webhooks/daily",
        eventType: event.type,
      });
      break;

    default:
      // Unknown event — acknowledge silently so Daily doesn't retry
      break;
  }

  return NextResponse.json({ received: true });
}, "/api/webhooks/daily");

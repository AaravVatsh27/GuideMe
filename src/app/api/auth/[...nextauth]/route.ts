import { handlers } from "@/Backend/auth";
import { getClientIp } from "@/Backend/lib/client-ip";
import { signInEmailLimiter, signInIpLimiter } from "@/Backend/lib/ratelimit";

export const runtime = "nodejs";

export const { GET } = handlers;

const SIGN_IN_PATH_PREFIX = "/api/auth/signin/";

function rateLimitedResponse(request: Request) {
  const errorUrl = new URL("/auth/error?error=RateLimited", request.url).toString();

  // next-auth's client asks for a JSON redirect target; plain form posts get a real redirect.
  if (request.headers.get("x-auth-return-redirect")) {
    return Response.json({ url: errorUrl }, { status: 429 });
  }

  return Response.redirect(errorUrl, 303);
}

/**
 * Throttles sign-in requests (magic links and OAuth starts) per IP, and magic-link
 * emails per address, before handing off to Auth.js. Admin password attempts are
 * throttled separately in the credentials provider.
 */
export async function POST(request: Request) {
  const { pathname } = new URL(request.url);

  if (pathname.startsWith(SIGN_IN_PATH_PREFIX)) {
    const ipCheck = await signInIpLimiter.limit(`ip:${getClientIp(request) ?? "unknown"}`);

    if (!ipCheck.success) {
      return rateLimitedResponse(request);
    }

    const form = await request.clone().formData().catch(() => null);
    const email = form?.get("email");

    if (typeof email === "string" && email.trim()) {
      const emailCheck = await signInEmailLimiter.limit(`email:${email.trim().toLowerCase()}`);

      if (!emailCheck.success) {
        return rateLimitedResponse(request);
      }
    }
  }

  return handlers.POST(request as Parameters<typeof handlers.POST>[0]);
}

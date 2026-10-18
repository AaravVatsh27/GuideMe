import type { Session } from "next-auth";

import { auth } from "@/Backend/auth";
import {
  type ApiHandlerContext,
  apiErrorResponse,
  applyRateLimit,
  getRateLimitId,
  withApiErrorHandling,
} from "@/Backend/lib/api-helpers";
import { generalLimiter, type RateLimiter } from "@/Backend/lib/ratelimit";
import type { AuthRole } from "@/shared/roles";

type AuthMode = "required" | "optional" | "none";

export type AuthenticatedSession = Session & {
  user: Session["user"] & { id: string; role: AuthRole };
};

type RouteOptions<TAuth extends AuthMode> = {
  /** "required" (default): 401 without a signed-in user. "optional": session may be null. "none": never read. */
  auth?: TAuth;
  /** Roles allowed to call the route; anyone signed in when omitted. */
  roles?: readonly AuthRole[];
  /** Message for the 403 response when the role doesn't match. */
  forbiddenMessage?: string;
  /** Limiter applied per user (or per IP when signed out). Defaults to the general limiter; null disables it. */
  rateLimit?: RateLimiter | null;
};

type RouteTools<TAuth extends AuthMode> = {
  metadata: ApiHandlerContext;
  session: TAuth extends "required" ? AuthenticatedSession : AuthenticatedSession | null;
};

type RouteHandler<TAuth extends AuthMode, TContext> = (
  request: Request,
  context: TContext,
  tools: RouteTools<TAuth>,
) => Promise<Response> | Response;

/**
 * The single entry point for API routes. In one place it:
 * - reads the session and records the user on logs and Sentry,
 * - applies the rate limit (per user, or per IP when signed out),
 * - rejects signed-out callers (401) and callers with the wrong role (403),
 * - turns thrown errors into the standard `{ success: false, error, status, issues }` shape.
 *
 * Each route only declares what it needs, so a check can't be forgotten.
 */
export function defineRoute<TAuth extends AuthMode = "required", TContext = unknown>(
  options: RouteOptions<TAuth>,
  handler: RouteHandler<TAuth, TContext>,
  route: string,
) {
  const authMode: AuthMode = options.auth ?? "required";
  const limiter = options.rateLimit === undefined ? generalLimiter : options.rateLimit;

  return withApiErrorHandling<Request, TContext>(async (request, context, metadata) => {
    const session = authMode === "none" ? null : ((await auth()) as AuthenticatedSession | null);
    const userId = session?.user?.id || null;
    metadata.setUserId(userId);

    const denied = await applyRateLimit(limiter, getRateLimitId(request, userId));
    if (denied) return denied;

    if (authMode === "required" && !userId) {
      return apiErrorResponse("Unauthorized", 401);
    }

    if (options.roles && options.roles.length > 0) {
      const role = session?.user?.role;

      if (!role || !options.roles.includes(role)) {
        return apiErrorResponse(
          options.forbiddenMessage ?? `Access restricted. Required role: ${options.roles.join(" or ")}.`,
          403,
        );
      }
    }

    return handler(request, context, {
      metadata,
      session: (userId ? session : null) as RouteTools<TAuth>["session"],
    });
  }, route);
}

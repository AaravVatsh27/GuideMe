import * as Sentry from "@sentry/nextjs";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/client";
import type { Ratelimit } from "@upstash/ratelimit";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ZodError } from "zod";

import { log } from "@/lib/logger";

interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  error: string;
  status: number;
  details?: unknown;
}

type ApiRouteMetadata = {
  requestId: string;
  route: string;
  userId?: string | null;
};

type ApiStatusError = Error & { status: number; details?: unknown };

type ApiHandlerContext = ApiRouteMetadata & {
  setUserId: (userId?: string | null) => void;
};

type AppRouteHandler<TRequest extends Request = Request, TContext = unknown> = (
  request: TRequest,
  context: TContext,
  metadata: ApiHandlerContext,
) => Promise<Response> | Response;

type BuiltApiErrorResponse = {
  capture: boolean;
  message: string;
  status: number;
  details?: unknown;
};

// ─── Identifier helpers ────────────────────────────────────────────────────────

/**
 * Returns the best available identifier for rate-limiting:
 * prefers user ID (authenticated), falls back to x-forwarded-for, then remote addr.
 */
export function getRateLimitId(
  request: NextRequest | Request,
  userId?: string | null,
): string {
  if (userId) return `user:${userId}`;

  // Cast to access headers safely
  const headers =
    request instanceof Request
      ? request.headers
      : (request as NextRequest).headers;

  const forwarded = headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  return `ip:${ip}`;
}

// ─── Rate limiting ─────────────────────────────────────────────────────────────

/**
 * Checks the rate limit and returns a 429 NextResponse if exceeded, or null if allowed.
 *
 * Usage:
 *   const denied = await applyRateLimit(searchLimiter, getRateLimitId(request, userId));
 *   if (denied) return denied;
 */
export async function applyRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<NextResponse | null> {
  if (!limiter) return null; // Redis not configured — skip in dev

  const { success, limit, reset } = await limiter.limit(identifier);

  if (!success) {
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
    return NextResponse.json(
      apiError("Too many requests. Please slow down.", 429),
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(reset),
        },
      },
    );
  }

  return null;
}

// ─── Response helpers ─────────────────────────────────────────────────────────

/**
 * Consistent success envelope: { success: true, data: ... }
 */
export function apiResponse<T>(data: T, httpStatus = 200): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, data } as ApiSuccessResponse<T>, { status: httpStatus });
}

/**
 * Consistent error envelope: { success: false, error: ..., details?: ... }
 */
export function apiError(
  message: string,
  status = 500,
  details?: unknown,
): ApiErrorResponse {
  return {
    success: false,
    error: message,
    status,
    ...(details !== undefined ? { details } : {}),
  };
}

export function apiErrorResponse(
  message: string,
  status = 500,
  details?: unknown,
  init?: ResponseInit,
) {
  return NextResponse.json(apiError(message, status, details), {
    status,
    ...init,
  });
}

function getRequestId(request: Request) {
  return request.headers.get("x-request-id")?.trim() || crypto.randomUUID();
}

function isApiStatusError(
  error: unknown,
): error is ApiStatusError {
  return (
    error instanceof Error &&
    "status" in error &&
    typeof (error as { status?: unknown }).status === "number"
  );
}

function buildErrorResponse(error: unknown): BuiltApiErrorResponse {
  if (error instanceof ZodError) {
    return {
      capture: false,
      message: "Validation failed",
      status: 400,
      details: error.flatten(),
    };
  }

  if (error instanceof SyntaxError && error.message.toLowerCase().includes("json")) {
    return {
      capture: false,
      message: "Invalid JSON body",
      status: 400,
      details: undefined,
    };
  }

  if (error instanceof PrismaClientKnownRequestError) {
    const prismaError = error;

    if (prismaError.code === "P2002") {
      return {
        capture: false,
        message: "Already exists",
        status: 409,
        details: undefined,
      };
    }

    if (prismaError.code === "P2025") {
      return {
        capture: false,
        message: "Not found",
        status: 404,
        details: undefined,
      };
    }
  }

  if (isApiStatusError(error)) {
    const statusError = error;

    return {
      capture: statusError.status >= 500,
      message: statusError.message || "Request failed",
      status: statusError.status,
      details: statusError.details,
    };
  }

  return {
    capture: true,
    message: "Internal server error",
    status: 500,
    details: undefined,
  };
}

function attachRequestId(response: Response, requestId: string) {
  response.headers.set("x-request-id", requestId);
  return response;
}

function captureUnexpectedError(error: unknown, metadata: ApiRouteMetadata) {
  Sentry.withScope((scope) => {
    scope.setTag("request_id", metadata.requestId);
    scope.setTag("route", metadata.route);

    if (metadata.userId) {
      scope.setUser({ id: metadata.userId });
    }

    Sentry.captureException(error);
  });
}

export function withApiErrorHandling<TRequest extends Request = Request, TContext = unknown>(
  handler: AppRouteHandler<TRequest, TContext>,
  route: string,
) {
  return async (request: TRequest, context: TContext) => {
    const metadata: ApiHandlerContext = {
      requestId: getRequestId(request),
      route,
      userId: null,
      setUserId(userId) {
        metadata.userId = userId ?? null;
      },
    };

    try {
      const response = await handler(request, context, metadata);
      return attachRequestId(response, metadata.requestId);
    } catch (error) {
      const failure = buildErrorResponse(error);

      if (failure.capture) {
        captureUnexpectedError(error, metadata);
        log.error("API route failed", error, {
          requestId: metadata.requestId,
          route: metadata.route,
          userId: metadata.userId,
          status: failure.status,
          method: request.method,
        });
      } else {
        log.warn("API route rejected request", {
          requestId: metadata.requestId,
          route: metadata.route,
          userId: metadata.userId,
          status: failure.status,
          method: request.method,
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
      }

      return attachRequestId(
        apiErrorResponse(failure.message, failure.status, failure.details),
        metadata.requestId,
      );
    }
  };
}

/**
 * Returns a 400 response for Zod validation failures using the flattened error format.
 */
export function validationError(
  flattenedErrors: { fieldErrors: Record<string, string[] | undefined>; formErrors: string[] },
): NextResponse {
  return apiErrorResponse("Validation failed", 400, flattenedErrors);
}

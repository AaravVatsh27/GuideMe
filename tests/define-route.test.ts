import { beforeEach, describe, expect, it, vi } from "vitest";

import { defineRoute } from "@/Backend/lib/define-route";

const { authMock, limitMock } = vi.hoisted(() => ({ authMock: vi.fn(), limitMock: vi.fn() }));

vi.mock("@/Backend/auth", () => ({ auth: () => authMock() }));
vi.mock("@/Backend/lib/ratelimit", () => ({
  generalLimiter: { limit: (id: string) => limitMock(id) },
}));
vi.mock("@sentry/nextjs", () => ({ withScope: vi.fn(), captureException: vi.fn() }));

const request = () => new Request("https://x.test/api/thing", { method: "POST" });
const ok = () => Response.json({ ok: true });

beforeEach(() => {
  authMock.mockReset();
  limitMock.mockReset().mockResolvedValue({ success: true, limit: 100, reset: Date.now() + 60_000 });
});

describe("defineRoute", () => {
  it("returns 401 to signed-out callers of a protected route", async () => {
    authMock.mockResolvedValue(null);
    const handler = vi.fn(ok);
    const res = await defineRoute({}, handler, "/test")(request(), {});

    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ success: false, error: "Unauthorized", status: 401 });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 403 when the role is not allowed", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT" } });
    const res = await defineRoute({ roles: ["ADMIN"], forbiddenMessage: "Admins only" }, ok, "/test")(request(), {});

    expect(res.status).toBe(403);
    expect((await res.json()).error).toBe("Admins only");
  });

  it("returns 429 when the rate limit is exceeded, keyed by user", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "STUDENT" } });
    limitMock.mockResolvedValue({ success: false, limit: 100, reset: Date.now() + 60_000 });
    const res = await defineRoute({}, ok, "/test")(request(), {});

    expect(res.status).toBe(429);
    expect(limitMock).toHaveBeenCalledWith("user:u1");
  });

  it("passes the session to the handler for allowed callers", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });
    const handler = vi.fn(async (_req: Request, _ctx: unknown, { session }: { session: { user: { id: string } } }) =>
      Response.json({ id: session.user.id }),
    );
    const res = await defineRoute({ roles: ["ADMIN"] }, handler, "/test")(request(), {});

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ id: "u1" });
  });

  it("never reads the session for public routes", async () => {
    const res = await defineRoute({ auth: "none" }, ok, "/test")(request(), {});

    expect(res.status).toBe(200);
    expect(authMock).not.toHaveBeenCalled();
  });

  it("turns thrown status errors into the standard error shape", async () => {
    authMock.mockResolvedValue({ user: { id: "u1", role: "ADMIN" } });
    const failing = async () => {
      throw Object.assign(new Error("Already processed"), { status: 409 });
    };
    const res = await defineRoute({}, failing, "/test")(request(), {});

    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ success: false, error: "Already processed", status: 409 });
  });
});

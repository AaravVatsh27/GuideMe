import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { defineRoute } from "@/Backend/lib/define-route";
import { JOBS, type JobName } from "@/Backend/server/jobs";

export const runtime = "nodejs";

type RouteParams = { params: { job: string } };

function isAuthorizedCron(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const header = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;

  if (!secret || header.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

/**
 * Runs a scheduled job. Vercel Cron calls these on the schedule in vercel.json and sends
 * `Authorization: Bearer $CRON_SECRET`; any other caller gets a 401.
 */
export const GET = defineRoute(
  { auth: "none", rateLimit: null },
  async (request: Request, context: RouteParams) => {
    if (!isAuthorizedCron(request)) {
      return apiErrorResponse("Unauthorized", 401);
    }

    const job = context.params.job;

    if (!(job in JOBS)) {
      return apiErrorResponse("Unknown job", 404);
    }

    const result = await JOBS[job as JobName]();
    return NextResponse.json({ job, ...result });
  },
  "/api/cron/[job]",
);

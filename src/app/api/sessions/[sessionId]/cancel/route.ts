import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { cancelSessionById, toSessionView } from "@/Backend/server/sessions";
import { defineRoute } from "@/Backend/lib/define-route";

const cancelSessionRequestSchema = z.object({
  reason: z.string().trim().min(10).max(280),
  noShow: z.boolean().optional(),
});

export const POST = defineRoute(
  {},
  async (request: Request, context: { params: { sessionId: string } }, { session }) => {
  const payload = await request.json().catch(() => null);
  const parsedBody = cancelSessionRequestSchema.safeParse(payload);

  if (!parsedBody.success) {
    return apiErrorResponse("Invalid cancellation payload", 400, parsedBody.error.flatten());
  }

  const result = await cancelSessionById({
    sessionId: context.params.sessionId,
    actorId: session.user.id,
    reason: parsedBody.data.reason,
    noShow: parsedBody.data.noShow,
  });

  return NextResponse.json({ ...result, session: toSessionView(result.session, session.user.id) });
}, "/api/sessions/[sessionId]/cancel");

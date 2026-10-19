import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { completeSessionById, toSessionView } from "@/Backend/server/sessions";
import { defineRoute } from "@/Backend/lib/define-route";

const completeSessionRequestSchema = z.object({
  transcript: z.string().trim().max(12000).optional(),
  endedAt: z.coerce.date().optional(),
});

export const POST = defineRoute(
  {},
  async (request: Request, context: { params: { sessionId: string } }, { session }) => {
  const payload = await request.json().catch(() => ({}));
  const parsedBody = completeSessionRequestSchema.safeParse(payload);

  if (!parsedBody.success) {
    return apiErrorResponse("Invalid completion payload", 400, z.flattenError(parsedBody.error));
  }

  const updatedSession = await completeSessionById({
    sessionId: context.params.sessionId,
    actorId: session.user.id,
    transcript: parsedBody.data.transcript,
    endedAt: parsedBody.data.endedAt,
  });

  return NextResponse.json(toSessionView(updatedSession, session.user.id));
}, "/api/sessions/[sessionId]/complete");

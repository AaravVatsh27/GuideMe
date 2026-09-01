import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/Backend/auth";
import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { completeSessionById } from "@/Backend/server/sessions";

const completeSessionRequestSchema = z.object({
  transcript: z.string().trim().max(12000).optional(),
  endedAt: z.coerce.date().optional(),
});

export const POST = withApiErrorHandling(async (
  request: Request,
  context: { params: { sessionId: string } },
  metadata,
) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  const payload = await request.json().catch(() => ({}));
  const parsedBody = completeSessionRequestSchema.safeParse(payload);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid completion payload",
        issues: parsedBody.error.flatten(),
      },
      { status: 400 },
    );
  }

  const updatedSession = await completeSessionById({
    sessionId: context.params.sessionId,
    actorId: session.user.id,
    transcript: parsedBody.data.transcript,
    endedAt: parsedBody.data.endedAt,
  });

  return NextResponse.json(updatedSession);
}, "/api/sessions/[sessionId]/complete");

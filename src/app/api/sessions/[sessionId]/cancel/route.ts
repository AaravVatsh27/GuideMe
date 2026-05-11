import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { withApiErrorHandling } from "@/lib/api-helpers";
import { cancelSessionById } from "@/server/sessions";

const cancelSessionRequestSchema = z.object({
  reason: z.string().trim().min(10).max(280),
  noShow: z.boolean().optional(),
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

  const payload = await request.json().catch(() => null);
  const parsedBody = cancelSessionRequestSchema.safeParse(payload);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid cancellation payload",
        issues: parsedBody.error.flatten(),
      },
      { status: 400 },
    );
  }

  const result = await cancelSessionById({
    sessionId: context.params.sessionId,
    actorId: session.user.id,
    reason: parsedBody.data.reason,
    noShow: parsedBody.data.noShow,
  });

  return NextResponse.json(result);
}, "/api/sessions/[sessionId]/cancel");

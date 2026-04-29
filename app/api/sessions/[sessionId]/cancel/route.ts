import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { cancelSessionById, SessionApiError } from "@/lib/sessions";

const cancelSessionRequestSchema = z.object({
  reason: z.string().trim().min(10).max(280),
  noShow: z.boolean().optional(),
});

function handleSessionError(error: unknown) {
  if (error instanceof SessionApiError) {
    return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(
  request: Request,
  context: { params: { sessionId: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  try {
    const result = await cancelSessionById({
      sessionId: context.params.sessionId,
      actorId: session.user.id,
      reason: parsedBody.data.reason,
      noShow: parsedBody.data.noShow,
    });

    return NextResponse.json(result);
  } catch (error) {
    return handleSessionError(error);
  }
}

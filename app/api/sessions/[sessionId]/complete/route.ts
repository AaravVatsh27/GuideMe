import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { completeSessionById, SessionApiError } from "@/lib/sessions";

const completeSessionRequestSchema = z.object({
  transcript: z.string().trim().max(12000).optional(),
  endedAt: z.coerce.date().optional(),
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

  try {
    const updatedSession = await completeSessionById({
      sessionId: context.params.sessionId,
      actorId: session.user.id,
      transcript: parsedBody.data.transcript,
      endedAt: parsedBody.data.endedAt,
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    return handleSessionError(error);
  }
}

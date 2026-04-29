import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  cancelSessionById,
  completeSessionById,
  markSessionStarted,
  SessionApiError,
  sessionDetailsInclude,
} from "@/lib/sessions";

const sessionPatchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("cancel"),
    reason: z.string().trim().min(10).max(280),
    noShow: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("start"),
    startedAt: z.coerce.date().optional(),
  }),
  z.object({
    action: z.literal("complete"),
    transcript: z.string().trim().max(12000).optional(),
    endedAt: z.coerce.date().optional(),
  }),
]);

function handleSessionError(error: unknown) {
  if (error instanceof SessionApiError) {
    return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(
  _request: Request,
  context: { params: { sessionId: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await db.session.findUnique({
    where: {
      id: context.params.sessionId,
    },
    include: sessionDetailsInclude,
  });

  if (!record) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (record.studentId !== session.user.id && record.mentorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(record);
}

export async function PATCH(
  request: Request,
  context: { params: { sessionId: string } },
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsedBody = sessionPatchSchema.safeParse(payload);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid session update payload",
        issues: parsedBody.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    switch (parsedBody.data.action) {
      case "cancel": {
        const result = await cancelSessionById({
          sessionId: context.params.sessionId,
          actorId: session.user.id,
          reason: parsedBody.data.reason,
          noShow: parsedBody.data.noShow,
        });

        return NextResponse.json(result);
      }
      case "start": {
        const updatedSession = await markSessionStarted({
          sessionId: context.params.sessionId,
          actorId: session.user.id,
          startedAt: parsedBody.data.startedAt,
        });

        return NextResponse.json(updatedSession);
      }
      case "complete": {
        const updatedSession = await completeSessionById({
          sessionId: context.params.sessionId,
          actorId: session.user.id,
          transcript: parsedBody.data.transcript,
          endedAt: parsedBody.data.endedAt,
        });

        return NextResponse.json(updatedSession);
      }
    }
  } catch (error) {
    return handleSessionError(error);
  }
}

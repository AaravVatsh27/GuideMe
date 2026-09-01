import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/Backend/auth";
import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { db } from "@/Backend/server/db";
import { cacheGet, cacheKeys, cacheSet, cacheTtl } from "@/Backend/lib/cache";
import {
  cancelSessionById,
  completeSessionById,
  markSessionStarted,
  sessionDetailsInclude,
} from "@/Backend/server/sessions";

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

type SessionDetailsResponse = Prisma.SessionGetPayload<{
  include: typeof sessionDetailsInclude;
}>;

export const GET = withApiErrorHandling(async (
  _request: Request,
  context: { params: { sessionId: string } },
  metadata,
) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  const cacheKey = cacheKeys.session(context.params.sessionId);
  const cached = await cacheGet<SessionDetailsResponse>(cacheKey);

  if (cached) {
    if (cached.studentId !== session.user.id && cached.mentorId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(cached);
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

  cacheSet(cacheKey, record, cacheTtl.sessionDetails).catch(() => {});

  return NextResponse.json(record);
}, "/api/sessions/[sessionId]");

export const PATCH = withApiErrorHandling(async (
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
}, "/api/sessions/[sessionId]");

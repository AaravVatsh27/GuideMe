import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { db } from "@/Backend/server/db";
import { cacheGet, cacheKeys, cacheSet, cacheTtl } from "@/Backend/lib/cache";
import {
  cancelSessionById,
  completeSessionById,
  markSessionStarted,
  sessionDetailsInclude,
  toSessionView,
} from "@/Backend/server/sessions";
import { defineRoute } from "@/Backend/lib/define-route";

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

export const GET = defineRoute(
  {},
  async (_request: Request, context: { params: { sessionId: string } }, { session }) => {
  const cacheKey = cacheKeys.session(context.params.sessionId);
  const cached = await cacheGet<SessionDetailsResponse>(cacheKey);

  if (cached) {
    if (cached.studentId !== session.user.id && cached.mentorId !== session.user.id) {
      return apiErrorResponse("Forbidden", 403);
    }
    return NextResponse.json(toSessionView(cached, session.user.id));
  }

  const record = await db.session.findUnique({
    where: {
      id: context.params.sessionId,
    },
    include: sessionDetailsInclude,
  });

  if (!record) {
    return apiErrorResponse("Session not found", 404);
  }

  if (record.studentId !== session.user.id && record.mentorId !== session.user.id) {
    return apiErrorResponse("Forbidden", 403);
  }

  cacheSet(cacheKey, record, cacheTtl.sessionDetails).catch(() => {});

  return NextResponse.json(toSessionView(record, session.user.id));
}, "/api/sessions/[sessionId]");

export const PATCH = defineRoute(
  {},
  async (request: Request, context: { params: { sessionId: string } }, { session }) => {
  const payload = await request.json().catch(() => null);
  const parsedBody = sessionPatchSchema.safeParse(payload);

  if (!parsedBody.success) {
    return apiErrorResponse("Invalid session update payload", 400, parsedBody.error.flatten());
  }

  switch (parsedBody.data.action) {
    case "cancel": {
      const result = await cancelSessionById({
        sessionId: context.params.sessionId,
        actorId: session.user.id,
        reason: parsedBody.data.reason,
        noShow: parsedBody.data.noShow,
      });

      return NextResponse.json({ ...result, session: toSessionView(result.session, session.user.id) });
    }
    case "start": {
      const updatedSession = await markSessionStarted({
        sessionId: context.params.sessionId,
        actorId: session.user.id,
        startedAt: parsedBody.data.startedAt,
      });

      return NextResponse.json(toSessionView(updatedSession, session.user.id));
    }
    case "complete": {
      const updatedSession = await completeSessionById({
        sessionId: context.params.sessionId,
        actorId: session.user.id,
        transcript: parsedBody.data.transcript,
        endedAt: parsedBody.data.endedAt,
      });

      return NextResponse.json(toSessionView(updatedSession, session.user.id));
    }
  }
}, "/api/sessions/[sessionId]");

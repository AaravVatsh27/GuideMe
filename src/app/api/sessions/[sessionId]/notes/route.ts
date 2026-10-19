import { SessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { cacheDel, cacheKeys } from "@/Backend/lib/cache";
import { db } from "@/Backend/server/db";
import { defineRoute } from "@/Backend/lib/define-route";

const createSessionNoteSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

export const POST = defineRoute(
  {},
  async (request: Request, context: { params: { sessionId: string } }, { session }) => {
  const payload = await request.json().catch(() => null);
  const parsedBody = createSessionNoteSchema.safeParse(payload);

  if (!parsedBody.success) {
    return apiErrorResponse("Invalid note payload", 400, z.flattenError(parsedBody.error));
  }

  const record = await db.session.findUnique({
    where: {
      id: context.params.sessionId,
    },
    select: {
      id: true,
      status: true,
      studentId: true,
      mentorId: true,
    },
  });

  if (!record) {
    return apiErrorResponse("Session not found", 404);
  }

  if (record.studentId !== session.user.id && record.mentorId !== session.user.id) {
    return apiErrorResponse("Forbidden", 403);
  }

  if (record.studentId !== session.user.id) {
    return apiErrorResponse("Only the student can add session notes here", 403);
  }

  if (record.status === SessionStatus.CANCELLED || record.status === SessionStatus.NO_SHOW) {
    return apiErrorResponse("Notes cannot be added to a cancelled session", 409);
  }

  const note = await db.sessionNote.create({
    data: {
      sessionId: record.id,
      authorId: session.user.id,
      content: parsedBody.data.content,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          image: true,
        },
      },
    },
  });

  await cacheDel(cacheKeys.session(record.id));

  return NextResponse.json(note, { status: 201 });
}, "/api/sessions/[sessionId]/notes");

import { SessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/Backend/auth";
import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { cacheDel, cacheKeys } from "@/Backend/lib/cache";
import { db } from "@/Backend/server/db";

const createSessionNoteSchema = z.object({
  content: z.string().trim().min(1).max(1000),
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
  const parsedBody = createSessionNoteSchema.safeParse(payload);

  if (!parsedBody.success) {
    return NextResponse.json(
      {
        error: "Invalid note payload",
        issues: parsedBody.error.flatten(),
      },
      { status: 400 },
    );
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
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (record.studentId !== session.user.id && record.mentorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (record.studentId !== session.user.id) {
    return NextResponse.json({ error: "Only the student can add session notes here" }, { status: 403 });
  }

  if (record.status === SessionStatus.CANCELLED || record.status === SessionStatus.NO_SHOW) {
    return NextResponse.json({ error: "Notes cannot be added to a cancelled session" }, { status: 409 });
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

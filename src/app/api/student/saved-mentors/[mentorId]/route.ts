import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { withApiErrorHandling } from "@/lib/api-helpers";
import { db } from "@/server/db";

type RouteParams = { params: Promise<{ mentorId: string }> };

export const DELETE = withApiErrorHandling(async (
  _request: Request,
  context: RouteParams,
  metadata,
) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  metadata.setUserId(session.user.id);
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can remove saved mentors" }, { status: 403 });
  }

  const { mentorId } = await context.params;
  await db.savedMentor.deleteMany({
    where: {
      studentId: session.user.id,
      mentorId,
    },
  });

  return NextResponse.json({ success: true });
}, "/api/student/saved-mentors/[mentorId]");

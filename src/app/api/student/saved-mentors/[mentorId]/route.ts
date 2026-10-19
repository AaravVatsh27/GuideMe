import { NextResponse } from "next/server";

import { db } from "@/Backend/server/db";
import { defineRoute } from "@/Backend/lib/define-route";

type RouteParams = { params: { mentorId: string } };

export const DELETE = defineRoute(
  { roles: ["STUDENT"], forbiddenMessage: "Only students can remove saved mentors" },
  async (_request: Request, context: RouteParams, { session }) => {
  const { mentorId } = context.params;
  await db.savedMentor.deleteMany({
    where: {
      studentId: session.user.id,
      mentorId,
    },
  });

  return NextResponse.json({ success: true });
}, "/api/student/saved-mentors/[mentorId]");

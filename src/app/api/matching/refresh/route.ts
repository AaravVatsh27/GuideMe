import { NextResponse } from "next/server";

import { auth } from "@/Backend/auth";
import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { getStudentMentorMatches } from "@/Backend/server/matching";

export const POST = withApiErrorHandling(async (_request: Request, _context, metadata) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  if (session.user.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Only students can refresh mentor matches" },
      { status: 403 },
    );
  }

  const matches = await getStudentMentorMatches(session.user.id, {
    forceRefresh: true,
  });

  if (!matches) {
    return NextResponse.json(
      { error: "Student profile not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(matches);
}, "/api/matching/refresh");

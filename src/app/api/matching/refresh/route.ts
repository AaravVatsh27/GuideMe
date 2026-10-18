import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { getStudentMentorMatches } from "@/Backend/server/matching";
import { defineRoute } from "@/Backend/lib/define-route";

export const POST = defineRoute(
  { roles: ["STUDENT"], forbiddenMessage: "Only students can refresh mentor matches" },
  async (_request: Request, _context, { session }) => {
  const matches = await getStudentMentorMatches(session.user.id, {
    forceRefresh: true,
  });

  if (!matches) {
    return apiErrorResponse("Student profile not found", 404);
  }

  return NextResponse.json(matches);
}, "/api/matching/refresh");

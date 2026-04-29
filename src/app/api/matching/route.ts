import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getStudentMentorMatches } from "@/server/matching";

export async function POST() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "STUDENT") {
    return NextResponse.json(
      { error: "Only students can request mentor matches" },
      { status: 403 },
    );
  }

  const matches = await getStudentMentorMatches(session.user.id);

  if (!matches) {
    return NextResponse.json(
      { error: "Student profile not found" },
      { status: 404 },
    );
  }

  return NextResponse.json(matches);
}

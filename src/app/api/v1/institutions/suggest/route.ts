import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/Backend/auth";
import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { db } from "@/Backend/server/db";

const requestSchema = z.object({
  submittedName: z
    .string()
    .trim()
    .min(3, "College name must be at least 3 characters")
    .max(200, "College name must be 200 characters or fewer"),
});

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const POST = withApiErrorHandling(async (request: Request) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "MENTOR") {
    return NextResponse.json(
      { error: "Only mentors can suggest institutions" },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request",
        issues: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const { submittedName } = parsed.data;
  const normalizedName = normalizeName(submittedName);

  // Prevent duplicate pending suggestions from the same mentor
  const existing = await db.institutionSuggestion.findFirst({
    where: {
      mentorId: session.user.id,
      normalizedName,
      status: "PENDING",
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({
      suggestionId: existing.id,
      status: "PENDING",
      message: "You have already submitted this college for review.",
    });
  }

  const suggestion = await db.institutionSuggestion.create({
    data: {
      mentorId: session.user.id,
      submittedName,
      normalizedName,
      status: "PENDING",
    },
    select: { id: true, status: true },
  });

  return NextResponse.json({
    suggestionId: suggestion.id,
    status: suggestion.status,
    message: "Your college has been submitted for review.",
  });
}, "/api/v1/institutions/suggest");

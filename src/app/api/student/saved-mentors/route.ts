import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { db } from "@/Backend/server/db";
import { defineRoute } from "@/Backend/lib/define-route";

const saveMentorSchema = z.object({
  mentorId: z.string().uuid(),
});

export const GET = defineRoute(
  { roles: ["STUDENT"], forbiddenMessage: "Only students can access saved mentors" },
  async (_request: Request, _context, { session }) => {
  const saved = await db.savedMentor.findMany({
    where: { studentId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      mentor: {
        select: {
          id: true,
          name: true,
          image: true,
          mentorProfile: {
            select: {
              username: true,
              headline: true,
              college: true,
              tier: true,
              avgRating: true,
              totalReviews: true,
              priceMin: true,
              priceMax: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ data: saved });
}, "/api/student/saved-mentors");

export const POST = defineRoute(
  { roles: ["STUDENT"], forbiddenMessage: "Only students can save mentors" },
  async (request: Request, _context, { session }) => {
  const payload = await request.json().catch(() => null);
  const parsed = saveMentorSchema.safeParse(payload);
  if (!parsed.success) {
    return apiErrorResponse("Invalid payload", 400, parsed.error.flatten());
  }

  const mentor = await db.user.findUnique({
    where: { id: parsed.data.mentorId },
    select: { id: true, role: true, isActive: true },
  });
  if (!mentor || mentor.role !== "MENTOR" || !mentor.isActive) {
    return apiErrorResponse("Mentor not found", 404);
  }

  const saved = await db.savedMentor.upsert({
    where: {
      studentId_mentorId: { studentId: session.user.id, mentorId: parsed.data.mentorId },
    },
    create: {
      studentId: session.user.id,
      mentorId: parsed.data.mentorId,
    },
    update: {},
  });

  return NextResponse.json({ saved });
}, "/api/student/saved-mentors");

import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/Backend/auth";
import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { db } from "@/Backend/server/db";

const saveMentorSchema = z.object({
  mentorId: z.string().uuid(),
});

export const GET = withApiErrorHandling(async (_request: Request, _context, metadata) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  metadata.setUserId(session.user.id);
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can access saved mentors" }, { status: 403 });
  }

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

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  metadata.setUserId(session.user.id);
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can save mentors" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = saveMentorSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const mentor = await db.user.findUnique({
    where: { id: parsed.data.mentorId },
    select: { id: true, role: true, isActive: true },
  });
  if (!mentor || mentor.role !== "MENTOR" || !mentor.isActive) {
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
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

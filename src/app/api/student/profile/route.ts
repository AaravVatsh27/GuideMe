import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/Backend/auth";
import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { db } from "@/Backend/server/db";
import { getRedis } from "@/Backend/server/redis";
import { invalidateMatchingCacheForStudent } from "@/Backend/server/matching";

const studentSettingsSchema = z.object({
  notificationsEnabled: z.boolean().optional(),
  profileVisibility: z.enum(["public", "private"]).optional(),
});

const profileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  image: z.string().trim().url().optional(),
  city: z.string().trim().min(2).max(80).optional(),
  state: z.string().trim().min(2).max(80).optional(),
  languagePreference: z.string().trim().min(2).max(40).optional(),
  settings: studentSettingsSchema.optional(),
});

function getSettingsKey(userId: string) {
  return `student:settings:${userId}`;
}

export const GET = withApiErrorHandling(async (_request: Request, _context, metadata) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  metadata.setUserId(session.user.id);
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can access profile settings" }, { status: 403 });
  }

  const [user, studentProfile, settings] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true },
    }),
    db.studentProfile.findUnique({
      where: { userId: session.user.id },
      select: {
        class: true,
        board: true,
        stream: true,
        schoolingMode: true,
        coachingMode: true,
        targetExam: true,
        targetExams: true,
        mentorshipNeeds: true,
        decisionStage: true,
        currentConfusion: true,
        confusionType: true,
        confusionTypes: true,
        city: true,
        state: true,
        languagePreference: true,
      },
    }),
    getRedis()?.get<string>(getSettingsKey(session.user.id)) ?? null,
  ]);

  return NextResponse.json({
    user,
    studentProfile,
    settings: settings ? JSON.parse(settings) : { notificationsEnabled: true, profileVisibility: "public" },
  });
}, "/api/student/profile");

export const PATCH = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  metadata.setUserId(session.user.id);
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can update profile settings" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const redis = getRedis();

  const [user, studentProfile] = await Promise.all([
    Object.keys(data).some((key) => key === "name" || key === "image")
      ? db.user.update({
          where: { id: session.user.id },
          data: {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.image !== undefined ? { image: data.image } : {}),
          },
          select: { id: true, name: true, email: true, image: true },
        })
      : db.user.findUnique({
          where: { id: session.user.id },
          select: { id: true, name: true, email: true, image: true },
        }),
    Object.keys(data).some((key) => key === "city" || key === "state" || key === "languagePreference")
      ? db.studentProfile.update({
          where: { userId: session.user.id },
          data: {
            ...(data.city !== undefined ? { city: data.city } : {}),
            ...(data.state !== undefined ? { state: data.state } : {}),
            ...(data.languagePreference !== undefined ? { languagePreference: data.languagePreference } : {}),
          },
          select: {
            class: true,
            board: true,
            stream: true,
            schoolingMode: true,
            coachingMode: true,
            targetExam: true,
            targetExams: true,
            mentorshipNeeds: true,
            decisionStage: true,
            currentConfusion: true,
            confusionType: true,
            confusionTypes: true,
            city: true,
            state: true,
            languagePreference: true,
          },
        })
      : db.studentProfile.findUnique({
          where: { userId: session.user.id },
          select: {
            class: true,
            board: true,
            stream: true,
            schoolingMode: true,
            coachingMode: true,
            targetExam: true,
            targetExams: true,
            mentorshipNeeds: true,
            decisionStage: true,
            currentConfusion: true,
            confusionType: true,
            confusionTypes: true,
            city: true,
            state: true,
            languagePreference: true,
          },
        }),
  ]);

  if (data.settings && redis) {
    await redis.set(getSettingsKey(session.user.id), JSON.stringify(data.settings), { ex: 60 * 60 * 24 * 30 });
  }

  return NextResponse.json({ user, studentProfile });
}, "/api/student/profile");

export const POST = withApiErrorHandling(async (_request: Request, _context, metadata) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  metadata.setUserId(session.user.id);
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can refresh matching" }, { status: 403 });
  }

  await invalidateMatchingCacheForStudent(session.user.id);
  return NextResponse.json({ success: true });
}, "/api/student/profile");

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { deleteRedisKeysByPattern } from "@/server/redis";
import { mentorProfileUpdateSchema } from "@/server/validations/mentor";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "MENTOR") {
    return NextResponse.json({ error: "Only mentors can update their profile" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = mentorProfileUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const mentorId = session.user.id;

  try {
    const existing = await db.mentorProfile.findUnique({
      where: { userId: mentorId },
      select: {
        username: true,
        priceMin: true,
        priceMax: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Mentor profile not found" }, { status: 404 });
    }

    // Extract availability slots for separate upsert
    const { availabilitySlots, exams, specialisations, ...profileFields } = data;

    // Build profile update payload
    const updateData: Record<string, unknown> = {
      ...profileFields,
      lastProfileUpdate: new Date(),
    };

    if (exams !== undefined) {
      updateData.examsCleared = exams.map((e) => e.exam);
      // Store exam years as JSON
      const examYears: Record<string, number> = {};
      for (const entry of exams) {
        if (entry.year) {
          examYears[entry.exam] = entry.year;
        }
      }
      updateData.examYears = Object.keys(examYears).length > 0 ? examYears : null;
    }

    if (specialisations !== undefined) {
      updateData.specialisations = specialisations;
    }

    const updatedProfile = await db.$transaction(async (tx) => {
      const profile = await tx.mentorProfile.update({
        where: { userId: mentorId },
        data: updateData,
      });

      // Replace availability slots if provided
      if (availabilitySlots !== undefined) {
        await tx.availability.deleteMany({ where: { mentorId } });

        if (availabilitySlots.length > 0) {
          await tx.availability.createMany({
            data: availabilitySlots.map((slot) => ({
              mentorId,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              timezone: data.timezone ?? "Asia/Kolkata",
              isRecurring: true,
              isActive: true,
            })),
          });
        }
      }

      // Log price change if applicable
      const priceChanged =
        (data.priceMin !== undefined && data.priceMin !== existing.priceMin) ||
        (data.priceMax !== undefined && data.priceMax !== existing.priceMax);

      if (priceChanged) {
        await tx.auditLog.create({
          data: {
            userId: mentorId,
            action: "MENTOR_PRICE_CHANGED",
            entityType: "MentorProfile",
            entityId: mentorId,
            metadata: {
              oldPriceMin: existing.priceMin,
              oldPriceMax: existing.priceMax,
              newPriceMin: data.priceMin ?? existing.priceMin,
              newPriceMax: data.priceMax ?? existing.priceMax,
            },
          },
        });
      }

      return profile;
    });

    // Invalidate Redis caches (fire-and-forget)
    Promise.allSettled([
      deleteRedisKeysByPattern(`mentor:profile:${existing.username}`),
      deleteRedisKeysByPattern("mentors:list:*"),
    ]).catch(() => {});

    return NextResponse.json({ profile: updatedProfile });
  } catch (error) {
    console.error("[mentors/profile] update error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

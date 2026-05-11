import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/lib/api-helpers";
import { cacheDel, cacheDelPattern, cacheKeys } from "@/lib/cache";
import { generalLimiter } from "@/lib/ratelimit";
import { db } from "@/server/db";
import { calculateFortyFiveMinutePrice } from "@/server/mentor-onboarding";
import { invalidateAllMatchingCaches } from "@/server/matching";
import { mentorProfileUpdateSchema } from "@/server/validations/mentor";

export const PATCH = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();

  const denied = await applyRateLimit(generalLimiter, getRateLimitId(request, session?.user?.id));
  if (denied) return denied;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

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
  const hasPriceUpdate = data.priceMin !== undefined || data.priceMax !== undefined;

  if (data.priceMax !== undefined && data.priceMin === undefined) {
    return NextResponse.json(
      { error: "priceMin is required when updating pricing" },
      { status: 400 },
    );
  }

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
  const {
    availabilitySlots,
    exams,
    specialisations,
    priceMin,
    ...profileFields
  } = data;

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

  if (priceMin !== undefined) {
    updateData.priceMin = priceMin;
    updateData.priceMax = calculateFortyFiveMinutePrice(priceMin);
  }

  await db.$transaction(async (tx) => {
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
      hasPriceUpdate &&
      ((updateData.priceMin as number | undefined) !== existing.priceMin ||
        (updateData.priceMax as number | undefined) !== existing.priceMax);

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
            newPriceMin: (updateData.priceMin as number | undefined) ?? existing.priceMin,
            newPriceMax: (updateData.priceMax as number | undefined) ?? existing.priceMax,
          },
        },
      });
    }

    return profile;
  });

  const updatedProfile = await db.user.findUnique({
    where: { id: mentorId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      mentorProfile: true,
      availabilities: {
        where: { isActive: true },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isRecurring: true,
          specificDate: true,
          timezone: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  // Invalidate Redis caches (fire-and-forget)
  const invalidations = [
    cacheDel(cacheKeys.mentorProfile(existing.username)),
    cacheDelPattern(cacheKeys.searchPattern),
    invalidateAllMatchingCaches(),
  ];

  if (availabilitySlots !== undefined) {
    invalidations.push(cacheDelPattern(cacheKeys.availabilityPattern(mentorId)));
  }

  Promise.allSettled(invalidations).catch(() => {});

  return NextResponse.json({
    profile: updatedProfile?.mentorProfile
      ? {
          ...updatedProfile.mentorProfile,
          user: {
            id: updatedProfile.id,
            name: updatedProfile.name,
            email: updatedProfile.email,
            image: updatedProfile.image,
          },
          availabilities: updatedProfile.availabilities,
        }
      : null,
  });
}, "/api/mentors/profile");

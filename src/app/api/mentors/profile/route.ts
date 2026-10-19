import { z } from "zod";
import { NextResponse } from "next/server";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { cacheDel, cacheDelPattern, cacheKeys } from "@/Backend/lib/cache";
import { generalLimiter } from "@/Backend/lib/ratelimit";
import { db } from "@/Backend/server/db";
import { calculateFortyFiveMinutePrice, retireMentorAvailability } from "@/shared/mentor-onboarding";
import { invalidateAllMatchingCaches } from "@/Backend/server/matching";
import { mentorProfileUpdateSchema } from "@/Backend/validations/mentor";
import { defineRoute } from "@/Backend/lib/define-route";

export const PATCH = defineRoute(
  { roles: ["MENTOR"], forbiddenMessage: "Only mentors can update their profile", rateLimit: generalLimiter },
  async (request: Request, _context, { session }) => {
  const payload = await request.json().catch(() => null);
  const parsed = mentorProfileUpdateSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Invalid payload", 400, z.flattenError(parsed.error));
  }

  const data = parsed.data;
  const mentorId = session.user.id;
  const hasPriceUpdate = data.priceMin !== undefined || data.priceMax !== undefined;

  if (data.priceMax !== undefined && data.priceMin === undefined) {
    return apiErrorResponse("priceMin is required when updating pricing", 400);
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
    return apiErrorResponse("Mentor profile not found", 404);
  }

  // Pull out fields that are not MentorProfile columns: availability slots and their
  // timezone are written to Availability, and the avatar is the user's image.
  const {
    availabilitySlots,
    exams,
    specialisations,
    priceMin,
    timezone,
    avatarUrl,
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

    if (avatarUrl !== undefined) {
      await tx.user.update({
        where: { id: mentorId },
        data: { image: avatarUrl },
      });
    }

    // Replace availability slots if provided
    if (availabilitySlots !== undefined) {
      await retireMentorAvailability(tx, { mentorId });

      if (availabilitySlots.length > 0) {
        await tx.availability.createMany({
          data: availabilitySlots.map((slot) => ({
            mentorId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            timezone: timezone ?? "Asia/Kolkata",
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

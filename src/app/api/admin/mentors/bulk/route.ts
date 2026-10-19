import { MentorTier } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import {
  autoAssignMentorTier,
  extractRequestIp,
  invalidateMentorPublicCaches,
} from "@/Backend/server/admin";
import { db } from "@/Backend/server/db";
import { sendWelcomeMentorEmail } from "@/Backend/server/resend";
import { getAppUrl } from "@/Backend/lib/env";
import { defineRoute } from "@/Backend/lib/define-route";
import { setMentorVerification } from "@/Backend/server/mentor-state";

const bulkMentorActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("verify"),
    mentorIds: z.array(z.string().uuid()).min(1).max(100),
  }),
  z.object({
    action: z.literal("suspend"),
    mentorIds: z.array(z.string().uuid()).min(1).max(100),
  }),
  z.object({
    action: z.literal("change-tier"),
    mentorIds: z.array(z.string().uuid()).min(1).max(100),
    tier: z.nativeEnum(MentorTier),
  }),
]);

export const POST = defineRoute(
  { roles: ["ADMIN"], forbiddenMessage: "Admin access required" },
  async (request: Request, _context, { session }) => {
  const payload = await request.json().catch(() => null);
  const parsed = bulkMentorActionSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Invalid payload", 400, parsed.error.flatten());
  }

  const mentors = await db.user.findMany({
    where: {
      id: { in: parsed.data.mentorIds },
      role: "MENTOR",
    },
    select: {
      id: true,
      name: true,
      email: true,
      mentorProfile: {
        select: {
          college: true,
          tier: true,
          username: true,
        },
      },
    },
  });

  if (mentors.length === 0) {
    return apiErrorResponse("No mentors found", 404);
  }

  const ipAddress = extractRequestIp(request);
  const appUrl = getAppUrl();

  await db.$transaction(async (tx) => {
    switch (parsed.data.action) {
      case "verify": {
        for (const mentor of mentors) {
          const tier = autoAssignMentorTier(mentor.mentorProfile?.college);

          await setMentorVerification(tx, mentor.id, {
            status: "APPROVED",
            reviewerId: session.user.id,
            tier,
          });

          await tx.auditLog.create({
            data: {
              userId: session.user.id,
              action: "ADMIN_MENTOR_VERIFIED",
              entityType: "MentorProfile",
              entityId: mentor.id,
              ipAddress,
              metadata: {
                tier,
              },
            },
          });
        }

        break;
      }
      case "suspend": {
        for (const mentor of mentors) {
          await tx.mentorProfile.update({
            where: { userId: mentor.id },
            data: {
              isActive: false,
            },
          });

          await tx.user.update({
            where: { id: mentor.id },
            data: {
              isActive: false,
            },
          });

          await tx.auditLog.create({
            data: {
              userId: session.user.id,
              action: "ADMIN_MENTOR_SUSPENDED",
              entityType: "MentorProfile",
              entityId: mentor.id,
              ipAddress,
            },
          });
        }

        break;
      }
      case "change-tier": {
        for (const mentor of mentors) {
          await tx.mentorProfile.update({
            where: { userId: mentor.id },
            data: {
              tier: parsed.data.tier,
            },
          });

          await tx.auditLog.create({
            data: {
              userId: session.user.id,
              action: "ADMIN_MENTOR_TIER_CHANGED",
              entityType: "MentorProfile",
              entityId: mentor.id,
              ipAddress,
              metadata: {
                tier: parsed.data.tier,
              },
            },
          });
        }

        break;
      }
    }
  });

  await invalidateMentorPublicCaches(mentors);

  if (parsed.data.action === "verify") {
    await Promise.allSettled(
      mentors.map((mentor) =>
        sendWelcomeMentorEmail({
          mentor: {
            name: mentor.name,
            email: mentor.email,
          },
          college: mentor.mentorProfile?.college ?? "GuideMe mentor network",
          tier: autoAssignMentorTier(mentor.mentorProfile?.college),
          profileUrl: `${appUrl.replace(/\/$/, "")}/dashboard/mentor/profile`,
        }),
      ),
    );
  }

  return NextResponse.json({
    success: true,
    processed: mentors.length,
  });
}, "/api/admin/mentors/bulk");

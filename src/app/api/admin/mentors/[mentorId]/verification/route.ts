import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import {
  autoAssignMentorTier,
  extractRequestIp,
  invalidateMentorPublicCaches,
} from "@/Backend/server/admin";
import { db } from "@/Backend/server/db";
import {
  sendMentorVerificationRejectedEmail,
  sendWelcomeMentorEmail,
} from "@/Backend/server/resend";
import { getAppUrl } from "@/Backend/lib/env";
import { defineRoute } from "@/Backend/lib/define-route";
import { setMentorVerification } from "@/Backend/server/mentor-state";

const verificationActionSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("approve"),
  }),
  z.object({
    decision: z.literal("reject"),
    reason: z.string().trim().min(10).max(280),
  }),
]);

export const POST = defineRoute(
  { roles: ["ADMIN"], forbiddenMessage: "Admin access required" },
  async (request: Request, context: { params: { mentorId: string } }, { session }) => {
  const payload = await request.json().catch(() => null);
  const parsed = verificationActionSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Invalid payload", 400, parsed.error.flatten());
  }

  const mentor = await db.user.findFirst({
    where: {
      id: context.params.mentorId,
      role: "MENTOR",
    },
    select: {
      id: true,
      name: true,
      email: true,
      mentorProfile: {
        select: {
          college: true,
          username: true,
        },
      },
      mentorVerification: {
        select: {
          id: true,
          status: true,
        },
      },
    },
  });

  if (!mentor) {
    return apiErrorResponse("Mentor not found", 404);
  }

  const tier = autoAssignMentorTier(mentor.mentorProfile?.college);
  const ipAddress = extractRequestIp(request);
  const appUrl = getAppUrl();

  await db.$transaction(async (tx) => {
    if (parsed.data.decision === "approve") {
      await setMentorVerification(tx, mentor.id, {
        status: "APPROVED",
        reviewerId: session.user.id,
        tier,
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "ADMIN_MENTOR_APPLICATION_APPROVED",
          entityType: "MentorVerification",
          entityId: mentor.mentorVerification?.id ?? mentor.id,
          ipAddress,
          metadata: {
            tier,
          },
        },
      });
    } else {
      await setMentorVerification(tx, mentor.id, {
        status: "REJECTED",
        reviewerId: session.user.id,
        reason: parsed.data.reason,
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "ADMIN_MENTOR_APPLICATION_REJECTED",
          entityType: "MentorVerification",
          entityId: mentor.mentorVerification?.id ?? mentor.id,
          ipAddress,
          metadata: {
            reason: parsed.data.reason,
          },
        },
      });
    }
  });

  await invalidateMentorPublicCaches([mentor]);

  if (parsed.data.decision === "approve") {
    await sendWelcomeMentorEmail({
      mentor: {
        name: mentor.name,
        email: mentor.email,
      },
      college: mentor.mentorProfile?.college ?? "GuideMe mentor network",
      tier,
      profileUrl: `${appUrl.replace(/\/$/, "")}/dashboard/mentor/profile`,
    });
  } else {
    await sendMentorVerificationRejectedEmail({
      mentor: {
        name: mentor.name,
        email: mentor.email,
      },
      reason: parsed.data.reason,
    });
  }

  return NextResponse.json({ success: true });
}, "/api/admin/mentors/[mentorId]/verification");

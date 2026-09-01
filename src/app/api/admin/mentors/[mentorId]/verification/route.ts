import { VerificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/Backend/auth";
import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { autoAssignMentorTier, extractRequestIp } from "@/Backend/server/admin";
import { db } from "@/Backend/server/db";
import {
  sendMentorVerificationRejectedEmail,
  sendWelcomeMentorEmail,
} from "@/Backend/server/resend";

const verificationActionSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("approve"),
  }),
  z.object({
    decision: z.literal("reject"),
    reason: z.string().trim().min(10).max(280),
  }),
]);

export const POST = withApiErrorHandling(async (
  request: Request,
  context: { params: { mentorId: string } },
  metadata,
) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = verificationActionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
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
    return NextResponse.json({ error: "Mentor not found" }, { status: 404 });
  }

  const tier = autoAssignMentorTier(mentor.mentorProfile?.college);
  const now = new Date();
  const ipAddress = extractRequestIp(request);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.AUTH_URL?.trim() || "http://localhost:3000";

  await db.$transaction(async (tx) => {
    if (parsed.data.decision === "approve") {
      await tx.mentorProfile.update({
        where: { userId: mentor.id },
        data: {
          isVerified: true,
          isActive: true,
          tier,
        },
      });

      await tx.user.update({
        where: { id: mentor.id },
        data: {
          isActive: true,
        },
      });

      await tx.mentorVerification.upsert({
        where: { mentorId: mentor.id },
        create: {
          mentorId: mentor.id,
          status: VerificationStatus.APPROVED,
          reviewedBy: session.user.id,
          reviewedAt: now,
          submittedAt: now,
        },
        update: {
          status: VerificationStatus.APPROVED,
          reviewedBy: session.user.id,
          reviewedAt: now,
          rejectionReason: null,
        },
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
      await tx.mentorProfile.update({
        where: { userId: mentor.id },
        data: {
          isVerified: false,
          isActive: false,
        },
      });

      await tx.mentorVerification.upsert({
        where: { mentorId: mentor.id },
        create: {
          mentorId: mentor.id,
          status: VerificationStatus.REJECTED,
          reviewedBy: session.user.id,
          reviewedAt: now,
          rejectionReason: parsed.data.reason,
          submittedAt: now,
        },
        update: {
          status: VerificationStatus.REJECTED,
          reviewedBy: session.user.id,
          reviewedAt: now,
          rejectionReason: parsed.data.reason,
        },
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

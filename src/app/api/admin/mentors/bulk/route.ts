import { MentorTier, VerificationStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { withApiErrorHandling } from "@/lib/api-helpers";
import { autoAssignMentorTier, extractRequestIp } from "@/server/admin";
import { db } from "@/server/db";
import { sendWelcomeMentorEmail } from "@/server/resend";

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

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = bulkMentorActionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
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
        },
      },
    },
  });

  if (mentors.length === 0) {
    return NextResponse.json({ error: "No mentors found" }, { status: 404 });
  }

  const ipAddress = extractRequestIp(request);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.AUTH_URL?.trim() || "http://localhost:3000";
  const now = new Date();

  await db.$transaction(async (tx) => {
    switch (parsed.data.action) {
      case "verify": {
        for (const mentor of mentors) {
          const tier = autoAssignMentorTier(mentor.mentorProfile?.college);

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

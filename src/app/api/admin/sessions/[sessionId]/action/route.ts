import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { withApiErrorHandling } from "@/lib/api-helpers";
import { extractRequestIp } from "@/server/admin";
import { db } from "@/server/db";
import { cancelSessionById, completeSessionById } from "@/server/sessions";

const adminSessionActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("complete"),
  }),
  z.object({
    action: z.literal("no_show"),
    reason: z.string().trim().min(10).max(280),
  }),
]);

export const POST = withApiErrorHandling(async (
  request: Request,
  context: { params: { sessionId: string } },
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
  const parsed = adminSessionActionSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const ipAddress = extractRequestIp(request);

  if (parsed.data.action === "complete") {
    const updatedSession = await completeSessionById({
      sessionId: context.params.sessionId,
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "ADMIN_SESSION_MARKED_COMPLETED",
        entityType: "Session",
        entityId: context.params.sessionId,
        ipAddress,
      },
    });

    return NextResponse.json({ success: true, session: updatedSession });
  }

  const sessionRecord = await db.session.findUnique({
    where: { id: context.params.sessionId },
    select: {
      mentorId: true,
    },
  });

  if (!sessionRecord) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const result = await cancelSessionById({
    sessionId: context.params.sessionId,
    actorId: sessionRecord.mentorId,
    reason: parsed.data.reason,
    noShow: true,
  });

  await db.auditLog.create({
    data: {
      userId: session.user.id,
      action: "ADMIN_SESSION_MARKED_NO_SHOW",
      entityType: "Session",
      entityId: context.params.sessionId,
      ipAddress,
      metadata: {
        reason: parsed.data.reason,
      },
    },
  });

  return NextResponse.json({ success: true, ...result });
}, "/api/admin/sessions/[sessionId]/action");

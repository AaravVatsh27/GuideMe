import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { extractRequestIp } from "@/Backend/server/admin";
import { db } from "@/Backend/server/db";
import { cancelSessionById, completeSessionById } from "@/Backend/server/sessions";
import { defineRoute } from "@/Backend/lib/define-route";

const adminSessionActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("complete"),
  }),
  z.object({
    action: z.literal("no_show"),
    reason: z.string().trim().min(10).max(280),
  }),
]);

export const POST = defineRoute(
  { roles: ["ADMIN"], forbiddenMessage: "Admin access required" },
  async (request: Request, context: { params: { sessionId: string } }, { session }) => {
  const payload = await request.json().catch(() => null);
  const parsed = adminSessionActionSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Invalid payload", 400, z.flattenError(parsed.error));
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

  const result = await cancelSessionById({
    sessionId: context.params.sessionId,
    actorId: session.user.id,
    reason: parsed.data.reason,
    noShow: true,
    asAdmin: true,
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

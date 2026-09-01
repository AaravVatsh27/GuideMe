import { NextResponse } from "next/server";
import { z } from "zod";

import { auth, updateSession } from "@/Backend/auth";
import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { authLimiter } from "@/Backend/lib/ratelimit";
import { AUTH_DEFAULT_REDIRECT, getOnboardingPath } from "@/Backend/server/auth-flow";
import { db } from "@/Backend/server/db";

const completeSignupSchema = z.object({
  role: z.enum(["STUDENT", "MENTOR"]),
});

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();
  const userId = session?.user?.id;

  const denied = await applyRateLimit(authLimiter, getRateLimitId(request, userId));
  if (denied) return denied;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(userId);

  const payload = await request.json().catch(() => null);
  const parsed = completeSignupSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role selection" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
    select: {
      role: true,
      onboardingComplete: true,
    },
  });

  await updateSession({
    user: {
      role: user.role,
      onboardingComplete: user.onboardingComplete,
    },
  });

  return NextResponse.json({
    role: user.role,
    onboardingComplete: user.onboardingComplete,
    onboardingPath: user.onboardingComplete ? AUTH_DEFAULT_REDIRECT : getOnboardingPath(user.role),
  });
}, "/api/auth/complete-signup");

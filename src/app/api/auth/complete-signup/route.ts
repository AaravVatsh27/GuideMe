import { NextResponse } from "next/server";
import { z } from "zod";

import { updateSession } from "@/Backend/auth";
import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { authLimiter } from "@/Backend/lib/ratelimit";
import { AUTH_DEFAULT_REDIRECT, getOnboardingPath } from "@/shared/auth-flow";
import { db } from "@/Backend/server/db";
import { defineRoute } from "@/Backend/lib/define-route";

const completeSignupSchema = z.object({
  role: z.enum(["STUDENT", "MENTOR"]),
});

export const POST = defineRoute(
  { rateLimit: authLimiter },
  async (request: Request, _context, { session }) => {
  const userId = session.user.id;

  const payload = await request.json().catch(() => null);
  const parsed = completeSignupSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Invalid role selection", 400);
  }

  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      onboardingComplete: true,
    },
  });

  if (!currentUser) {
    return apiErrorResponse("User not found", 404);
  }

  if (currentUser.onboardingComplete) {
    return NextResponse.json({
      role: currentUser.role,
      onboardingComplete: true,
      onboardingPath: AUTH_DEFAULT_REDIRECT,
    });
  }

  await db.user.updateMany({
    where: {
      id: userId,
      onboardingComplete: false,
    },
    data: { role: parsed.data.role },
  });

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      onboardingComplete: true,
    },
  });

  if (!user) {
    return apiErrorResponse("User not found", 404);
  }

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

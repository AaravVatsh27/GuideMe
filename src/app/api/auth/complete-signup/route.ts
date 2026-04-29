import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getOnboardingPath } from "@/server/auth-flow";
import { db } from "@/server/db";

const completeSignupSchema = z.object({
  role: z.enum(["STUDENT", "MENTOR"]),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = completeSignupSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role selection" }, { status: 400 });
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: { role: parsed.data.role },
    select: {
      role: true,
      onboardingComplete: true,
    },
  });

  return NextResponse.json({
    role: user.role,
    onboardingComplete: user.onboardingComplete,
    onboardingPath: getOnboardingPath(user.role),
  });
}

import "server-only";

import type { Session } from "next-auth";
import { NextResponse } from "next/server";

import { auth } from "@/Backend/auth";
import { apiError } from "@/Backend/lib/api-helpers";

type UserRole = "STUDENT" | "MENTOR" | "ADMIN";

type AuthSuccess = { session: Session; response?: never };
type AuthFailure = { session?: never; response: NextResponse };
type AuthResult = AuthSuccess | AuthFailure;

export async function requireAuth(roles?: UserRole[]): Promise<AuthResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      response: NextResponse.json(apiError("Unauthorized", 401), { status: 401 }),
    };
  }

  if (roles && roles.length > 0) {
    const userRole = session.user.role as UserRole | undefined;
    if (!userRole || !roles.includes(userRole)) {
      return {
        response: NextResponse.json(
          apiError(`Access restricted. Required role: ${roles.join(" or ")}.`, 403),
          { status: 403 },
        ),
      };
    }
  }

  return { session };
}

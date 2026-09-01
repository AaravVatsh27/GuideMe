import { SessionStatus } from "@prisma/client";
import { addHours, isAfter, isBefore, subDays } from "date-fns";
import { NextResponse } from "next/server";

import { auth } from "@/Backend/auth";
import { withApiErrorHandling } from "@/Backend/lib/api-helpers";
import { db } from "@/Backend/server/db";

export const GET = withApiErrorHandling(async (_request: Request, _context, metadata) => {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  metadata.setUserId(session.user.id);
  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can access this endpoint" }, { status: 403 });
  }

  const now = new Date();
  const next24Hours = addHours(now, 24);

  const [upcomingSession, completedSessions, spentAgg, mentorCountAgg, activity] = await Promise.all([
    db.session.findFirst({
      where: {
        studentId: session.user.id,
        status: { in: [SessionStatus.SCHEDULED, SessionStatus.ONGOING] },
        scheduledAt: { gte: now },
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            image: true,
            mentorProfile: { select: { username: true, headline: true } },
          },
        },
        payment: {
          select: { status: true, amount: true, refundAmount: true, refundStatus: true },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    db.session.count({
      where: { studentId: session.user.id, status: SessionStatus.COMPLETED },
    }),
    db.payment.aggregate({
      where: { userId: session.user.id, status: "CAPTURED" },
      _sum: { amount: true },
    }),
    db.session.findMany({
      where: { studentId: session.user.id },
      distinct: ["mentorId"],
      select: { mentorId: true },
    }),
    db.auditLog.findMany({
      where: { userId: session.user.id, createdAt: { gte: subDays(now, 30) } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, metadata: true },
    }),
  ]);

  return NextResponse.json({
    greetingName: session.user.name ?? "Student",
    upcomingSession:
      upcomingSession && isAfter(upcomingSession.scheduledAt, now) && isBefore(upcomingSession.scheduledAt, next24Hours)
        ? upcomingSession
        : null,
    quickStats: {
      sessionsCompleted: completedSessions,
      moneySpent: spentAgg._sum.amount ?? 0,
      mentorsTried: mentorCountAgg.length,
    },
    recentActivity: activity,
  });
}, "/api/student/dashboard");

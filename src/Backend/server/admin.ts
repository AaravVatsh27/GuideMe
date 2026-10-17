import {
  MentorTier,
  PaymentStatus,
  PayoutStatus,
  Prisma,
  Role,
  SessionStatus,
  VerificationStatus,
} from "@prisma/client";
import { addDays, format, startOfDay, subDays } from "date-fns";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@/Backend/auth";
import { cacheDel, cacheDelPattern, cacheGet, cacheKeys, cacheSet, cacheTtl } from "@/Backend/lib/cache";
import { getClientIp } from "@/Backend/lib/client-ip";
import { invalidateAllMatchingCaches } from "@/Backend/server/matching";
import { isEmailAuthEnabled } from "@/Backend/server/auth";
import { db } from "@/Backend/server/db";

type AdminMentorStatus = "PENDING" | "VERIFIED" | "SUSPENDED" | "REJECTED";

export type AdminOverviewData = {
  kpis: {
    totalUsersToday: number;
    sessionsToday: number;
    revenueToday: number;
    activeMentors: number;
  };
  revenueLast30Days: Array<{
    date: string;
    label: string;
    amount: number;
  }>;
  recentSessions: Array<{
    id: string;
    status: SessionStatus;
    type: string;
    scheduledAt: Date;
    durationMinutes: number;
    studentName: string;
    mentorName: string;
    paymentStatus: PaymentStatus | null;
    amount: number;
  }>;
  alerts: {
    failedPayments: Array<{
      id: string;
      amount: number;
      createdAt: Date;
      studentName: string;
      mentorName: string;
      sessionId: string;
    }>;
    mentorNoShows: Array<{
      id: string;
      scheduledAt: Date;
      reason: string | null;
      studentName: string;
      mentorName: string;
    }>;
    flaggedReviews: Array<{
      id: string;
      reviewId: string;
      createdAt: Date;
      actorName: string;
      metadata: Prisma.JsonValue;
    }>;
  };
};

function formatEnumLabel(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => {
      const upper = word.toUpperCase();

      if (["AI", "CBSE", "ICSE", "IIT", "IIM", "IIIT", "NIT", "UPI", "DU"].includes(upper)) {
        return upper;
      }

      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`;
    })
    .join(" ");
}

function getRevenueBuckets(payments: Array<{ paidAt: Date | null; amount: number }>, days: number) {
  const now = new Date();
  const start = startOfDay(subDays(now, days - 1));
  const bucketMap = new Map<string, number>();

  for (let index = 0; index < days; index += 1) {
    const date = addDays(start, index);
    bucketMap.set(format(date, "yyyy-MM-dd"), 0);
  }

  for (const payment of payments) {
    if (!payment.paidAt) {
      continue;
    }

    const key = format(payment.paidAt, "yyyy-MM-dd");
    if (!bucketMap.has(key)) {
      continue;
    }

    bucketMap.set(key, (bucketMap.get(key) ?? 0) + payment.amount);
  }

  return Array.from(bucketMap.entries()).map(([date, amount]) => ({
    date,
    label: format(new Date(date), "d MMM"),
    amount,
  }));
}

/**
 * Every admin data loader checks the viewer itself, so admin data is never served
 * just because a page or layout check was skipped.
 */
async function requireAdminViewer() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/admin/signin");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
}

/**
 * Drops cached public data for mentors after an admin changes their status or tier,
 * so suspended or rejected mentors stop appearing straight away.
 */
export async function invalidateMentorPublicCaches(
  mentors: Array<{ id: string; mentorProfile?: { username: string } | null }>,
) {
  const invalidations: Promise<unknown>[] = [
    cacheDelPattern(cacheKeys.searchPattern),
    invalidateAllMatchingCaches(),
  ];

  for (const mentor of mentors) {
    invalidations.push(cacheDelPattern(cacheKeys.availabilityPattern(mentor.id)));

    if (mentor.mentorProfile?.username) {
      invalidations.push(cacheDel(cacheKeys.mentorProfile(mentor.mentorProfile.username)));
    }
  }

  await Promise.allSettled(invalidations);

  for (const mentor of mentors) {
    if (mentor.mentorProfile?.username) {
      revalidatePath(`/mentor/${mentor.mentorProfile.username}`);
    }
  }

  revalidatePath("/find-mentor");
}

export function extractRequestIp(request: Request) {
  return getClientIp(request);
}

export function getAdminRedirectPath() {
  return "/dashboard";
}

export function autoAssignMentorTier(college: string | null | undefined) {
  const normalized = (college ?? "").toLowerCase();

  if (
    /(iit|iim|aiims|nlsiu|bits pilani|isb|iisc|iit bombay|iit delhi|iit madras)/.test(normalized)
  ) {
    return MentorTier.ELITE;
  }

  if (/(nit|iiit|bits|dtu|nsut|du|jnu|iiser|vnit|pec|jamia)/.test(normalized)) {
    return MentorTier.VERIFIED;
  }

  return MentorTier.RISING;
}

export function getMentorAdminStatus(input: {
  verificationStatus: VerificationStatus | null | undefined;
  isVerified: boolean;
  isActive: boolean;
}) {
  if (!input.isActive) {
    return "SUSPENDED" satisfies AdminMentorStatus;
  }

  if (input.verificationStatus === VerificationStatus.APPROVED && input.isVerified) {
    return "VERIFIED" satisfies AdminMentorStatus;
  }

  if (input.verificationStatus === VerificationStatus.REJECTED) {
    return "REJECTED" satisfies AdminMentorStatus;
  }

  return "PENDING" satisfies AdminMentorStatus;
}

export async function getPendingMentorVerificationCount() {
  await requireAdminViewer();

  return db.mentorVerification.count({
    where: {
      status: VerificationStatus.PENDING,
    },
  });
}

export async function getAdminOverviewData(): Promise<AdminOverviewData> {
  await requireAdminViewer();

  const cacheKey = cacheKeys.adminStats;
  const cached = await cacheGet<AdminOverviewData>(cacheKey);
  if (cached) return cached;

  const now = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = addDays(todayStart, 1);
  const last30DaysStart = startOfDay(subDays(now, 29));

  const [
    totalUsersToday,
    sessionsToday,
    activeMentors,
    todayRevenuePayments,
    chartPayments,
    recentSessions,
    failedPayments,
    mentorNoShows,
    flaggedReviews,
  ] = await Promise.all([
    db.user.count({
      where: { createdAt: { gte: todayStart, lt: tomorrowStart } },
    }),
    db.session.count({
      where: { scheduledAt: { gte: todayStart, lt: tomorrowStart } },
    }),
    db.mentorProfile.count({
      where: { isActive: true },
    }),
    db.payment.findMany({
      where: {
        status: PaymentStatus.CAPTURED,
        paidAt: { gte: todayStart, lt: tomorrowStart },
      },
      select: { amount: true },
    }),
    db.payment.findMany({
      where: {
        status: PaymentStatus.CAPTURED,
        paidAt: { gte: last30DaysStart },
      },
      select: {
        amount: true,
        paidAt: true,
      },
    }),
    db.session.findMany({
      take: 10,
      orderBy: { scheduledAt: "desc" },
      select: {
        id: true,
        status: true,
        type: true,
        scheduledAt: true,
        durationMinutes: true,
        student: { select: { name: true } },
        mentor: { select: { name: true } },
        payment: { select: { status: true, amount: true } },
      },
    }),
    db.payment.findMany({
      where: {
        status: PaymentStatus.FAILED,
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        user: { select: { name: true } },
        session: {
          select: {
            id: true,
            mentor: { select: { name: true } },
          },
        },
      },
    }),
    db.session.findMany({
      where: {
        status: SessionStatus.NO_SHOW,
      },
      take: 5,
      orderBy: { cancelledAt: "desc" },
      select: {
        id: true,
        scheduledAt: true,
        cancellationReason: true,
        student: { select: { name: true } },
        mentor: { select: { name: true } },
      },
    }),
    db.auditLog.findMany({
      where: {
        action: "MENTOR_REVIEW_FLAGGED",
      },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        entityId: true,
        metadata: true,
        user: { select: { name: true } },
      },
    }),
  ]);
  const response = {
    kpis: {
      totalUsersToday,
      sessionsToday,
      revenueToday: todayRevenuePayments.reduce((sum, payment) => sum + payment.amount, 0),
      activeMentors,
    },
    revenueLast30Days: getRevenueBuckets(chartPayments, 30),
    recentSessions: recentSessions.map((session) => ({
      id: session.id,
      status: session.status,
      type: session.type,
      scheduledAt: session.scheduledAt,
      durationMinutes: session.durationMinutes,
      studentName: session.student.name,
      mentorName: session.mentor.name,
      paymentStatus: session.payment?.status ?? null,
      amount: session.payment?.amount ?? 0,
    })),
    alerts: {
      failedPayments: failedPayments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        createdAt: payment.createdAt,
        studentName: payment.user.name,
        mentorName: payment.session.mentor.name,
        sessionId: payment.session.id,
      })),
      mentorNoShows: mentorNoShows.map((session) => ({
        id: session.id,
        scheduledAt: session.scheduledAt,
        reason: session.cancellationReason,
        studentName: session.student.name,
        mentorName: session.mentor.name,
      })),
      flaggedReviews: flaggedReviews.map((entry) => ({
        id: entry.id,
        reviewId: entry.entityId,
        createdAt: entry.createdAt,
        actorName: entry.user?.name ?? "Unknown mentor",
        metadata: entry.metadata,
      })),
    },
  } satisfies AdminOverviewData;

  cacheSet(cacheKey, response, cacheTtl.adminOverviewStats).catch(() => {});

  return response;
}

export async function getAdminMentorsData() {
  await requireAdminViewer();

  const mentors = await db.user.findMany({
    where: { role: Role.MENTOR },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      mentorProfile: {
        select: {
          college: true,
          tier: true,
          totalSessions: true,
          avgRating: true,
          totalReviews: true,
          isVerified: true,
          isActive: true,
          headline: true,
          bio: true,
          priceMin: true,
          priceMax: true,
        },
      },
      mentorVerification: {
        select: {
          id: true,
          status: true,
          collegeIdUrl: true,
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true,
        },
      },
    },
  });

  return mentors.map((mentor) => {
    const status = getMentorAdminStatus({
      verificationStatus: mentor.mentorVerification?.status,
      isVerified: mentor.mentorProfile?.isVerified ?? false,
      isActive: mentor.mentorProfile?.isActive ?? true,
    });

    return {
      id: mentor.id,
      name: mentor.name,
      email: mentor.email,
      image: mentor.image,
      joinedAt: mentor.createdAt,
      college: mentor.mentorProfile?.college ?? "Not provided",
      tier: mentor.mentorProfile?.tier ?? MentorTier.RISING,
      sessions: mentor.mentorProfile?.totalSessions ?? 0,
      rating: mentor.mentorProfile?.avgRating ?? 0,
      totalReviews: mentor.mentorProfile?.totalReviews ?? 0,
      status,
      verificationStatus: mentor.mentorVerification?.status ?? VerificationStatus.PENDING,
      isVerified: mentor.mentorProfile?.isVerified ?? false,
      isActive: mentor.mentorProfile?.isActive ?? true,
      headline: mentor.mentorProfile?.headline ?? "",
      bio: mentor.mentorProfile?.bio ?? "",
      priceMin: mentor.mentorProfile?.priceMin ?? 0,
      priceMax: mentor.mentorProfile?.priceMax ?? 0,
      collegeIdUrl: mentor.mentorVerification?.collegeIdUrl ?? null,
      submittedAt: mentor.mentorVerification?.submittedAt ?? null,
      reviewedAt: mentor.mentorVerification?.reviewedAt ?? null,
      rejectionReason: mentor.mentorVerification?.rejectionReason ?? null,
    };
  });
}

export async function getAdminMentorVerificationQueueData() {
  await requireAdminViewer();

  const mentors = await db.user.findMany({
    where: {
      role: Role.MENTOR,
      mentorVerification: {
        status: VerificationStatus.PENDING,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      mentorProfile: {
        select: {
          college: true,
          degree: true,
          branch: true,
          yearOfStudy: true,
          expectedGraduationYear: true,
          tier: true,
          headline: true,
          bio: true,
          examsCleared: true,
          specialisations: true,
          priceMin: true,
          priceMax: true,
          linkedinUrl: true,
          responseRate: true,
          totalSessions: true,
          avgRating: true,
          totalReviews: true,
        },
      },
      mentorVerification: {
        select: {
          id: true,
          collegeIdUrl: true,
          status: true,
          submittedAt: true,
        },
      },
      availabilities: {
        where: { isActive: true },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          timezone: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  return mentors.map((mentor) => ({
    id: mentor.id,
    name: mentor.name,
    email: mentor.email,
    image: mentor.image,
    verificationId: mentor.mentorVerification?.id ?? mentor.id,
    collegeIdUrl: mentor.mentorVerification?.collegeIdUrl ?? null,
    submittedAt: mentor.mentorVerification?.submittedAt ?? null,
    profile: {
      college: mentor.mentorProfile?.college ?? "Not provided",
      degree: mentor.mentorProfile?.degree ?? "",
      branch: mentor.mentorProfile?.branch ?? "",
      yearOfStudy: mentor.mentorProfile?.yearOfStudy ?? null,
      expectedGraduationYear: mentor.mentorProfile?.expectedGraduationYear ?? null,
      tier: mentor.mentorProfile?.tier ?? MentorTier.RISING,
      headline: mentor.mentorProfile?.headline ?? "",
      bio: mentor.mentorProfile?.bio ?? "",
      examsCleared: mentor.mentorProfile?.examsCleared ?? [],
      specialisations: mentor.mentorProfile?.specialisations ?? [],
      priceMin: mentor.mentorProfile?.priceMin ?? 0,
      priceMax: mentor.mentorProfile?.priceMax ?? 0,
      linkedinUrl: mentor.mentorProfile?.linkedinUrl ?? "",
      responseRate: mentor.mentorProfile?.responseRate ?? 0,
      totalSessions: mentor.mentorProfile?.totalSessions ?? 0,
      avgRating: mentor.mentorProfile?.avgRating ?? 0,
      totalReviews: mentor.mentorProfile?.totalReviews ?? 0,
    },
    availability: mentor.availabilities.map((slot) => ({
      id: slot.id,
      label: `${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][slot.dayOfWeek] ?? "Day"} ${slot.startTime}-${slot.endTime}`,
      timezone: slot.timezone,
    })),
  }));
}

export async function getAdminMentorDetailData(mentorId: string) {
  await requireAdminViewer();

  return db.user.findFirst({
    where: {
      id: mentorId,
      role: Role.MENTOR,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      mentorProfile: {
        select: {
          college: true,
          degree: true,
          branch: true,
          yearOfStudy: true,
          expectedGraduationYear: true,
          tier: true,
          headline: true,
          bio: true,
          examsCleared: true,
          specialisations: true,
          priceMin: true,
          priceMax: true,
          isVerified: true,
          isActive: true,
          totalSessions: true,
          avgRating: true,
          totalReviews: true,
          responseRate: true,
          linkedinUrl: true,
          profileViews: true,
          lastProfileUpdate: true,
        },
      },
      mentorVerification: {
        select: {
          status: true,
          collegeIdUrl: true,
          rejectionReason: true,
          submittedAt: true,
          reviewedAt: true,
        },
      },
      mentorSessions: {
        take: 10,
        orderBy: { scheduledAt: "desc" },
        select: {
          id: true,
          status: true,
          type: true,
          scheduledAt: true,
          durationMinutes: true,
          price: true,
          mentorEarning: true,
          student: { select: { name: true, email: true } },
        },
      },
      reviewsReceived: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          rating: true,
          reviewText: true,
          createdAt: true,
          student: { select: { name: true } },
        },
      },
      availabilities: {
        where: { isActive: true },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          timezone: true,
        },
      },
    },
  });
}

export async function getAdminSessionsData() {
  await requireAdminViewer();

  const sessions = await db.session.findMany({
    orderBy: { scheduledAt: "desc" },
    select: {
      id: true,
      status: true,
      type: true,
      scheduledAt: true,
      startedAt: true,
      endedAt: true,
      durationMinutes: true,
      price: true,
      mentorEarning: true,
      meetingLink: true,
      cancellationReason: true,
      cancelledAt: true,
      aiSummary: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      mentor: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          paidAt: true,
          refundAmount: true,
          refundStatus: true,
        },
      },
      payout: {
        select: {
          id: true,
          amount: true,
          status: true,
          transactionId: true,
          processedAt: true,
        },
      },
      review: {
        select: {
          id: true,
          rating: true,
          reviewText: true,
        },
      },
      notes: {
        select: {
          id: true,
          content: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return sessions.map((session) => ({
    ...session,
    statusLabel: formatEnumLabel(session.status),
    typeLabel: formatEnumLabel(session.type),
  }));
}

export async function getAdminPaymentsData() {
  await requireAdminViewer();

  const [payments, payouts] = await Promise.all([
    db.payment.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true,
        paidAt: true,
        createdAt: true,
        refundAmount: true,
        refundStatus: true,
        user: { select: { id: true, name: true } },
        session: {
          select: {
            id: true,
            mentor: { select: { id: true, name: true } },
          },
        },
      },
    }),
    db.payout.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true,
        transactionId: true,
        upiId: true,
        scheduledAt: true,
        processedAt: true,
        createdAt: true,
        mentor: { select: { id: true, name: true } },
        session: {
          select: {
            id: true,
            student: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const totalCollected = payments
    .filter((payment) => payment.status === PaymentStatus.CAPTURED)
    .reduce((sum, payment) => sum + payment.amount, 0);
  const totalPaidOut = payouts
    .filter((payout) => payout.status === PayoutStatus.PAID)
    .reduce((sum, payout) => sum + payout.amount, 0);

  return {
    payments,
    payouts,
    pendingPayouts: payouts.filter((payout) => payout.status === PayoutStatus.PENDING),
    analytics: {
      totalCollected,
      totalPaidOut,
      platformRetained: totalCollected - totalPaidOut,
    },
  };
}

export async function getAdminUsersData() {
  await requireAdminViewer();

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      emailVerified: true,
      onboardingComplete: true,
      studentProfile: {
        select: {
          class: true,
          targetExam: true,
          city: true,
        },
      },
      mentorProfile: {
        select: {
          college: true,
          tier: true,
          isVerified: true,
          isActive: true,
        },
      },
    },
  });

  return users.map((user) => ({
    ...user,
    roleLabel: formatEnumLabel(user.role),
  }));
}

export async function getAdminNotificationsData() {
  await requireAdminViewer();

  return db.notification.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      isRead: true,
      link: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}

export async function getAdminSettingsData() {
  await requireAdminViewer();

  const [userCount, mentorCount, sessionCount, notificationCount] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: Role.MENTOR } }),
    db.session.count(),
    db.notification.count(),
  ]);

  return {
    system: {
      emailAuthEnabled: isEmailAuthEnabled,
      appUrl: process.env.NEXT_PUBLIC_APP_URL?.trim() || process.env.AUTH_URL?.trim() || "http://localhost:3000",
      supportEmail: process.env.EMAIL_FROM?.trim() || "not-configured",
    },
    counters: {
      userCount,
      mentorCount,
      sessionCount,
      notificationCount,
    },
  };
}

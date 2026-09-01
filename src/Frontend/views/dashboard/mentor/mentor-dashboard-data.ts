import { SessionStatus } from "@prisma/client";
import {
  addWeeks,
  endOfDay,
  endOfWeek,
  isWithinInterval,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";

import { auth } from "@/Backend/auth";
import { db } from "@/Backend/server/db";
import { AVAILABILITY_DAYS, getDegreeLabel, getExamLabel, getHelpTopicLabel, getYearOfStudyLabel } from "@/Backend/server/mentor-onboarding";

import { formatEnumLabel, getFirstName, normalizeResponseRate } from "./mentor-dashboard-utils";

type DayHour = {
  dayOfWeek: number;
  hour: number;
};

const weekdayMap: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function sessionDate(session: { endedAt: Date | null; scheduledAt: Date }) {
  return session.endedAt ?? session.scheduledAt;
}

function inRange(date: Date, start: Date, end: Date) {
  return isWithinInterval(date, { start, end });
}

function buildPrepTips(session: {
  type: string;
  student: {
    name: string;
    studentProfile: {
      class: string | null;
      city: string | null;
      stream: string | null;
      targetExam: string | null;
    } | null;
  };
}) {
  const profile = session.student.studentProfile;
  const focus = profile?.targetExam
    ? `Ask how ${formatEnumLabel(profile.targetExam)} is shaping current decisions.`
    : "Open with the student's most urgent decision instead of a generic intro.";
  const context = profile?.class
    ? `Calibrate examples for ${formatEnumLabel(profile.class)} level context.`
    : "Spend the first two minutes validating academic context and constraints.";
  const location = profile?.city
    ? `Use ${profile.city}-specific college or coaching references where useful.`
    : "Keep the advice anchored to choices the student can act on this week.";
  const typeTip =
    session.type === "INTRO"
      ? "Keep the intro session concrete so the student leaves with one next step."
      : "Reserve the last five minutes for a written action plan and follow-ups.";

  return [context, focus, location, typeTip].slice(0, 2);
}

function buildPerformanceTips(input: {
  avgRating: number;
  responseRate: number;
}) {
  const tips: string[] = [];

  if (input.avgRating < 4.5) {
    tips.push("Close every session with one clear action plan and ask the student to repeat it back.");
    tips.push("Trim the first five minutes of setup and move faster into the student's exact decision.");
  }

  if (input.responseRate < 80) {
    tips.push("Reply to new session notes within twelve hours to protect response-rate ranking.");
    tips.push("Block fewer tentative slots and keep only hours you can consistently honour.");
  }

  return tips;
}

function buildSeoDescription(input: {
  headline: string | null;
  college: string | null;
  specialisations: string[];
  avgRating: number;
  totalReviews: number;
}) {
  const headline = input.headline?.trim();
  const college = input.college?.trim();
  const topics = input.specialisations.slice(0, 2).map((topic) => getHelpTopicLabel(topic));
  const parts = [
    headline,
    college ? `Mentor from ${college}` : null,
    topics.length > 0 ? `Guidance in ${topics.join(" and ")}` : null,
    input.totalReviews > 0 ? `${input.avgRating.toFixed(1)} stars from ${input.totalReviews} reviews` : null,
  ].filter(Boolean);

  return parts.join(" | ").slice(0, 156);
}

function getDayHour(date: Date, timeZone: string): DayHour {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }

    return acc;
  }, {});

  return {
    dayOfWeek: weekdayMap[parts.weekday ?? "Sun"] ?? 0,
    hour: Number.parseInt(parts.hour ?? "0", 10),
  };
}

export async function getMentorDashboardData() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const mentor = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      mentorProfile: {
        select: {
          username: true,
          college: true,
          degree: true,
          branch: true,
          yearOfStudy: true,
          expectedGraduationYear: true,
          tier: true,
          headline: true,
          bio: true,
          examsCleared: true,
          examYears: true,
          specialisations: true,
          priceMin: true,
          priceMax: true,
          isAvailable: true,
          isVerified: true,
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
          submittedAt: true,
          reviewedAt: true,
          rejectionReason: true,
        },
      },
      availabilities: {
        where: {
          isActive: true,
          isRecurring: true,
        },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isRecurring: true,
          specificDate: true,
          timezone: true,
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });

  if (!mentor || !mentor.mentorProfile) {
    return null;
  }

  const [sessions, reviews, rankCount] = await Promise.all([
    db.session.findMany({
      where: { mentorId: mentor.id },
      orderBy: [{ scheduledAt: "desc" }],
      select: {
        id: true,
        status: true,
        type: true,
        scheduledAt: true,
        endedAt: true,
        durationMinutes: true,
        price: true,
        mentorEarning: true,
        meetingLink: true,
        aiSummary: true,
        cancelledAt: true,
        cancellationReason: true,
        createdAt: true,
        payout: {
          select: {
            id: true,
            amount: true,
            status: true,
            upiId: true,
            transactionId: true,
            scheduledAt: true,
            processedAt: true,
            createdAt: true,
          },
        },
        payment: {
          select: {
            amount: true,
            status: true,
            paidAt: true,
            refundAmount: true,
            refundStatus: true,
          },
        },
        review: {
          select: {
            id: true,
            rating: true,
            reviewText: true,
            createdAt: true,
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
        student: {
          select: {
            id: true,
            name: true,
            image: true,
            studentProfile: {
              select: {
                class: true,
                city: true,
                stream: true,
                targetExam: true,
              },
            },
          },
        },
      },
    }),
    db.review.findMany({
      where: {
        mentorId: mentor.id,
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        rating: true,
        reviewText: true,
        tags: true,
        wouldRebook: true,
        createdAt: true,
        student: {
          select: {
            name: true,
            image: true,
          },
        },
        session: {
          select: {
            type: true,
            durationMinutes: true,
          },
        },
      },
    }),
    db.mentorProfile.count({
      where: {
        isActive: true,
        OR: [
          { avgRating: { gt: mentor.mentorProfile.avgRating } },
          {
            avgRating: mentor.mentorProfile.avgRating,
            totalSessions: { gt: mentor.mentorProfile.totalSessions },
          },
        ],
      },
    }),
  ]);

  const now = new Date();
  const timezone = mentor.availabilities[0]?.timezone ?? "Asia/Kolkata";
  const startToday = startOfDay(now);
  const endToday = endOfDay(now);
  const startThisMonth = startOfMonth(now);
  const startLastMonth = startOfMonth(subMonths(now, 1));
  const endLastMonth = startThisMonth;
  const startThisWeek = startOfWeek(now, { weekStartsOn: 1 });
  const endThisWeek = endOfWeek(now, { weekStartsOn: 1 });
  const eightWeeksAgo = startOfWeek(subWeeks(now, 7), { weekStartsOn: 1 });
  const completedSessions = sessions.filter((item) => item.status === SessionStatus.COMPLETED);
  const upcomingSessions = sessions
    .filter((item) => item.status === SessionStatus.SCHEDULED || item.status === SessionStatus.ONGOING)
    .sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime());
  const cancelledSessions = sessions.filter(
    (item) => item.status === SessionStatus.CANCELLED || item.status === SessionStatus.NO_SHOW,
  );

  const thisMonthEarnings = completedSessions
    .filter((item) => inRange(sessionDate(item), startThisMonth, now))
    .reduce((sum, item) => sum + item.mentorEarning, 0);
  const lastMonthEarnings = completedSessions
    .filter((item) => inRange(sessionDate(item), startLastMonth, endLastMonth))
    .reduce((sum, item) => sum + item.mentorEarning, 0);
  const thisWeekEarnings = completedSessions
    .filter((item) => inRange(sessionDate(item), startThisWeek, endThisWeek))
    .reduce((sum, item) => sum + item.mentorEarning, 0);
  const totalEarned = completedSessions.reduce((sum, item) => sum + item.mentorEarning, 0);
  const pendingPayout = sessions.reduce((sum, item) => {
    if (!item.payout) {
      return sum;
    }

    return item.payout.status === "PENDING" || item.payout.status === "PROCESSING"
      ? sum + item.payout.amount
      : sum;
  }, 0);

  const nextPayout =
    sessions
      .map((item) => item.payout)
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter((item) => item.status === "PENDING" || item.status === "PROCESSING")
      .sort((left, right) => {
        const leftTime = (left.scheduledAt ?? left.createdAt).getTime();
        const rightTime = (right.scheduledAt ?? right.createdAt).getTime();
        return leftTime - rightTime;
      })[0] ?? null;

  const weeklyEarnings = Array.from({ length: 8 }, (_, index) => {
    const weekStart = addWeeks(eightWeeksAgo, index);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const amount = completedSessions
      .filter((item) => inRange(sessionDate(item), weekStart, weekEnd))
      .reduce((sum, item) => sum + item.mentorEarning, 0);

    return {
      label: `W${index + 1}`,
      weekOf: weekStart,
      amount,
    };
  });

  const upcomingToday = upcomingSessions.filter((item) => inRange(item.scheduledAt, startToday, endToday));
  const responseRate = normalizeResponseRate(mentor.mentorProfile.responseRate);
  const performanceTips = buildPerformanceTips({
    avgRating: mentor.mentorProfile.avgRating,
    responseRate,
  });

  const bookedSlotKeys = new Set(
    upcomingSessions
      .filter((item) => item.scheduledAt >= now)
      .slice(0, 40)
      .flatMap((item) => {
        const start = getDayHour(item.scheduledAt, timezone);
        const hours = Math.max(1, Math.ceil(item.durationMinutes / 60));

        return Array.from({ length: hours }, (_, index) => `${start.dayOfWeek}-${String(start.hour + index).padStart(2, "0")}:00`);
      }),
  );

  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((item) => item.rating === rating).length,
  }));
  const reviewPreview = reviews.map((item) => ({
    id: item.id,
    studentFirstName: getFirstName(item.student.name),
    studentName: item.student.name,
    studentImage: item.student.image,
    rating: item.rating,
    reviewText: item.reviewText,
    tags: item.tags,
    wouldRebook: item.wouldRebook,
    createdAt: item.createdAt,
    sessionType: item.session.type,
    durationMinutes: item.session.durationMinutes,
  }));
  const seoTitle = `${mentor.name} | ${mentor.mentorProfile.headline ?? "Mentor"} | GuideMe`;
  const seoUrlBase = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "https://guideme.app";
  const seoUrl = `${seoUrlBase}/mentors/${mentor.mentorProfile.username}`;

  return {
    mentor: {
      id: mentor.id,
      name: mentor.name,
      email: mentor.email,
      image: mentor.image,
      createdAt: mentor.createdAt,
      verification: mentor.mentorVerification,
      profile: {
        ...mentor.mentorProfile,
        responseRate,
        degreeLabel: getDegreeLabel(mentor.mentorProfile.degree),
        yearOfStudyLabel: getYearOfStudyLabel(mentor.mentorProfile.yearOfStudy),
        examLabels: mentor.mentorProfile.examsCleared.map((exam) => getExamLabel(exam)),
        specialisationLabels: mentor.mentorProfile.specialisations.map((topic) => getHelpTopicLabel(topic)),
      },
      seo: {
        title: seoTitle,
        description: buildSeoDescription({
          headline: mentor.mentorProfile.headline,
          college: mentor.mentorProfile.college,
          specialisations: mentor.mentorProfile.specialisations,
          avgRating: mentor.mentorProfile.avgRating,
          totalReviews: mentor.mentorProfile.totalReviews,
        }),
        url: seoUrl,
      },
    },
    overview: {
      isVerified: mentor.mentorProfile.isVerified && mentor.mentorVerification?.status === "APPROVED",
      thisMonthEarnings,
      lastMonthEarnings,
      thisWeekEarnings,
      totalSessions: mentor.mentorProfile.totalSessions || completedSessions.length,
      avgRating: mentor.mentorProfile.avgRating,
      responseRate,
      rank: rankCount + 1,
      upcomingToday: upcomingToday.map((item) => ({
        id: item.id,
        studentFirstName: getFirstName(item.student.name),
        studentName: item.student.name,
        scheduledAt: item.scheduledAt,
        durationMinutes: item.durationMinutes,
        meetingLink: item.meetingLink,
      })),
      performanceTips,
    },
    sessions: {
      upcoming: upcomingSessions.map((item) => ({
        id: item.id,
        status: item.status,
        type: item.type,
        scheduledAt: item.scheduledAt,
        durationMinutes: item.durationMinutes,
        price: item.price,
        mentorEarning: item.mentorEarning,
        meetingLink: item.meetingLink,
        aiSummary: item.aiSummary,
        cancelledAt: item.cancelledAt,
        cancellationReason: item.cancellationReason,
        payout: item.payout,
        payment: item.payment,
        review: item.review,
        notes: item.notes,
        student: {
          id: item.student.id,
          name: item.student.name,
          firstName: getFirstName(item.student.name),
          image: item.student.image,
          classLabel: formatEnumLabel(item.student.studentProfile?.class),
          city: item.student.studentProfile?.city,
          streamLabel: formatEnumLabel(item.student.studentProfile?.stream),
          targetExamLabel: formatEnumLabel(item.student.studentProfile?.targetExam),
        },
        prepTips: buildPrepTips(item),
      })),
      completed: completedSessions.map((item) => ({
        id: item.id,
        status: item.status,
        type: item.type,
        scheduledAt: item.scheduledAt,
        durationMinutes: item.durationMinutes,
        price: item.price,
        mentorEarning: item.mentorEarning,
        meetingLink: item.meetingLink,
        aiSummary: item.aiSummary,
        payout: item.payout,
        payment: item.payment,
        review: item.review,
        notes: item.notes,
        student: {
          id: item.student.id,
          name: item.student.name,
          firstName: getFirstName(item.student.name),
          image: item.student.image,
          classLabel: formatEnumLabel(item.student.studentProfile?.class),
          city: item.student.studentProfile?.city,
        },
      })),
      cancelled: cancelledSessions.map((item) => ({
        id: item.id,
        status: item.status,
        type: item.type,
        scheduledAt: item.scheduledAt,
        durationMinutes: item.durationMinutes,
        price: item.price,
        mentorEarning: item.mentorEarning,
        cancelledAt: item.cancelledAt,
        cancellationReason: item.cancellationReason,
        payout: item.payout,
        payment: item.payment,
        student: {
          id: item.student.id,
          name: item.student.name,
          firstName: getFirstName(item.student.name),
          image: item.student.image,
          classLabel: formatEnumLabel(item.student.studentProfile?.class),
          city: item.student.studentProfile?.city,
        },
      })),
    },
    availability: {
      timezone,
      days: AVAILABILITY_DAYS,
      recurringSlots: mentor.availabilities,
      bookedSlotKeys: Array.from(bookedSlotKeys),
    },
    earnings: {
      totalEarned,
      thisMonthEarnings,
      pendingPayout,
      nextPayout: nextPayout
        ? {
            amount: nextPayout.amount,
            status: nextPayout.status,
            date: nextPayout.scheduledAt ?? nextPayout.createdAt,
            transactionId: nextPayout.transactionId,
          }
        : null,
      weeklyEarnings,
      payouts: sessions
        .map((item) =>
          item.payout
            ? {
                id: item.payout.id,
                sessionId: item.id,
                date: item.payout.processedAt ?? item.payout.scheduledAt ?? item.payout.createdAt,
                amount: item.payout.amount,
                status: item.payout.status,
                transactionId: item.payout.transactionId,
                upiId: item.payout.upiId,
                studentFirstName: getFirstName(item.student.name),
                scheduledAt: item.scheduledAt,
              }
            : null,
        )
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
        .sort((left, right) => right.date.getTime() - left.date.getTime()),
      statementSessions: completedSessions
        .map((item) => ({
          id: item.id,
          studentName: item.student.name,
          scheduledAt: item.scheduledAt,
          completedAt: sessionDate(item),
          sessionType: item.type,
          durationMinutes: item.durationMinutes,
          grossAmount: item.price,
          mentorEarning: item.mentorEarning,
          payoutStatus: item.payout?.status ?? "PENDING",
          transactionId: item.payout?.transactionId ?? null,
        }))
        .sort((left, right) => right.completedAt.getTime() - left.completedAt.getTime()),
    },
    reviews: {
      items: reviewPreview,
      distribution: ratingDistribution,
    },
  };
}

export type MentorDashboardData = NonNullable<Awaited<ReturnType<typeof getMentorDashboardData>>>;

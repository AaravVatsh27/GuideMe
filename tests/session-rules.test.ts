import { PaymentStatus, SessionStatus, SessionType } from "@prisma/client";
import { addHours, addMinutes } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  calculateCancellationOutcome,
  calculateSessionAmounts,
  ensureMentorControlsSession,
  ensureNoShowCanBeReported,
  fitsAvailability,
  isBookingHoldExpired,
  resolveSessionEndAt,
  resolveSessionStartAt,
  sessionsOverlap,
} from "@/Backend/server/sessions/rules";

const NOW = new Date("2030-06-01T10:00:00.000Z");
const MENTOR = "mentor-1";
const STUDENT = "student-1";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

const paidSession = (scheduledAt: Date) => ({
  mentorId: MENTOR,
  scheduledAt,
  type: SessionType.PAID,
  pricePaise: 20000,
});

describe("calculateCancellationOutcome", () => {
  it("refunds in full more than 24 hours ahead", () => {
    const outcome = calculateCancellationOutcome(paidSession(addHours(NOW, 30)), STUDENT);
    expect(outcome).toMatchObject({ refundPercent: 100, refundAmountPaise: 20000, status: SessionStatus.CANCELLED });
  });

  it("refunds exactly half of an odd price, to the paisa", () => {
    const outcome = calculateCancellationOutcome({ ...paidSession(addHours(NOW, 13)), pricePaise: 19900 }, STUDENT);
    expect(outcome.refundAmountPaise).toBe(9950);
  });

  it("refunds half between 12 and 24 hours ahead", () => {
    const outcome = calculateCancellationOutcome(paidSession(addHours(NOW, 13)), STUDENT);
    expect(outcome).toMatchObject({ refundPercent: 50, refundAmountPaise: 10000 });
  });

  it("refunds nothing within 12 hours", () => {
    const outcome = calculateCancellationOutcome(paidSession(addHours(NOW, 2)), STUDENT);
    expect(outcome).toMatchObject({ refundPercent: 0, refundAmountPaise: 0 });
  });

  it("always refunds in full when the mentor cancels", () => {
    const outcome = calculateCancellationOutcome(paidSession(addHours(NOW, 1)), MENTOR);
    expect(outcome.refundPercent).toBe(100);
  });

  it("refunds a mentor no-show in full", () => {
    const outcome = calculateCancellationOutcome(paidSession(addHours(NOW, -1)), STUDENT, true);
    expect(outcome).toMatchObject({ refundPercent: 100, status: SessionStatus.NO_SHOW });
  });

  it("never refunds intro sessions", () => {
    const outcome = calculateCancellationOutcome(
      { ...paidSession(addHours(NOW, 30)), type: SessionType.INTRO, pricePaise: 0 },
      STUDENT,
    );
    expect(outcome.refundAmountPaise).toBe(0);
  });
});

describe("ensureNoShowCanBeReported", () => {
  const scheduled = (scheduledAt: Date, extra = {}) => ({
    status: SessionStatus.SCHEDULED,
    startedAt: null,
    scheduledAt,
    durationMinutes: 30,
    ...extra,
  });

  it("rejects a report before the grace period", () => {
    expect(() => ensureNoShowCanBeReported(scheduled(addMinutes(NOW, -5)))).toThrow(/minutes after/);
  });

  it("accepts a report after the grace period", () => {
    expect(() => ensureNoShowCanBeReported(scheduled(addMinutes(NOW, -15)))).not.toThrow();
  });

  it("rejects a report for a session that started", () => {
    expect(() =>
      ensureNoShowCanBeReported(scheduled(addMinutes(NOW, -15), { startedAt: addMinutes(NOW, -14) })),
    ).toThrow(/started/);
  });

  it("rejects a report long after the session", () => {
    expect(() => ensureNoShowCanBeReported(scheduled(addHours(NOW, -48)))).toThrow(/closed/);
  });
});

describe("session start and end times", () => {
  it("refuses to complete a session before it begins, whatever endedAt says", () => {
    const session = { scheduledAt: addHours(NOW, 2) };
    expect(() => resolveSessionEndAt(session, addHours(NOW, 5))).toThrow(/before they begin/);
  });

  it("ignores an endedAt in the future", () => {
    const session = { scheduledAt: addHours(NOW, -1) };
    expect(resolveSessionEndAt(session, addHours(NOW, 3))).toEqual(NOW);
  });

  it("keeps a plausible endedAt", () => {
    const session = { scheduledAt: addHours(NOW, -1) };
    const endedAt = addMinutes(NOW, -10);
    expect(resolveSessionEndAt(session, endedAt)).toEqual(endedAt);
  });

  it("refuses to start long before the scheduled time", () => {
    expect(() => resolveSessionStartAt({ scheduledAt: addHours(NOW, 1) })).toThrow(/shortly before/);
  });

  it("only lets the mentor start or complete", () => {
    expect(() => ensureMentorControlsSession({ mentorId: MENTOR }, STUDENT, "complete")).toThrow(/Only the mentor/);
    expect(() => ensureMentorControlsSession({ mentorId: MENTOR }, MENTOR, "complete")).not.toThrow();
  });
});

describe("slot rules", () => {
  it("detects overlapping sessions but allows back-to-back ones", () => {
    const first = { scheduledAt: NOW, durationMinutes: 30 };
    expect(sessionsOverlap(first, { scheduledAt: addMinutes(NOW, 15), durationMinutes: 30 })).toBe(true);
    expect(sessionsOverlap(first, { scheduledAt: addMinutes(NOW, 30), durationMinutes: 30 })).toBe(false);
  });

  it("checks a booking against availability in the mentor's timezone", () => {
    // 2030-06-03 is a Monday; 09:00-12:00 IST is 03:30-06:30 UTC.
    const availability = {
      id: "a",
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "12:00",
      timezone: "Asia/Kolkata",
      specificDate: null,
      isRecurring: true,
    };
    expect(fitsAvailability(availability, new Date("2030-06-03T04:00:00Z"), 30)).toBe(true);
    expect(fitsAvailability(availability, new Date("2030-06-03T06:15:00Z"), 30)).toBe(false);
    expect(fitsAvailability(availability, new Date("2030-06-04T04:00:00Z"), 30)).toBe(false);
  });

  it("expires unpaid holds after 15 minutes", () => {
    const fresh = { type: SessionType.PAID, createdAt: addMinutes(NOW, -5) };
    const stale = { type: SessionType.PAID, createdAt: addMinutes(NOW, -20) };
    expect(isBookingHoldExpired(fresh, PaymentStatus.PENDING)).toBe(false);
    expect(isBookingHoldExpired(stale, PaymentStatus.PENDING)).toBe(true);
    expect(isBookingHoldExpired(stale, PaymentStatus.CAPTURED)).toBe(false);
  });
});

describe("calculateSessionAmounts", () => {
  it("takes the platform cut from paid sessions", () => {
    expect(calculateSessionAmounts(SessionType.PAID, 20000)).toEqual({ platformCutPaise: 4000, mentorEarningPaise: 16000 });
  });

  it("charges nothing for intro sessions", () => {
    expect(calculateSessionAmounts(SessionType.INTRO, 0)).toEqual({ platformCutPaise: 0, mentorEarningPaise: 0 });
  });
});

import { PaymentStatus, SessionStatus, SessionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { apiErrorResponse } from "@/Backend/lib/api-helpers";
import { cacheDel, cacheKeys } from "@/Backend/lib/cache";
import { paymentLimiter } from "@/Backend/lib/ratelimit";
import { DEFAULT_CURRENCY, PLATFORM_CUT } from "@/shared/constants";
import { db } from "@/Backend/server/db";
import { createOrder } from "@/Backend/server/razorpay";
import { expireUnpaidBooking, isBookingHoldExpired } from "@/Backend/server/sessions";
import { defineRoute } from "@/Backend/lib/define-route";

const createOrderSchema = z.object({
  sessionId: z.uuid("sessionId must be a valid UUID"),
});

export const POST = defineRoute(
  { roles: ["STUDENT"], forbiddenMessage: "Only students can create payment orders", rateLimit: paymentLimiter },
  async (request: Request, _context, { session }) => {
  const payload = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(payload);

  if (!parsed.success) {
    return apiErrorResponse("Invalid payload", 400, z.flattenError(parsed.error));
  }

  const { sessionId } = parsed.data;
  const userId = session.user.id;

  const bookingSession = await db.session.findUnique({
    where: { id: sessionId },
    include: {
      payment: true,
      student: { select: { id: true, name: true, email: true } },
      mentor: { select: { id: true, name: true, email: true } },
    },
  });

  if (!bookingSession) {
    return apiErrorResponse("Session not found", 404);
  }

  if (bookingSession.studentId !== userId) {
    return apiErrorResponse("Forbidden", 403);
  }

  if (bookingSession.type !== SessionType.PAID) {
    return apiErrorResponse("Only paid sessions require a payment order", 400);
  }

  if (bookingSession.status !== SessionStatus.SCHEDULED) {
    return apiErrorResponse(`Session is already ${bookingSession.status.toLowerCase()}`, 409);
  }

  // Return existing captured payment
  if (bookingSession.payment?.status === PaymentStatus.CAPTURED) {
    return apiErrorResponse("Session is already paid", 409);
  }

  if (isBookingHoldExpired(bookingSession, bookingSession.payment?.status)) {
    await expireUnpaidBooking(sessionId);
    return apiErrorResponse("This booking was not paid in time and has been released. Please book the slot again.", 410);
  }

  // Reuse existing pending order if present
  if (bookingSession.payment?.razorpayOrderId && bookingSession.payment.status === PaymentStatus.PENDING) {
    const existingAmountPaise =
      (bookingSession.payment.metadata as { razorpayAmountSubunits?: number } | null)
        ?.razorpayAmountSubunits ?? bookingSession.price * 100;

    return NextResponse.json({
      orderId: bookingSession.payment.razorpayOrderId,
      amount: existingAmountPaise,
      currency: DEFAULT_CURRENCY,
      key: process.env.RAZORPAY_KEY_ID,
    });
  }

  const receipt = `session_${sessionId.replaceAll("-", "")}`;
  const order = await createOrder(bookingSession.price, DEFAULT_CURRENCY, receipt, {
    sessionId,
    studentId: userId,
    mentorId: bookingSession.mentorId,
  });

  const platformCut = Math.round(bookingSession.price * PLATFORM_CUT);
  const mentorEarning = bookingSession.price - platformCut;

  await db.payment.upsert({
    where: { sessionId },
    create: {
      sessionId,
      userId,
      razorpayOrderId: order.id,
      amount: bookingSession.price,
      currency: DEFAULT_CURRENCY,
      status: PaymentStatus.PENDING,
      metadata: {
        razorpayAmountSubunits: order.amount,
        mentorId: bookingSession.mentorId,
        platformCut,
        mentorEarning,
        scheduledAt: bookingSession.scheduledAt.toISOString(),
      },
    },
    update: {
      razorpayOrderId: order.id,
      status: PaymentStatus.PENDING,
      metadata: {
        razorpayAmountSubunits: order.amount,
        mentorId: bookingSession.mentorId,
        platformCut,
        mentorEarning,
        scheduledAt: bookingSession.scheduledAt.toISOString(),
      },
    },
  });
  cacheDel(cacheKeys.session(sessionId)).catch(() => {});

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: DEFAULT_CURRENCY,
    key: process.env.RAZORPAY_KEY_ID,
  });
}, "/api/payment/create-order");

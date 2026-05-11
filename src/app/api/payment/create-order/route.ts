import { PaymentStatus, SessionStatus, SessionType } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { applyRateLimit, getRateLimitId, withApiErrorHandling } from "@/lib/api-helpers";
import { cacheDel, cacheKeys } from "@/lib/cache";
import { paymentLimiter } from "@/lib/ratelimit";
import { DEFAULT_CURRENCY, PLATFORM_CUT } from "@/server/constants";
import { db } from "@/server/db";
import { createOrder } from "@/server/razorpay";

const createOrderSchema = z.object({
  sessionId: z.string().uuid("sessionId must be a valid UUID"),
});

export const POST = withApiErrorHandling(async (request: Request, _context, metadata) => {
  const session = await auth();

  const denied = await applyRateLimit(paymentLimiter, getRateLimitId(request, session?.user?.id));
  if (denied) return denied;

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  metadata.setUserId(session.user.id);

  if (session.user.role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can create payment orders" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
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
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (bookingSession.studentId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (bookingSession.type !== SessionType.PAID) {
    return NextResponse.json({ error: "Only paid sessions require a payment order" }, { status: 400 });
  }

  if (bookingSession.status !== SessionStatus.SCHEDULED) {
    return NextResponse.json(
      { error: `Session is already ${bookingSession.status.toLowerCase()}` },
      { status: 409 },
    );
  }

  // Return existing captured payment
  if (bookingSession.payment?.status === PaymentStatus.CAPTURED) {
    return NextResponse.json({ error: "Session is already paid" }, { status: 409 });
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

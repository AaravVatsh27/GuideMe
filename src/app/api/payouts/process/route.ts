import { PayoutStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/server/db";
import { sendPayoutConfirmation } from "@/server/resend";

const processPayoutsSchema = z.object({
  payoutIds: z.array(z.string().uuid()).min(1).max(50),
  transactionId: z.string().trim().min(3).max(100),
  upiId: z.string().trim().min(5).max(100).optional(),
  notes: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = processPayoutsSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { payoutIds, transactionId, upiId, notes } = parsed.data;
  const now = new Date();

  try {
    // Fetch all pending payouts
    const payouts = await db.payout.findMany({
      where: {
        id: { in: payoutIds },
        status: PayoutStatus.PENDING,
      },
      include: {
        mentor: { select: { id: true, name: true, email: true } },
        session: { select: { id: true, type: true, scheduledAt: true, durationMinutes: true, price: true, meetingLink: true } },
      },
    });

    if (payouts.length === 0) {
      return NextResponse.json(
        { error: "No pending payouts found for the given IDs" },
        { status: 404 },
      );
    }

    const skipped = payoutIds.filter((id) => !payouts.find((p) => p.id === id));

    // Mark all as PAID in one transaction
    await db.$transaction(async (tx) => {
      await tx.payout.updateMany({
        where: { id: { in: payouts.map((p) => p.id) } },
        data: {
          status: PayoutStatus.PAID,
          transactionId,
          upiId: upiId ?? null,
          processedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "BATCH_PAYOUTS_PROCESSED",
          entityType: "Payout",
          entityId: payoutIds.join(","),
          metadata: {
            count: payouts.length,
            transactionId,
            upiId,
            notes,
            totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
          },
        },
      });
    });

    // Fire confirmation emails — don't block response
    const emailPromises = payouts.map((payout) =>
      sendPayoutConfirmation(
        {
          id: payout.id,
          amount: payout.amount,
          status: PayoutStatus.PAID,
          processedAt: now,
          transactionId,
        },
        payout.mentor,
      ).catch((err) => console.error(`[payouts/process] email error for ${payout.id}`, err)),
    );

    Promise.allSettled(emailPromises);

    return NextResponse.json({
      success: true,
      processed: payouts.length,
      skipped: skipped.length,
      skippedIds: skipped,
      totalAmount: payouts.reduce((sum, p) => sum + p.amount, 0),
    });
  } catch (error) {
    console.error("[payouts/process]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

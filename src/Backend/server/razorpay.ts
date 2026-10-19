import { createHmac, timingSafeEqual } from "node:crypto";

import Razorpay from "razorpay";
import type { Orders } from "razorpay/dist/types/orders";
import type { Refunds } from "razorpay/dist/types/refunds";

import { DEFAULT_CURRENCY } from "@/shared/constants";

export type RazorpayOrderNotes = Record<string, string | number>;

let razorpayClient: Razorpay | null = null;

function getRazorpaySecret() {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error("Missing RAZORPAY_KEY_SECRET");
  }

  return secret;
}

function getRazorpayClient() {
  if (razorpayClient) {
    return razorpayClient;
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials");
  }

  razorpayClient = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  return razorpayClient;
}

/** Creates a Razorpay order. Amounts are in paise, which is what Razorpay expects. */
export async function createOrder(
  amountPaise: number,
  currency = DEFAULT_CURRENCY,
  receipt: string,
  notes?: RazorpayOrderNotes,
): Promise<Orders.RazorpayOrder> {
  return getRazorpayClient().orders.create({
    amount: amountPaise,
    currency,
    receipt,
    notes,
  });
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const expectedSignature = createHmac("sha256", getRazorpaySecret())
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

/** Refunds part or all of a payment. The amount is in paise. */
export async function createRefund(
  paymentId: string,
  amountPaise: number,
): Promise<Refunds.RazorpayRefund> {
  return getRazorpayClient().payments.refund(paymentId, {
    amount: amountPaise,
  });
}

export type CreateOrderResult = Awaited<ReturnType<typeof createOrder>>;
export type CreateRefundResult = Awaited<ReturnType<typeof createRefund>>;

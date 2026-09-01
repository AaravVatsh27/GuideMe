import { createHmac, timingSafeEqual } from "node:crypto";

import Razorpay from "razorpay";
import type { Orders } from "razorpay/dist/types/orders";
import type { Refunds } from "razorpay/dist/types/refunds";

import { DEFAULT_CURRENCY } from "@/Backend/server/constants";

export type RazorpayOrderNotes = Record<string, string | number>;

function toSubunits(amount: number) {
  return Math.round(amount * 100);
}

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

export async function createOrder(
  amount: number,
  currency = DEFAULT_CURRENCY,
  receipt: string,
  notes?: RazorpayOrderNotes,
): Promise<Orders.RazorpayOrder> {
  return getRazorpayClient().orders.create({
    amount: toSubunits(amount),
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

export async function createRefund(
  paymentId: string,
  amount: number,
): Promise<Refunds.RazorpayRefund> {
  return getRazorpayClient().payments.refund(paymentId, {
    amount: toSubunits(amount),
  });
}

export type CreateOrderResult = Awaited<ReturnType<typeof createOrder>>;
export type CreateRefundResult = Awaited<ReturnType<typeof createRefund>>;

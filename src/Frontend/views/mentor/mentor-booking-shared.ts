export const IST_TIMEZONE = "Asia/Kolkata";
export const FREE_INTRO_DURATION = 10;
export const PENDING_BOOKING_STORAGE_PREFIX = "guideme:mentor-pending-paid-booking:";

export type SessionType = "INTRO" | "PAID";
export type PaidDuration = 30 | 45;

export type AvailabilityDay = {
  date: string;
  slots: string[];
};

export type PendingPaidBooking = {
  sessionId: string;
  date: string;
  slot: string;
  durationMinutes: PaidDuration;
};

export type SessionBookingResponse = {
  confirmed?: boolean;
  requiresPayment?: boolean;
  sessionId?: string;
  session?: {
    id: string;
  };
};

export type PaymentOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  key?: string;
};

export type RazorpayPaymentResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayCheckoutInstance = {
  open: () => void;
};

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description: string;
  prefill?: {
    name?: string | null;
    email?: string | null;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
  handler: (response: RazorpayPaymentResponse) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}

export const EMPTY_AVAILABILITY: AvailabilityDay[] = [];
export const EMPTY_SLOTS: string[] = [];

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class CheckoutDismissedError extends Error {
  constructor() {
    super("Payment checkout was closed.");
    this.name = "CheckoutDismissedError";
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError || error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

async function readJsonOrNull(response: Response) {
  try {
    return (await response.json()) as
      | {
          error?: string;
        }
      | null;
  } catch {
    return null;
  }
}

export async function expectJson<T>(response: Response): Promise<T> {
  const payload = await readJsonOrNull(response);

  if (!response.ok) {
    throw new ApiError(payload?.error?.trim() || "Request failed", response.status);
  }

  return payload as T;
}

function getDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: IST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const lookup = parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }

    return acc;
  }, {});

  return {
    year: lookup.year ?? "0000",
    month: lookup.month ?? "01",
    day: lookup.day ?? "01",
  };
}

export function formatIstDateKey(date: Date) {
  const parts = getDateParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getDateFromIstKey(value: string) {
  return new Date(`${value}T12:00:00+05:30`);
}

export function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(getDateFromIstKey(value));
}

export function formatTimeLabel(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(`2026-01-01T${value}:00+05:30`));
}

export function buildScheduledAt(date: string, slot: string) {
  return new Date(`${date}T${slot}:00+05:30`).toISOString();
}

export function formatCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

export function getPendingBookingStorageKey(mentorId: string) {
  return `${PENDING_BOOKING_STORAGE_PREFIX}${mentorId}`;
}

export function buildMentorBookingPath(
  username: string,
  params?: {
    date?: string | null;
    slot?: string | null;
  },
) {
  const query = new URLSearchParams();

  if (params?.date) {
    query.set("date", params.date);
  }

  if (params?.slot) {
    query.set("slot", params.slot);
  }

  const suffix = query.toString();
  return `/mentor/${username}/book${suffix ? `?${suffix}` : ""}`;
}

export async function fetchAvailability(username: string) {
  const response = await fetch(`/api/mentors/${encodeURIComponent(username)}/availability`, {
    cache: "no-store",
  });

  return expectJson<AvailabilityDay[]>(response);
}

export async function loadRazorpayCheckout() {
  if (typeof window === "undefined") {
    throw new Error("Payment checkout is only available in the browser.");
  }

  if (window.Razorpay) {
    return window.Razorpay;
  }

  await new Promise<void>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[data-guideme-razorpay="true"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Unable to load the payment checkout script.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.guidemeRazorpay = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load the payment checkout script."));
    document.body.appendChild(script);
  });

  if (!window.Razorpay) {
    throw new Error("Payment checkout did not initialize correctly.");
  }

  return window.Razorpay;
}

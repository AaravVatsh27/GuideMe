"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  LockKeyhole,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/Frontend/components/ui/badge";
import { Button } from "@/Frontend/components/ui/button";
import { Calendar } from "@/Frontend/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { Textarea } from "@/Frontend/components/ui/textarea";
import { queryKeys } from "@/Frontend/lib/react-query";
import { cn } from "@/Backend/server/utils";

import {
  CheckoutDismissedError,
  EMPTY_AVAILABILITY,
  EMPTY_SLOTS,
  FREE_INTRO_DURATION,
  buildMentorBookingPath,
  buildScheduledAt,
  expectJson,
  fetchAvailability,
  formatCurrency,
  formatDateLabel,
  formatIstDateKey,
  formatTimeLabel,
  getDateFromIstKey,
  getErrorMessage,
  getPendingBookingStorageKey,
  loadRazorpayCheckout,
  type PaidDuration,
  type PaymentOrderResponse,
  type PendingPaidBooking,
  type SessionBookingResponse,
} from "./mentor-booking-shared";

type MentorBookingPageClientProps = {
  mentorId: string;
  username: string;
  mentorName: string;
  mentorHeadline: string | null;
  mentorCollege: string | null;
  priceMin: number | null;
  priceMax: number | null;
  initialDate?: string | null;
  initialSlot?: string | null;
};

function toRoute(path: string) {
  return path as Route;
}

export function MentorBookingPageClient({
  mentorId,
  username,
  mentorName,
  mentorHeadline,
  mentorCollege,
  priceMin,
  priceMax,
  initialDate,
  initialSlot,
}: MentorBookingPageClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const [selectedDate, setSelectedDate] = React.useState<string | null>(initialDate ?? null);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(initialSlot ?? null);
  const [notes, setNotes] = React.useState("");
  const [currentAction, setCurrentAction] = React.useState<"INTRO" | "PAID" | "RESUME" | null>(
    null,
  );
  const [pendingLoaded, setPendingLoaded] = React.useState(false);
  const [pendingPaidBooking, setPendingPaidBooking] = React.useState<PendingPaidBooking | null>(
    null,
  );
  const [selectionWarning, setSelectionWarning] = React.useState<string | null>(null);
  const availabilityQuery = useQuery({
    queryKey: queryKeys.mentors.availability(mentorId),
    queryFn: () => fetchAvailability(username),
  });

  const availability = availabilityQuery.data ?? EMPTY_AVAILABILITY;
  const selectedDay = availability.find((day) => day.date === selectedDate) ?? null;
  const slotsForSelectedDate = selectedDay?.slots ?? EMPTY_SLOTS;
  const paidOptions = [
    typeof priceMin === "number"
      ? {
          durationMinutes: 30 as PaidDuration,
          label: `30 minutes • ${formatCurrency(priceMin)}`,
          price: priceMin,
        }
      : null,
    typeof priceMax === "number"
      ? {
          durationMinutes: 45 as PaidDuration,
          label: `45 minutes • ${formatCurrency(priceMax)}`,
          price: priceMax,
        }
      : null,
  ].filter((value): value is { durationMinutes: PaidDuration; label: string; price: number } =>
    Boolean(value),
  );
  const [paidDuration, setPaidDuration] = React.useState<PaidDuration>(
    paidOptions[0]?.durationMinutes ?? 30,
  );
  const bookingPath = buildMentorBookingPath(username, {
    date: selectedDate,
    slot: selectedSlot,
  });
  const signInHref = {
    pathname: "/auth/signin",
    query: {
      callbackUrl: bookingPath,
    },
  } as const;
  const profileHref = toRoute(`/mentor/${username}`);
  const viewerRole = session?.user?.role ?? null;
  const isStudent = viewerRole === "STUDENT";
  const needsOnboarding = isStudent && !session?.user?.onboardingComplete;
  const bookingDisabled = !selectedDate || !selectedSlot;

  React.useEffect(() => {
    if (paidOptions.length === 0) {
      return;
    }

    if (!paidOptions.some((option) => option.durationMinutes === paidDuration)) {
      setPaidDuration(paidOptions[0].durationMinutes);
    }
  }, [paidDuration, paidOptions]);

  React.useEffect(() => {
    if (availability.length === 0) {
      setSelectedDate(null);
      setSelectedSlot(null);
      return;
    }

    const hasRequestedDate = Boolean(initialDate);
    const hasRequestedSlot = Boolean(initialSlot);

    if (!selectedDate || !availability.some((day) => day.date === selectedDate)) {
      setSelectedDate(availability[0].date);
      setSelectedSlot(availability[0].slots[0] ?? null);

      if (hasRequestedDate) {
        setSelectionWarning("That date is no longer open. We selected the next available slot.");
      }
      return;
    }

    if (!selectedSlot || !slotsForSelectedDate.includes(selectedSlot)) {
      setSelectedSlot(slotsForSelectedDate[0] ?? null);

      if (hasRequestedSlot) {
        setSelectionWarning("That slot was taken. We selected the next available time on this date.");
      }
      return;
    }

    if (selectionWarning && selectedDate === initialDate && selectedSlot === initialSlot) {
      setSelectionWarning(null);
    }
  }, [availability, initialDate, initialSlot, selectedDate, selectedSlot, selectionWarning, slotsForSelectedDate]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(getPendingBookingStorageKey(mentorId));

    if (!raw) {
      setPendingLoaded(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<PendingPaidBooking>;

      if (
        typeof parsed.sessionId === "string" &&
        typeof parsed.date === "string" &&
        typeof parsed.slot === "string" &&
        (parsed.durationMinutes === 30 || parsed.durationMinutes === 45)
      ) {
        setPendingPaidBooking({
          sessionId: parsed.sessionId,
          date: parsed.date,
          slot: parsed.slot,
          durationMinutes: parsed.durationMinutes,
        });
      } else {
        window.localStorage.removeItem(getPendingBookingStorageKey(mentorId));
      }
    } catch {
      window.localStorage.removeItem(getPendingBookingStorageKey(mentorId));
    } finally {
      setPendingLoaded(true);
    }
  }, [mentorId]);

  React.useEffect(() => {
    if (!pendingLoaded || typeof window === "undefined") {
      return;
    }

    const storageKey = getPendingBookingStorageKey(mentorId);

    if (pendingPaidBooking) {
      window.localStorage.setItem(storageKey, JSON.stringify(pendingPaidBooking));
      return;
    }

    window.localStorage.removeItem(storageKey);
  }, [mentorId, pendingLoaded, pendingPaidBooking]);

  async function invalidateAvailability() {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.mentors.availability(mentorId),
    });
  }

  function getSelectedPaidOption() {
    return paidOptions.find((option) => option.durationMinutes === paidDuration) ?? null;
  }

  function ensureSlotSelection() {
    if (!selectedDate || !selectedSlot) {
      toast.error("Choose a date and time before booking.");
      return null;
    }

    return {
      date: selectedDate,
      slot: selectedSlot,
      scheduledAt: buildScheduledAt(selectedDate, selectedSlot),
    };
  }

  async function startPaymentCheckout(sessionId: string) {
    const orderResponse = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });
    const order = await expectJson<PaymentOrderResponse>(orderResponse);
    const razorpayKey = order.key;

    if (!razorpayKey) {
      throw new Error("Razorpay is not configured for this environment.");
    }

    const RazorpayCheckout = await loadRazorpayCheckout();

    await new Promise<void>((resolve, reject) => {
      const checkout = new RazorpayCheckout({
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "GuideMe",
        description: `${mentorName} paid mentorship session`,
        prefill: {
          name: session?.user?.name ?? null,
          email: session?.user?.email ?? null,
        },
        notes: {
          mentorId,
          mentorUsername: username,
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: () => reject(new CheckoutDismissedError()),
        },
        handler: (paymentResponse) => {
          void (async () => {
            try {
              const verifyResponse = await fetch("/api/payment/verify", {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                },
                body: JSON.stringify({
                  sessionId,
                  razorpayOrderId: paymentResponse.razorpay_order_id,
                  razorpayPaymentId: paymentResponse.razorpay_payment_id,
                  razorpaySignature: paymentResponse.razorpay_signature,
                }),
              });

              await expectJson<{ success: true; sessionId: string }>(verifyResponse);
              setPendingPaidBooking(null);
              await invalidateAvailability();
              toast.success("Paid session confirmed.");
              router.push(`/session/${sessionId}`);
              resolve();
            } catch (error) {
              reject(error);
            }
          })();
        },
      });

      checkout.open();
    });
  }

  async function handleBookIntro() {
    const selection = ensureSlotSelection();

    if (!selection) {
      return;
    }

    setCurrentAction("INTRO");

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          mentorId,
          type: "INTRO",
          scheduledAt: selection.scheduledAt,
          durationMinutes: FREE_INTRO_DURATION,
          price: 0,
          notes: notes.trim() || undefined,
        }),
      });
      const payload = await expectJson<SessionBookingResponse>(response);
      const sessionId = payload.session?.id ?? payload.sessionId;

      if (!payload.confirmed || !sessionId) {
        throw new Error("Intro booking did not complete as expected.");
      }

      await invalidateAvailability();
      toast.success("Free intro booked.");
      router.push(`/session/${sessionId}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setCurrentAction(null);
    }
  }

  async function handleBookPaid() {
    const selection = ensureSlotSelection();
    const paidOption = getSelectedPaidOption();

    if (!selection || !paidOption) {
      if (!paidOption) {
        toast.error("This mentor has not published paid session pricing yet.");
      }
      return;
    }

    setCurrentAction("PAID");

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          mentorId,
          type: "PAID",
          scheduledAt: selection.scheduledAt,
          durationMinutes: paidOption.durationMinutes,
          price: paidOption.price,
          notes: notes.trim() || undefined,
        }),
      });
      const payload = await expectJson<SessionBookingResponse>(response);
      const sessionId = payload.sessionId ?? payload.session?.id;

      if (!payload.requiresPayment || !sessionId) {
        throw new Error("Paid booking did not start correctly.");
      }

      setPendingPaidBooking({
        sessionId,
        date: selection.date,
        slot: selection.slot,
        durationMinutes: paidOption.durationMinutes,
      });
      await invalidateAvailability();
      await startPaymentCheckout(sessionId);
    } catch (error) {
      if (error instanceof CheckoutDismissedError) {
        toast.error("Payment is still pending. Resume it to keep this booking active.");
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setCurrentAction(null);
    }
  }

  async function handleResumePayment() {
    if (!pendingPaidBooking) {
      return;
    }

    setCurrentAction("RESUME");

    try {
      await startPaymentCheckout(pendingPaidBooking.sessionId);
    } catch (error) {
      if (error instanceof CheckoutDismissedError) {
        toast.error("Payment is still pending. Resume it when you are ready.");
      } else {
        toast.error(getErrorMessage(error));
      }
    } finally {
      setCurrentAction(null);
    }
  }

  function renderStatePanel() {
    if (status === "loading") {
      return (
        <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Checking your session state...
        </div>
      );
    }

    if (!session?.user) {
      return (
        <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 size-4 text-sky-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">
                Sign in with a student account to confirm this booking.
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Your chosen slot stays in this URL, so you will come back to the same booking page after sign-in.
              </p>
              <div className="mt-3">
                <Button asChild className="rounded-xl bg-slate-950 text-white hover:bg-slate-900">
                  <Link href={signInHref}>Sign in to continue</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (viewerRole !== "STUDENT") {
      return (
        <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-4 text-amber-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">
                Only student accounts can book mentor sessions.
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                You are signed in as a {viewerRole?.toLowerCase()}. Switch to a student account to continue.
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (needsOnboarding) {
      return (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-4 text-emerald-700" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-950">
                Complete your student profile before confirming this session.
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                After onboarding, reopen this booking page from the same slot link to continue.
              </p>
              <div className="mt-3">
                <Button asChild className="rounded-xl bg-slate-950 text-white hover:bg-slate-900">
                  <Link href="/onboarding/student">Complete profile</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Signed in as a student. Confirm the slot below, then book the free intro or paid session.
      </div>
    );
  }

  const selectedPaidOption = getSelectedPaidOption();
  const canSubmit = Boolean(session?.user && isStudent && !needsOnboarding);

  return (
    <div className="space-y-6">
      <Card className="rounded-[2rem] border-slate-200 bg-white shadow-[0_28px_80px_-52px_rgba(15,23,42,0.65)]">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-slate-950 text-white">Booking page</Badge>
            <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
              Daily meeting link included after confirmation
            </Badge>
          </div>
          <CardTitle className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            Confirm your session with {mentorName}
          </CardTitle>
          <p className="text-sm leading-6 text-slate-600">
            {mentorHeadline ?? "Mentor profile"}{mentorCollege ? ` • ${mentorCollege}` : ""}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {renderStatePanel()}

          {selectionWarning ? (
            <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {selectionWarning}
            </div>
          ) : null}

          {pendingPaidBooking ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-950">Pending paid booking</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    {formatDateLabel(pendingPaidBooking.date)} at {formatTimeLabel(pendingPaidBooking.slot)} for{" "}
                    {pendingPaidBooking.durationMinutes} minutes is waiting for payment completion.
                  </p>
                </div>
                <Button
                  onClick={handleResumePayment}
                  disabled={!canSubmit || currentAction !== null}
                  className="rounded-xl bg-slate-950 text-white hover:bg-slate-900"
                >
                  {currentAction === "RESUME" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Resuming payment
                    </>
                  ) : (
                    <>
                      Resume payment
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          {availabilityQuery.isLoading ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
              <div className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                Loading live availability...
              </div>
            </div>
          ) : availabilityQuery.isError ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-5">
              <p className="text-sm font-semibold text-red-700">Unable to load live availability.</p>
              <Button
                variant="outline"
                className="mt-3 rounded-xl border-red-200 bg-white text-red-700 hover:bg-red-100"
                onClick={() => {
                  void availabilityQuery.refetch();
                }}
              >
                Retry
              </Button>
            </div>
          ) : availability.length === 0 ? (
            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-5">
              <p className="text-sm font-semibold text-slate-900">No open slots in the next 14 days.</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Go back to the mentor profile and check again later for new weekly availability.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-3">
                  <div className="mb-3 flex items-center gap-2 px-2 pt-1 text-sm font-semibold text-slate-900">
                    <CalendarDays className="size-4 text-slate-500" />
                    Pick a date
                  </div>
                  <Calendar
                    mode="single"
                    showOutsideDays={false}
                    selected={selectedDate ? getDateFromIstKey(selectedDate) : undefined}
                    onSelect={(date) => {
                      if (!date) {
                        return;
                      }

                      setSelectedDate(formatIstDateKey(date));
                      setSelectedSlot(null);
                    }}
                    disabled={(date) => !availability.some((day) => day.date === formatIstDateKey(date))}
                    className="mx-auto"
                  />
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Clock3 className="size-4 text-slate-500" />
                    {selectedDate ? `Open slots for ${formatDateLabel(selectedDate)}` : "Open slots"}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Switch the slot here if you need a different time before confirming.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {slotsForSelectedDate.length > 0 ? (
                      slotsForSelectedDate.map((slot) => (
                        <Button
                          key={slot}
                          variant={selectedSlot === slot ? "default" : "outline"}
                          className={cn(
                            "rounded-xl",
                            selectedSlot === slot && "bg-slate-950 text-white hover:bg-slate-900",
                          )}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {formatTimeLabel(slot)}
                        </Button>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No free slots left on this date.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.62fr_0.38fr]">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-4">
                  <label htmlFor="mentor-booking-notes" className="text-sm font-semibold text-slate-900">
                    Notes for the mentor
                  </label>
                  <p className="mt-1 text-sm text-slate-500">
                    Optional context helps the mentor prepare before the call.
                  </p>
                  <Textarea
                    id="mentor-booking-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="What do you want help with in this session?"
                    className="mt-3 min-h-24 rounded-[1.25rem] border-slate-200 bg-white text-slate-900 placeholder:text-slate-400"
                    maxLength={500}
                  />
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Selected slot
                  </div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">
                    {selectedDate && selectedSlot
                      ? `${formatDateLabel(selectedDate)} at ${formatTimeLabel(selectedSlot)}`
                      : "Choose a date and time"}
                  </div>
                  <div className="mt-4 rounded-[1.25rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                      <p>
                        After confirmation, both participants get a Resend email with the scheduled time and Daily meeting link.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Free intro call</div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {FREE_INTRO_DURATION}-minute intro session for context, fit, and next steps.
                      </p>
                    </div>
                    <Button
                      size="lg"
                      onClick={handleBookIntro}
                      disabled={!canSubmit || bookingDisabled || currentAction !== null}
                      className="rounded-xl bg-slate-950 text-white hover:bg-slate-900"
                    >
                      {currentAction === "INTRO" ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Booking intro
                        </>
                      ) : (
                        "Book Free Intro"
                      )}
                    </Button>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Paid session</div>
                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Choose the session duration, then continue into secure Razorpay checkout.
                        </p>
                      </div>
                      <div className="w-full max-w-xs">
                        <label
                          htmlFor="paid-duration"
                          className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
                        >
                          Duration and price
                        </label>
                        <select
                          id="paid-duration"
                          value={String(paidDuration)}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);

                            if (nextValue === 30 || nextValue === 45) {
                              setPaidDuration(nextValue);
                            }
                          }}
                          disabled={paidOptions.length === 0 || currentAction !== null}
                          className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                        >
                          {paidOptions.length > 0 ? (
                            paidOptions.map((option) => (
                              <option key={option.durationMinutes} value={option.durationMinutes}>
                                {option.label}
                              </option>
                            ))
                          ) : (
                            <option value="">Paid sessions not published</option>
                          )}
                        </select>
                      </div>
                    </div>

                    {selectedPaidOption ? (
                      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        You are booking the {selectedPaidOption.durationMinutes}-minute slot at{" "}
                        <span className="font-semibold text-slate-900">
                          {formatCurrency(selectedPaidOption.price)}
                        </span>
                        .
                      </div>
                    ) : (
                      <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        This mentor has not published paid-session pricing yet.
                      </div>
                    )}

                    <Button
                      size="lg"
                      onClick={handleBookPaid}
                      disabled={!canSubmit || bookingDisabled || currentAction !== null || paidOptions.length === 0 || pendingPaidBooking !== null}
                      className="w-full rounded-xl bg-slate-950 text-white hover:bg-slate-900"
                    >
                      {currentAction === "PAID" ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Starting payment
                        </>
                      ) : pendingPaidBooking ? (
                        "Finish the pending payment first"
                      ) : (
                        "Book Paid Session"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" className="rounded-xl border-slate-200 bg-white text-slate-900 hover:bg-slate-100">
          <Link href={profileHref}>
            <ArrowLeft className="size-4" />
            Back to mentor profile
          </Link>
        </Button>
      </div>
    </div>
  );
}

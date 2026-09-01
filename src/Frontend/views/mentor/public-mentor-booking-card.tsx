"use client";

import * as React from "react";
import type { Route } from "next";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/Frontend/components/ui/button";
import { Calendar } from "@/Frontend/components/ui/calendar";
import { queryKeys } from "@/Frontend/lib/react-query";
import { cn } from "@/Backend/server/utils";

import {
  EMPTY_AVAILABILITY,
  EMPTY_SLOTS,
  FREE_INTRO_DURATION,
  buildMentorBookingPath,
  fetchAvailability,
  formatDateLabel,
  formatIstDateKey,
  formatTimeLabel,
  getDateFromIstKey,
} from "./mentor-booking-shared";

type PublicMentorBookingCardProps = {
  mentorId: string;
  username: string;
  mentorName: string;
  priceMin: number | null;
  totalSessions: number;
};

function toRoute(path: string) {
  return path as Route;
}

function formatRupees(value: number | null) {
  return typeof value === "number" ? `₹${value.toLocaleString("en-IN")}` : "₹249";
}

export function PublicMentorBookingCard({
  mentorId,
  username,
  mentorName,
  priceMin,
  totalSessions,
}: PublicMentorBookingCardProps) {
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = React.useState<string | null>(null);
  const availabilityQuery = useQuery({
    queryKey: queryKeys.mentors.availability(mentorId),
    queryFn: () => fetchAvailability(username),
  });

  const availability = availabilityQuery.data ?? EMPTY_AVAILABILITY;
  const selectedDay = availability.find((day) => day.date === selectedDate) ?? null;
  const slotsForSelectedDate = selectedDay?.slots ?? EMPTY_SLOTS;
  const hasSelection = Boolean(selectedDate && selectedSlot);
  const bookingPath = toRoute(
    buildMentorBookingPath(username, {
      date: selectedDate,
      slot: selectedSlot,
    }),
  );
  const firstOpenDay = availability[0] ?? null;
  const nextSlotLabel = firstOpenDay?.slots[0]
    ? `${formatDateLabel(firstOpenDay.date)} at ${formatTimeLabel(firstOpenDay.slots[0])}`
    : "Checking live slots";

  React.useEffect(() => {
    if (availability.length === 0) {
      setSelectedDate(null);
      setSelectedSlot(null);
      return;
    }

    if (!selectedDate || !availability.some((day) => day.date === selectedDate)) {
      setSelectedDate(availability[0].date);
      setSelectedSlot(availability[0].slots[0] ?? null);
      return;
    }

    if (!selectedSlot || !slotsForSelectedDate.includes(selectedSlot)) {
      setSelectedSlot(slotsForSelectedDate[0] ?? null);
    }
  }, [availability, selectedDate, selectedSlot, slotsForSelectedDate]);

  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-[#111f33] p-5 shadow-[0_28px_80px_-48px_rgba(0,0,0,0.9)]">
      <div className="flex items-start gap-3">
        <div className="rounded-full bg-emerald-300/15 p-2 text-emerald-200">
          <ShieldCheck className="size-5" />
        </div>
        <div>
          <p className="text-lg font-bold leading-6 text-white">Book a session with {mentorName}</p>
          <p className="mt-1 text-sm text-slate-300">A calm call for the decision you keep postponing.</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div className="rounded-[1rem] border border-amber-200/20 bg-amber-200/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-amber-50">Free intro</p>
              <p className="mt-1 text-xs text-amber-100/80">{FREE_INTRO_DURATION} min · ₹0</p>
            </div>
            <Button
              asChild={hasSelection}
              disabled={!hasSelection}
              className="rounded-xl bg-amber-300 text-[#0f1b2d] hover:bg-amber-200"
            >
              {hasSelection ? (
                <Link href={bookingPath}>
                  Book Free Intro
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                "Pick a slot"
              )}
            </Button>
          </div>
        </div>

        <div className="rounded-[1rem] border border-teal-200/25 bg-teal-200/5 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-teal-50">Paid session</p>
              <p className="mt-1 text-xs text-teal-100/80">30 min · {formatRupees(priceMin)}</p>
            </div>
            <Button
              asChild={hasSelection}
              disabled={!hasSelection}
              variant="outline"
              className="rounded-xl border-teal-200/60 bg-transparent text-teal-50 hover:bg-teal-200/10 hover:text-white"
            >
              {hasSelection ? (
                <Link href={bookingPath}>
                  Book Session
                  <ArrowRight className="size-4" />
                </Link>
              ) : (
                "Pick a slot"
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[1rem] border border-emerald-200/20 bg-emerald-200/10 p-4 text-xs leading-5 text-emerald-50">
        <div className="flex gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-200" />
          <p>Payment held safely until session completes. Full refund if mentor doesn&apos;t show.</p>
        </div>
      </div>

      <div className="mt-5 rounded-[1rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Clock3 className="size-4 text-amber-200" />
          Next available
        </div>
        <p className="mt-1 text-sm text-slate-300">{availabilityQuery.isLoading ? "Loading..." : nextSlotLabel}</p>
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
          <CalendarDays className="size-4 text-emerald-200" />
          Availability calendar
        </div>

        {availabilityQuery.isLoading ? (
          <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] px-4 py-8 text-center text-sm text-slate-300">
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Loading open slots
            </span>
          </div>
        ) : availabilityQuery.isError ? (
          <div className="rounded-[1rem] border border-red-300/25 bg-red-300/10 p-4">
            <p className="text-sm font-semibold text-red-100">Unable to load live availability.</p>
            <Button
              variant="outline"
              className="mt-3 rounded-xl border-red-200/50 bg-transparent text-red-50 hover:bg-red-200/10 hover:text-white"
              onClick={() => {
                void availabilityQuery.refetch();
              }}
            >
              Retry
            </Button>
          </div>
        ) : availability.length === 0 ? (
          <div className="rounded-[1rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
            No open slots in the next 14 days. This mentor may add more soon.
          </div>
        ) : (
          <>
            <div className="rounded-[1rem] border border-white/10 bg-[#0f1b2d] p-2 text-slate-100">
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
                className="mx-auto bg-transparent text-slate-100"
                classNames={{
                  caption_label: "text-sm font-semibold text-white",
                  weekday: "text-slate-400",
                  disabled: "text-slate-600 opacity-40",
                  today: "bg-white/10 text-white",
                }}
              />
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                {selectedDate ? formatDateLabel(selectedDate) : "Open slots"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {slotsForSelectedDate.length > 0 ? (
                  slotsForSelectedDate.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={cn(
                        "h-9 rounded-full border px-3 text-sm font-semibold transition",
                        selectedSlot === slot
                          ? "border-emerald-200 bg-emerald-200 text-[#0f1b2d]"
                          : "border-white/10 bg-white/[0.04] text-slate-200 hover:bg-white/[0.08]",
                      )}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatTimeLabel(slot)}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">No free slots left on this date.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-5 border-t border-white/10 pt-4 text-xs text-slate-400">
        {totalSessions} sessions completed on GuideMe. Booking opens on the next screen after your slot is chosen.
      </div>
    </section>
  );
}

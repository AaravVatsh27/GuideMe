"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/Frontend/components/ui/badge";
import { Button } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { Input } from "@/Frontend/components/ui/input";
import { Label } from "@/Frontend/components/ui/label";
import { cn } from "@/Backend/server/utils";

import type { MentorDashboardData } from "./mentor-dashboard-data";
import { buildSlotKey, hourLabel, slotTimeValue } from "./mentor-dashboard-utils";

type Props = {
  mentorId: string;
  availability: MentorDashboardData["availability"];
};

type LocalSettings = {
  bufferMinutes: "0" | "15" | "30";
  vacationStart: string;
  vacationEnd: string;
};

const hours = Array.from({ length: 15 }, (_, index) => index + 8);

export function MentorAvailabilityPageClient({ mentorId, availability }: Props) {
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(() => {
    const keys = availability.recurringSlots.flatMap((slot) => {
      const start = Number.parseInt(slot.startTime.split(":")[0] ?? "0", 10);
      const end = Number.parseInt(slot.endTime.split(":")[0] ?? "0", 10);
      return Array.from({ length: Math.max(0, end - start) }, (_, index) => buildSlotKey(slot.dayOfWeek, start + index));
    });

    return new Set(keys);
  });
  const [localSettings, setLocalSettings] = useState<LocalSettings>({
    bufferMinutes: "15",
    vacationStart: "",
    vacationEnd: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(`mentor-dashboard:${mentorId}:availability-settings`);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<LocalSettings>;
      setLocalSettings((current) => ({
        bufferMinutes: parsed.bufferMinutes === "0" || parsed.bufferMinutes === "30" ? parsed.bufferMinutes : "15",
        vacationStart: parsed.vacationStart ?? current.vacationStart,
        vacationEnd: parsed.vacationEnd ?? current.vacationEnd,
      }));
    } catch {
      // ignore malformed local state
    }
  }, [mentorId]);

  useEffect(() => {
    window.localStorage.setItem(
      `mentor-dashboard:${mentorId}:availability-settings`,
      JSON.stringify(localSettings),
    );
  }, [localSettings, mentorId]);

  const bookedSlotKeys = useMemo(() => new Set(availability.bookedSlotKeys), [availability.bookedSlotKeys]);
  const selectedCount = selectedSlots.size;
  const bookedCount = bookedSlotKeys.size;
  const dayLabels = availability.days;

  const vacationSummary = useMemo(() => {
    if (!localSettings.vacationStart || !localSettings.vacationEnd) {
      return "No vacation window selected.";
    }

    if (localSettings.vacationStart > localSettings.vacationEnd) {
      return "Vacation end date must be after the start date.";
    }

    return `Students should not be able to book between ${localSettings.vacationStart} and ${localSettings.vacationEnd}.`;
  }, [localSettings.vacationEnd, localSettings.vacationStart]);

  function toggleSlot(dayOfWeek: number, hour: number) {
    const key = buildSlotKey(dayOfWeek, hour);

    if (bookedSlotKeys.has(key)) {
      return;
    }

    setSelectedSlots((current) => {
      const next = new Set(current);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });
  }

  async function saveChanges() {
    if (selectedSlots.size < 5) {
      toast.error("Add at least five hourly slots before saving.");
      return;
    }

    const availabilitySlots = Array.from(selectedSlots)
      .map((key) => {
        const [dayOfWeek, startTime] = key.split("-");
        const startHour = Number.parseInt(startTime.split(":")[0] ?? "0", 10);
        return {
          dayOfWeek: Number.parseInt(dayOfWeek ?? "0", 10),
          startTime: slotTimeValue(startHour),
          endTime: slotTimeValue(startHour + 1),
        };
      })
      .sort((left, right) =>
        left.dayOfWeek === right.dayOfWeek
          ? left.startTime.localeCompare(right.startTime)
          : left.dayOfWeek - right.dayOfWeek,
      );

    setIsSaving(true);

    try {
      const response = await fetch("/api/mentors/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          timezone: availability.timezone,
          availabilitySlots,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to save availability");
      }

      toast.success("Availability updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save availability");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-[1.75rem] border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.14),_transparent_24%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_60%,_#ecfeff_100%)]">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
              Weekly schedule
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Availability</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Toggle recurring one-hour blocks between 8am and 10pm. Teal is open, gray is closed, amber is already booked.
            </p>
          </div>
          <Button onClick={saveChanges} disabled={isSaving}>
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <CalendarRange className="size-5 text-teal-700" />
              Weekly grid calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <div className="min-w-[840px]">
              <div className="grid grid-cols-[92px_repeat(7,minmax(92px,1fr))] gap-2">
                <div />
                {dayLabels.map((day) => (
                  <div key={day.value} className="rounded-2xl bg-slate-50 px-3 py-2 text-center text-sm font-semibold text-slate-700">
                    {day.fullLabel}
                  </div>
                ))}

                {hours.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="flex items-center rounded-2xl px-2 text-sm font-medium text-slate-600">
                      {hourLabel(hour)}
                    </div>
                    {dayLabels.map((day) => {
                      const key = buildSlotKey(day.value, hour);
                      const isBooked = bookedSlotKeys.has(key);
                      const isSelected = selectedSlots.has(key);

                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={isBooked}
                          onClick={() => toggleSlot(day.value, hour)}
                          className={cn(
                            "h-12 rounded-2xl border text-sm font-medium transition",
                            isBooked
                              ? "cursor-not-allowed border-amber-200 bg-amber-100 text-amber-900"
                              : isSelected
                                ? "border-teal-600 bg-teal-500 text-white shadow-[0_18px_36px_-24px_rgba(13,148,136,0.8)]"
                                : "border-slate-200 bg-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50",
                          )}
                        >
                          {isBooked ? "Booked" : isSelected ? "Open" : "Closed"}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Batch settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="buffer-minutes">Buffer time</Label>
                <select
                  id="buffer-minutes"
                  value={localSettings.bufferMinutes}
                  onChange={(event) =>
                    setLocalSettings((current) => ({
                      ...current,
                      bufferMinutes: event.target.value as LocalSettings["bufferMinutes"],
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none"
                >
                  <option value="0">0 min</option>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                </select>
              </div>

              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="vacation-start">Vacation mode start</Label>
                  <Input
                    id="vacation-start"
                    type="date"
                    value={localSettings.vacationStart}
                    onChange={(event) =>
                      setLocalSettings((current) => ({ ...current, vacationStart: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacation-end">Vacation mode end</Label>
                  <Input
                    id="vacation-end"
                    type="date"
                    value={localSettings.vacationEnd}
                    onChange={(event) =>
                      setLocalSettings((current) => ({ ...current, vacationEnd: event.target.value }))
                    }
                  />
                </div>
                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  {vacationSummary}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Grid summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Open slots</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{selectedCount}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Booked slots</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">{bookedCount}</p>
              </div>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Buffer time is currently set to {localSettings.bufferMinutes} minutes between sessions.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/Frontend/components/ui/badge";
import { Button } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { Input } from "@/Frontend/components/ui/input";
import { Label } from "@/Frontend/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Frontend/components/ui/select";
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
    <div className="min-w-0 max-w-full space-y-4 bg-[#FAF5FF] scroll-mt-24">
      <Card className="rounded-2xl border-violet-100 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.08),transparent_30%),linear-gradient(135deg,#ffffff_0%,#faf5ff_55%,#fdf2f8_100%)]">
        <CardContent className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-6">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-violet-200 bg-white/90 text-violet-800">
              Weekly schedule
            </Badge>
            <h2 className="mt-3 text-[clamp(1.75rem,3vw,2.25rem)] font-bold tracking-[-0.03em] text-slate-950">Availability</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">
              Set the hours students can book and keep your weekly schedule ready at a glance.
            </p>
          </div>
          <Button
            onClick={saveChanges}
            disabled={isSaving}
            className="h-10 rounded-full bg-[#7C3AED] font-semibold text-white shadow-[0_8px_24px_-12px_rgba(124,58,237,0.5)] hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/10"
          >
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.8fr)]">
        <Card className="min-w-0 overflow-hidden rounded-2xl border border-[#E9D5FF] bg-white shadow-sm shadow-violet-900/5">
          <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
            <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
              <CalendarRange className="size-5 text-violet-600" />
              Weekly grid calendar
            </CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 max-w-full overflow-x-auto px-4 pb-4 sm:px-5">
            <div className="w-full min-w-[620px] xl:min-w-0">
              <div className="grid min-w-0 grid-cols-[72px_repeat(7,minmax(0,1fr))] gap-1.5">
                <div />
                {dayLabels.map((day) => (
                  <div key={day.value} className="min-w-0 rounded-xl bg-violet-50 px-1.5 py-2 text-center text-xs font-semibold text-violet-900 sm:px-2 sm:text-sm">
                    {day.label}
                  </div>
                ))}

                {hours.map((hour) => (
                  <div key={hour} className="contents">
                    <div className="flex items-center rounded-xl px-1 text-xs font-medium text-slate-600 sm:px-2 sm:text-sm">
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
                            "h-9 min-w-0 w-full rounded-xl border px-2 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/10 sm:text-sm",
                            isBooked
                              ? "cursor-not-allowed border-amber-200 bg-amber-100 text-amber-900"
                              : isSelected
                              ? "border-[#7C3AED] bg-[#7C3AED] text-white hover:bg-[#6D28D9]"
                              : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
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

        <div className="space-y-3">
          <Card className="min-w-0 overflow-hidden rounded-2xl border border-[#E9D5FF] bg-white p-6 shadow-sm shadow-violet-900/5">
            <CardHeader className="p-0">
              <CardTitle className="text-lg text-slate-950">Batch settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="space-y-2">
                <Label htmlFor="buffer-minutes" className="text-sm font-medium text-slate-900">Buffer time</Label>
                <Select
                  value={localSettings.bufferMinutes}
                  onValueChange={(value) => {
                    if (value === "0" || value === "15" || value === "30") {
                      setLocalSettings((current) => ({ ...current, bufferMinutes: value }));
                    }
                  }}
                >
                  <SelectTrigger
                    id="buffer-minutes"
                    className="!h-10 !w-full !rounded-xl !border-input !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none focus:!border-[#7C3AED] focus:!ring-2 focus:!ring-[#7C3AED]/10"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 min</SelectItem>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label htmlFor="vacation-start" className="text-sm font-medium text-slate-900">Vacation mode start</Label>
                  <Input
                    id="vacation-start"
                    type="date"
                    value={localSettings.vacationStart}
                    onChange={(event) =>
                      setLocalSettings((current) => ({ ...current, vacationStart: event.target.value }))
                    }
                    style={{ colorScheme: "light" }}
                    className="!h-10 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none !outline-none placeholder:!text-slate-400 focus:!border-[#7C3AED] focus:!ring-2 focus:!ring-[#7C3AED]/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vacation-end" className="text-sm font-medium text-slate-900">Vacation mode end</Label>
                  <Input
                    id="vacation-end"
                    type="date"
                    value={localSettings.vacationEnd}
                    onChange={(event) =>
                      setLocalSettings((current) => ({ ...current, vacationEnd: event.target.value }))
                    }
                    style={{ colorScheme: "light" }}
                    className="!h-10 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none !outline-none placeholder:!text-slate-400 focus:!border-[#7C3AED] focus:!ring-2 focus:!ring-[#7C3AED]/10"
                  />
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                  {vacationSummary}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0 overflow-hidden rounded-2xl border-violet-100 bg-white shadow-sm shadow-violet-900/5">
            <CardHeader className="p-4 pb-2 sm:p-5 sm:pb-2">
              <CardTitle className="text-lg text-slate-950">Grid summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Open slots</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{selectedCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Booked slots</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{bookedCount}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600 sm:col-span-2">
                Buffer time is currently set to {localSettings.bufferMinutes} minutes between sessions.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

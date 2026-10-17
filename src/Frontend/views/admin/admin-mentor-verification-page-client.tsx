"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ChevronRight, Search, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/Frontend/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/Frontend/components/ui/tabs";
import { Textarea } from "@/Frontend/components/ui/textarea";

import type { getAdminMentorVerificationQueueData } from "@/Backend/server/admin";
import { cn } from "@/Backend/server/utils";
import { isSafeHttpsUrl } from "@/Backend/validations/url";

import { formatCurrency, formatDateOnly, formatDateTime, formatEnumLabel } from "./admin-utils";

type Props = {
  queue: Awaited<ReturnType<typeof getAdminMentorVerificationQueueData>>;
};

type Applicant = Props["queue"][number];

const chipTones = [
  "bg-[#EEF2FF] text-[#4F46E5]",
  "bg-[#DCFCE7] text-[#166534]",
  "bg-[#F3E8FF] text-[#6B21A8]",
];

// Cards peeking out behind the front card of the carousel.
const stackLayers = [
  { offset: 1, background: "bg-white/60" },
  { offset: 2, background: "bg-white/35" },
  { offset: 3, background: "bg-white/20" },
];

// Explicit light colors: the shared Tabs switch to dark-theme colors when <html> has the dark class.
const tabTriggerClass =
  "flex-none px-0 text-[#64748B] hover:text-[#0F172A] after:bg-[#4F46E5] data-active:text-[#4F46E5] dark:text-[#64748B] dark:hover:text-[#0F172A] dark:data-active:border-transparent dark:data-active:bg-transparent dark:data-active:text-[#4F46E5]";

const sectionLabel = "text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "?";
}

function ApplicantAvatar({ applicant, className }: { applicant: Applicant; className: string }) {
  if (applicant.image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={applicant.image} alt="" className={cn("shrink-0 rounded-full object-cover", className)} />;
  }

  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] font-semibold text-[#4F46E5]", className)} aria-hidden="true">
      {getInitials(applicant.name)}
    </span>
  );
}

function PendingPill() {
  return <span className="inline-flex rounded-full bg-[#FEF3C7] px-2.5 py-1 text-xs font-medium text-[#92400E]">Pending</span>;
}

function getMeta(applicant: Applicant) {
  return [
    applicant.profile.yearOfStudy ? `Year ${applicant.profile.yearOfStudy}` : null,
    applicant.profile.degree || applicant.profile.branch || null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function ApplicationCard({ applicant, onOpen }: { applicant: Applicant; onOpen: () => void }) {
  const meta = getMeta(applicant);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Open application from ${applicant.name}`}
      className="relative z-10 flex w-[calc(100%-36px)] flex-col rounded-[20px] bg-white p-4 text-left shadow-[0_12px_32px_-12px_rgba(15,23,42,0.35)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:w-[300px]"
    >
      <div className="flex min-h-6 gap-1.5 overflow-hidden">
        {applicant.profile.specialisations.slice(0, 2).map((topic, index) => (
          <span key={topic} className={cn("max-w-[140px] shrink-0 truncate whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", chipTones[index])}>
            {formatEnumLabel(topic)}
          </span>
        ))}
        {applicant.profile.specialisations.length > 2 ? (
          <span className={cn("shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium", chipTones[2])}>
            +{applicant.profile.specialisations.length - 2}
          </span>
        ) : null}
      </div>
      <p className="mt-3 truncate text-base font-semibold text-[#0F172A]">{applicant.name}</p>
      <p className="mt-0.5 text-xs text-[#64748B]">
        {applicant.submittedAt ? `Submitted ${formatDateOnly(applicant.submittedAt)}` : "Submission date not available"}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <ApplicantAvatar applicant={applicant} className="size-7 text-[10px]" />
        {meta ? <span className="min-w-0 truncate text-xs text-[#64748B]">{meta}</span> : null}
        <span className="ml-auto flex shrink-0 gap-1">
          {!applicant.collegeIdUrl ? (
            <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-medium text-[#92400E]">No ID image</span>
          ) : null}
          {applicant.profile.examsCleared.length === 0 ? (
            <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] font-medium text-[#92400E]">No exams</span>
          ) : null}
        </span>
      </div>
    </button>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-4 py-1.5 text-sm">
      <dt className="w-28 shrink-0 text-[#64748B]">{label}</dt>
      <dd className="min-w-0 break-words text-[#0F172A]">{value}</dd>
    </div>
  );
}

function ChipList({ items, empty }: { items: string[]; empty: string }) {
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-[#64748B]">{empty}</p>;
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#334155]">
          {item}
        </span>
      ))}
    </div>
  );
}

export function AdminMentorVerificationPageClient({ queue }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [carouselId, setCarouselId] = useState<string | null>(null);
  const [reasonErrorId, setReasonErrorId] = useState<string | null>(null);

  const filteredQueue = useMemo(
    () =>
      queue.filter((mentor) =>
        `${mentor.name} ${mentor.email} ${mentor.profile.college}`.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [queue, search],
  );

  const openId = searchParams.get("id");
  const openApplicant = openId ? queue.find((mentor) => mentor.id === openId) ?? null : null;

  const carouselIndex = Math.max(0, filteredQueue.findIndex((mentor) => mentor.id === carouselId));
  const frontApplicant = filteredQueue[carouselIndex] ?? null;

  // Keep the open applicant in the URL so a refresh reopens the drawer.
  const setOpenId = useCallback((id: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (id) {
      params.set("id", id);
    } else {
      params.delete("id");
    }
    const query = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
  }, []);

  const step = useCallback(
    (direction: 1 | -1) => {
      if (filteredQueue.length === 0) return;
      const nextIndex = (carouselIndex + direction + filteredQueue.length) % filteredQueue.length;
      setCarouselId(filteredQueue[nextIndex].id);
    },
    [carouselIndex, filteredQueue],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (openApplicant || event.defaultPrevented) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openApplicant, step]);

  async function submitDecision(mentorId: string, decision: "approve" | "reject") {
    if (decision === "reject" && !(rejectionReasons[mentorId] ?? "").trim()) {
      toast.error("Add a rejection reason before rejecting an application.");
      return false;
    }

    setSubmittingId(mentorId);

    try {
      const response = await fetch(`/api/admin/mentors/${mentorId}/verification`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          decision === "approve"
            ? { decision }
            : { decision, reason: rejectionReasons[mentorId] },
        ),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Verification action failed");
      }

      toast.success(decision === "approve" ? "Mentor approved" : "Mentor rejected");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification action failed");
      return false;
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleDecision(applicant: Applicant, decision: "approve" | "reject") {
    if (decision === "reject" && !(rejectionReasons[applicant.id] ?? "").trim()) {
      setReasonErrorId(applicant.id);
      return;
    }

    const ok = await submitDecision(applicant.id, decision);
    if (!ok) return;

    const index = filteredQueue.findIndex((mentor) => mentor.id === applicant.id);
    const remaining = filteredQueue.filter((mentor) => mentor.id !== applicant.id);
    setCarouselId(remaining[Math.min(Math.max(index, 0), remaining.length - 1)]?.id ?? null);
    setOpenId(null);
  }

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-6 rounded-[24px] border border-[#EEF2FF] bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-[36px] font-bold leading-tight tracking-tight text-[#0F172A]">Verification queue</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            {queue.length.toLocaleString("en-IN")} total, review them to approve or reject
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="relative w-full sm:w-64">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter applicants"
              aria-label="Filter applicants"
              className="h-11 w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] pl-4 pr-11 text-sm text-[#0F172A] placeholder:text-[#64748B] focus:border-[#4F46E5]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
            />
            <Search className="pointer-events-none absolute right-4 top-1/2 size-[18px] -translate-y-1/2 text-[#64748B]" aria-hidden="true" />
          </div>
          <dl className="flex divide-x divide-[#E2E8F0]">
            <div className="flex flex-col">
              <dt className="order-last mt-1 text-sm text-[#64748B]">Pending</dt>
              <dd className="text-[40px] font-bold leading-none tracking-tight text-[#0F172A]">{queue.length.toLocaleString("en-IN")}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section
        className={cn(
          "relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,#4F46E5_0%,#7C3AED_100%)] text-white",
          queue.length > 0 && filteredQueue.length <= 3 ? "p-8" : "p-6 sm:p-8",
        )}
      >
        {queue.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center text-center">
            <CheckCircle2 className="size-10 text-white" aria-hidden="true" />
            <p className="mt-3 text-lg font-semibold">All caught up</p>
            <p className="mt-1 text-sm text-white/80">No mentor applications are waiting for review.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Applications to review:</h2>
              {filteredQueue.length > 0 ? (
                <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium" aria-live="polite">
                  {carouselIndex + 1} of {filteredQueue.length}
                </span>
              ) : null}
            </div>

            {frontApplicant ? (
              <div className="relative mt-5 [--peek:12px] sm:pr-14 sm:[--peek:20px]">
                <div className="relative w-full sm:w-[372px]">
                  {stackLayers
                    .filter((layer) => layer.offset < filteredQueue.length)
                    .map((layer) => (
                      <div
                        key={layer.offset}
                        aria-hidden="true"
                        className={cn("absolute inset-y-0 left-0 w-[calc(100%-36px)] rounded-[20px] sm:w-[300px]", layer.background)}
                        style={{
                          transform: `translate(calc(var(--peek) * ${layer.offset}), ${layer.offset * 6}px) scale(${1 - layer.offset * 0.07})`,
                          transformOrigin: "right center",
                          zIndex: 10 - layer.offset,
                        }}
                      />
                    ))}
                  <ApplicationCard key={frontApplicant.id} applicant={frontApplicant} onOpen={() => setOpenId(frontApplicant.id)} />
                </div>
                <button
                  type="button"
                  onClick={() => step(1)}
                  disabled={filteredQueue.length < 2}
                  aria-label="Next application"
                  className="absolute -right-3 top-1/2 z-20 flex size-11 sm:right-0 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#4F46E5] shadow-[0_8px_20px_-8px_rgba(15,23,42,0.45)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 disabled:opacity-50 disabled:hover:scale-100"
                >
                  <ChevronRight className="size-5" />
                </button>
              </div>
            ) : (
              <p className="mt-5 text-sm text-white/80">No applications match your search.</p>
            )}
          </>
        )}
      </section>

      {queue.length > 0 ? (
        <section className="rounded-[24px] border border-[#EEF2FF] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
          <h2 className="text-lg font-semibold text-[#0F172A]">Applications</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[12px] uppercase tracking-[0.05em] text-[#64748B]">
                  <th className="px-3 py-3 font-medium">Applicant</th>
                  <th className="hidden px-3 py-3 font-medium md:table-cell">College</th>
                  <th className="px-3 py-3 font-medium">Year</th>
                  <th className="px-3 py-3 font-medium">Submitted</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-[#64748B]">
                      No applications match your search.
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((applicant) => (
                    <tr
                      key={applicant.id}
                      tabIndex={0}
                      onClick={() => setOpenId(applicant.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && event.target === event.currentTarget) setOpenId(applicant.id);
                      }}
                      className="h-14 cursor-pointer border-b border-[#F1F5F9] transition-colors last:border-b-0 hover:bg-[#F8FAFC] focus-visible:bg-[#F8FAFC] focus-visible:outline-none"
                    >
                      <td className="px-3">
                        <span className="flex items-center gap-3">
                          <ApplicantAvatar applicant={applicant} className="size-9 text-xs" />
                          <span className="truncate font-medium text-[#0F172A]">{applicant.name}</span>
                        </span>
                      </td>
                      <td className="hidden max-w-[220px] truncate px-3 text-[#334155] md:table-cell">{applicant.profile.college}</td>
                      <td className="whitespace-nowrap px-3 text-[#334155]">
                        {applicant.profile.yearOfStudy ? `Year ${applicant.profile.yearOfStudy}` : "—"}
                      </td>
                      <td className="px-3">
                        <span className="whitespace-nowrap rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-medium text-[#334155]">
                          {applicant.submittedAt ? formatDateOnly(applicant.submittedAt) : "Not available"}
                        </span>
                      </td>
                      <td className="px-3">
                        <PendingPill />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <Sheet open={Boolean(openApplicant)} onOpenChange={(open) => (!open ? setOpenId(null) : undefined)}>
        <SheetContent
          side="right"
          className="w-full gap-0 border-l-[#E2E8F0] bg-white p-0 text-[#0F172A] [&_[data-slot=sheet-close]]:text-[#64748B] [&_[data-slot=sheet-close]:hover]:bg-[#F5F3FF] [&_[data-slot=sheet-close]:hover]:text-[#0F172A] data-[side=right]:w-full data-[side=right]:sm:max-w-none data-[side=right]:md:max-w-[520px]"
        >
          {openApplicant ? (
            <>
              <div className="flex items-start gap-3 border-b border-[#E2E8F0] px-6 pb-4 pt-6 pr-14">
                <ApplicantAvatar applicant={openApplicant} className="size-12 text-sm" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <SheetTitle className="truncate text-lg font-semibold text-[#0F172A]">{openApplicant.name}</SheetTitle>
                    <PendingPill />
                  </div>
                  <SheetDescription className="mt-0.5 text-xs text-[#64748B]">
                    {openApplicant.submittedAt ? `Submitted ${formatDateTime(openApplicant.submittedAt)}` : "Submission date not available"}
                  </SheetDescription>
                </div>
              </div>

              <Tabs key={openApplicant.id} defaultValue="overview" className="min-h-0 flex-1 gap-0">
                <TabsList variant="line" className="w-full justify-start gap-4 overflow-x-auto border-b border-[#E2E8F0] px-6 [scrollbar-width:none]">
                  <TabsTrigger value="overview" className={tabTriggerClass}>Overview</TabsTrigger>
                  <TabsTrigger value="documents" className={tabTriggerClass}>ID and documents</TabsTrigger>
                  <TabsTrigger value="profile" className={tabTriggerClass}>Profile preview</TabsTrigger>
                  <TabsTrigger value="availability" className={tabTriggerClass}>Availability</TabsTrigger>
                </TabsList>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                  <TabsContent value="overview" className="space-y-6">
                    <section>
                      <p className={sectionLabel}>Submitted info</p>
                      <dl className="mt-2">
                        <DetailRow label="Email" value={openApplicant.email} />
                        <DetailRow label="College" value={openApplicant.profile.college} />
                        <DetailRow label="Degree" value={openApplicant.profile.degree || "Not provided"} />
                        <DetailRow label="Branch" value={openApplicant.profile.branch || "Not provided"} />
                        <DetailRow label="Year" value={openApplicant.profile.yearOfStudy ?? "Not provided"} />
                        <DetailRow label="Graduation" value={openApplicant.profile.expectedGraduationYear ?? "Not provided"} />
                        <DetailRow
                          label="Pricing"
                          value={`${formatCurrency(openApplicant.profile.priceMin)} to ${formatCurrency(openApplicant.profile.priceMax)}`}
                        />
                      </dl>
                    </section>
                    <section>
                      <p className={sectionLabel}>Exams cleared</p>
                      <ChipList items={openApplicant.profile.examsCleared.map(formatEnumLabel)} empty="No exams submitted" />
                    </section>
                    <section>
                      <p className={sectionLabel}>Specialisations</p>
                      <ChipList items={openApplicant.profile.specialisations.map(formatEnumLabel)} empty="No topics submitted" />
                    </section>
                  </TabsContent>

                  <TabsContent value="documents">
                    <p className={sectionLabel}>College ID image</p>
                    {openApplicant.collegeIdUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={openApplicant.collegeIdUrl}
                        alt={`${openApplicant.name} college ID`}
                        className="mt-3 w-full rounded-2xl object-contain"
                      />
                    ) : (
                      <div className="mt-3 flex h-48 items-center justify-center rounded-2xl bg-[#F8FAFC] text-sm text-[#64748B]">
                        No college ID image uploaded
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="profile" className="space-y-6">
                    <section>
                      <p className="text-xl font-semibold tracking-tight text-[#0F172A]">{openApplicant.name}</p>
                      <p className="mt-1 text-sm text-[#64748B]">{openApplicant.profile.headline || "No headline added yet."}</p>
                      <p className="mt-3 text-sm leading-6 text-[#334155]">{openApplicant.profile.bio || "No bio submitted."}</p>
                    </section>
                    <section>
                      <p className={sectionLabel}>Assigned tier</p>
                      <p className="mt-1 text-sm font-medium text-[#0F172A]">{openApplicant.profile.tier}</p>
                    </section>
                    <section>
                      <p className={sectionLabel}>LinkedIn</p>
                      {isSafeHttpsUrl(openApplicant.profile.linkedinUrl) ? (
                        <a
                          href={openApplicant.profile.linkedinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block max-w-full break-all text-sm text-[#4F46E5] underline-offset-2 hover:underline"
                        >
                          {openApplicant.profile.linkedinUrl}
                        </a>
                      ) : (
                        <p className="mt-1 text-sm text-[#334155]">Not provided</p>
                      )}
                    </section>
                  </TabsContent>

                  <TabsContent value="availability">
                    <p className={sectionLabel}>Availability preview</p>
                    <ChipList items={openApplicant.availability.map((slot) => slot.label)} empty="No availability blocks found" />
                  </TabsContent>
                </div>
              </Tabs>

              <div className="sticky bottom-0 border-t border-[#E2E8F0] bg-white px-6 py-4">
                <label className="text-xs font-semibold text-[#64748B]" htmlFor={`rejection-reason-${openApplicant.id}`}>
                  Reason (required if rejecting)
                </label>
                <Textarea
                  id={`rejection-reason-${openApplicant.id}`}
                  rows={2}
                  value={rejectionReasons[openApplicant.id] ?? ""}
                  onChange={(event) => {
                    setRejectionReasons((current) => ({
                      ...current,
                      [openApplicant.id]: event.target.value,
                    }));
                    if (reasonErrorId === openApplicant.id) setReasonErrorId(null);
                  }}
                  placeholder="Reason required if rejecting this application"
                  aria-invalid={reasonErrorId === openApplicant.id || undefined}
                  aria-describedby={reasonErrorId === openApplicant.id ? `rejection-reason-error-${openApplicant.id}` : undefined}
                  className="mt-2 min-h-0 rounded-xl border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:border-[#4F46E5] focus-visible:ring-2 focus-visible:ring-[#4F46E5]/15 dark:bg-white"
                />
                {reasonErrorId === openApplicant.id ? (
                  <p id={`rejection-reason-error-${openApplicant.id}`} className="mt-1.5 text-xs font-medium text-[#DC2626]">
                    Add a reason before rejecting this application.
                  </p>
                ) : null}
                <div className="mt-3 flex justify-start gap-3">
                  <button
                    type="button"
                    disabled={submittingId === openApplicant.id}
                    onClick={() => handleDecision(openApplicant, "approve")}
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-[#4F46E5] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#4338CA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 focus-visible:ring-offset-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={submittingId === openApplicant.id}
                    onClick={() => handleDecision(openApplicant, "reject")}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[#FCA5A5] bg-white px-5 text-sm font-semibold text-[#DC2626] transition-colors hover:bg-[#FEF2F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/30 disabled:opacity-50"
                  >
                    <XCircle className="size-4" />
                    Reject
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldAlert, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/Frontend/components/ui/badge";
import { Button } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { Input } from "@/Frontend/components/ui/input";

import type { getAdminMentorVerificationQueueData } from "@/Backend/server/admin";

import { formatCurrency, formatDateTime, formatEnumLabel } from "./admin-utils";

type Props = {
  queue: Awaited<ReturnType<typeof getAdminMentorVerificationQueueData>>;
};

export function AdminMentorVerificationPageClient({ queue }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const filteredQueue = useMemo(
    () =>
      queue.filter((mentor) =>
        `${mentor.name} ${mentor.email} ${mentor.profile.college}`.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [queue, search],
  );

  async function submitDecision(mentorId: string, decision: "approve" | "reject") {
    if (decision === "reject" && !(rejectionReasons[mentorId] ?? "").trim()) {
      toast.error("Add a rejection reason before rejecting an application.");
      return;
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Verification action failed");
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-[1.75rem] border-slate-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f8fafc_58%,_#fef3c7_100%)]">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">Verification queue</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Pending mentor applications</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Review submitted mentor information, inspect the current public profile shape, and approve or reject applications with a single decision.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-900">
              {queue.length} pending
            </Badge>
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search mentor or college"
              className="w-[240px]"
            />
          </div>
        </CardContent>
      </Card>

      {filteredQueue.length === 0 ? (
        <Card className="rounded-[1.5rem] border-slate-200 bg-white">
          <CardContent className="p-6 text-sm text-slate-600">No pending mentor applications match the current search.</CardContent>
        </Card>
      ) : (
        filteredQueue.map((mentor) => (
          <div key={mentor.id} className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="rounded-[1.75rem] border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3 text-lg text-slate-950">
                  <span>{mentor.name}</span>
                  <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                    Submitted {formatDateTime(mentor.submittedAt)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Submitted info</p>
                    <div className="mt-3 space-y-2 text-sm text-slate-700">
                      <p><span className="font-medium text-slate-950">Email:</span> {mentor.email}</p>
                      <p><span className="font-medium text-slate-950">College:</span> {mentor.profile.college}</p>
                      <p><span className="font-medium text-slate-950">Degree:</span> {mentor.profile.degree || "Not provided"}</p>
                      <p><span className="font-medium text-slate-950">Branch:</span> {mentor.profile.branch || "Not provided"}</p>
                      <p><span className="font-medium text-slate-950">Year:</span> {mentor.profile.yearOfStudy ?? "Not provided"}</p>
                      <p><span className="font-medium text-slate-950">Graduation:</span> {mentor.profile.expectedGraduationYear ?? "Not provided"}</p>
                      <p><span className="font-medium text-slate-950">Pricing:</span> {formatCurrency(mentor.profile.priceMin)} to {formatCurrency(mentor.profile.priceMax)}</p>
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">College ID image</p>
                    <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      {mentor.collegeIdUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={mentor.collegeIdUrl} alt={`${mentor.name} college ID`} className="h-56 w-full object-cover" />
                      ) : (
                        <div className="flex h-56 items-center justify-center bg-slate-100 text-sm text-slate-500">
                          No college ID image uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Exams cleared</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {mentor.profile.examsCleared.length > 0 ? (
                        mentor.profile.examsCleared.map((exam) => (
                          <Badge key={exam} variant="outline" className="border-slate-300 bg-white text-slate-700">
                            {formatEnumLabel(exam)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No exams submitted</span>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Specialisations</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {mentor.profile.specialisations.length > 0 ? (
                        mentor.profile.specialisations.map((topic) => (
                          <Badge key={topic} variant="outline" className="border-slate-300 bg-white text-slate-700">
                            {formatEnumLabel(topic)}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-slate-500">No topics submitted</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Review notes</p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto_auto]">
                    <Input
                      value={rejectionReasons[mentor.id] ?? ""}
                      onChange={(event) =>
                        setRejectionReasons((current) => ({
                          ...current,
                          [mentor.id]: event.target.value,
                        }))
                      }
                      placeholder="Reason required if rejecting this application"
                    />
                    <Button
                      disabled={submittingId === mentor.id}
                      onClick={() => submitDecision(mentor.id, "approve")}
                    >
                      <CheckCircle2 className="size-4" />
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={submittingId === mentor.id}
                      onClick={() => submitDecision(mentor.id, "reject")}
                    >
                      <XCircle className="size-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.75rem] border-slate-200 bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                  <ShieldAlert className="size-5 text-teal-700" />
                  Profile preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-[1.5rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-5">
                  <p className="text-2xl font-semibold tracking-tight text-slate-950">{mentor.name}</p>
                  <p className="mt-2 text-sm text-slate-600">{mentor.profile.headline || "No headline added yet."}</p>
                  <p className="mt-4 text-sm leading-6 text-slate-700">{mentor.profile.bio || "No bio submitted."}</p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Assigned tier</p>
                      <p className="mt-2 font-medium text-slate-950">{mentor.profile.tier}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">LinkedIn</p>
                      <p className="mt-2 text-sm text-slate-700">{mentor.profile.linkedinUrl || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Availability preview</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {mentor.availability.length > 0 ? (
                      mentor.availability.map((slot) => (
                        <Badge key={slot.id} variant="outline" className="border-slate-300 bg-white text-slate-700">
                          {slot.label}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-slate-500">No availability blocks found</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  );
}

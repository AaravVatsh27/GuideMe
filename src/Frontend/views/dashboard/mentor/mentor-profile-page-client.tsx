"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Save } from "lucide-react";
import { toast } from "sonner";

import { MentorAvatar } from "@/Frontend/components/MentorAvatar";
import { Badge } from "@/Frontend/components/ui/badge";
import { Button } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { Input } from "@/Frontend/components/ui/input";
import { Label } from "@/Frontend/components/ui/label";
import { Textarea } from "@/Frontend/components/ui/textarea";
import {
  DEGREE_OPTIONS,
  EXAM_OPTIONS,
  HELP_TOPIC_OPTIONS,
  PRICING_POINTS,
  YEAR_OF_STUDY_OPTIONS,
  getDegreeLabel,
  getExamLabel,
  getHelpTopicLabel,
} from "@/Backend/server/mentor-onboarding";
import { cn } from "@/Backend/server/utils";

import type { MentorDashboardData } from "./mentor-dashboard-data";
import { formatCurrency, getInitials } from "./mentor-dashboard-utils";

type Props = {
  mentor: MentorDashboardData["mentor"];
};

const tierOptions = [
  { value: "RISING", label: "Rising" },
  { value: "VERIFIED", label: "Verified" },
  { value: "ELITE", label: "Elite" },
] as const;

type FormState = {
  college: string;
  tier: string;
  degree: string;
  branch: string;
  yearOfStudy: string;
  expectedGraduationYear: string;
  headline: string;
  bio: string;
  priceMin: string;
  linkedinUrl: string;
  exams: string[];
  specialisations: string[];
};

export function MentorProfilePageClient({ mentor }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const initialFormState: FormState = {
    college: mentor.profile.college ?? "",
    tier: mentor.profile.tier,
    degree: mentor.profile.degree ?? "",
    branch: mentor.profile.branch ?? "",
    yearOfStudy: mentor.profile.yearOfStudy ? String(mentor.profile.yearOfStudy) : "",
    expectedGraduationYear: mentor.profile.expectedGraduationYear ? String(mentor.profile.expectedGraduationYear) : "",
    headline: mentor.profile.headline ?? "",
    bio: mentor.profile.bio ?? "",
    priceMin: mentor.profile.priceMin ? String(mentor.profile.priceMin) : "199",
    linkedinUrl: mentor.profile.linkedinUrl ?? "",
    exams: mentor.profile.examsCleared,
    specialisations: mentor.profile.specialisations,
  };
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [savedFormState, setSavedFormState] = useState<FormState>(initialFormState);
  const [isEditing, setIsEditing] = useState(false);

  const priceMin = Number.parseInt(formState.priceMin || "0", 10) || 0;
  const priceMax = Math.round(priceMin * 1.4);
  const previewHeadline =
    formState.headline.trim().length >= 12
      ? formState.headline.trim()
      : "Mentor profile headline";
  const previewBio =
    formState.bio.trim().length >= 24
      ? formState.bio.trim()
      : "Add a clear public bio so students understand how you can help them.";
  const verificationLabel =
    mentor.verification?.status === "APPROVED"
      ? "VERIFIED"
      : mentor.verification?.status === "REJECTED"
        ? "ACTION REQUIRED"
        : "UNDER REVIEW";
  const tierLabel = tierOptions.find((option) => option.value === formState.tier)?.label ?? formState.tier;
  const degreeLabel = getDegreeLabel(formState.degree);
  const yearLabel =
    YEAR_OF_STUDY_OPTIONS.find((option) => String(option.value) === formState.yearOfStudy)?.label ||
    formState.yearOfStudy ||
    "Not provided";

  function cloneFormState(value: FormState): FormState {
    return {
      ...value,
      exams: [...value.exams],
      specialisations: [...value.specialisations],
    };
  }

  function startEditing() {
    setSavedFormState(cloneFormState(formState));
    setIsEditing(true);
  }

  function cancelEditing() {
    setFormState(cloneFormState(savedFormState));
    setIsEditing(false);
  }

  function toggleValue(field: "exams" | "specialisations", value: string) {
    setFormState((current) => {
      const hasValue = current[field].includes(value);
      return {
        ...current,
        [field]: hasValue ? current[field].filter((item) => item !== value) : [...current[field], value],
      };
    });
  }

  async function saveProfile() {
    setIsSaving(true);

    try {
      const response = await fetch("/api/mentors/profile", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          college: formState.college,
          tier: formState.tier,
          degree: formState.degree,
          branch: formState.branch,
          yearOfStudy: formState.yearOfStudy ? Number.parseInt(formState.yearOfStudy, 10) : undefined,
          expectedGraduationYear: formState.expectedGraduationYear
            ? Number.parseInt(formState.expectedGraduationYear, 10)
            : undefined,
          priceMin,
          headline: formState.headline,
          bio: formState.bio,
          linkedinUrl: formState.linkedinUrl,
          exams: formState.exams.map((exam) => ({ exam, year: null })),
          specialisations: formState.specialisations,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Failed to save profile");
      }

      toast.success(
        "Profile changes saved",
      );
      setSavedFormState(cloneFormState(formState));
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-2xl border-violet-100 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.08),transparent_30%),linear-gradient(135deg,#ffffff_0%,#faf5ff_55%,#fdf2f8_100%)]">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div className="max-w-2xl">
            <Badge variant="outline" className="border-violet-200 bg-white/90 text-violet-800">
              Public listing
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Profile</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Update the profile students will see once your mentor listing is approved.
            </p>
          </div>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={cancelEditing}
                disabled={isSaving}
                className="min-h-11 border-violet-200 bg-white text-violet-900 hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={saveProfile}
                disabled={isSaving}
                className="min-h-11 bg-[#7C3AED] text-white hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20"
              >
                <Save className="size-4" />
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              onClick={startEditing}
              className="min-h-11 bg-[#7C3AED] text-white hover:bg-[#6D28D9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20"
            >
              Edit profile
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <div className="min-w-0 space-y-4">
          <Card className="min-w-0 overflow-hidden rounded-2xl border-violet-100 bg-white shadow-sm shadow-violet-900/5">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">
                {isEditing ? "Edit profile" : "Profile details"}
              </CardTitle>
            </CardHeader>
              {isEditing ? (
                <CardContent className="grid min-w-0 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="mentor-college"
                  className="text-sm font-medium text-slate-900"
                >
                  College
                </Label>
                <Input
                  id="mentor-college"
                  value={formState.college}
                  onChange={(event) => setFormState((current) => ({ ...current, college: event.target.value }))}
                  style={{ colorScheme: "light" }}
                  className="!h-11 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none placeholder:!text-slate-400 focus-visible:!border-violet-400 focus-visible:!ring-2 focus-visible:!ring-violet-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="mentor-tier"
                  className="text-sm font-medium text-slate-900"
                >
                  Mentor tier
                </Label>
                <select
                  id="mentor-tier"
                  value={formState.tier}
                  onChange={(event) => setFormState((current) => ({ ...current, tier: event.target.value }))}
                  style={{ colorScheme: "light" }}
                  className="!h-11 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none !outline-none focus:!border-violet-400 focus:!ring-2 focus:!ring-violet-500/20"
                >
                  {tierOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs leading-5 text-slate-600">
                  Tier is separate from verification status.
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="mentor-degree"
                  className="text-sm font-medium text-slate-900"
                >
                  Degree
                </Label>
                <select
                  id="mentor-degree"
                  value={formState.degree}
                  onChange={(event) => setFormState((current) => ({ ...current, degree: event.target.value }))}
                  style={{ colorScheme: "light" }}
                  className="!h-11 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none !outline-none focus:!border-violet-400 focus:!ring-2 focus:!ring-violet-500/20"
                >
                  {DEGREE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="mentor-branch"
                  className="text-sm font-medium text-slate-900"
                >
                  Branch
                </Label>
                <Input
                  id="mentor-branch"
                  value={formState.branch}
                  onChange={(event) => setFormState((current) => ({ ...current, branch: event.target.value }))}
                  style={{ colorScheme: "light" }}
                  className="!h-11 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none placeholder:!text-slate-400 focus-visible:!border-violet-400 focus-visible:!ring-2 focus-visible:!ring-violet-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="mentor-year"
                  className="text-sm font-medium text-slate-900"
                >
                  Year of study
                </Label>
                <select
                  id="mentor-year"
                  value={formState.yearOfStudy}
                  onChange={(event) => setFormState((current) => ({ ...current, yearOfStudy: event.target.value }))}
                  style={{ colorScheme: "light" }}
                  className="!h-11 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none !outline-none focus:!border-violet-400 focus:!ring-2 focus:!ring-violet-500/20"
                >
                  <option value="">Select year</option>
                  {YEAR_OF_STUDY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="mentor-grad-year"
                  className="text-sm font-medium text-slate-900"
                >
                  Graduation year
                </Label>
                <Input
                  id="mentor-grad-year"
                  value={formState.expectedGraduationYear}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, expectedGraduationYear: event.target.value }))
                  }
                  style={{ colorScheme: "light" }}
                  className="!h-11 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none placeholder:!text-slate-400 focus-visible:!border-violet-400 focus-visible:!ring-2 focus-visible:!ring-violet-500/20"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="mentor-headline"
                  className="text-sm font-medium text-slate-900"
                >
                  Headline
                </Label>
                <Input
                  id="mentor-headline"
                  value={formState.headline}
                  onChange={(event) => setFormState((current) => ({ ...current, headline: event.target.value }))}
                  style={{ colorScheme: "light" }}
                  className="!h-11 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none placeholder:!text-slate-400 focus-visible:!border-violet-400 focus-visible:!ring-2 focus-visible:!ring-violet-500/20"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label
                  htmlFor="mentor-bio"
                  className="text-sm font-medium text-slate-900"
                >
                  Bio
                </Label>
                <Textarea
                  id="mentor-bio"
                  value={formState.bio}
                  onChange={(event) => setFormState((current) => ({ ...current, bio: event.target.value }))}
                  style={{ colorScheme: "light" }}
                  className="!min-h-36 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !py-3 !text-sm !leading-6 !text-[#1E1B4B] !shadow-none placeholder:!text-slate-400 focus-visible:!border-violet-400 focus-visible:!ring-2 focus-visible:!ring-violet-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="mentor-price"
                  className="text-sm font-medium text-slate-900"
                >
                  30-minute price
                </Label>
                <select
                  id="mentor-price"
                  value={formState.priceMin}
                  onChange={(event) => setFormState((current) => ({ ...current, priceMin: event.target.value }))}
                  style={{ colorScheme: "light" }}
                  className="!h-11 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none !outline-none focus:!border-violet-400 focus:!ring-2 focus:!ring-violet-500/20"
                >
                  {PRICING_POINTS.map((point) => (
                    <option key={point} value={point}>
                      {formatCurrency(point)}
                    </option>
                  ))}
                </select>
                <p className="text-xs leading-5 text-slate-600">
                  45-minute price auto-previews at {formatCurrency(priceMax)}.
                </p>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="mentor-linkedin"
                  className="text-sm font-medium text-slate-900"
                >
                  LinkedIn URL
                </Label>
                <Input
                  id="mentor-linkedin"
                  value={formState.linkedinUrl}
                  onChange={(event) => setFormState((current) => ({ ...current, linkedinUrl: event.target.value }))}
                  style={{ colorScheme: "light" }}
                  className="!h-11 !w-full !rounded-xl !border !border-slate-200 !bg-white !px-3.5 !text-sm !font-medium !text-[#1E1B4B] !shadow-none placeholder:!text-slate-400 focus-visible:!border-violet-400 focus-visible:!ring-2 focus-visible:!ring-violet-500/20"
                />
              </div>

              <div className="space-y-3 sm:col-span-2">
                <Label className="text-sm font-medium text-slate-900">
                  Exams cleared
                </Label>
                <div className="flex flex-wrap gap-2">
                  {EXAM_OPTIONS.map((option) => {
                    const isSelected = formState.exams.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleValue("exams", option.value)}
                        className={cn(
                          "min-h-10 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20",
                          isSelected
                            ? "border-violet-600 bg-violet-600 text-white"
                            : "border-violet-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 sm:col-span-2">
                <Label className="text-sm font-medium text-slate-900">
                  Specialisations
                </Label>
                <div className="flex flex-wrap gap-2">
                  {HELP_TOPIC_OPTIONS.map((option) => {
                    const isSelected = formState.specialisations.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleValue("specialisations", option.value)}
                        className={cn(
                          "min-h-10 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/20",
                          isSelected
                            ? "border-violet-600 bg-violet-600 text-white"
                            : "border-violet-200 bg-white text-slate-700 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              </CardContent>
            ) : (
              <CardContent className="grid min-w-0 gap-4 sm:grid-cols-2">
                {[
                  ["College", formState.college || "Not provided"],
                  ["Mentor tier", tierLabel],
                  ["Degree", degreeLabel || "Not provided"],
                  ["Branch", formState.branch || "Not provided"],
                  ["Year of study", yearLabel],
                  ["Graduation year", formState.expectedGraduationYear || "Not provided"],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-900">{label}</p>
                    <p className="mt-1 break-words text-sm leading-6 text-slate-700">{value}</p>
                  </div>
                ))}
                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm font-medium text-slate-900">Headline</p>
                  <p className="mt-1 break-words text-sm leading-6 text-slate-700">{previewHeadline}</p>
                </div>
                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm font-medium text-slate-900">Bio</p>
                  <p className="mt-1 break-words whitespace-normal text-sm leading-6 text-slate-700">{previewBio}</p>
                </div>
                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">30-minute price</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{formatCurrency(priceMin)}</p>
                </div>
                <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-900">LinkedIn URL</p>
                  <p className="mt-1 break-words text-sm leading-6 text-slate-700">{formState.linkedinUrl || "Not provided"}</p>
                </div>
                <div className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm font-medium text-slate-900">Exams cleared</p>
                  <div className="flex flex-wrap gap-2">
                    {formState.exams.length > 0 ? formState.exams.map((exam) => (
                      <Badge key={exam} variant="outline" className="min-h-10 rounded-xl border-violet-200 bg-white px-3 text-sm font-medium text-violet-900">
                        {getExamLabel(exam)}
                      </Badge>
                    )) : <p className="text-sm text-slate-600">None selected</p>}
                  </div>
                </div>
                <div className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                  <p className="text-sm font-medium text-slate-900">Specialisations</p>
                  <div className="flex flex-wrap gap-2">
                    {formState.specialisations.length > 0 ? formState.specialisations.map((topic) => (
                      <Badge key={topic} variant="outline" className="min-h-10 rounded-xl border-violet-200 bg-white px-3 text-sm font-medium text-violet-900">
                        {getHelpTopicLabel(topic)}
                      </Badge>
                    )) : <p className="text-sm text-slate-600">None selected</p>}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:self-start">
          <Card className="h-fit min-w-0 overflow-hidden rounded-2xl border-violet-100 bg-white shadow-sm shadow-violet-900/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <Globe className="size-5 text-violet-600" />
                Live preview
              </CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 overflow-hidden">
              <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-violet-100 bg-[linear-gradient(180deg,#ffffff_0%,#faf5ff_100%)] p-4 sm:p-5">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <MentorAvatar
                    src={mentor.image}
                    alt={mentor.name}
                    fallback={getInitials(mentor.name)}
                    className="size-16"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xl font-semibold text-slate-950">{mentor.name}</p>
                    <p className="mt-1 max-w-xl break-words text-sm leading-5 text-slate-600">
                      {previewHeadline}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
                    {verificationLabel}
                  </Badge>
                  <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">
                    Tier: {tierLabel}
                  </Badge>
                  {formState.specialisations.slice(0, 3).map((topic) => (
                    <Badge key={topic} variant="outline" className="border-slate-300 bg-white text-slate-700">
                      {getHelpTopicLabel(topic)}
                    </Badge>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Education</p>
                    <p className="mt-2 break-words text-sm font-medium text-slate-900">
                      {formState.college || "College"} • {getDegreeLabel(formState.degree)}
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-600">{formState.branch || "Branch"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pricing</p>
                    <p className="mt-2 break-words text-sm font-medium text-slate-900">{formatCurrency(priceMin)} / 30 min</p>
                    <p className="mt-1 text-sm text-slate-600">{formatCurrency(priceMax)} / 45 min</p>
                  </div>
                </div>

                <p className="mt-5 break-words whitespace-normal text-sm leading-6 text-slate-700">
                  {previewBio}
                </p>

                <div className="mt-5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Proof points</p>
                  <div className="flex flex-wrap gap-2">
                    {formState.exams.slice(0, 4).map((exam) => (
                      <Badge key={exam} variant="outline" className="border-slate-300 bg-white text-slate-700">
                        {getExamLabel(exam)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}

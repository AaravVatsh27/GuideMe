"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Save, Search } from "lucide-react";
import { toast } from "sonner";

import { MentorAvatar } from "@/components/MentorAvatar";
import { Badge } from "@/client/components/ui/badge";
import { Button } from "@/client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card";
import { Input } from "@/client/components/ui/input";
import { Label } from "@/client/components/ui/label";
import { Textarea } from "@/client/components/ui/textarea";
import {
  DEGREE_OPTIONS,
  EXAM_OPTIONS,
  HELP_TOPIC_OPTIONS,
  PRICING_POINTS,
  YEAR_OF_STUDY_OPTIONS,
  getDegreeLabel,
  getExamLabel,
  getHelpTopicLabel,
} from "@/server/mentor-onboarding";
import { cn } from "@/server/utils";

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

function buildSeoDescription(input: FormState) {
  const parts = [
    input.headline.trim(),
    input.college.trim() ? `Mentor from ${input.college.trim()}` : "",
    input.specialisations.slice(0, 2).map((topic) => getHelpTopicLabel(topic)).join(" and "),
  ].filter(Boolean);

  return parts.join(" | ").slice(0, 156);
}

export function MentorProfilePageClient({ mentor }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [formState, setFormState] = useState<FormState>({
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
  });

  const seoTitle = useMemo(
    () => `${mentor.name} | ${formState.headline.trim() || "Mentor"} | GuideMe`,
    [formState.headline, mentor.name],
  );
  const seoDescription = useMemo(() => buildSeoDescription(formState), [formState]);
  const seoUrl = mentor.seo.url;
  const priceMin = Number.parseInt(formState.priceMin || "0", 10) || 0;
  const priceMax = Math.round(priceMin * 1.4);

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

      toast.success("Profile published");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save profile");
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
              Public listing
            </Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">Profile</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Update the public story students see, then publish the changes immediately from the same screen.
            </p>
          </div>
          <Button onClick={saveProfile} disabled={isSaving}>
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4">
          <Card className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-lg text-slate-950">Editable fields</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mentor-college">College</Label>
                <Input
                  id="mentor-college"
                  value={formState.college}
                  onChange={(event) => setFormState((current) => ({ ...current, college: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentor-tier">Tier</Label>
                <select
                  id="mentor-tier"
                  value={formState.tier}
                  onChange={(event) => setFormState((current) => ({ ...current, tier: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none"
                >
                  {tierOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentor-degree">Degree</Label>
                <select
                  id="mentor-degree"
                  value={formState.degree}
                  onChange={(event) => setFormState((current) => ({ ...current, degree: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none"
                >
                  {DEGREE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentor-branch">Branch</Label>
                <Input
                  id="mentor-branch"
                  value={formState.branch}
                  onChange={(event) => setFormState((current) => ({ ...current, branch: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentor-year">Year of study</Label>
                <select
                  id="mentor-year"
                  value={formState.yearOfStudy}
                  onChange={(event) => setFormState((current) => ({ ...current, yearOfStudy: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none"
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
                <Label htmlFor="mentor-grad-year">Graduation year</Label>
                <Input
                  id="mentor-grad-year"
                  value={formState.expectedGraduationYear}
                  onChange={(event) =>
                    setFormState((current) => ({ ...current, expectedGraduationYear: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="mentor-headline">Headline</Label>
                <Input
                  id="mentor-headline"
                  value={formState.headline}
                  onChange={(event) => setFormState((current) => ({ ...current, headline: event.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="mentor-bio">Bio</Label>
                <Textarea
                  id="mentor-bio"
                  value={formState.bio}
                  onChange={(event) => setFormState((current) => ({ ...current, bio: event.target.value }))}
                  className="min-h-40"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentor-price">30-minute price</Label>
                <select
                  id="mentor-price"
                  value={formState.priceMin}
                  onChange={(event) => setFormState((current) => ({ ...current, priceMin: event.target.value }))}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none"
                >
                  {PRICING_POINTS.map((point) => (
                    <option key={point} value={point}>
                      {formatCurrency(point)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">45-minute price auto-previews at {formatCurrency(priceMax)}.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="mentor-linkedin">LinkedIn URL</Label>
                <Input
                  id="mentor-linkedin"
                  value={formState.linkedinUrl}
                  onChange={(event) => setFormState((current) => ({ ...current, linkedinUrl: event.target.value }))}
                />
              </div>

              <div className="space-y-3 sm:col-span-2">
                <Label>Exams cleared</Label>
                <div className="flex flex-wrap gap-2">
                  {EXAM_OPTIONS.map((option) => {
                    const isSelected = formState.exams.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleValue("exams", option.value)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition",
                          isSelected
                            ? "border-teal-600 bg-teal-500 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 sm:col-span-2">
                <Label>Specialisations</Label>
                <div className="flex flex-wrap gap-2">
                  {HELP_TOPIC_OPTIONS.map((option) => {
                    const isSelected = formState.specialisations.includes(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleValue("specialisations", option.value)}
                        className={cn(
                          "rounded-full border px-3 py-1.5 text-sm transition",
                          isSelected
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300",
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <Globe className="size-5 text-teal-700" />
                Live preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] p-5">
                <div className="flex items-center gap-4">
                  <MentorAvatar
                    src={mentor.image}
                    alt={mentor.name}
                    fallback={getInitials(mentor.name)}
                    className="size-16"
                  />
                  <div>
                    <p className="text-xl font-semibold text-slate-950">{mentor.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{formState.headline || "Your headline appears here."}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                    {formState.tier}
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
                    <p className="mt-2 text-sm font-medium text-slate-900">
                      {formState.college || "College"} • {getDegreeLabel(formState.degree)}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{formState.branch || "Branch"}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Pricing</p>
                    <p className="mt-2 text-sm font-medium text-slate-900">{formatCurrency(priceMin)} / 30 min</p>
                    <p className="mt-1 text-sm text-slate-600">{formatCurrency(priceMax)} / 45 min</p>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-6 text-slate-700">{formState.bio || "Your public bio appears here."}</p>

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

          <Card className="rounded-[1.5rem] border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-slate-950">
                <Search className="size-5 text-teal-700" />
                SEO preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-emerald-700">{seoUrl}</p>
                <p className="mt-1 text-xl text-sky-700">{seoTitle}</p>
                <p className="mt-2 text-sm leading-6 text-slate-700">{seoDescription || mentor.seo.description}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

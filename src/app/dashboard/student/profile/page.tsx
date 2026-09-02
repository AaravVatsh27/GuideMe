"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, UploadCloud } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  buildHeroSubtitle,
  formatAcademicContext,
  formatEnumLabel,
  formatMentorshipNeeds,
  formatTargetExamLabel,
  getInitials,
} from "@/Frontend/views/dashboard/student/student-dashboard-utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/Frontend/components/ui/avatar";
import { Badge } from "@/Frontend/components/ui/badge";
import { Button, buttonVariants } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { Input } from "@/Frontend/components/ui/input";
import { Label } from "@/Frontend/components/ui/label";
import { Switch } from "@/Frontend/components/ui/switch";
import { queryKeys } from "@/Frontend/lib/react-query";
import { getConfusionOption } from "@/Backend/server/student-onboarding";
import { uploadFiles } from "@/Backend/server/uploadthing";

const SUPPORT_NEED_VALUES = new Set(["SCHOOL_COACHING_BALANCE", "STUDY_STRATEGY", "TIME_MANAGEMENT"]);

type ProfileResponse = {
  user: { name: string; email: string; image?: string | null } | null;
  studentProfile: {
    class?: string | null;
    board?: string | null;
    stream?: string | null;
    targetExam?: string | null;
    targetExams?: string[] | null;
    mentorshipNeeds?: string[] | null;
    decisionStage?: string | null;
    currentConfusion?: string | null;
    confusionTypes?: string[] | null;
    city?: string | null;
    state?: string | null;
    languagePreference?: string | null;
  } | null;
  settings: { notificationsEnabled: boolean; profileVisibility: "public" | "private" };
};

type ProfileFormState = {
  name: string;
  city: string;
  state: string;
  languagePreference: string;
};

const profileInputClass =
  "min-h-11 rounded-xl border-violet-200 bg-white text-slate-950 shadow-sm placeholder:text-slate-400 focus-visible:border-violet-500 focus-visible:ring-violet-500/20 disabled:border-violet-100 disabled:bg-violet-50/70 disabled:text-slate-500 disabled:opacity-100 dark:border-violet-200 dark:bg-white dark:text-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:border-violet-500 dark:disabled:border-violet-100 dark:disabled:bg-violet-50/70 dark:disabled:text-slate-500";

const sectionCardClass = "rounded-2xl border-violet-100 bg-white shadow-sm shadow-violet-900/5";

const sectionTitleClass = "text-base font-bold tracking-tight text-slate-950";

const lightOutlineButtonClass =
  "min-h-11 border-violet-200 bg-white text-violet-900 hover:border-violet-300 hover:bg-violet-50 dark:border-violet-200 dark:bg-white dark:text-violet-900 dark:hover:border-violet-300 dark:hover:bg-violet-50";

const lightSecondaryButtonClass =
  "min-h-11 border-violet-200 bg-violet-50 text-violet-900 hover:border-violet-300 hover:bg-violet-100 disabled:border-violet-100 disabled:bg-violet-50 disabled:text-violet-400 disabled:opacity-70 dark:border-violet-200 dark:bg-violet-50 dark:text-violet-900 dark:hover:border-violet-300 dark:hover:bg-violet-100 dark:disabled:border-violet-100 dark:disabled:bg-violet-50 dark:disabled:text-violet-400";

async function fetchProfile() {
  const res = await fetch("/api/student/profile");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return (await res.json()) as ProfileResponse;
}

async function updateProfile(payload: unknown) {
  const res = await fetch("/api/student/profile", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  return res.json();
}

async function refreshMatching() {
  const res = await fetch("/api/student/profile", { method: "POST" });
  if (!res.ok) throw new Error("Failed to refresh matching");
}

function normalizeTextValue(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export default function StudentProfilePage() {
  const { update } = useSession();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.student.profile,
    queryFn: fetchProfile,
  });
  const [formState, setFormState] = useState<ProfileFormState>({
    name: "",
    city: "",
    state: "",
    languagePreference: "",
  });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!data) {
      return;
    }

    setFormState({
      name: data.user?.name ?? "",
      city: data.studentProfile?.city ?? "",
      state: data.studentProfile?.state ?? "",
      languagePreference: data.studentProfile?.languagePreference ?? "",
    });
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: async (payload: { user?: { name?: string | null; image?: string | null } | null }) => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.student.profile });
      await update({
        user: {
          name: payload.user?.name ?? undefined,
          image: payload.user?.image ?? undefined,
        },
      });
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const refreshMutation = useMutation({
    mutationFn: refreshMatching,
    onSuccess: () => {
      toast.success("Onboarding preferences refreshed for matching");
      queryClient.invalidateQueries({ queryKey: queryKeys.student.matching });
      queryClient.invalidateQueries({ queryKey: queryKeys.student.dashboard });
    },
    onError: () => {
      toast.error("Failed to refresh matching");
    },
  });

  const preferenceGroups = useMemo(() => {
    const studentProfile = data?.studentProfile;

    if (!studentProfile) {
      return {
        academic: "",
        direction: "",
        currentPriorities: [] as string[],
        mentorshipNeeds: [] as string[],
        clarityNotes: [] as string[],
      };
    }

    const mentorshipValues = studentProfile.mentorshipNeeds ?? [];
    const currentPriorityValues = mentorshipValues.filter((value) => !SUPPORT_NEED_VALUES.has(value));
    const supportNeedValues = mentorshipValues.filter((value) => SUPPORT_NEED_VALUES.has(value));

    return {
      academic: formatAcademicContext(studentProfile),
      direction: formatTargetExamLabel(studentProfile),
      currentPriorities: formatMentorshipNeeds(currentPriorityValues, 6),
      mentorshipNeeds: formatMentorshipNeeds(supportNeedValues, 6),
      clarityNotes: Array.from(
        new Set(
          studentProfile.confusionTypes
            ?.map((value) => getConfusionOption(value, studentProfile.class)?.label ?? formatEnumLabel(value))
            .filter(Boolean) ?? [],
        ),
      ),
    };
  }, [data]);

  const notificationsEnabled = data?.settings?.notificationsEnabled ?? true;
  const profileVisibility = data?.settings?.profileVisibility ?? "public";
  const academicContext = formatAcademicContext(data?.studentProfile);
  const dashboardSubtitle = buildHeroSubtitle(data?.studentProfile);
  const heroSubtitle =
    dashboardSubtitle === "You're exploring your academic direction."
      ? "Exploring your academic direction"
      : dashboardSubtitle;

  async function handleAvatarChange(file: File) {
    setIsUploading(true);
    try {
      const uploaded = await uploadFiles("studentAvatar", { files: [file] });
      const url = uploaded[0]?.ufsUrl;
      if (url) {
        await updateMutation.mutateAsync({ image: url });
      }
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card className={sectionCardClass}>
          <CardContent className="p-6 text-sm text-slate-600">Loading profile...</CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="rounded-2xl border-red-200 bg-white shadow-sm">
        <CardContent className="p-6 text-sm text-red-600">Failed to load profile.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5 rounded-[2rem] bg-violet-50/50 p-1 sm:p-2">
      <Card className="overflow-hidden rounded-2xl border-violet-200/80 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.14),_transparent_28%),radial-gradient(circle_at_right,_rgba(236,72,153,0.1),_transparent_35%),linear-gradient(135deg,_#ffffff_0%,_#faf5ff_42%,_#f5f3ff_100%)] shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:items-center">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
              <Avatar className="size-16 shrink-0 border border-violet-100 bg-white shadow-sm">
                <AvatarImage src={data.user?.image ?? ""} alt={data.user?.name ?? "Student"} />
                <AvatarFallback>{getInitials(data.user?.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-700">Student profile</p>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                    {data.user?.name ?? "Student"}
                  </h2>
                  <p className="mt-1 break-words text-sm font-medium text-slate-600">{data.user?.email ?? ""}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-violet-100 bg-white/70 p-3 shadow-sm shadow-violet-900/5">
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                    Academic context
                  </p>
                  <p className="mt-1 text-base font-bold leading-6 text-slate-950">
                    {academicContext || "Academic profile in progress"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">
                    Current direction
                  </p>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-700">{heroSubtitle}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={sectionCardClass}>
        <CardHeader className="p-5 pb-1">
          <CardTitle className={sectionTitleClass}>Edit personal info</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-2">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e: FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              updateMutation.mutate({
                name: normalizeTextValue(formState.name),
                city: normalizeTextValue(formState.city),
                state: normalizeTextValue(formState.state),
                languagePreference: normalizeTextValue(formState.languagePreference),
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="text-sm font-semibold text-slate-900">Name</Label>
              <Input
                id="profile-name"
                name="name"
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="Name"
                className={profileInputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email" className="text-sm font-semibold text-slate-900">Email</Label>
              <Input id="profile-email" value={data.user?.email ?? ""} disabled className={profileInputClass} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-city" className="text-sm font-semibold text-slate-900">City</Label>
              <Input
                id="profile-city"
                name="city"
                value={formState.city}
                onChange={(event) => setFormState((current) => ({ ...current, city: event.target.value }))}
                placeholder="City"
                className={profileInputClass}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-state" className="text-sm font-semibold text-slate-900">State</Label>
              <Input
                id="profile-state"
                name="state"
                value={formState.state}
                onChange={(event) => setFormState((current) => ({ ...current, state: event.target.value }))}
                placeholder="State"
                className={profileInputClass}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-language" className="text-sm font-semibold text-slate-900">
                Language preference
              </Label>
              <Input
                id="profile-language"
                name="languagePreference"
                value={formState.languagePreference}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, languagePreference: event.target.value }))
                }
                placeholder="Language"
                className={profileInputClass}
              />
            </div>
            <div className="mt-1 flex border-t border-violet-100 pt-4 sm:col-span-2 sm:justify-end">
              <Button type="submit" disabled={updateMutation.isPending} className="min-h-11 w-full sm:w-auto">
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className={sectionCardClass}>
        <CardHeader className="p-5 pb-1">
          <CardTitle className={sectionTitleClass}>Update your guidance profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-5 pt-2">
          <p className="max-w-2xl text-sm font-medium leading-6 text-slate-700">
            These preferences influence mentor matching and help us keep recommendations aligned with your goals.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button
              variant="secondary"
              onClick={() => refreshMutation.mutate()}
              disabled={refreshMutation.isPending}
              className={lightSecondaryButtonClass}
            >
              <RefreshCcw className="size-4" />
              {refreshMutation.isPending ? "Refreshing..." : "Refresh current matches"}
            </Button>
            <Link
              href="/onboarding/student"
              className={buttonVariants({
                variant: "outline",
                className: lightOutlineButtonClass,
              })}
            >
              Edit onboarding
            </Link>
          </div>
          <div className="grid gap-3 rounded-xl border border-violet-100 bg-violet-50/50 p-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Academic context</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-950">
                {preferenceGroups.academic || "Academic profile in progress"}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Current direction</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-950">
                {preferenceGroups.direction || "No direction saved yet."}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Current priorities</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {preferenceGroups.currentPriorities.length > 0 ? (
                  preferenceGroups.currentPriorities.map((value) => (
                    <Badge key={value} variant="outline" className="border-violet-200 bg-white text-violet-800">
                      {value}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm font-medium text-slate-600">No priorities saved yet.</p>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Mentorship needs</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {preferenceGroups.mentorshipNeeds.length > 0 ? (
                  preferenceGroups.mentorshipNeeds.map((value) => (
                    <Badge key={value} variant="outline" className="border-violet-200 bg-white text-violet-800">
                      {value}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm font-medium text-slate-600">No support needs saved yet.</p>
                )}
              </div>
            </div>
            {preferenceGroups.clarityNotes.length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-violet-700">Clarity notes</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {preferenceGroups.clarityNotes.map((value) => (
                    <Badge key={value} variant="outline" className="border-violet-200 bg-white text-violet-800">
                      {value}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {!preferenceGroups.academic &&
              !preferenceGroups.direction &&
              preferenceGroups.currentPriorities.length === 0 &&
              preferenceGroups.mentorshipNeeds.length === 0 &&
              preferenceGroups.clarityNotes.length === 0 && (
                <p className="text-sm font-medium text-slate-600 sm:col-span-2">
                  No onboarding preferences saved yet.
                </p>
              )}
            </div>
        </CardContent>
      </Card>

      <Card className={sectionCardClass}>
        <CardHeader className="p-5 pb-1">
          <CardTitle className={sectionTitleClass}>Change avatar</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-4 pt-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-16 shrink-0 border border-violet-100 bg-white shadow-sm">
              <AvatarImage src={data.user?.image ?? ""} alt={data.user?.name ?? "Student"} />
              <AvatarFallback>{getInitials(data.user?.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 text-sm text-slate-700">
              <p className="font-semibold text-slate-950">Upload a current photo</p>
              <p className="mt-1 leading-6">This updates your dashboard avatar and account identity.</p>
            </div>
          </div>
          <div className="w-full min-w-0 space-y-2 rounded-xl border border-violet-100 bg-violet-50/40 p-2.5 lg:max-w-md">
            <Input
              type="file"
              accept="image/*"
              className={`${profileInputClass} h-auto cursor-pointer py-2 file:mr-3 file:h-8 file:rounded-lg file:bg-violet-100 file:px-3 file:text-xs file:font-semibold file:text-violet-900 dark:file:bg-violet-100 dark:file:text-violet-900`}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleAvatarChange(file);
              }}
              disabled={isUploading}
            />
            <p className="flex items-center gap-2 text-sm leading-5 text-slate-600">
              <UploadCloud className="size-4" />
              {isUploading ? "Uploading avatar..." : "PNG, JPG, and WebP work best."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className={sectionCardClass}>
        <CardHeader className="p-5 pb-1">
          <CardTitle className={sectionTitleClass}>Account settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 p-5 pt-2">
          <div className="flex min-h-16 items-center justify-between gap-4 rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3">
            <div className="min-w-0">
              <Label htmlFor="notifications" className="text-sm font-semibold text-slate-950">Notifications</Label>
              <p className="mt-1 text-sm leading-5 text-slate-600">Receive reminders and booking updates.</p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={(checked) =>
                updateMutation.mutate({ settings: { notificationsEnabled: checked, profileVisibility } })
              }
            />
          </div>
          <div className="flex min-h-16 items-center justify-between gap-4 rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3">
            <div className="min-w-0">
              <Label htmlFor="privacy" className="text-sm font-semibold text-slate-950">Profile visibility</Label>
              <p className="mt-1 text-sm leading-5 text-slate-600">Control whether your student profile is public.</p>
            </div>
            <Switch
              id="privacy"
              checked={profileVisibility === "public"}
              onCheckedChange={(checked) =>
                updateMutation.mutate({
                  settings: { notificationsEnabled, profileVisibility: checked ? "public" : "private" },
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

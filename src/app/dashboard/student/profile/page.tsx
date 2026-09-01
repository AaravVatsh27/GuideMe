"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, UploadCloud } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  formatEnumLabel,
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
import {
  getBoardOption,
  getClassOption,
  getConfusionOption,
  getStreamOption,
} from "@/Backend/server/student-onboarding";
import { uploadFiles } from "@/Backend/server/uploadthing";

type ProfileResponse = {
  user: { name: string; email: string; image?: string | null } | null;
  studentProfile: {
    class?: string | null;
    board?: string | null;
    stream?: string | null;
    targetExam?: string | null;
    confusionTypes?: string[];
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

const TARGET_EXAM_LABELS: Record<string, string> = {
  CA_FOUNDATION: "CA Foundation",
  CAT: "CAT",
  CLAT: "CLAT",
  GATE: "GATE",
  GMAT: "GMAT",
  GRE: "GRE",
  JEE: "JEE",
  NDA: "NDA",
  NEET: "NEET",
  OTHER: "Other",
  UNDECIDED: "Undecided",
  UPSC: "UPSC",
};

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

  const preferenceBadges = useMemo(() => {
    const studentProfile = data?.studentProfile;

    if (!studentProfile) {
      return [];
    }

    const badges = [
      getClassOption(studentProfile.class)?.label ?? formatEnumLabel(studentProfile.class),
      getBoardOption(studentProfile.board)?.label ?? formatEnumLabel(studentProfile.board),
      getStreamOption(studentProfile.stream, studentProfile.class)?.label ??
        formatEnumLabel(studentProfile.stream),
      TARGET_EXAM_LABELS[studentProfile.targetExam ?? ""] ?? formatEnumLabel(studentProfile.targetExam),
      ...(
        studentProfile.confusionTypes?.map(
          (value) => getConfusionOption(value, studentProfile.class)?.label ?? formatEnumLabel(value),
        ) ?? []
      ),
    ];

    return badges.filter(Boolean);
  }, [data]);

  const notificationsEnabled = data?.settings?.notificationsEnabled ?? true;
  const profileVisibility = data?.settings?.profileVisibility ?? "public";

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
        <Card className="rounded-[1.75rem] border-slate-200 bg-white">
          <CardContent className="p-6 text-sm text-slate-600">Loading profile...</CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="rounded-[1.75rem] border-red-200 bg-white">
        <CardContent className="p-6 text-sm text-red-600">Failed to load profile.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-[1.75rem] border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.12),_transparent_24%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_60%,_#ecfeff_100%)]">
        <CardContent className="p-6 sm:p-7">
          <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
            Student profile
          </Badge>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={data.user?.image ?? ""} alt={data.user?.name ?? "Student"} />
                <AvatarFallback>{getInitials(data.user?.name)}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">{data.user?.name ?? "Student"}</h2>
                <p className="mt-1 text-sm text-slate-600">{data.user?.email ?? ""}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {preferenceBadges.slice(0, 4).map((badge) => (
                <Badge key={badge} variant="outline" className="border-slate-300 bg-white text-slate-700">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-slate-200 bg-white">
        <CardHeader>
          <CardTitle>Edit personal info</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 sm:grid-cols-2"
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
              <Label htmlFor="profile-name">Name</Label>
              <Input
                id="profile-name"
                name="name"
                value={formState.name}
                onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
                placeholder="Name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" value={data.user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-city">City</Label>
              <Input
                id="profile-city"
                name="city"
                value={formState.city}
                onChange={(event) => setFormState((current) => ({ ...current, city: event.target.value }))}
                placeholder="City"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-state">State</Label>
              <Input
                id="profile-state"
                name="state"
                value={formState.state}
                onChange={(event) => setFormState((current) => ({ ...current, state: event.target.value }))}
                placeholder="State"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="profile-language">Language preference</Label>
              <Input
                id="profile-language"
                name="languagePreference"
                value={formState.languagePreference}
                onChange={(event) =>
                  setFormState((current) => ({ ...current, languagePreference: event.target.value }))
                }
                placeholder="Language"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-slate-200 bg-white">
        <CardHeader>
          <CardTitle>Re-take onboarding quiz</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-6 text-slate-600">
            Your onboarding preferences drive mentor matching. Revisit them whenever your goals or confusion areas change.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
              <RefreshCcw className="size-4" />
              {refreshMutation.isPending ? "Refreshing..." : "Refresh current matches"}
            </Button>
            <Link href="/onboarding/student" className={buttonVariants({ variant: "outline" })}>
              Open onboarding
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {preferenceBadges.map((badge) => (
              <Badge key={badge} variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                {badge}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-slate-200 bg-white">
        <CardHeader>
          <CardTitle>Change avatar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              <AvatarImage src={data.user?.image ?? ""} alt={data.user?.name ?? "Student"} />
              <AvatarFallback>{getInitials(data.user?.name)}</AvatarFallback>
            </Avatar>
            <div className="text-sm text-slate-600">
              <p className="font-medium text-slate-950">Upload a current photo</p>
              <p className="mt-1 leading-6">This updates your dashboard avatar and account identity.</p>
            </div>
          </div>
          <div className="space-y-3">
            <Input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleAvatarChange(file);
              }}
              disabled={isUploading}
            />
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <UploadCloud className="size-4" />
              {isUploading ? "Uploading avatar..." : "PNG, JPG, and WebP work best."}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-slate-200 bg-white">
        <CardHeader>
          <CardTitle>Account settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Notifications</Label>
              <p className="mt-1 text-sm text-slate-500">Receive reminders and booking updates.</p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={(checked) =>
                updateMutation.mutate({ settings: { notificationsEnabled: checked, profileVisibility } })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="privacy">Profile visibility</Label>
              <p className="mt-1 text-sm text-slate-500">Control whether your student profile is public.</p>
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

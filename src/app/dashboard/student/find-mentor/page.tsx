"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Compass, Heart } from "lucide-react";
import { toast } from "sonner";

import {
  buildHeroSubtitle,
  formatAcademicContext,
  formatCurrency,
  formatMentorshipNeeds,
  getInitials,
} from "@/Frontend/views/dashboard/student/student-dashboard-utils";
import { Avatar, AvatarFallback } from "@/Frontend/components/ui/avatar";
import { Badge } from "@/Frontend/components/ui/badge";
import { Button } from "@/Frontend/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/Frontend/components/ui/card";
import { Skeleton } from "@/Frontend/components/ui/skeleton";
import { queryKeys } from "@/Frontend/lib/react-query";
import { cn } from "@/Backend/server/utils";

type Mentor = {
  id: string;
  name: string;
  image?: string | null;
  username?: string | null;
  college?: string | null;
  headline?: string | null;
  tier?: string | null;
  avgRating?: number | null;
  priceMin?: number | null;
  priceMax?: number | null;
  availableThisWeek: boolean;
};

type StudentProfileResponse = {
  studentProfile?: {
    class?: string | null;
    board?: string | null;
    stream?: string | null;
    targetExam?: string | null;
    targetExams?: string[] | null;
    mentorshipNeeds?: string[] | null;
    decisionStage?: string | null;
  } | null;
};

async function fetchMentors() {
  const res = await fetch("/api/mentors?limit=12");
  if (!res.ok) throw new Error("Failed to fetch mentors");
  const json = await res.json();
  return json.data as Mentor[];
}

async function saveMentor(mentorId: string) {
  const res = await fetch("/api/student/saved-mentors", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mentorId }),
  });
  if (!res.ok) throw new Error("Failed to save mentor");
}

async function fetchStudentProfile() {
  const res = await fetch("/api/student/profile");
  if (!res.ok) throw new Error("Failed to load student profile");
  return (await res.json()) as StudentProfileResponse;
}

export default function FindMentorPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.search.results({ limit: 12, scope: "student-discovery" }),
    queryFn: fetchMentors,
  });
  const { data: profileData } = useQuery({
    queryKey: ["student-profile"],
    queryFn: fetchStudentProfile,
  });
  const focusedMentorId = searchParams.get("mentorId");
  const rescheduleSessionId = searchParams.get("reschedule");
  const profile = profileData?.studentProfile;
  const academicContext = formatAcademicContext(profile);
  const focusTags = formatMentorshipNeeds(profile?.mentorshipNeeds);

  const saveMutation = useMutation({
    mutationFn: saveMentor,
    onSuccess: () => {
      toast.success("Mentor saved");
      queryClient.invalidateQueries({ queryKey: queryKeys.student.savedMentors });
    },
    onError: () => {
      toast.error("Failed to save mentor");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 rounded-[1.75rem]" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-72 rounded-[1.5rem]" />
          ))}
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <Card className="rounded-[1.75rem] border-red-200 bg-white">
        <CardContent className="p-6 text-sm text-red-600">Failed to fetch mentors.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden rounded-[1.75rem] border-violet-100 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.10),_transparent_30%),#ffffff] shadow-sm shadow-violet-900/5">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <Badge
                variant="outline"
                className="border-violet-200 bg-violet-50 text-violet-800"
              >
                Mentor discovery
              </Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Find a mentor who fits your next decision
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                Explore mentors who can help you think through the choices, questions, and goals in front of you.
              </p>
            </div>
            <Link
              href="/dashboard/student/saved"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-5 text-sm font-semibold text-violet-900 shadow-sm transition-colors duration-200 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Saved mentors
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-violet-100 bg-white shadow-sm shadow-violet-900/5">
        <CardContent className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-700">Your current focus</p>
              <p className="mt-2 text-base font-semibold text-slate-950">
                {academicContext || "Your academic profile is still taking shape."}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {buildHeroSubtitle(profile)}
              </p>
              {focusTags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {focusTags.map((tag) => (
                    <Badge key={tag} variant="outline" className="border-violet-200 bg-violet-50 text-violet-800">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <Link
              href="/dashboard/student/profile"
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-900 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              Update profile
            </Link>
          </div>
        </CardContent>
      </Card>

      {focusedMentorId ? (
        <Card className="rounded-[1.5rem] border-sky-200 bg-sky-50/80">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-950">Mentor selected from another dashboard flow.</p>
              <p className="mt-1 text-sm text-slate-600">
                {rescheduleSessionId
                  ? "Pick this mentor again to replace an earlier booking."
                  : "This mentor card is highlighted below so you can move faster."}
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-sm font-medium text-sky-800">
              <Compass className="size-4" />
              Scroll to the highlighted mentor
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data?.map((mentor) => (
        <Card
          key={mentor.id}
          id={`mentor-${mentor.id}`}
          className={cn(
            "scroll-mt-28 rounded-[1.5rem] border-slate-200 bg-white transition",
            mentor.id === focusedMentorId && "border-sky-300 shadow-[0_24px_60px_-42px_rgba(2,132,199,0.9)]",
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  {mentor.image ? (
                    <Image
                      src={mentor.image}
                      alt={mentor.name}
                      width={80}
                      height={80}
                      quality={85}
                      className="aspect-square size-full rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback>{getInitials(mentor.name)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-base text-slate-950">{mentor.name}</CardTitle>
                  <p className="mt-1 text-sm text-slate-600">{mentor.headline ?? "Mentor profile"}</p>
                </div>
              </div>
              {mentor.tier ? (
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                  {mentor.tier}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <p className="text-slate-600">{mentor.college ?? "College details coming soon"}</p>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-700">
              <span>★ {mentor.avgRating?.toFixed(1) ?? "0.0"}</span>
              <span>{formatCurrency(mentor.priceMin)} / 30 min</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <span className={cn("size-2 rounded-full", mentor.availableThisWeek ? "bg-emerald-500" : "bg-slate-300")} />
              {mentor.availableThisWeek ? "Available this week" : "Availability varies"}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-violet-100 pt-4">
              <Button size="sm" onClick={() => saveMutation.mutate(mentor.id)} disabled={saveMutation.isPending}>
                <Heart className="size-3.5" />
                Save
              </Button>
              <Link
                href={mentor.username ? `/mentor/${mentor.username}` : `/dashboard/student/find-mentor?mentorId=${mentor.id}#mentor-${mentor.id}`}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-4 text-sm font-semibold text-violet-900 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
              >
                View mentor
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
}

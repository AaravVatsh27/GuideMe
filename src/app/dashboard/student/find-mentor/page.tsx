"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Compass, Heart } from "lucide-react";
import { toast } from "sonner";

import {
  formatCurrency,
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

export default function FindMentorPage() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.search.results({ limit: 12, scope: "student-discovery" }),
    queryFn: fetchMentors,
  });
  const focusedMentorId = searchParams.get("mentorId");
  const rescheduleSessionId = searchParams.get("reschedule");

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
      <Card className="rounded-[1.75rem] border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_20%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_55%,_#eef2ff_100%)]">
        <CardContent className="p-6 sm:p-7">
          <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
            Mentor discovery
          </Badge>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Find the next mentor fit</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Start from your strongest available mentors, save the best options, and return here when you want to book again.
              </p>
            </div>
            <Link href="/dashboard/student/saved" className="text-sm font-medium text-sky-700 hover:text-sky-800">
              Open saved mentors
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
          <CardContent className="space-y-4 text-sm">
            <p className="text-slate-600">{mentor.college ?? "College details coming soon"}</p>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                Rating {mentor.avgRating?.toFixed(1) ?? "0.0"}
              </Badge>
              <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                {formatCurrency(mentor.priceMin)} / 30 min
              </Badge>
              {mentor.availableThisWeek ? <Badge className="bg-emerald-600 text-white">Available this week</Badge> : null}
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => saveMutation.mutate(mentor.id)} disabled={saveMutation.isPending}>
                <Heart className="size-3.5" />
                Save
              </Button>
              <Link href="/dashboard/student/saved" className="text-sm font-medium text-sky-700 hover:text-sky-800">
                View saved
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
}

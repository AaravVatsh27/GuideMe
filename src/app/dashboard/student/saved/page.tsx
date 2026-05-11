"use client";

import type { Route } from "next";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HeartOff } from "lucide-react";
import { toast } from "sonner";

import {
  formatCurrency,
  getInitials,
} from "@/app/dashboard/student/_components/student-dashboard-utils";
import { Avatar, AvatarFallback } from "@/client/components/ui/avatar";
import { Badge } from "@/client/components/ui/badge";
import { Button, buttonVariants } from "@/client/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/client/components/ui/card";
import { Skeleton } from "@/client/components/ui/skeleton";
import { queryKeys } from "@/lib/react-query";

type SavedMentor = {
  id: string;
  mentorId: string;
  createdAt: string;
  mentor: {
    name: string;
    image?: string | null;
    mentorProfile?: {
      username?: string | null;
      headline?: string | null;
      college?: string | null;
      tier?: string | null;
      avgRating?: number | null;
      priceMin?: number | null;
    } | null;
  };
};

async function fetchSavedMentors() {
  const res = await fetch("/api/student/saved-mentors");
  if (!res.ok) throw new Error("Failed to fetch saved mentors");
  const json = await res.json();
  return json.data as SavedMentor[];
}

async function unsaveMentor(mentorId: string) {
  const res = await fetch(`/api/student/saved-mentors/${mentorId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to remove mentor");
}

function getMentorDiscoveryHref(mentorId: string): Route {
  return `/dashboard/student/find-mentor?mentorId=${mentorId}#mentor-${mentorId}` as Route;
}

export default function SavedMentorsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.student.savedMentors,
    queryFn: fetchSavedMentors,
  });

  const mutation = useMutation({
    mutationFn: unsaveMentor,
    onMutate: async (mentorId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.student.savedMentors });
      const previous = queryClient.getQueryData<SavedMentor[]>(queryKeys.student.savedMentors);
      if (previous) {
        queryClient.setQueryData<SavedMentor[]>(
          queryKeys.student.savedMentors,
          previous.filter((item) => item.mentorId !== mentorId),
        );
      }
      return { previous };
    },
    onError: (_error, _mentorId, context) => {
      toast.error("Could not remove mentor");
      if (context?.previous) queryClient.setQueryData(queryKeys.student.savedMentors, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.student.savedMentors });
    },
    onSuccess: () => {
      toast.success("Mentor removed from saved");
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
        <CardContent className="p-6 text-sm text-red-600">Failed to load saved mentors.</CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className="rounded-[1.75rem] border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl text-slate-950">No saved mentors yet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-5 max-w-xl text-sm leading-6 text-slate-600">
            Save strong mentor profiles here so the next booking starts from a shortlist instead of a blank slate.
          </p>
          <Link href="/dashboard/student/find-mentor" className={buttonVariants({ size: "lg" })}>
            Find mentors
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-[1.75rem] border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(250,204,21,0.12),_transparent_22%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_60%,_#fefce8_100%)]">
        <CardContent className="p-6 sm:p-7">
          <Badge variant="outline" className="border-slate-300 bg-white/80 text-slate-700">
            Saved shortlist
          </Badge>
          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Saved mentors</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                Keep your strongest profiles close, remove the weak ones quickly, and jump back into discovery when you are ready to book.
              </p>
            </div>
            <Link href="/dashboard/student/find-mentor" className={buttonVariants({ variant: "outline" })}>
              Find more mentors
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.map((item) => (
        <Card key={item.id} className="rounded-[1.5rem] border-slate-200 bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-11">
                  {item.mentor.image ? (
                    <Image
                      src={item.mentor.image}
                      alt={item.mentor.name}
                      width={80}
                      height={80}
                      quality={85}
                      className="aspect-square size-full rounded-full object-cover"
                    />
                  ) : (
                    <AvatarFallback>{getInitials(item.mentor.name)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-base text-slate-950">{item.mentor.name}</CardTitle>
                  <p className="mt-1 text-sm text-slate-600">
                    {item.mentor.mentorProfile?.headline ?? "Mentor profile"}
                  </p>
                </div>
              </div>
              {item.mentor.mentorProfile?.tier ? (
                <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                  {item.mentor.mentorProfile.tier}
                </Badge>
              ) : null}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-slate-600">{item.mentor.mentorProfile?.college ?? "College details coming soon"}</p>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">Rating</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {item.mentor.mentorProfile?.avgRating?.toFixed(1) ?? "0.0"}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-slate-500">Starting price</p>
                <p className="mt-1 font-semibold text-slate-950">
                  {formatCurrency(item.mentor.mentorProfile?.priceMin)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Link
                href={getMentorDiscoveryHref(item.mentorId)}
                className={buttonVariants({ variant: "secondary", size: "sm" })}
              >
                Quick book
              </Link>
              <Button
                size="sm"
                variant="outline"
                onClick={() => mutation.mutate(item.mentorId)}
                disabled={mutation.isPending && mutation.variables === item.mentorId}
              >
                <HeartOff className="size-3.5" />
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </div>
  );
}

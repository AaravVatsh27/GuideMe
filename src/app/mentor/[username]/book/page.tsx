import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, Star } from "lucide-react";
import type { Route } from "next";

import { Badge } from "@/Frontend/components/ui/badge";
import { Card, CardContent } from "@/Frontend/components/ui/card";
import { MentorAvatar } from "@/Frontend/components/MentorAvatar";
import { db } from "@/Backend/server/db";
import { buttonVariants } from "@/Frontend/components/ui/button";
import { cn } from "@/Backend/server/utils";

import { MentorBookingPageClient } from "@/Frontend/views/mentor/mentor-booking-page-client";

type MentorBookingPageProps = {
  params: {
    username: string;
  };
  searchParams?: {
    date?: string;
    slot?: string;
  };
};

function toRoute(path: string) {
  return path as Route;
}

async function getMentorForBooking(username: string) {
  return db.user.findFirst({
    where: {
      role: "MENTOR",
      isActive: true,
      deletedAt: null,
      onboardingComplete: true,
      mentorProfile: {
        is: {
          username,
          isActive: true,
          isAvailable: true,
          isVerified: true,
        },
      },
    },
    select: {
      id: true,
      name: true,
      image: true,
      mentorProfile: {
        select: {
          username: true,
          college: true,
          headline: true,
          tier: true,
          avgRating: true,
          totalReviews: true,
          priceMin: true,
          priceMax: true,
          isVerified: true,
        },
      },
    },
  });
}

export default async function MentorBookingPage({
  params,
  searchParams,
}: MentorBookingPageProps) {
  const mentor = await getMentorForBooking(params.username);

  if (!mentor?.mentorProfile) {
    notFound();
  }

  const profileHref = toRoute(`/mentor/${mentor.mentorProfile.username}`);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.12),_transparent_26%),linear-gradient(180deg,_#f8fafc_0%,_#eef4ff_52%,_#ffffff_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={profileHref}
            className={cn(buttonVariants({ variant: "outline" }), "rounded-xl border-slate-200 bg-white text-slate-900 hover:bg-slate-100")}
          >
            <ArrowLeft className="size-4" />
            Back to mentor profile
          </Link>
        </div>

        <Card className="rounded-[2rem] border-slate-200 bg-white/92 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.45)]">
          <CardContent className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <MentorAvatar
                  src={mentor.image}
                  alt={mentor.name}
                  fallback={mentor.name.charAt(0)}
                  className="size-20 border border-slate-200 bg-white shadow-md"
                  fallbackClassName="text-2xl"
                />
                {mentor.mentorProfile.isVerified ? (
                  <div className="absolute -bottom-1 -right-1 rounded-full border border-slate-100 bg-white p-1.5 shadow-sm">
                    <ShieldCheck className="size-4 text-sky-600" />
                  </div>
                ) : null}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  {mentor.mentorProfile.tier ? (
                    <Badge className="bg-slate-950 text-white">{mentor.mentorProfile.tier}</Badge>
                  ) : null}
                  <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                    Booking confirmation
                  </Badge>
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                  {mentor.name}
                </h1>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {mentor.mentorProfile.headline ?? "Mentor profile"}
                  {mentor.mentorProfile.college ? ` • ${mentor.mentorProfile.college}` : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <Star className="size-4 fill-amber-500 text-amber-500" />
                <span className="font-semibold text-slate-950">
                  {mentor.mentorProfile.avgRating.toFixed(1)}
                </span>
                <span>({mentor.mentorProfile.totalReviews} reviews)</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-900">
                Daily meeting link sent after confirmation
              </div>
            </div>
          </CardContent>
        </Card>

        <MentorBookingPageClient
          mentorId={mentor.id}
          username={mentor.mentorProfile.username}
          mentorName={mentor.name}
          mentorHeadline={mentor.mentorProfile.headline}
          mentorCollege={mentor.mentorProfile.college}
          priceMin={mentor.mentorProfile.priceMin}
          priceMax={mentor.mentorProfile.priceMax}
          initialDate={searchParams?.date ?? null}
          initialSlot={searchParams?.slot ?? null}
        />
      </div>
    </main>
  );
}

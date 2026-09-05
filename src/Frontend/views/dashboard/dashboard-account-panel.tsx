"use client";

import type { Route } from "next";
import Link from "next/link";
import { LogOut, ShieldCheck, UserRound } from "lucide-react";
import { signOut } from "next-auth/react";

import { Avatar, AvatarFallback, AvatarImage } from "@/Frontend/components/ui/avatar";
import { Badge } from "@/Frontend/components/ui/badge";
import { Button } from "@/Frontend/components/ui/button";

type DashboardAccountPanelProps = {
  name: string;
  email?: string | null;
  image?: string | null;
  initials: string;
  roleLabel: string;
  onboardingComplete: boolean;
  profileHref: Route;
  signOutRedirectTo: string;
};

export function DashboardAccountPanel({
  name,
  email,
  image,
  initials,
  roleLabel,
  onboardingComplete,
  profileHref,
  signOutRedirectTo,
}: DashboardAccountPanelProps) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/92 p-4 shadow-sm backdrop-blur">
      <div className="flex items-start gap-3">
        <Avatar className="size-12 border border-slate-200">
          <AvatarImage src={image ?? ""} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 w-full flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-950">{name}</p>
            <Badge variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
              {roleLabel}
            </Badge>
          </div>
          <p className="mt-1 truncate text-sm text-slate-600">{email || "Signed in account"}</p>
          <div className="mt-3 flex w-full flex-wrap gap-2">
            <Badge
              variant="outline"
              className="border-emerald-200 bg-emerald-50 text-emerald-800"
            >
              <ShieldCheck className="mr-1 size-3.5" />
              Signed in
            </Badge>
            <Badge variant="outline" className="w-full justify-start whitespace-nowrap border-slate-300 bg-slate-50 text-slate-700">
              <UserRound className="mr-1 size-3.5" />
              {onboardingComplete ? "Onboarding complete" : "Onboarding pending"}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <Button asChild variant="outline" className="flex-1 justify-center border-slate-200 bg-white text-slate-900 hover:bg-slate-100">
          <Link href={profileHref}>Open profile</Link>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => signOut({ redirectTo: signOutRedirectTo })}
          className="flex-1 justify-center border-slate-200 bg-white text-slate-900 hover:bg-slate-100"
        >
          <LogOut className="size-4" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

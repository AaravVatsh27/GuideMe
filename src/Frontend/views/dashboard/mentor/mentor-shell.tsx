"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  CalendarRange,
  ChevronDown,
  IndianRupee,
  LayoutGrid,
  LogOut,
  Settings,
  Star,
  User,
  type LucideIcon,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { MentraLogo } from "@/components/brand/MentraLogo";
import { MentorAvatar } from "@/Frontend/components/MentorAvatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Frontend/components/ui/dropdown-menu";
import { cn } from "@/Backend/server/utils";

import { getInitials } from "./mentor-dashboard-utils";

const navItems = [
  { href: "/dashboard/mentor", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/mentor/sessions", label: "My Sessions", icon: CalendarRange },
  { href: "/dashboard/mentor/availability", label: "Availability", icon: CalendarRange },
  { href: "/dashboard/mentor/earnings", label: "Earnings", icon: IndianRupee },
  { href: "/dashboard/mentor/reviews", label: "Reviews", icon: Star },
  { href: "/dashboard/mentor/profile", label: "Profile", icon: User },
] as const satisfies ReadonlyArray<{ href: Route; label: string; icon: LucideIcon }>;

const mobileNavLabels: Record<(typeof navItems)[number]["href"], string> = {
  "/dashboard/mentor": "Home",
  "/dashboard/mentor/sessions": "Sessions",
  "/dashboard/mentor/availability": "Slots",
  "/dashboard/mentor/earnings": "Earnings",
  "/dashboard/mentor/reviews": "Reviews",
  "/dashboard/mentor/profile": "Profile",
};

const pageDateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

type Props = {
  children: React.ReactNode;
};

export function MentorShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useSession();

  const userName = data?.user?.name ?? "Mentor";
  const userEmail = data?.user?.email ?? "";
  const initials = getInitials(userName);
  const activeItem =
    navItems.find((item) => pathname === item.href || (item.href !== "/dashboard/mentor" && pathname.startsWith(item.href))) ??
    navItems[0];

  return (
    <div className="relative isolate min-h-screen bg-[#FAF5FF]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#FAF5FF]" aria-hidden="true" />
      <div className="mx-auto flex max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[304px] shrink-0 flex-col overflow-hidden rounded-[2rem] border border-violet-100 bg-white/95 p-5 shadow-[0_24px_80px_-40px_rgba(76,29,149,0.28)] backdrop-blur lg:flex">
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Brand */}
            <div className="min-w-0">
              <div className="h-[48px] w-[82px] overflow-hidden">
                <MentraLogo size="sm" showTagline={false} />
              </div>
              <h2 className="mt-3 text-lg font-bold tracking-tight text-slate-950">
                Dashboard
              </h2>
              <p className="mt-1 text-sm leading-5 text-slate-600">
                Manage your sessions, availability, profile, and mentor growth in one place.
              </p>
            </div>

            {/* Account card */}
            <div className="mt-5 mb-4 rounded-2xl border border-violet-100 border-b border-[#E9D5FF] bg-violet-50/40 p-4 pb-4">
              <div className="flex min-w-0 items-center gap-3">
                <MentorAvatar src={data?.user?.image} alt={userName} fallback={initials} className="size-11 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">{userName}</p>
                  <span className="mt-0.5 inline-flex rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-800">
                    Mentor
                  </span>
                  <p className="mt-0.5 max-w-full truncate text-xs text-slate-600">{userEmail}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Link href="/dashboard/mentor/profile" className="inline-flex h-9 min-h-9 items-center justify-center rounded-xl border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-900 transition-colors hover:bg-violet-50">
                  Profile
                </Link>
                <button type="button" onClick={() => signOut({ redirectTo: "/auth/signin" })} className="inline-flex h-9 min-h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                  Sign out
                </button>
              </div>
            </div>

            {/* Nav */}
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard/mentor" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[rgba(124,58,237,0.10)] text-[#7C3AED]"
                        : "text-slate-600 hover:bg-violet-50 hover:text-violet-900",
                    )}
                  >
                    <item.icon className={cn("size-4 shrink-0", isActive ? "text-[#7C3AED]" : "text-slate-500")} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-5 shrink-0 rounded-2xl bg-[linear-gradient(135deg,#7C3AED_0%,#9333EA_55%,#EC4899_100%)] p-4 text-white shadow-[0_16px_40px_-24px_rgba(124,58,237,0.65)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/75">Keep quality high</p>
            <p className="mt-2 text-sm leading-5 text-white/90">
              Your rank grows with every great session.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-28 lg:pb-0">
          <header className="sticky top-4 z-20 mb-5 flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-700">Mentra</p>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h1 className="truncate text-lg font-semibold tracking-tight text-slate-950">{activeItem.label}</h1>
                <span className="hidden text-sm text-slate-500 sm:inline">{pageDateFormatter.format(new Date())}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="relative flex size-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 py-1 pr-3 text-left transition hover:border-slate-300">
                  <MentorAvatar
                    src={data?.user?.image}
                    alt={userName}
                    fallback={initials}
                    className="size-8"
                    fallbackClassName="text-xs"
                  />
                  <div className="hidden sm:block">
                    <p className="max-w-28 truncate text-sm font-medium text-slate-950">{userName}</p>
                    <p className="text-xs text-slate-500">Mentor</p>
                  </div>
                  <ChevronDown className="size-4 text-slate-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 min-w-52">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/mentor/profile")}>
                    <User className="mr-2 size-4" /> View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/mentor/profile")}>
                    <Settings className="mr-2 size-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => signOut({ redirectTo: "/auth/signin" })}>
                    <LogOut className="mr-2 size-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="mb-5 lg:hidden">
            <div className="w-full rounded-2xl border border-violet-100 bg-violet-50/40 p-3.5">
              <div className="flex min-w-0 items-center gap-3">
                <MentorAvatar src={data?.user?.image} alt={userName} fallback={initials} className="size-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950">{userName}</p>
                  <span className="mt-1 inline-flex rounded-full border border-violet-200 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-800">Mentor</span>
                  <p className="mt-1 truncate text-xs text-slate-600">{userEmail}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700">Signed in</span>
                {data?.user?.onboardingComplete ? <span className="inline-flex max-w-full rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-700">Onboarding complete</span> : null}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href="/dashboard/mentor/profile" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-900 transition-colors hover:bg-violet-50">Profile</Link>
                <button type="button" onClick={() => signOut({ redirectTo: "/auth/signin" })} className="inline-flex min-h-10 items-center justify-center rounded-xl border border-violet-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-violet-50 hover:text-violet-900">Sign out</button>
              </div>
            </div>
          </div>
          {children}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/dashboard/mentor" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium",
                isActive ? "text-slate-950" : "text-slate-500",
              )}
            >
              <item.icon className="size-4" />
              {mobileNavLabels[item.href]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

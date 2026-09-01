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

import { DashboardAccountPanel } from "@/Frontend/views/dashboard/dashboard-account-panel";
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.1),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#f0fdfa_46%,_#ffffff_100%)]">
      <div className="mx-auto flex max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[2rem] border border-slate-200/80 bg-white/90 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">GuideMe</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">Mentor dashboard</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Run sessions, hold availability, and keep payouts visible from one control room.
            </p>
          </div>

          <div className="mt-6">
            <DashboardAccountPanel
              name={userName}
              email={userEmail}
              image={data?.user?.image}
              initials={initials}
              roleLabel="Mentor"
              onboardingComplete={Boolean(data?.user?.onboardingComplete)}
              profileHref="/dashboard/mentor/profile"
              signOutRedirectTo="/auth/signin"
            />
          </div>

          <nav className="mt-8 space-y-1.5">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/dashboard/mentor" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    isActive
                      ? "bg-slate-950 text-white shadow-[0_16px_40px_-28px_rgba(15,23,42,0.85)]"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl border",
                      isActive ? "border-white/10 bg-white/10" : "border-slate-200 bg-white",
                    )}
                  >
                    <item.icon className="size-4" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[1.5rem] bg-slate-950 p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Keep quality high</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Fast replies, clean prep, and reliable attendance compound into better rank and repeat bookings.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-28 lg:pb-0">
          <header className="sticky top-4 z-20 mb-5 flex items-center justify-between gap-4 rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-4 py-4 shadow-sm backdrop-blur">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">GuideMe</p>
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
                <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-teal-500" />
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
            <DashboardAccountPanel
              name={userName}
              email={userEmail}
              image={data?.user?.image}
              initials={initials}
              roleLabel="Mentor"
              onboardingComplete={Boolean(data?.user?.onboardingComplete)}
              profileHref="/dashboard/mentor/profile"
              signOutRedirectTo="/auth/signin"
            />
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
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

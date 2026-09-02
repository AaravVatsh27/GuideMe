"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Bookmark,
  ChevronDown,
  Compass,
  LayoutGrid,
  LogOut,
  Search,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { DashboardAccountPanel } from "@/Frontend/views/dashboard/dashboard-account-panel";
import { Avatar, AvatarFallback, AvatarImage } from "@/Frontend/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Frontend/components/ui/dropdown-menu";
import { getInitials } from "@/Frontend/views/dashboard/student/student-dashboard-utils";
import { MentraLogo } from "@/components/brand/MentraLogo";
import { cn } from "@/Backend/server/utils";

const navItems = [
  { href: "/dashboard/student", label: "Overview", icon: LayoutGrid },
  { href: "/dashboard/student/find-mentor", label: "Find Mentor", icon: Search },
  { href: "/dashboard/student/sessions", label: "My Sessions", icon: Compass },
  { href: "/dashboard/student/saved", label: "Saved", icon: Bookmark },
  { href: "/dashboard/student/profile", label: "Profile", icon: User },
] as const satisfies ReadonlyArray<{ href: Route; label: string; icon: LucideIcon }>;

const pageDateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

type Props = {
  children: React.ReactNode;
};

export function StudentShell({ children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { data } = useSession();

  const userName = data?.user?.name ?? "Student";
  const userEmail = data?.user?.email ?? "";
  const initials = getInitials(userName);
  const activeItem =
    navItems.find((item) => pathname === item.href || (item.href !== "/dashboard/student" && pathname.startsWith(item.href))) ??
    navItems[0];

  return (
    <div className="min-h-screen bg-slate-50/70">
      <div className="mx-auto flex max-w-[1440px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        {/* Sidebar */}
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[270px] shrink-0 flex-col rounded-2xl border border-violet-200/80 bg-white/90 p-4 shadow-[0_15px_50px_-25px_rgba(124,58,237,0.2)] backdrop-blur-xl lg:flex">
          {/* Scrollable upper area for Brand, Account Card, Navigation */}
          <div className="flex flex-1 flex-col overflow-y-auto space-y-4 pr-0.5">
            {/* Brand */}
            <div className="space-y-1.5 px-1 pt-1">
              <div className="flex items-center gap-2">
                <MentraLogo size="sm" showTagline={false} className="h-7 w-auto" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight text-slate-950">Student dashboard</h2>
                <p className="text-xs text-slate-500 leading-relaxed">Guidance, decisions, and next steps.</p>
              </div>
            </div>

            {/* Account Card */}
            <div className="[&>div]:rounded-xl [&>div]:border-violet-100/80 [&>div]:bg-violet-50/40 [&>div]:p-3 [&>div]:shadow-none">
              <DashboardAccountPanel
                name={userName}
                email={userEmail}
                image={data?.user?.image}
                initials={initials}
                roleLabel="Student"
                onboardingComplete={Boolean(data?.user?.onboardingComplete)}
                profileHref="/dashboard/student/profile"
                signOutRedirectTo="/auth/signin"
              />
            </div>

            {/* Navigation */}
            <nav className="space-y-1 py-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard/student" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20"
                        : "text-slate-600 hover:bg-violet-50 hover:text-violet-900",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg border",
                        isActive ? "border-white/20 bg-white/20 text-white" : "border-violet-100 bg-white text-slate-500",
                      )}
                    >
                      <item.icon className="size-4" />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Keep Momentum Card (Never clipped) */}
          <div className="mt-3 shrink-0 rounded-2xl bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-500 p-4 text-white shadow-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-100">Keep momentum</p>
            <p className="mt-1.5 text-xs leading-relaxed text-violet-50">
              Use saved mentors and session history to make your next move sharper.
            </p>
          </div>
        </aside>

        {/* Main Content Container */}
        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className="sticky top-4 z-20 mb-5 flex items-center justify-between gap-4 rounded-2xl border border-violet-200/80 bg-white/90 px-5 py-3.5 shadow-sm backdrop-blur-xl">
            <div className="min-w-0 flex items-center gap-3">
              <h1 className="truncate text-base font-bold tracking-tight text-slate-950 sm:text-lg">{activeItem.label}</h1>
              <span className="hidden text-xs text-slate-400 sm:inline">·</span>
              <span className="hidden text-xs font-medium text-slate-500 sm:inline">{pageDateFormatter.format(new Date())}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="relative flex size-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                aria-label="Notifications"
              >
                <Bell className="size-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 py-1 pr-3 text-left transition hover:border-slate-300">
                  <Avatar className="size-7">
                    <AvatarImage src={data?.user?.image ?? ""} alt={userName} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="max-w-28 truncate text-xs font-semibold text-slate-950">{userName}</p>
                  </div>
                  <ChevronDown className="size-3.5 text-slate-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 min-w-52">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/student/profile")}>
                    <User className="mr-2 size-4" /> View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/student/profile")}>
                    <Settings className="mr-2 size-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    onClick={() => signOut({ redirectTo: "/auth/signin" })}
                  >
                    <LogOut className="mr-2 size-4" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          {children}
        </div>
      </div>

      {/* Mobile Nav */}
      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/dashboard/student" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition",
                isActive ? "text-violet-700 font-semibold" : "text-slate-500",
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

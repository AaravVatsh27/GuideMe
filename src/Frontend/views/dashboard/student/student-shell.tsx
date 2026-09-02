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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.14),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.1),_transparent_30%),linear-gradient(180deg,_#faf5ff_0%,_#f5f3ff_55%,_#ffffff_100%)]">
      <div className="mx-auto flex max-w-7xl gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 flex-col rounded-[2rem] border border-violet-200/80 bg-white/80 p-5 shadow-[0_30px_100px_-40px_rgba(124,58,237,0.35)] backdrop-blur-xl lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-500 to-pink-500 text-sm font-bold text-white shadow-sm">M</div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-600">Mentra</p>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">Student dashboard</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Your guidance workspace for mentors, decisions, and next steps.
            </p>
          </div>

          <div className="mt-6">
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

          <nav className="mt-8 space-y-1.5">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || (item.href !== "/dashboard/student" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    isActive
                      ? "bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white shadow-[0_18px_40px_-25px_rgba(124,58,237,0.85)]"
                      : "text-slate-600 hover:bg-violet-50 hover:text-violet-800",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl border",
                      isActive ? "border-white/10 bg-white/10" : "border-violet-100 bg-white",
                    )}
                  >
                    <item.icon className="size-4" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-[1.5rem] bg-gradient-to-br from-violet-700 via-fuchsia-600 to-pink-500 p-5 text-white shadow-[0_22px_56px_-30px_rgba(168,85,247,0.7)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-100">Keep momentum</p>
            <p className="mt-3 text-sm leading-6 text-violet-50">
              Use your saved mentors and session history to make the next booking faster and sharper.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <header className="sticky top-4 z-20 mb-5 flex items-center justify-between gap-4 rounded-[1.5rem] border border-violet-200/80 bg-white/80 px-4 py-4 shadow-[0_15px_50px_-28px_rgba(124,58,237,0.35)] backdrop-blur-xl">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-600">Mentra</p>
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
                  <Avatar className="size-8">
                    <AvatarImage src={data?.user?.image ?? ""} alt={userName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="max-w-28 truncate text-sm font-medium text-slate-950">{userName}</p>
                    <p className="text-xs text-slate-500">Student</p>
                  </div>
                  <ChevronDown className="size-4 text-slate-500" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 min-w-52">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/student/profile")}>
                    <User className="mr-2 size-4" /> View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => router.push("/dashboard/student/profile")}>
                    <Settings className="mr-2 size-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer"
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

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/dashboard/student" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
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

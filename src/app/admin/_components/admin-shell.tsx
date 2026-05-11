"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CreditCard,
  LayoutGrid,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  Video,
  UserCog,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/client/components/ui/button";
import { cn } from "@/server/utils";

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutGrid,
  },
  {
    label: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    label: "Mentors",
    href: "/admin/mentors",
    icon: UserCog,
  },
  {
    label: "Sessions",
    href: "/admin/sessions",
    icon: Video,
  },
  {
    label: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    label: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
] as const satisfies ReadonlyArray<{ label: string; href: Route; icon: LucideIcon }>;

type Props = {
  adminName: string;
  pendingVerificationCount: number;
  children: React.ReactNode;
};

export function AdminShell({ adminName, pendingVerificationCount, children }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-80 shrink-0 border-r border-slate-800 bg-slate-950 text-slate-200 lg:flex lg:flex-col">
          <div className="border-b border-slate-800 px-6 py-7">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-teal-400">GuideMe</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">Admin panel</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Monitor growth, review mentor quality, and operate the marketplace from one control room.
            </p>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                    isActive ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-900 hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl border",
                      isActive ? "border-slate-700 bg-slate-900" : "border-slate-800 bg-slate-900/70",
                    )}
                  >
                    <item.icon className="size-4" />
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            <Link
              href="/admin/mentors/verification"
              className={cn(
                "mt-4 flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition",
                pathname.startsWith("/admin/mentors/verification")
                  ? "border-teal-700 bg-teal-500/10 text-white"
                  : "border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700 hover:text-white",
              )}
            >
              <span className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900">
                  <ShieldCheck className="size-4" />
                </span>
                <span className="font-medium">Verification queue</span>
              </span>
              <span className="rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-slate-950">
                {pendingVerificationCount}
              </span>
            </Link>
          </nav>

          <div className="border-t border-slate-800 px-6 py-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Signed in as</p>
            <p className="mt-2 text-sm font-medium text-white">{adminName}</p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">GuideMe admin</p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{adminName}</h2>
              </div>
              <Button variant="outline" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
                <LogOut className="size-4" />
                Sign out
              </Button>
            </div>
          </header>

          <main className="px-4 py-5 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  ChevronDown,
  CreditCard,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { MentraLogo } from "@/components/brand/MentraLogo";
import { cn } from "@/Backend/server/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/Frontend/components/ui/dropdown-menu";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutGrid },
  { label: "Verification queue", href: "/admin/mentors/verification", icon: ShieldCheck },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Mentors", href: "/admin/mentors", icon: UserCog },
  { label: "Sessions", href: "/admin/sessions", icon: Video },
  { label: "Payments", href: "/admin/payments", icon: CreditCard },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Settings", href: "/admin/settings", icon: Settings },
] as const satisfies ReadonlyArray<{ label: string; href: Route; icon: LucideIcon }>;

const pageDateFormatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

type Props = {
  adminName: string;
  pendingVerificationCount: number;
  children: React.ReactNode;
};

function isNavItemMatch(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

function AdminIdentity({ adminName, compact = false }: { adminName: string; compact?: boolean }) {
  const initials = adminName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";

  return (
    <div className={cn("flex min-w-0 items-center gap-3", compact && "gap-2")}>
      <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] font-semibold text-[#4F46E5]", compact ? "size-8 text-xs" : "size-10 text-sm")}>
        {initials}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-950">{adminName}</p>
        <span className="mt-0.5 inline-flex rounded-full border border-indigo-100 bg-[#EEF2FF] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4F46E5]">
          Admin
        </span>
      </div>
    </div>
  );
}

export function AdminShell({ adminName, pendingVerificationCount, children }: Props) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const activeHref = navItems
    .filter((item) => isNavItemMatch(pathname, item.href))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href ?? "/admin";
  const activeItem = navItems.find((item) => item.href === activeHref) ?? navItems[0];

  return (
    <div className="relative isolate min-h-screen bg-[#FAF5FF]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#FAF5FF]" aria-hidden="true" />
      <div className="mx-auto flex max-w-7xl gap-5 px-6 py-4 lg:px-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-[304px] shrink-0 flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-[0_24px_80px_-40px_rgba(76,29,149,0.18)] backdrop-blur lg:flex">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-[38px] items-center">
              <MentraLogo size="sm" layout="horizontal" />
            </div>

            <nav className="mt-5 space-y-0.5" aria-label="Admin navigation">
              {navItems.map((item) => {
                const isActive = item.href === activeHref;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[#EEF2FF] text-[#4F46E5]"
                        : "text-slate-600 hover:bg-[#F8FAFC] hover:text-slate-950",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <item.icon className={cn("size-4 shrink-0", isActive ? "text-[#4F46E5]" : "text-slate-500")} />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.href === "/admin/mentors/verification" && pendingVerificationCount > 0 ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                        {pendingVerificationCount}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="mt-5 shrink-0 border-t border-slate-200 pt-4">
            <AdminIdentity adminName={adminName} />
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-8">
          <header className="sticky top-4 z-20 mb-5 flex min-h-[72px] items-center justify-between gap-4 rounded-[20px] border border-[#E2E8F0] bg-white/95 px-4 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] backdrop-blur sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-expanded={mobileMenuOpen}
                aria-controls="admin-mobile-navigation"
                aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"}
                className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40 lg:hidden"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4F46E5]">Mentra admin</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="truncate text-lg font-semibold tracking-tight text-slate-950">{activeItem.label}</h1>
                  <span className="hidden text-sm text-slate-500 sm:inline">{pageDateFormatter.format(new Date())}</span>
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 py-1 pr-3 text-left transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40">
                <AdminIdentity adminName={adminName} compact />
                <ChevronDown className="size-4 text-slate-500" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 min-w-52">
                <DropdownMenuItem className="cursor-pointer" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
                  <LogOut className="mr-2 size-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {mobileMenuOpen ? (
            <nav id="admin-mobile-navigation" className="mb-5 rounded-[20px] border border-[#E2E8F0] bg-white p-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] lg:hidden" aria-label="Admin navigation">
              <div className="grid gap-1 sm:grid-cols-2">
                {navItems.map((item) => {
                const isActive = item.href === activeHref;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium",
                        isActive ? "bg-[#EEF2FF] text-[#4F46E5]" : "text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <item.icon className="size-4" />
                        {item.label}
                      </span>
                      {item.href === "/admin/mentors/verification" && pendingVerificationCount > 0 ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">{pendingVerificationCount}</span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-3 border-t border-slate-200 pt-3">
                <AdminIdentity adminName={adminName} />
              </div>
            </nav>
          ) : null}

          <main className="min-w-0 px-0 py-1 [&_[data-slot=card]]:rounded-[20px] [&_[data-slot=card]]:border-[#E2E8F0] [&_[data-slot=card]]:shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

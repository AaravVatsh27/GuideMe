"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useState } from "react";
import {
  Bell,
  ChevronDown,
  CreditCard,
  LayoutGrid,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  Video,
  X,
  type LucideIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";

import { MentraLogo } from "@/Frontend/components/brand/MentraLogo";
import { cn } from "@/Frontend/lib/utils";
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

const cardSurface = "rounded-[24px] border border-[#EEF2FF] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]";
const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F46E5]/40";

// Admin-wide button and card treatment, scoped to the shell's <main> so the shared ui components stay untouched.
const mainSurfaceStyles = [
  "[&_[data-slot=card]]:rounded-[24px] [&_[data-slot=card]]:border-[#EEF2FF] [&_[data-slot=card]]:shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
  "[&_[data-slot=button][class*='7C3AED']]:rounded-full [&_[data-slot=button][class*='7C3AED']]:bg-[#4F46E5] [&_[data-slot=button][class*='7C3AED']]:text-white [&_[data-slot=button][class*='7C3AED']]:shadow-none [&_[data-slot=button][class*='7C3AED']:hover]:bg-[#4338CA]",
  "[&_[data-slot=button][class*='light-border']]:rounded-full [&_[data-slot=button][class*='light-border']]:border-[#E2E8F0] [&_[data-slot=button][class*='light-border']]:bg-white [&_[data-slot=button][class*='light-border']]:text-[#334155] [&_[data-slot=button][class*='light-border']:hover]:bg-[#F5F3FF]",
].join(" ");

// Lets admin pages reuse the pending count the layout already loads, without a second query.
const PendingVerificationCountContext = createContext(0);

export function usePendingVerificationCount() {
  return useContext(PendingVerificationCountContext);
}

type Props = {
  adminName: string;
  adminEmail?: string | null;
  pendingVerificationCount: number;
  children: React.ReactNode;
};

function isNavItemMatch(pathname: string, href: string) {
  return pathname === href || (href !== "/admin" && pathname.startsWith(href));
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "A";
}

function AdminAvatar({ adminName, size }: { adminName: string; size: "sm" | "lg" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-[#EEF2FF] font-semibold text-[#4F46E5]",
        size === "lg" ? "size-14 text-lg" : "size-9 text-xs",
      )}
      aria-hidden="true"
    >
      {getInitials(adminName)}
    </span>
  );
}

function NavLinks({
  activeHref,
  pendingVerificationCount,
  onNavigate,
}: {
  activeHref: string;
  pendingVerificationCount: number;
  onNavigate?: () => void;
}) {
  return (
    <>
      {navItems.map((item) => {
        const isActive = item.href === activeHref;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex h-11 w-full items-center justify-between gap-3 rounded-full px-4 text-[15px] font-medium transition-colors",
              focusRing,
              isActive ? "bg-[#4F46E5] text-white" : "text-[#334155] hover:bg-[#F5F3FF]",
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <item.icon className={cn("size-[18px] shrink-0", isActive ? "text-white" : "text-[#64748B]")} />
              <span className="truncate">{item.label}</span>
            </span>
            {item.href === "/admin/mentors/verification" && pendingVerificationCount > 0 ? (
              <span className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-xs font-semibold text-[#92400E]">
                {pendingVerificationCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </>
  );
}

function AdminFooter({ adminName, adminEmail }: { adminName: string; adminEmail?: string | null }) {
  return (
    <div className="flex flex-col items-center text-center">
      <AdminAvatar adminName={adminName} size="lg" />
      <p className="mt-3 max-w-full truncate text-base font-semibold text-[#0F172A]">{adminName}</p>
      {adminEmail ? <p className="mt-0.5 max-w-full truncate text-[13px] text-[#64748B]">{adminEmail}</p> : null}
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        className={cn("mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-[#4F46E5] transition-colors hover:bg-[#F5F3FF]", focusRing)}
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </div>
  );
}

export function AdminShell({ adminName, adminEmail, pendingVerificationCount, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const activeHref = navItems
    .filter((item) => isNavItemMatch(pathname, item.href))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href ?? "/admin";
  const activeItem = navItems.find((item) => item.href === activeHref) ?? navItems[0];

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    const match = query ? navItems.find((item) => item.label.toLowerCase().includes(query)) : undefined;

    if (match) {
      setSearchQuery("");
      router.push(match.href);
    }
  }

  return (
    <div data-admin-shell className="relative isolate min-h-screen bg-[#FAF5FF]">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[#FAF5FF]" aria-hidden="true" />
      <div className="mx-auto flex max-w-7xl gap-6 p-4 sm:p-6">
        <aside className={cn("sticky top-6 hidden h-[calc(100vh-3rem)] w-[280px] shrink-0 flex-col overflow-hidden p-5 lg:flex", cardSurface)}>
          <div className="flex h-10 shrink-0 items-center px-2">
            <MentraLogo size="sm" layout="horizontal" />
          </div>
          <div className="mt-5 h-px shrink-0 bg-[#E2E8F0]" />

          <nav className="mt-5 min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Admin navigation">
            <NavLinks activeHref={activeHref} pendingVerificationCount={pendingVerificationCount} />
          </nav>

          <div className="mt-5 shrink-0 border-t border-[#E2E8F0] pt-5">
            <AdminFooter adminName={adminName} adminEmail={adminEmail} />
          </div>
        </aside>

        <div className="min-w-0 flex-1 pb-8">
          <h1 className="sr-only">{activeItem.label}</h1>
          <header className={cn("sticky top-4 z-20 mb-6 flex min-h-[72px] items-center gap-3 px-4 py-3 sm:top-6 sm:gap-4 sm:px-5", cardSurface)}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-expanded={mobileMenuOpen}
              aria-controls="admin-mobile-navigation"
              aria-label={mobileMenuOpen ? "Close admin menu" : "Open admin menu"}
              className={cn("flex size-10 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#334155] transition-colors hover:bg-[#F5F3FF] lg:hidden", focusRing)}
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            <form role="search" onSubmit={handleSearch} className="relative min-w-0 flex-1 md:max-w-sm">
              <label htmlFor="admin-search" className="sr-only">Search admin pages</label>
              <input
                id="admin-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search admin pages"
                className="h-11 w-full rounded-full border border-[#E2E8F0] bg-[#F8FAFC] pl-4 pr-11 text-sm text-[#0F172A] placeholder:text-[#64748B] transition-colors focus:border-[#4F46E5]/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
              />
              <button
                type="submit"
                aria-label="Search"
                className={cn("absolute right-1.5 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#64748B] transition-colors hover:text-[#4F46E5]", focusRing)}
              >
                <Search className="size-[18px]" />
              </button>
            </form>

            <div className="hidden flex-1 justify-center md:flex">
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-[#334155]">
                {pageDateFormatter.format(new Date())}
                <ChevronDown className="size-4 text-[#64748B]" aria-hidden="true" />
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <Link
                href="/admin/notifications"
                aria-label="Notifications"
                className={cn("flex size-10 items-center justify-center rounded-full border border-[#E2E8F0] bg-white text-[#334155] transition-colors hover:bg-[#F5F3FF]", focusRing)}
              >
                <Bell className="size-[18px]" />
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Account menu"
                  className={cn("flex items-center rounded-full transition hover:opacity-90", focusRing)}
                >
                  <AdminAvatar adminName={adminName} size="sm" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 min-w-56">
                  <div className="px-2 py-1.5">
                    <p className="truncate text-sm font-semibold text-[#0F172A]">{adminName}</p>
                    {adminEmail ? <p className="truncate text-xs text-[#64748B]">{adminEmail}</p> : null}
                  </div>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => signOut({ callbackUrl: "/auth/signin" })}>
                    <LogOut className="mr-2 size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {mobileMenuOpen ? (
            <nav id="admin-mobile-navigation" className={cn("mb-6 p-4 lg:hidden", cardSurface)} aria-label="Admin navigation">
              <div className="grid gap-1 sm:grid-cols-2">
                <NavLinks
                  activeHref={activeHref}
                  pendingVerificationCount={pendingVerificationCount}
                  onNavigate={() => setMobileMenuOpen(false)}
                />
              </div>
              <div className="mt-4 border-t border-[#E2E8F0] pt-4">
                <AdminFooter adminName={adminName} adminEmail={adminEmail} />
              </div>
            </nav>
          ) : null}

          <main className={cn("min-w-0", mainSurfaceStyles)}>
            <PendingVerificationCountContext.Provider value={pendingVerificationCount}>
              {children}
            </PendingVerificationCountContext.Provider>
          </main>
        </div>
      </div>
    </div>
  );
}

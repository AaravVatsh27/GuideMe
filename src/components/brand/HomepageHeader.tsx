"use client";

import { useEffect, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Compass,
  CreditCard,
  GraduationCap,
  Menu,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { MentraLogo } from "@/components/brand/MentraLogo";

export function HomepageHeader() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on resize to desktop or route change
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const isHome = pathname === "/";
  const isFindMentor = pathname.startsWith("/find-mentor") || pathname.startsWith("/mentor");
  const isCommunity = pathname.startsWith("/community");

  const navLinks = [
    {
      label: "Find a Mentor",
      href: "/find-mentor",
      isActive: isFindMentor,
      badge: null,
    },
    {
      label: "How it Works",
      href: isHome ? "#how-it-works" : "/#how-it-works",
      isActive: false,
      badge: null,
    },
    {
      label: "Pricing",
      href: isHome ? "#pricing" : "/#pricing",
      isActive: false,
      badge: null,
    },
    {
      label: "For Mentors",
      href: isHome ? "#for-mentors" : "/#for-mentors",
      isActive: false,
      badge: null,
    },
    {
      label: "Community",
      href: "/community",
      isActive: isCommunity,
      badge: null,
    },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "border-b border-violet-100/90 bg-[#FAF5FF]/90 py-2 shadow-[0_10px_30px_-15px_rgba(30,27,75,0.08)] backdrop-blur-2xl"
          : "border-b border-violet-100/60 bg-[#FAF5FF]/80 py-3 backdrop-blur-xl"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with tagline */}
        <Link
          href="/"
          aria-label="Mentra homepage"
          className="group flex items-center shrink-0 rounded-xl transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED]/50"
        >
          <MentraLogo
            variant="color"
            layout="horizontal"
            showTagline={true}
            size="sm"
            priority
          />
        </Link>

        {/* Desktop Navigation Links - Modern floating pill dock */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center rounded-full border border-violet-100/80 bg-white/75 p-1 shadow-[0_2px_12px_-4px_rgba(30,27,75,0.04)] backdrop-blur-md lg:flex"
        >
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href as Route}
              aria-current={link.isActive ? "page" : undefined}
              className={`relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13.5px] transition-all duration-200 ${
                link.isActive
                  ? "bg-[#7C3AED]/10 font-semibold text-[#7C3AED] shadow-xs"
                  : "font-medium text-slate-600 hover:bg-violet-50/80 hover:text-[#1E1B4B]"
              }`}
            >
              <span>{link.label}</span>
              {link.badge && (
                <span
                  className={`inline-flex items-center rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    link.isActive
                      ? "bg-[#7C3AED] text-white"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2.5 shrink-0 sm:gap-3">
          <Link
            href="/auth/signup"
            className="hidden rounded-full border border-violet-200/90 bg-white/85 px-4 py-2 text-xs sm:text-[13px] font-semibold text-[#1E1B4B] shadow-xs backdrop-blur-sm transition-all duration-200 hover:border-violet-300 hover:bg-white hover:shadow-sm active:scale-[0.98] xl:inline-flex"
          >
            Create free account
          </Link>

          <Link
            href="/find-mentor"
            className="group relative hidden sm:inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#7C3AED] px-4.5 py-2 text-xs sm:text-[13px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(124,58,237,0.7)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6D28D9] hover:shadow-[0_14px_30px_-10px_rgba(124,58,237,0.8)] active:translate-y-0 active:scale-[0.98]"
          >
            <span className="relative z-10">Find My Senior Friend</span>
            <ArrowRight className="relative z-10 size-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
            <div
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transition-transform duration-700 group-hover:translate-x-full"
              aria-hidden="true"
            />
          </Link>

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex size-10 items-center justify-center rounded-full border border-violet-200/90 bg-white/90 text-slate-700 shadow-xs transition duration-200 hover:border-violet-300 hover:bg-violet-50 active:scale-95 lg:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="size-5 text-[#1E1B4B]" />
            ) : (
              <Menu className="size-5 text-[#1E1B4B]" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile navigation dropdown drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-violet-100/90 bg-[#FAF5FF]/98 px-4 pb-6 pt-3 shadow-[0_20px_40px_-15px_rgba(30,27,75,0.12)] backdrop-blur-2xl lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="mx-auto max-w-lg space-y-3">
            <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href as Route}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={link.isActive ? "page" : undefined}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition duration-150 ${
                    link.isActive
                      ? "bg-[#7C3AED]/10 font-bold text-[#7C3AED]"
                      : "text-slate-700 hover:bg-violet-100/60 hover:text-[#1E1B4B]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {link.label === "Find a Mentor" && (
                      <Compass className="size-4 text-[#7C3AED]" />
                    )}
                    {link.label === "How it Works" && (
                      <Sparkles className="size-4 text-[#7C3AED]" />
                    )}
                    {link.label === "Pricing" && (
                      <CreditCard className="size-4 text-[#7C3AED]" />
                    )}
                    {link.label === "For Mentors" && (
                      <GraduationCap className="size-4 text-[#7C3AED]" />
                    )}
                    {link.label === "Community" && (
                      <Users className="size-4 text-[#7C3AED]" />
                    )}
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="rounded-full bg-[#7C3AED] px-2 py-0.5 text-[10px] font-bold text-white">
                      {link.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-2.5 border-t border-violet-100 pt-3">
              <Link
                href="/auth/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-full border border-violet-200 bg-white py-3 text-sm font-semibold text-[#1E1B4B] shadow-xs transition hover:bg-violet-50"
              >
                Create free account
              </Link>
              <Link
                href="/find-mentor"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-[#7C3AED] py-3 text-sm font-semibold text-white shadow-[0_10px_22px_-8px_rgba(124,58,237,0.65)] transition hover:bg-[#6D28D9]"
              >
                <span>Find My Senior Friend</span>
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

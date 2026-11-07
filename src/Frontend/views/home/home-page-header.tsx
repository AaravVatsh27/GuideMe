"use client";

import { useEffect, useState, type MouseEvent } from "react";
import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { MentraLogo } from "@/Frontend/components/brand/MentraLogo";

const navLinks = [
  { label: "Find a Mentor", href: "/find-mentor" },
  { label: "How it Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "For Mentors", href: "#for-mentors" },
  { label: "Community", href: "/community" },
] as const;

export function HomePageHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavLinkClick = (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    setMobileMenuOpen(false);
    if (!href.startsWith("#")) return;

    const target = document.getElementById(href.slice(1));
    if (!target) return;

    event.preventDefault();
    const behavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";
    target.scrollIntoView({ behavior, block: "start" });
    window.history.pushState(null, "", href);
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <header
      className={`home-nav fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "home-nav-scrolled py-2"
          : "py-3"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="Mentra homepage"
          className="flex shrink-0 items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <span className="home-logo-lockup block" aria-hidden="true">
            <span className="home-logo-mark" />
            <span className="home-logo-wordmark-crop">
              <MentraLogo
                variant="light"
                layout="horizontal"
                showTagline
                size="sm"
                priority
                alt=""
                className="home-logo-wordmark"
              />
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href as Route}
              onClick={(event) => handleNavLinkClick(event, link.href)}
              className="rounded-full px-3 py-2 text-[13px] font-medium text-[var(--text)] transition hover:bg-[var(--card)] hover:text-[var(--accent)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/auth/signup"
            className="home-secondary-button hidden rounded-full px-4 py-2 text-xs font-semibold sm:inline-flex"
          >
            Create free account
          </Link>
          <Link
            href="/find-mentor"
            className="home-primary-button group hidden items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition sm:inline-flex"
          >
            Find My Senior Friend
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((open) => !open)}
            className="home-secondary-button flex size-10 items-center justify-center rounded-full md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div
        className={`overflow-hidden border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-2xl transition-[max-height,opacity] duration-300 md:hidden ${
          mobileMenuOpen ? "max-h-[28rem] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto flex max-w-lg flex-col gap-1 px-4 pb-4 pt-3" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href as Route}
              onClick={(event) => handleNavLinkClick(event, link.href)}
              className="rounded-xl px-4 py-3 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--card)] hover:text-[var(--accent)]"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-[var(--border)] pt-3 sm:hidden">
            <Link
              href="/auth/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="home-secondary-button flex justify-center rounded-full py-3 text-sm font-semibold"
            >
              Create free account
            </Link>
            <Link
              href="/find-mentor"
              onClick={() => setMobileMenuOpen(false)}
              className="home-primary-button flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold"
            >
              Find My Senior Friend <ArrowRight className="size-4" />
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

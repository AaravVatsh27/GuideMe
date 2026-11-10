/**
 * Home-page-only footer: brand column, three link columns, the legal row, and a large
 * "MENTRA" wordmark cut off by the bottom edge. Every link goes to a page or contact
 * route that exists; there is no language selector or newsletter in the product yet.
 */

import type { Route } from "next";
import Link from "next/link";
import { Mail, MessageCircle } from "lucide-react";
import { MentraLogo } from "@/Frontend/components/brand/MentraLogo";
import { COMMUNITY_WHATSAPP_URL, supportMailto } from "@/shared/site-config";

type FooterLink = { label: string; href: string; external?: boolean };

const footerColumns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Explore",
    links: [
      { label: "Find a Mentor", href: "/find-mentor" },
      { label: "How it Works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
      { label: "Community", href: "/community" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "For Mentors", href: "/#for-mentors" },
      { label: "Become a Mentor", href: "/auth/signup?role=MENTOR" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Create free account", href: "/auth/signup" },
      { label: "Sign in", href: "/auth/signin" },
      { label: "Contact support", href: supportMailto("Question about Mentra"), external: true },
    ],
  },
];

// Only channels that exist: support email always, WhatsApp once its invite link is configured.
const socialLinks = [
  { label: "Email Mentra support", href: supportMailto("Hello from the Mentra website"), Icon: Mail },
  ...(COMMUNITY_WHATSAPP_URL
    ? [{ label: "Mentra WhatsApp community", href: COMMUNITY_WHATSAPP_URL, Icon: MessageCircle }]
    : []),
];

const linkClass =
  "text-sm text-[var(--muted)] transition-colors hover:text-[var(--text)] motion-reduce:transition-none";

function FooterAnchor({ link }: { link: FooterLink }) {
  // mailto: and other external links use a plain anchor; internal routes use Link.
  if (link.external) {
    return (
      <a href={link.href} className={linkClass}>
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href as Route} className={linkClass}>
      {link.label}
    </Link>
  );
}

export function HomePageFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              aria-label="Mentra home"
              className="inline-flex items-center transition-opacity hover:opacity-90 motion-reduce:transition-none"
            >
              <MentraLogo variant="light" layout="horizontal" showTagline={true} size="sm" />
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-6 text-[var(--muted)]">
              Your senior friend · your guide. Talk to seniors reviewed before they go live who have lived your path.
            </p>

            <div className="mt-5 flex gap-3">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] motion-reduce:transition-none"
                  {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                >
                  <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                {column.title}
              </p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterAnchor link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--border)] pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[var(--muted)]">
            © {new Date().getFullYear()} Mentra. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            <Link href={"/privacy" as Route} className="text-[var(--muted)] transition-colors hover:text-[var(--text)] motion-reduce:transition-none">
              Privacy Policy
            </Link>
            <span aria-hidden="true" className="text-[var(--muted)]">
              ·
            </span>
            <Link href={"/terms" as Route} className="text-[var(--muted)] transition-colors hover:text-[var(--text)] motion-reduce:transition-none">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Giant wordmark: solid accent fading out downwards, cut off by the footer's bottom edge.
          Its size follows the viewport width so it always fits, and the footer clips any overflow. */}
      <div
        className="pointer-events-none mt-8 select-none overflow-hidden"
        style={{ height: "min(12vw, 10.5rem)" }}
        aria-hidden="true"
      >
        <p
          className="whitespace-nowrap text-center font-extrabold leading-[0.78] tracking-[-0.04em] text-[var(--accent)]"
          style={{
            fontSize: "min(22vw, 19rem)",
            maskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 80%)",
          }}
        >
          MENTRA
        </p>
      </div>
    </footer>
  );
}

/** Landing page: pricing. Three plans from the existing pricing data, then the guarantees and FAQ. */

import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, GraduationCap, Lock, ShieldCheck, Zap } from "lucide-react";
import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";

import { getPriceRange } from "@/Frontend/views/home/home-helpers";
import { formatPaise } from "@/shared/format";
import { FREE_INTRO_DURATION, FULL_REFUND_NOTICE_HOURS, HALF_REFUND_NOTICE_HOURS, NO_SHOW_REPORT_GRACE_MINUTES, SESSION_DURATIONS } from "@/shared/constants";

export function PricingSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  // The lowest 30-minute price among approved, active mentors, shown as "From ₹X" because each
  // mentor sets their own price. Never the "₹—" placeholder: with no prices yet it says "Mentor-set".
  const hasRealPrice = snapshot.minPricePaise > 0;
  const sessionPrice = hasRealPrice ? formatPaise(snapshot.minPricePaise) : "Mentor-set";
  const priceRange = getPriceRange(snapshot);
  const sessionLengths = SESSION_DURATIONS.join(" or ");
  const refundPolicy = `If your mentor doesn't join within ${NO_SHOW_REPORT_GRACE_MINUTES} minutes, report it from the session page for a full refund. If you cancel more than ${FULL_REFUND_NOTICE_HOURS} hours ahead you get a full refund, ${HALF_REFUND_NOTICE_HOURS}–${FULL_REFUND_NOTICE_HOURS} hours ahead half, and less than ${HALF_REFUND_NOTICE_HOURS} hours ahead none.`;
  const introMinutes = snapshot.introMinutes || FREE_INTRO_DURATION;

  // Existing plans, prices and features. Features are trimmed to ones the product backs up:
  // dropped lines promised things the platform doesn't provide (priority slots, rank tracking,
  // curated notes and similar), so they don't appear here.
  const pricingTiers = [
    {
      id: "intro",
      name: "Free Fit Check",
      tagline: "Test chemistry with zero risk",
      pricePrefix: null,
      price: "₹0",
      period: `first ${introMinutes}-min call`,
      features: [
        `${introMinutes}-min private 1:1 video call`,
        "Discuss your current exam or college dilemma",
        "Check communication style & mentor vibe",
        "Zero payment details required to book",
      ],
      ctaText: "Book Free Intro Call",
      ctaHref: "/find-mentor",
      featured: false,
    },
    {
      id: "deep-dive",
      name: "1:1 Strategy Session",
      tagline: "Tailored deep-dive for your exam target",
      pricePrefix: hasRealPrice ? "From" : null,
      price: sessionPrice,
      period: hasRealPrice ? `/ session (${sessionLengths} mins)` : `${sessionLengths}-min sessions`,
      features: [
        `${sessionLengths}-minute private video call`,
        "Unfiltered college & branch reality check",
        "Live doubt resolution & score triage",
        "Full refund if your mentor doesn't show up",
      ],
      ctaText: "Find Your Senior Mentor",
      ctaHref: "/find-mentor",
      featured: true,
    },
    {
      id: "ongoing",
      name: "Milestone Mentorship",
      tagline: "Ongoing checkpoints till exam day",
      pricePrefix: null,
      price: "Pay-As-You-Go",
      period: "flexible milestone check-ins",
      features: [
        "Multi-session checkpoints at your own pace",
        "Step-by-step choice filling & counselling help",
        "Book only when you need the next check-in",
      ],
      ctaText: "Explore Mentorship Plans",
      ctaHref: "/find-mentor",
      featured: false,
    },
  ];

  const trustGuarantees = [
    {
      icon: ShieldCheck,
      title: "Full refund on mentor no-shows",
      description: refundPolicy,
    },
    {
      icon: Zap,
      title: "Mentor-set pricing",
      description: "Fair, transparent pricing set by each mentor.",
    },
    {
      icon: GraduationCap,
      title: "Senior review process",
      description: "Every senior is reviewed before they go live.",
    },
    {
      icon: Lock,
      title: "Secure payments",
      description: "Pay via UPI, Net Banking, or cards.",
    },
  ];

  const faqs = [
    {
      q: `Is the ${introMinutes}-minute intro session really free?`,
      a: "Yes, completely free. You don't need to provide a credit card or payment details. It is an obligation-free opportunity to speak with a senior mentor, share your goals, and ensure their background aligns with your needs.",
    },
    {
      q: "How do mentors set their prices?",
      a: `Mentors set their own fees based on their year, degree and preparation experience. Sessions are ${sessionLengths} minutes, and prices on Mentra are currently ${priceRange}. There are no hidden platform surcharges.`,
    },
    {
      q: "What happens if my mentor doesn't show up or I need to reschedule?",
      a: `${refundPolicy} Refunds go back to your original payment method. To move a session, cancel it and book a new slot.`,
    },
    {
      q: "How is pricing set?",
      a: "Fair, transparent pricing set by each mentor.",
    },
  ];

  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 bg-[var(--bg)] py-20 sm:py-24 lg:py-28"
    >
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="home-section-label text-xs font-semibold uppercase tracking-[0.2em]">
            Pricing
          </p>

          <h2 className="mt-4 text-balance text-3xl font-bold leading-tight tracking-[-0.04em] text-[var(--text)] sm:text-4xl lg:text-5xl">
            Guidance for{" "}
            <span className="text-[var(--accent)]">every stage</span> of your
            journey.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Fair, transparent pricing set by each mentor.
          </p>
        </div>

        {/* Three plans, equal height. On phones they stack with the recommended plan first. */}
        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-3 md:items-stretch">
          {pricingTiers.map((tier) => (
            <article
              key={tier.id}
              className={`flex flex-col rounded-[20px] border bg-[var(--card)] p-6 backdrop-blur-[12px] lg:p-7 ${
                tier.featured
                  ? "order-first border-[var(--accent)] md:order-none"
                  : "border-[var(--border)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-[var(--text)]">
                  {tier.name}
                </h3>
                {tier.featured ? (
                  <span className="shrink-0 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--bg)]">
                    Recommended
                  </span>
                ) : null}
              </div>

              <p className="mt-1 text-sm text-[var(--muted)]">{tier.tagline}</p>

              <div className="mt-6 border-b border-[var(--border)] pb-6">
                <p className="text-3xl font-bold tracking-tight text-[var(--text)] lg:text-4xl">
                  {tier.pricePrefix ? (
                    <span className="mr-1 text-base font-medium tracking-normal text-[var(--muted)]">
                      {tier.pricePrefix}{" "}
                    </span>
                  ) : null}
                  {tier.price}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{tier.period}</p>
              </div>

              <ul className="mt-6 space-y-3">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm leading-snug text-[var(--text)]"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-[var(--accent)]"
                      strokeWidth={2.25}
                      aria-hidden="true"
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Link
                  href={tier.ctaHref as Route}
                  className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold ${
                    tier.featured ? "home-primary-button" : "home-secondary-button"
                  }`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Guarantees */}
        <div className="mt-14 rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustGuarantees.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex flex-col items-start">
                  <Icon className="size-5 text-[var(--accent)]" strokeWidth={1.75} aria-hidden="true" />
                  <h4 className="mt-3 text-sm font-semibold text-[var(--text)]">
                    {item.title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-[var(--muted)]">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing FAQ */}
        <div className="mx-auto mt-14 max-w-3xl">
          <div className="text-center">
            <h3 className="text-xl font-bold text-[var(--text)] sm:text-2xl">
              Frequently asked questions about pricing
            </h3>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Everything you need to know about sessions, payments, and refunds.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {faqs.map((faq, idx) => (
              <details
                key={faq.q}
                className="group rounded-[20px] border border-[var(--border)] bg-[var(--card)] p-5"
                {...(idx === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[var(--text)] select-none sm:text-base">
                  <span>{faq.q}</span>
                  <ChevronDown className="ml-3 size-4 shrink-0 text-[var(--accent)] transition-transform duration-200 group-open:rotate-180 motion-reduce:transform-none motion-reduce:transition-none" />
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-[var(--muted)] sm:text-sm">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

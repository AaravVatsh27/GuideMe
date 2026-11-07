/** Landing page: pricing. */

import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, GraduationCap, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";

import { getPriceRange, getTypicalPrice } from "@/Frontend/views/home/home-helpers";
import { FREE_INTRO_DURATION, FULL_REFUND_NOTICE_HOURS, HALF_REFUND_NOTICE_HOURS, NO_SHOW_REPORT_GRACE_MINUTES, SESSION_DURATIONS } from "@/shared/constants";

export function PricingSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const typicalPrice = getTypicalPrice(snapshot);
  const priceRange = getPriceRange(snapshot);
  const sessionLengths = SESSION_DURATIONS.join(" or ");
  const refundPolicy = `If your mentor doesn't join within ${NO_SHOW_REPORT_GRACE_MINUTES} minutes, report it from the session page for a full refund. If you cancel more than ${FULL_REFUND_NOTICE_HOURS} hours ahead you get a full refund, ${HALF_REFUND_NOTICE_HOURS}–${FULL_REFUND_NOTICE_HOURS} hours ahead half, and less than ${HALF_REFUND_NOTICE_HOURS} hours ahead none.`;
  const introMinutes = snapshot.introMinutes || FREE_INTRO_DURATION;

  const pricingTiers = [
    {
      id: "intro",
      name: "Free Fit Check",
      tagline: "Test chemistry with zero risk",
      badge: "100% Free",
      badgeColor: "bg-emerald-400/10 text-emerald-200 border-emerald-300/20",
      price: "₹0",
      period: `first ${introMinutes}-min call`,
      subPriceNote: "No card or upfront payment needed",
      description:
        "Speak directly with your chosen senior mentor before spending a single rupee. Share your doubts and confirm mutual fit.",
      features: [
        `${introMinutes}-min private 1:1 video call`,
        "Discuss your current exam or college dilemma",
        "Check communication style & mentor vibe",
        "Initial high-level action roadmap",
        "Zero payment details required to book",
      ],
      ctaText: "Book Free Intro Call",
      ctaHref: "/find-mentor",
      ctaVariant: "secondary" as const,
      audience: "Best for: Students exploring their guidance options",
      featured: false,
    },
    {
      id: "deep-dive",
      name: "1:1 Strategy Session",
      tagline: "Tailored deep-dive for your exam target",
      badge: "Recommended",
      badgeColor: "bg-[rgba(79,70,229,0.18)] text-[#C7D2FE] border-white/[0.08]",
      price: typicalPrice,
      period: `/ session (${sessionLengths} mins)`,
      subPriceNote: `Fair mentor rates · ${priceRange}`,
      description:
        "An intensive, focused 1:1 session completely tailored to your study schedule, mock score analysis, or college selection dilemma.",
      features: [
        `${sessionLengths}-minute private video call`,
        "Custom study schedule & milestone audit",
        "Unfiltered college & branch reality check",
        "Curated notes, mock tests & resource tips",
        "Live doubt resolution & score triage",
        "Full refund if your mentor doesn't show up",
      ],
      ctaText: "Find Your Senior Mentor",
      ctaHref: "/find-mentor",
      ctaVariant: "primary" as const,
      audience: "Best for: Score plateaus & college/branch decisions",
      featured: true,
    },
    {
      id: "ongoing",
      name: "Milestone Mentorship",
      tagline: "Ongoing checkpoints till exam day",
      badge: "Continuous Prep",
      badgeColor: "bg-[rgba(79,70,229,0.18)] text-[#A5B4FC] border-white/[0.08]",
      price: "Pay-As-You-Go",
      period: "flexible milestone check-ins",
      subPriceNote: "Fair, transparent pricing set by each mentor.",
      description:
        "Stay accountable with regular senior checkpoints throughout your entire preparation cycle, right through counselling rounds.",
      features: [
        "Multi-session checkpoints at your own pace",
        "Ongoing mock performance & rank tracking",
        "Step-by-step choice filling & counselling help",
        "Priority slot access with popular mentors",
        "Emergency strategy realignment before exams",
        "Book only when you need the next check-in",
      ],
      ctaText: "Explore Mentorship Plans",
      ctaHref: "/find-mentor",
      ctaVariant: "secondary" as const,
      audience: "Best for: Complete syllabus & counselling journey",
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
      description:
        "Pay via UPI, Net Banking, or cards.",
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
      className="relative scroll-mt-24 overflow-hidden bg-[#07060F] py-20 sm:py-24 lg:py-28"
    >
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute -left-32 top-20 size-[26rem] rounded-full bg-[rgba(79,70,229,0.18)] blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-16 bg-gradient-to-b from-transparent to-[#07060F] sm:h-20 lg:h-24"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Fair, transparent pricing set by each mentor.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/[0.65] sm:text-lg">
            Fair, transparent pricing set by each mentor.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {pricingTiers.map((tier) => (
            <article
              key={tier.id}
              className={`relative flex flex-col justify-between overflow-visible rounded-[24px] border p-7 transition-colors duration-200 motion-reduce:transition-none sm:p-8 ${
                tier.featured
                  ? "z-10 border-transparent shadow-[0_0_44px_rgba(79,70,229,0.18)] lg:-translate-y-2.5"
                  : "border-white/[0.08] bg-white/[0.04] shadow-sm backdrop-blur-md hover:border-[rgba(165,180,252,0.35)]"
              }`}
              style={
                tier.featured
                  ? {
                      background:
                        "radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 52%) padding-box, linear-gradient(rgba(255,255,255,0.04), rgba(255,255,255,0.04)) padding-box, linear-gradient(135deg, #4F46E5, #7C3AED) border-box",
                    }
                  : {
                      backgroundImage:
                        "radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 52%)",
                    }
              }
            >
              {tier.featured && (
                <>
                  <div className="absolute -top-3.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    <Sparkles className="size-3 text-white" />
                    <span>Recommended</span>
                  </div>
                </>
              )}

              <div className="relative z-10">
                {/* Header: Name & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-white">
                    {tier.name}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tier.badgeColor}`}
                  >
                    {tier.badge}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-white/[0.65]">
                  {tier.tagline}
                </p>

                {/* Pricing Display */}
                <div className="mt-6 border-b border-white/[0.08] pb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tracking-tight text-white">
                      {tier.price}
                    </span>
                    <span className="text-xs font-medium text-white/[0.65]">
                      {tier.period}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-[#A5B4FC]">
                    {tier.subPriceNote}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/[0.65]">
                    {tier.description}
                  </p>
                </div>

                {/* Feature Checklist */}
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#A5B4FC]">
                    What&apos;s included:
                  </p>
                  <ul className="mt-4 space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-white/[0.65]"
                      >
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[rgba(79,70,229,0.18)] text-[#A5B4FC]">
                          <Check className="size-3" />
                        </span>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer: CTA & Audience note */}
              <div className="relative z-10 mt-8 border-t border-white/[0.08] pt-6">
                <Link
                  href={tier.ctaHref as Route}
                  className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors duration-200 motion-reduce:transition-none ${
                    tier.ctaVariant === "primary"
                      ? "bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] text-white shadow-[0_12px_24px_-10px_rgba(79,70,229,0.55)] hover:shadow-[0_16px_30px_-10px_rgba(79,70,229,0.65)]"
                      : "border border-white/[0.2] text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight className="size-4" />
                </Link>
                <p className="mt-3 text-center text-[11px] font-medium text-white/[0.65]">
                  {tier.audience}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Trust & Risk-Reversal Guarantee Strip */}
        <div
          className="relative mt-14 overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-6 shadow-sm backdrop-blur-md transition-colors duration-200 hover:border-[rgba(165,180,252,0.35)] motion-reduce:transition-none sm:p-8"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 52%)",
          }}
        >
          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustGuarantees.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex flex-col items-start">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-[rgba(79,70,229,0.18)] text-[#A5B4FC]">
                    <Icon className="size-5" />
                  </div>
                  <h4 className="mt-3.5 text-sm font-bold text-white">
                    {item.title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/[0.65]">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pricing details */}
        <div
          className="relative mt-12 overflow-hidden rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-6 shadow-sm transition-colors duration-200 hover:border-[rgba(165,180,252,0.35)] motion-reduce:transition-none sm:p-8"
          style={{
            backgroundImage:
              "radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 52%)",
          }}
        >
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A5B4FC]">
              Pricing details
            </p>
            <h3 className="mt-2 text-xl font-bold text-white sm:text-2xl">
              Fair, transparent pricing set by each mentor.
            </h3>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Session pricing */}
            <div
              className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-5 transition-colors duration-200 hover:border-[rgba(165,180,252,0.35)] motion-reduce:transition-none sm:p-6"
              style={{
                backgroundImage:
                  "radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 52%)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-rose-400/15 text-xs font-bold text-rose-200">
                  •
                </span>
                <h4 className="text-sm font-bold text-white">
                  Session pricing
                </h4>
              </div>
              <ul className="mt-4 space-y-2.5 text-xs text-white/[0.65]">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-rose-300">•</span>
                  <span>Fair, transparent pricing set by each mentor.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-rose-300">•</span>
                  <span>Fair, transparent pricing set by each mentor.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-rose-300">•</span>
                  <span>Fair, transparent pricing set by each mentor.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-rose-300">•</span>
                  <span>Fair, transparent pricing set by each mentor.</span>
                </li>
              </ul>
            </div>

            {/* Mentra */}
            <div
              className="rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-5 shadow-xs transition-colors duration-200 hover:border-[rgba(165,180,252,0.35)] motion-reduce:transition-none sm:p-6"
              style={{
                backgroundImage:
                  "radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 52%)",
              }}
            >
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-[rgba(79,70,229,0.18)] text-xs font-bold text-[#A5B4FC]">
                  •
                </span>
                <h4 className="text-sm font-bold text-white">
                  Mentor-set pricing
                </h4>
              </div>
              <ul className="mt-4 space-y-2.5 text-xs text-white/[0.65]">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-[#A5B4FC]">•</span>
                  <span className="font-medium text-white">
                    Fair, transparent pricing set by each mentor.
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-[#A5B4FC]">•</span>
                  <span>Fair, transparent pricing set by each mentor.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-[#A5B4FC]">•</span>
                  <span>Fair, transparent pricing set by each mentor.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-[#A5B4FC]">•</span>
                  <span>Fair, transparent pricing set by each mentor.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pricing FAQ Accordion */}
        <div className="mx-auto mt-14 max-w-3xl">
          <div className="text-center">
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              Frequently asked questions about pricing
            </h3>
            <p className="mt-2 text-sm text-white/[0.65]">
              Everything you need to know about sessions, payments, and refunds.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {faqs.map((faq, idx) => (
              <details
                key={faq.q}
                className="group rounded-[24px] border border-white/[0.08] bg-white/[0.04] p-5 shadow-xs transition-colors duration-200 hover:border-[rgba(165,180,252,0.35)] open:border-[rgba(165,180,252,0.35)] motion-reduce:transition-none"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 52%)",
                }}
                {...(idx === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-white select-none sm:text-base">
                  <span>{faq.q}</span>
                  <ChevronDown className="ml-3 size-4 shrink-0 text-[#A5B4FC] transition-transform duration-200 group-open:rotate-180 motion-reduce:transform-none motion-reduce:transition-none" />
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-white/[0.65] sm:text-sm">
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

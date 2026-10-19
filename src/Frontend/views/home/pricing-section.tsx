/** Landing page: pricing. */

import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Check, ChevronDown, GraduationCap, Lock, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { type PublicPlatformSnapshot } from "@/Backend/server/public-data";

import { getPriceRange, getTypicalPrice } from "@/Frontend/views/home/home-helpers";
import { FREE_INTRO_DURATION } from "@/shared/constants";

export function PricingSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const typicalPrice = getTypicalPrice(snapshot);
  const priceRange = getPriceRange(snapshot);
  const introMinutes = snapshot.introMinutes || FREE_INTRO_DURATION;

  const pricingTiers = [
    {
      id: "intro",
      name: "Free Fit Check",
      tagline: "Test chemistry with zero risk",
      badge: "100% Free",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
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
      badge: "Most Popular",
      badgeColor: "bg-[#7C3AED] text-white border-transparent",
      price: typicalPrice,
      period: "/ session (45–60 mins)",
      subPriceNote: `Fair mentor rates · ${priceRange}`,
      description:
        "An intensive, focused 1:1 session completely tailored to your study schedule, mock score analysis, or college selection dilemma.",
      features: [
        "45–60 min deep-dive private video call",
        "Custom study schedule & milestone audit",
        "Unfiltered college & branch reality check",
        "Curated notes, mock tests & resource tips",
        "Live doubt resolution & score triage",
        "100% Money-Back Satisfaction Guarantee",
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
      badgeColor: "bg-violet-50 text-[#7C3AED] border-violet-200/70",
      price: "Pay-As-You-Go",
      period: "flexible milestone check-ins",
      subPriceNote: "Zero subscription lock-in or recurring auto-debit",
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
      title: "100% Money-Back Guarantee",
      description:
        "If your mentor misses a session or technical issues disrupt the call, receive an immediate full refund or free reschedule.",
    },
    {
      icon: Zap,
      title: "Zero Subscription Traps",
      description:
        "No monthly recurring charges, auto-debits, or forced bundles. You pay strictly per session only when you need guidance.",
    },
    {
      icon: GraduationCap,
      title: "Verified Senior Mentors",
      description:
        "Every senior is verified with college IDs & institutional credentials from IITs, BITS, AIIMS, NITs, and top universities.",
    },
    {
      icon: Lock,
      title: "Secure & RBI-Compliant",
      description:
        "Encrypted transactions powered by standard Indian payment gateways. Pay safely via UPI, Net Banking, or cards.",
    },
  ];

  const faqs = [
    {
      q: `Is the ${introMinutes}-minute intro session really free?`,
      a: "Yes, completely free. You don't need to provide a credit card or payment details. It is an obligation-free opportunity to speak with a senior mentor, share your goals, and ensure their background aligns with your needs.",
    },
    {
      q: "How do mentors set their prices?",
      a: "Mentors set their own fees transparently based on their year, degree, and preparation expertise. Most sessions range between ₹199 and ₹599 for a full 45–60 minute session. There are never any hidden platform surcharges.",
    },
    {
      q: "What happens if my mentor doesn't show up or I need to reschedule?",
      a: "Our 100% Money-Back Guarantee protects you. If a mentor fails to join or severe technical disruption occurs, we immediately issue a full refund to your original payment method or reschedule you with priority.",
    },
    {
      q: "How does Mentra compare to expensive coaching institute counselling?",
      a: "Traditional coaching institutes charge ₹30,000 to ₹1,00,000+ upfront for generic advice from counsellors who haven't taken competitive exams in years. Mentra gives you direct 1:1 access to students who actually cracked it recently, starting at ₹0.",
    },
  ];

  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 overflow-hidden bg-[#FAF5FF] py-20 sm:py-24 lg:py-28"
    >
      {/* Ambient background glows */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7C3AED]/[0.07] blur-[140px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute right-10 bottom-20 h-[350px] w-[350px] rounded-full bg-[#EC4899]/[0.05] blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[#1E1B4B] sm:text-4xl lg:text-5xl">
            Invest in clarity, not coaching packages.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-[#5B6475] sm:text-lg">
            Start with a 100% free intro call to test chemistry. When you find the right senior guide, book focused 1:1 sessions with zero subscription lock-in.
          </p>
        </div>

        {/* 3 Pricing Cards */}
        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {pricingTiers.map((tier) => (
            <article
              key={tier.id}
              className={`relative flex flex-col justify-between rounded-[2rem] p-7 transition duration-300 sm:p-8 ${
                tier.featured
                  ? "border-2 border-[#7C3AED]/40 bg-white shadow-[0_24px_50px_-20px_rgba(124,58,237,0.28)] lg:-translate-y-2.5 z-10"
                  : "border border-violet-100/90 bg-white/85 shadow-sm backdrop-blur-md hover:border-violet-200 hover:shadow-md"
              }`}
            >
              {tier.featured && (
                <>
                  <div
                    className="pointer-events-none absolute -inset-px rounded-[2rem] bg-gradient-to-br from-[#7C3AED]/10 via-[#EC4899]/[0.05] to-[#F97316]/[0.03]"
                    aria-hidden="true"
                  />
                  <div className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#EC4899] px-4 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-md">
                    <Sparkles className="size-3 text-white" />
                    <span>Most Chosen · Best Value</span>
                  </div>
                </>
              )}

              <div className="relative">
                {/* Header: Name & Badge */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-[#1E1B4B]">
                    {tier.name}
                  </h3>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tier.badgeColor}`}
                  >
                    {tier.badge}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {tier.tagline}
                </p>

                {/* Pricing Display */}
                <div className="mt-6 border-b border-violet-100/80 pb-6">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-4xl font-extrabold tracking-tight text-[#1E1B4B]">
                      {tier.price}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {tier.period}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-[#7C3AED]">
                    {tier.subPriceNote}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#5B6475]">
                    {tier.description}
                  </p>
                </div>

                {/* Feature Checklist */}
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#1E1B4B]/80">
                    What&apos;s included:
                  </p>
                  <ul className="mt-4 space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-[#4B5875]"
                      >
                        <span
                          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${
                            tier.featured
                              ? "bg-violet-100 text-[#7C3AED]"
                              : "bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          <Check className="size-3" />
                        </span>
                        <span className="leading-snug">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer: CTA & Audience note */}
              <div className="relative mt-8 border-t border-violet-100/60 pt-6">
                <Link
                  href={tier.ctaHref as Route}
                  className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                    tier.ctaVariant === "primary"
                      ? "bg-[#7C3AED] text-white shadow-[0_12px_24px_-10px_rgba(124,58,237,0.75)] hover:-translate-y-0.5 hover:bg-[#6D28D9] hover:shadow-[0_16px_30px_-10px_rgba(124,58,237,0.85)]"
                      : "border border-violet-200/90 bg-white text-[#1E1B4B] shadow-xs hover:border-violet-300 hover:bg-violet-50/70 hover:text-[#7C3AED]"
                  }`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight className="size-4" />
                </Link>
                <p className="mt-3 text-center text-[11px] font-medium text-slate-500">
                  {tier.audience}
                </p>
              </div>
            </article>
          ))}
        </div>

        {/* Trust & Risk-Reversal Guarantee Strip */}
        <div className="mt-14 rounded-3xl border border-violet-100/90 bg-white/90 p-6 shadow-sm backdrop-blur-md sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trustGuarantees.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex flex-col items-start">
                  <div className="flex size-10 items-center justify-center rounded-2xl bg-violet-50 text-[#7C3AED]">
                    <Icon className="size-5" />
                  </div>
                  <h4 className="mt-3.5 text-sm font-bold text-[#1E1B4B]">
                    {item.title}
                  </h4>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#5B6475]">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mentra vs Traditional Coaching Institutes Comparison */}
        <div className="mt-12 overflow-hidden rounded-3xl border border-violet-100 bg-gradient-to-br from-white via-[#FAF5FF] to-white p-6 shadow-sm sm:p-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
              The Honest Difference
            </p>
            <h3 className="mt-2 text-xl font-bold text-[#1E1B4B] sm:text-2xl">
              Why Mentra beats expensive coaching packages
            </h3>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Traditional institutes */}
            <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5 sm:p-6">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600">
                  ✕
                </span>
                <h4 className="text-sm font-bold text-slate-800">
                  Traditional Coaching & Career Institutes
                </h4>
              </div>
              <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-rose-500">−</span>
                  <span>₹25,000 – ₹1,00,000+ non-refundable upfront packages</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-rose-500">−</span>
                  <span>Counsellors who never took modern JEE/NEET/BITS/CUET</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-rose-500">−</span>
                  <span>Generic batch advice without seeing your mock answers</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-rose-500">−</span>
                  <span>Zero refunds if the advice doesn&apos;t match campus reality</span>
                </li>
              </ul>
            </div>

            {/* Mentra */}
            <div className="rounded-2xl border border-violet-200 bg-white p-5 shadow-xs sm:p-6">
              <div className="flex items-center gap-2">
                <span className="flex size-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  ✓
                </span>
                <h4 className="text-sm font-bold text-[#1E1B4B]">
                  Mentra 1:1 Senior Guidance
                </h4>
              </div>
              <ul className="mt-4 space-y-2.5 text-xs text-[#4B5875]">
                <li className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600">✓</span>
                  <span className="font-medium text-[#1E1B4B]">
                    ₹0 free intro call · Pay per session only when needed
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600">✓</span>
                  <span>Verified seniors studying at your dream college right now</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600">✓</span>
                  <span>Tailored advice on your specific rank, marks, and bottlenecks</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-bold text-emerald-600">✓</span>
                  <span>100% Money-Back Satisfaction Guarantee on every call</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Pricing FAQ Accordion */}
        <div className="mx-auto mt-14 max-w-3xl">
          <div className="text-center">
            <h3 className="text-xl font-bold text-[#1E1B4B] sm:text-2xl">
              Frequently asked questions about pricing
            </h3>
            <p className="mt-2 text-sm text-[#5B6475]">
              Everything you need to know about sessions, payments, and refunds.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            {faqs.map((faq, idx) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-violet-100/90 bg-white/90 p-5 shadow-xs transition-all hover:border-violet-200 open:border-violet-200 open:bg-white open:shadow-sm"
                {...(idx === 0 ? { open: true } : {})}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-[#1E1B4B] select-none sm:text-base">
                  <span>{faq.q}</span>
                  <ChevronDown className="ml-3 size-4 shrink-0 text-[#7C3AED] transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-xs leading-relaxed text-[#5B6475] sm:text-sm">
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

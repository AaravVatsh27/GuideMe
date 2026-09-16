import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  CreditCard,
  GraduationCap,
  HeartHandshake,
  HelpCircle,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";

import { MentraLogo } from "@/components/brand/MentraLogo";
import { HomepageHeader } from "@/components/brand/HomepageHeader";
import { HomepageFooter } from "@/components/brand/HomepageFooter";
import { HowItWorksSteps } from "@/Frontend/components/HowItWorksSteps";
import {
  getPublicPlatformSnapshot,
  getPublicReviewSpotlights,
  type PublicMentorCard,
  type PublicPlatformSnapshot,
  type PublicReviewSpotlight,
} from "@/Backend/server/public-data";

export const dynamic = "force-dynamic";

const SCHOOL_MENTOR_YEARS = new Set([1, 2]);

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function formatCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function getMentorInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "M";
}

function getMentorGroup(mentor: PublicMentorCard) {
  return mentor.yearOfStudy !== null &&
    SCHOOL_MENTOR_YEARS.has(mentor.yearOfStudy)
    ? "school"
    : "ug";
}

function getMentorPrice(mentor: PublicMentorCard) {
  return mentor.priceMin && mentor.priceMin > 0
    ? formatCurrency(mentor.priceMin)
    : "View pricing";
}

function getMentorContext(mentor: PublicMentorCard) {
  const parts = [
    mentor.college,
    mentor.degree,
    mentor.yearLabel,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Mentor profile";
}

function getMentorTopic(mentor: PublicMentorCard) {
  return (
    mentor.topicLabels[0] ??
    mentor.examLabels[0] ??
    "Academic guidance"
  );
}

function getMentorProof(mentor: PublicMentorCard) {
  if (mentor.totalReviews > 0) {
    return `${mentor.avgRating.toFixed(1)} · ${formatNumber(
      mentor.totalReviews,
    )} reviews`;
  }

  if (mentor.totalSessions > 0) {
    return `${formatNumber(mentor.totalSessions)} sessions`;
  }

  return "New mentor";
}

function getStartingPrice(snapshot: PublicPlatformSnapshot) {
  if (snapshot.minPrice > 0) {
    return formatCurrency(snapshot.minPrice);
  }

  if (snapshot.averagePaidSessionPrice > 0) {
    return formatCurrency(snapshot.averagePaidSessionPrice);
  }

  return "₹—";
}

function getTypicalPrice(snapshot: PublicPlatformSnapshot) {
  if (snapshot.averagePaidSessionPrice > 0) {
    return formatCurrency(snapshot.averagePaidSessionPrice);
  }

  if (snapshot.minPrice > 0) {
    return formatCurrency(snapshot.minPrice);
  }

  return "₹—";
}

function getPriceRange(snapshot: PublicPlatformSnapshot) {
  if (snapshot.minPrice > 0 && snapshot.maxPrice > 0) {
    return `${formatCurrency(snapshot.minPrice)} – ${formatCurrency(
      snapshot.maxPrice,
    )}`;
  }

  if (snapshot.minPrice > 0) {
    return `${formatCurrency(snapshot.minPrice)} onwards`;
  }

  return "Pricing updates as mentors go live";
}

function estimateMonthlyEarnings(
  sessionsPerWeek: number,
  averagePrice: number,
) {
  return Math.round(sessionsPerWeek * averagePrice * 4.33 * 0.8);
}

function getMentorIncomeEstimate(snapshot: PublicPlatformSnapshot) {
  const price =
    snapshot.averagePaidSessionPrice > 0
      ? snapshot.averagePaidSessionPrice
      : snapshot.minPrice > 0
        ? snapshot.minPrice
        : 249;

  return estimateMonthlyEarnings(4, price);
}

function getReviewInitials(review: PublicReviewSpotlight) {
  return review.studentFirstName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function HeroSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const previewMentors = snapshot.featuredMentors.slice(0, 3);
  const startingPrice = getStartingPrice(snapshot);

  const colleges = [
    "IIT Bombay",
    "IIT Madras",
    "IIT Delhi",
    "AIIMS",
    "NIT Trichy",
    "BITS Pilani",
    "IIM Bangalore",
    "NLU Delhi",
  ];

  return (
    <section
      id="top"
      className="mentra-hero-depth relative overflow-hidden border-b border-violet-100/70 bg-[#FAF5FF]"
    >
      {/* Ambient background */}
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-[#7C3AED]/10 blur-[110px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-32 top-20 h-[32rem] w-[32rem] rounded-full bg-[#EC4899]/10 blur-[120px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[45%] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[#F97316]/[0.06] blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-14 sm:px-6 sm:pb-20 sm:pt-18 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Hero copy */}
          <div className="max-w-3xl">
            <div className="mentra-clay-pill inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold text-[#6D28D9] backdrop-blur-xl">
              <span
                className="size-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899]"
                aria-hidden="true"
              />
              Your senior friend for every big decision
            </div>

            <h1 className="mt-7 max-w-4xl text-balance text-5xl font-extrabold leading-[0.98] tracking-[-0.055em] text-[#1E1B4B] sm:text-6xl lg:text-[5.2rem]">
              Find your mantra.
              <span className="block">Find your</span>
              <span className="mt-1 block bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F97316] bg-clip-text text-transparent">
                mentor.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-base leading-7 text-[#4B5875] sm:text-lg sm:leading-8">
              One honest conversation can change everything. Talk to a
              college senior who has recently walked the same road and can
              help you choose with more clarity.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/find-mentor"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 text-sm font-semibold text-white shadow-[0_16px_36px_-18px_rgba(124,58,237,0.72)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#6D28D9]"
              >
                Find My Senior Friend
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/auth/signup"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-violet-200 bg-white/75 px-6 text-sm font-semibold text-[#1E1B4B] shadow-sm backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white"
              >
                Create free account
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#667085]">
              <span className="font-semibold text-[#7C3AED]">
                {startingPrice} / session
              </span>
              <span aria-hidden="true">·</span>
              <span>Free {snapshot.introMinutes}-min intro</span>
              <span aria-hidden="true">·</span>
              <span>
                {formatNumber(snapshot.totalMentors)} verified mentors
              </span>
            </div>

            {/* Community Social Proof Avatar Strip */}
            <div className="mt-8 flex items-center gap-2.5 pt-1 sm:gap-3.5">
              <div className="flex shrink-0 -space-x-2 overflow-hidden sm:-space-x-2.5">
                <div className="relative size-9 overflow-hidden rounded-full ring-2 ring-white shadow-xs sm:size-10">
                  <Image
                    src="/avatars/mentor-1.jpg"
                    alt="Mentra senior mentor Ananya"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="relative size-9 overflow-hidden rounded-full ring-2 ring-white shadow-xs sm:size-10">
                  <Image
                    src="/avatars/mentor-2.jpg"
                    alt="Mentra senior mentor Rohan"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="relative size-9 overflow-hidden rounded-full ring-2 ring-white shadow-xs sm:size-10">
                  <Image
                    src="/avatars/mentor-3.jpg"
                    alt="Mentra senior mentor Pooja"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="relative size-9 overflow-hidden rounded-full ring-2 ring-white shadow-xs sm:size-10">
                  <Image
                    src="/avatars/mentor-4.jpg"
                    alt="Mentra senior mentor Kabir"
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
              </div>

              <div className="text-left">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-bold text-[#1E1B4B]">
                  <div className="flex items-center gap-0.5" aria-label="5 stars rating">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="size-3.5 fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <span className="font-extrabold text-[#1E1B4B]">4.95/5</span>
                  <span className="size-1 rounded-full bg-slate-300" aria-hidden="true" />
                  <span className="font-bold text-[#7C3AED]">10,000+ Students Guided</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug font-medium text-slate-500 sm:mt-1 sm:text-xs">
                  Active peer circles in IIT, AIIMS, BITS &amp; top colleges
                </p>
              </div>
            </div>
          </div>

          {/* Mentor preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div
              className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-[#7C3AED]/12 via-[#EC4899]/10 to-[#F97316]/8 blur-2xl"
              aria-hidden="true"
            />

            <div className="mentra-clay-card relative rounded-[2rem] border bg-white/70 p-5 backdrop-blur-2xl transition-transform duration-500 hover:-translate-y-1 sm:p-6">
              {/* Live Session Photo Banner */}
              <div className="relative mb-5 overflow-hidden rounded-2xl border border-violet-100/90 shadow-xs group">
                <Image
                  src="/hero/senior-mentor-guidance.jpg"
                  alt="Live 1:1 senior mentorship session"
                  width={600}
                  height={338}
                  className="w-full object-cover aspect-[16/9] transition-transform duration-500 group-hover:scale-[1.03]"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/85 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-semibold text-white drop-shadow-sm">Live 1:1 Guidance Session</span>
                  </div>
                  <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10.5px] font-semibold backdrop-blur-md">
                    IIT & AIIMS Seniors
                  </span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7C3AED]">
                    Start with someone who has been there
                  </p>

                  <h2 className="mt-2 text-xl font-bold tracking-tight text-[#1E1B4B]">
                    Find a mentor who gets it.
                  </h2>
                </div>

                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-violet-100 bg-white/90 text-[#7C3AED] shadow-sm">
                  <HeartHandshake className="size-5" />
                </div>
              </div>

              {previewMentors.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {previewMentors.map((mentor) => {
                    const group = getMentorGroup(mentor);

                    return (
                      <Link
                        key={mentor.username ?? mentor.name}
                        href={
                          mentor.username
                            ? `/mentor/${encodeURIComponent(
                                mentor.username,
                              )}`
                            : "/find-mentor"
                        }
                        className="group flex items-center gap-3 rounded-2xl border border-slate-100/90 bg-white/85 p-3.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-[0_12px_28px_-22px_rgba(124,58,237,0.45)]"
                      >
                        <div
                          className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                            group === "school"
                              ? "bg-violet-100 text-[#7C3AED]"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {getMentorInitials(mentor.name)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-[#1E1B4B]">
                              {mentor.name}
                            </p>

                            {mentor.totalReviews > 0 && (
                              <ShieldCheck className="size-3.5 shrink-0 text-emerald-500" />
                            )}
                          </div>

                          <p className="truncate text-xs text-slate-500">
                            {getMentorContext(mentor)}
                          </p>

                          <p className="mt-1 text-xs font-medium text-[#7C3AED]">
                            {getMentorTopic(mentor)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-[#1E1B4B]">
                            {getMentorPrice(mentor)}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            {getMentorProof(mentor)}
                          </p>
                        </div>
                      </Link>
                    );
                  })}

                  <Link
                    href="/find-mentor"
                    className="group flex min-h-11 items-center justify-between rounded-2xl border border-dashed border-violet-200 bg-white/55 px-4 text-sm font-semibold text-[#7C3AED] backdrop-blur transition hover:bg-violet-50/70"
                  >
                    Explore all mentors
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-violet-200 bg-violet-50/60 p-6">
                  <p className="text-sm font-semibold text-[#1E1B4B]">
                    Mentor profiles are opening now.
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Search the mentor network and see who is currently live.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Crawling college marquee */}
        <div className="relative mt-14 overflow-hidden rounded-[1.75rem] border border-violet-100/80 bg-white/60 py-5 shadow-[0_12px_40px_-30px_rgba(30,27,75,0.25)] backdrop-blur-xl sm:mt-16">
          <div className="flex items-center gap-5 px-5 sm:px-6">
            <div className="z-10 shrink-0 border-r border-violet-100 pr-5 sm:pr-7">
              <p className="whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.2em] text-[#7C3AED]">
                Mentors from
              </p>
            </div>

            <div className="relative min-w-0 flex-1 overflow-hidden">
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-white/80 to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-white/80 to-transparent" />

              <div
                className="mentra-college-marquee"
                aria-label={`Mentors from ${colleges.join(", ")}`}
              >
                <div className="mentra-college-marquee-track">
                  {[...colleges, ...colleges].map((college, index) => (
                    <span
                      key={`${college}-${index}`}
                      className="inline-flex shrink-0 items-center gap-4 whitespace-nowrap text-sm font-semibold text-slate-500"
                    >
                      {college}
                      <span
                        className="size-1 rounded-full bg-violet-200"
                        aria-hidden="true"
                      />
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustStrip({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  return (
    <section className="relative z-10 -mt-1 bg-[#FAF5FF] px-4 pb-2 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/75 shadow-[0_20px_60px_-40px_rgba(30,27,75,0.28)] backdrop-blur-xl">
          <div className="grid grid-cols-2 divide-x divide-violet-100 sm:grid-cols-4">
            <div className="px-4 py-6 sm:px-7 sm:py-7">
              <p className="text-2xl font-bold tracking-[-0.03em] text-[#7C3AED]">
                {formatNumber(snapshot.totalMentors)}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Verified mentors
              </p>
            </div>

            <div className="px-4 py-6 sm:px-7 sm:py-7">
              <p className="text-2xl font-bold tracking-[-0.03em] text-[#7C3AED]">
                {formatNumber(snapshot.totalStudents)}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Students onboarded
              </p>
            </div>

            <div className="border-t border-violet-100 px-4 py-6 sm:border-t-0 sm:px-7 sm:py-7">
              <p className="text-2xl font-bold tracking-[-0.03em] text-[#7C3AED]">
                {formatNumber(snapshot.completedSessions)}
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Sessions completed
              </p>
            </div>

            <div className="border-t border-violet-100 px-4 py-6 sm:border-t-0 sm:px-7 sm:py-7">
              <p className="text-2xl font-bold tracking-[-0.03em] text-[#7C3AED]">
                {snapshot.introMinutes} min
              </p>

              <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                Free intro conversation
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const items = [
    {
      number: "01",
      title: "Narrow exposure",
      copy:
        "Students often hear only a small set of options from school, family, or coaching circles.",
      solution: "50+ real paths mapped by seniors",
    },
    {
      number: "02",
      title: "Pressure-led choices",
      copy:
        "Stream and college decisions can get shaped by pressure before students understand their own fit.",
      solution: "Zero-pressure, honest 1-on-1 talks",
    },
    {
      number: "03",
      title: "Thin guidance access",
      copy:
        "One-to-one guidance is difficult to find exactly when students need it most.",
      solution: "Verified seniors on demand in minutes",
    },
    {
      number: "04",
      title: "Late clarity",
      copy:
        "The right questions often appear after important forms, deadlines, or decisions have already passed.",
      solution: "Proactive guidance before deadlines",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="bg-white py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:gap-16">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
              The problem
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] text-[#1E1B4B] sm:text-4xl lg:text-5xl">
              Big decisions are easier when someone has already been there.
            </h2>

            <p className="mt-5 text-base leading-7 text-[#5B6475]">
              Mentra exists for the moment when students need more than
              generic advice and less than a giant career-consulting process.
            </p>

            <div className="group relative mt-8 overflow-hidden rounded-[1.75rem] border border-violet-100 bg-[#F8F5FF] shadow-[0_22px_55px_-38px_rgba(76,29,149,0.45)] transition-all duration-300 hover:shadow-[0_28px_65px_-35px_rgba(124,58,237,0.35)]">
              <Image
                src="/brand/decision-guidance-illustration.png"
                alt="A senior helping a student see their academic options more clearly"
                width={1024}
                height={1536}
                sizes="(min-width: 1024px) 29vw, (min-width: 640px) 48vw, 100vw"
                className="aspect-[1.12/1] w-full object-cover object-[50%_34%] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/70 bg-white/85 p-3.5 shadow-lg shadow-violet-950/10 backdrop-blur-md transition-colors duration-300 group-hover:bg-white/95">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7C3AED]">
                  From uncertainty to a next step
                </p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#1E1B4B]">
                  A conversation turns a huge decision into a clear path forward.
                </p>
              </div>
            </div>
          </div>

          <HowItWorksSteps items={items} />
        </div>
      </div>
    </section>
  );
}

function MentorsSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  return (
    <section
      id="mentors"
      className="relative overflow-hidden bg-[#FAF5FF] py-20 sm:py-24 lg:py-28"
    >
      <div
        className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-[#EC4899]/[0.07] blur-[100px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#7C3AED]/[0.06] blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
              Meet your mentors
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] text-[#1E1B4B] sm:text-4xl">
              Real students. Real experience. Real guidance.
            </h2>

            <p className="mt-4 text-base leading-7 text-[#5B6475]">
              Every live mentor brings recent, relevant experience to the
              decisions students are trying to make right now.
            </p>
          </div>

          <Link
            href="/find-mentor"
            className="group inline-flex min-h-11 items-center gap-2 self-start rounded-full border border-violet-200 bg-white/80 px-5 text-sm font-semibold text-[#7C3AED] shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white lg:self-auto"
          >
            See all mentors
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {snapshot.featuredMentors.length > 0 ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {snapshot.featuredMentors.slice(0, 8).map((mentor) => {
              const group = getMentorGroup(mentor);

              return (
                <article
                  key={mentor.username ?? mentor.name}
                  className="group flex flex-col rounded-[1.75rem] border border-violet-100 bg-white p-5 shadow-[0_12px_40px_-32px_rgba(30,27,75,0.30)] transition duration-200 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_24px_55px_-32px_rgba(124,58,237,0.32)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex size-12 items-center justify-center rounded-2xl text-sm font-bold ${
                        group === "school"
                          ? "bg-violet-50 text-[#7C3AED]"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {getMentorInitials(mentor.name)}
                    </div>

                    <div className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-700">
                      {mentor.availableThisWeek ? "Available" : "Profile live"}
                    </div>
                  </div>

                  <div className="mt-5">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-[0.13em] text-[#7C3AED]">
                      {mentor.college ?? "Mentra mentor"}
                    </p>

                    <h3 className="mt-2 line-clamp-2 text-lg font-semibold tracking-tight text-[#1E1B4B]">
                      {mentor.name}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {getMentorContext(mentor)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {[mentor.examLabels[0], mentor.topicLabels[0]]
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((label) => (
                          <span
                            key={label}
                            className="rounded-full bg-violet-50 px-3 py-1.5 text-[11px] font-medium text-[#6D28D9]"
                          >
                            {label}
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                      <div>
                        <p className="text-sm font-bold text-[#1E1B4B]">
                          {getMentorPrice(mentor)}
                          {mentor.priceMin && mentor.priceMin > 0 && (
                            <span className="ml-1 text-xs font-medium text-slate-400">
                              / session
                            </span>
                          )}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {getMentorProof(mentor)}
                        </p>
                      </div>

                      <Link
                        href={
                          mentor.username
                            ? `/mentor/${encodeURIComponent(
                                mentor.username,
                              )}`
                            : "/find-mentor"
                        }
                        className="inline-flex size-10 items-center justify-center rounded-full bg-[#1E1B4B] text-white transition duration-200 group-hover:bg-[#7C3AED]"
                        aria-label={`View ${mentor.name}'s profile`}
                      >
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-12 rounded-[1.75rem] border border-dashed border-violet-200 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
            <Users className="mx-auto size-8 text-[#7C3AED]" />

            <h3 className="mt-4 text-lg font-semibold text-[#1E1B4B]">
              Mentor profiles are opening now.
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Browse the mentor marketplace as profiles become available.
            </p>

            <Link
              href="/find-mentor"
              className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#7C3AED] px-5 text-sm font-semibold text-white shadow-[0_10px_28px_-18px_rgba(124,58,237,0.65)] transition hover:-translate-y-0.5 hover:bg-[#6D28D9]"
            >
              Browse mentor directory
              <ArrowRight className="size-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function TestimonialsSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const reviews = snapshot.reviewSpotlights.slice(0, 6);

  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-violet-300/[0.08] blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
            Student stories
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[#1E1B4B] sm:text-4xl">
            Students who found clarity.
          </h2>

          <p className="mt-4 max-w-xl text-base leading-7 text-[#5B6475]">
            The best proof is what happens after the conversation.
          </p>
        </div>

        {reviews.length > 0 ? (
          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {reviews.map((review) => (
              <article
                key={`${review.studentFirstName}-${review.createdAt.toISOString()}`}
                className="group relative overflow-hidden rounded-[1.75rem] border border-violet-100/80 bg-white/65 p-6 shadow-[0_20px_55px_-38px_rgba(30,27,75,0.30)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_26px_65px_-38px_rgba(124,58,237,0.30)]"
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 text-[9rem] font-serif leading-none text-violet-100/70"
                  aria-hidden="true"
                >
                  “
                </div>

                <div className="relative">
                  <div className="flex items-center gap-1 text-amber-500">
                    {"★★★★★".slice(
                      0,
                      Math.max(1, Math.min(5, Math.round(review.rating))),
                    )}
                  </div>

                  <p className="mt-6 text-[15px] leading-7 text-[#3D4A6B]">
                    “
                    {review.reviewText?.trim() ||
                      `${review.studentFirstName} shared their experience after a Mentra session.`}
                    ”
                  </p>

                  <div className="mt-8 flex items-center gap-3 border-t border-violet-100/80 pt-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-violet-50 text-xs font-bold text-[#7C3AED]">
                      {getReviewInitials(review)}
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E1B4B]">
                        {review.studentFirstName}
                        {review.studentCity
                          ? `, ${review.studentCity}`
                          : ""}
                      </p>

                      <p className="truncate text-xs text-slate-400">
                        Mentored by {review.mentorName}
                      </p>
                    </div>

                    <p className="ml-auto shrink-0 text-[11px] text-slate-400">
                      {formatDate(review.createdAt)}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 rounded-[1.75rem] border border-dashed border-violet-200 bg-violet-50/40 p-10 text-center">
            <p className="text-sm font-medium text-slate-600">
              Public student reviews will appear here after the first
              completed sessions.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function PricingSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const typicalPrice = getTypicalPrice(snapshot);
  const priceRange = getPriceRange(snapshot);
  const introMinutes = snapshot.introMinutes || 15;

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
      q: "Is the 15-minute intro session really 100% free?",
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

function MentorIncomeSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  const estimate = getMentorIncomeEstimate(snapshot);

  return (
    <section
      id="for-mentors"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
    >
      <div
        className="pointer-events-none absolute -left-28 top-20 h-80 w-80 rounded-full bg-[#7C3AED]/[0.06] blur-[100px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#EC4899]/[0.06] blur-[100px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
              For mentors
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] text-[#1E1B4B] sm:text-4xl lg:text-5xl">
              Turn your experience into income.
            </h2>

            <p className="mt-5 text-base leading-7 text-[#5B6475]">
              You just figured something out that another student is about to
              face. Share the path that worked for you and build meaningful
              experience while doing it.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Help students make decisions with more context.",
                "Build proof of communication and leadership.",
                "Earn from sessions that fit your schedule.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[#7C3AED]">
                    <Check className="size-3.5" />
                  </span>

                  <p className="text-sm leading-6 text-[#4B5875]">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/auth/signup?role=MENTOR"
              className="group mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#1E1B4B] px-6 text-sm font-semibold text-white shadow-[0_12px_30px_-20px_rgba(30,27,75,0.6)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#312E81]"
            >
              Apply to Become a Mentor
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-8 rounded-[2.75rem] bg-gradient-to-br from-[#7C3AED]/10 via-[#EC4899]/[0.06] to-[#F97316]/[0.04] blur-2xl"
              aria-hidden="true"
            />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/80 bg-white/65 p-6 shadow-[0_30px_90px_-44px_rgba(30,27,75,0.35)] backdrop-blur-2xl sm:p-8">
              <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-gradient-to-br from-violet-300/20 via-pink-200/10 to-orange-200/5 blur-3xl" />

              <div className="relative">
                <div className="flex items-start justify-between gap-5">
                  <div className="max-w-md">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7C3AED]">
                      Earnings snapshot
                    </p>

                    <h3 className="mt-2 text-xl font-bold tracking-tight text-[#1E1B4B] sm:text-2xl">
                      What consistent mentoring can look like
                    </h3>
                  </div>

                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-violet-100 bg-white/90 text-[#7C3AED] shadow-sm">
                    <GraduationCap className="size-5" />
                  </div>
                </div>

                <div className="mt-8 rounded-[1.5rem] border border-violet-100/80 bg-white/90 p-6 shadow-sm">
                  <p className="text-sm font-medium text-slate-500">
                    Example at 4 sessions / week
                  </p>

                  <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-4xl font-bold tracking-[-0.04em] text-[#1E1B4B] sm:text-5xl">
                      {formatCurrency(estimate)}
                    </p>

                    <span className="text-sm font-medium text-slate-400">
                      / month
                    </span>
                  </div>

                  <p className="mt-4 max-w-lg text-sm leading-6 text-slate-500">
                    Estimate based on the current platform booking value and an
                    80% mentor share.
                  </p>

                  <div className="mt-7 rounded-2xl bg-violet-50/80 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span>Mentor share</span>
                      <span className="text-[#7C3AED]">80%</span>
                    </div>

                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white shadow-inner">
                      <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F97316]" />
                    </div>

                    <div className="mt-3 flex justify-between text-[11px] text-slate-400">
                      <span>Platform</span>
                      <span>Mentor</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex items-start gap-3">
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="size-3.5" />
                  </div>

                  <p className="text-xs leading-5 text-slate-500">
                    Actual earnings vary with session price, availability, and
                    bookings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeCommunitySection() {
  return (
    <section
      id="community"
      className="relative overflow-hidden border-t border-violet-100/80 bg-[#FAF5FF] py-20 sm:py-24 lg:py-28"
    >
      <div
        className="pointer-events-none absolute -left-28 top-20 h-80 w-80 rounded-full bg-[#7C3AED]/[0.08] blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#EC4899]/[0.07] blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Column: Copy & Stats */}
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#6D28D9] shadow-xs backdrop-blur-sm">
              <Users className="size-3.5 text-[#7C3AED]" />
              <span>Mentra Student Community</span>
            </div>

            <h2 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#1E1B4B] sm:text-4xl lg:text-5xl">
              You&apos;re not figuring this out{" "}
              <span className="bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F97316] bg-clip-text text-transparent">
                alone.
              </span>
            </h2>

            <p className="mt-5 text-base leading-7 text-[#4B5875] sm:text-lg">
              Join over 10,000 students navigating the same big decisions — stream choices, competitive exams, college realities, and branch trade-offs. Connect with verified seniors who walked your exact road.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-3 rounded-2xl border border-violet-100 bg-white/80 p-4 shadow-xs">
              <div className="text-center">
                <p className="text-2xl font-black text-[#1E1B4B]">10K+</p>
                <p className="text-xs font-semibold text-[#7C3AED]">Students</p>
              </div>
              <div className="border-x border-violet-100 text-center">
                <p className="text-2xl font-black text-[#1E1B4B]">50+</p>
                <p className="text-xs font-semibold text-[#7C3AED]">Cities</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-[#1E1B4B]">8</p>
                <p className="text-xs font-semibold text-[#7C3AED]">Streams</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/community"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 text-sm font-semibold text-white shadow-[0_16px_36px_-18px_rgba(124,58,237,0.72)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#6D28D9]"
              >
                Join WhatsApp Community
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/community"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-violet-200 bg-white px-6 text-sm font-semibold text-[#1E1B4B] shadow-xs transition duration-200 hover:border-violet-300 hover:bg-violet-50/70"
              >
                Explore Community Hub
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Image Showcase */}
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-6 rounded-[2.5rem] bg-gradient-to-br from-[#7C3AED]/12 via-[#EC4899]/10 to-[#F97316]/8 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative space-y-3 sm:space-y-4">
              {/* Main Photo: Campus Steps */}
              <div className="group relative overflow-hidden rounded-3xl border border-white/90 bg-white p-2.5 shadow-[0_24px_60px_-30px_rgba(30,27,75,0.22)] backdrop-blur-xl">
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl bg-violet-50">
                  <Image
                    src="/hero/community-hero.jpg"
                    alt="Indian university students collaborating on campus"
                    width={720}
                    height={450}
                    className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white">
                    <span className="font-semibold text-white drop-shadow-sm">
                      Campus Chapters Across India
                    </span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md">
                      IIT · DU · BITS · AIIMS
                    </span>
                  </div>
                </div>
              </div>

              {/* Secondary Photo Grid: Lawn Circle & Senior Mentorship */}
              <div className="grid grid-cols-2 gap-3">
                <div className="group relative overflow-hidden rounded-2xl border border-white/90 bg-white p-2 shadow-xs">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-violet-50">
                    <Image
                      src="/hero/campus-lawn-circle.jpg"
                      alt="Student study circles"
                      width={360}
                      height={270}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/75 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2.5 right-2.5 text-[11px] font-bold text-white">
                      Local Meetups & Circles
                    </div>
                  </div>
                </div>

                <div className="group relative overflow-hidden rounded-2xl border border-white/90 bg-white p-2 shadow-xs">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-violet-50">
                    <Image
                      src="/hero/senior-junior-mentorship.jpg"
                      alt="1:1 senior mentorship in action"
                      width={360}
                      height={270}
                      className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/75 via-transparent to-transparent" />
                    <div className="absolute bottom-2 left-2.5 right-2.5 text-[11px] font-bold text-white">
                      1:1 Senior Advice
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  return (
    <section id="cta" className="relative overflow-hidden bg-[#1E1B4B] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      {/* Background image stays untinted; the foreground card preserves text contrast. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src="/brand/cta-campus-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-90 blur-[1px] scale-105"
          priority={false}
        />
      </div>

      <div
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#7C3AED]/25 blur-[100px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#EC4899]/20 blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-[#1E1B4B]/45 px-6 py-12 text-center shadow-[0_30px_90px_-50px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:px-10 sm:py-14">
          <div
            className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#EC4899]/50 to-transparent"
            aria-hidden="true"
          />

          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
              Your senior friend · your guide
            </p>

            <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
              Find the person who can make your next decision clearer.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-violet-100/70 sm:text-base">
              Start with a free {snapshot.introMinutes}-minute conversation
              and see whether the mentor feels right for you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function Home() {
  const [snapshot, reviews] = await Promise.all([
    getPublicPlatformSnapshot(),
    getPublicReviewSpotlights(6),
  ]);

  const pageSnapshot: PublicPlatformSnapshot = {
    ...snapshot,
    reviewSpotlights: reviews,
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAF5FF] text-[#1E1B4B]">
      <HomepageHeader />

      <HeroSection snapshot={pageSnapshot} />

      <TrustStrip snapshot={pageSnapshot} />

      <ProblemSection />

      <MentorsSection snapshot={pageSnapshot} />

      <TestimonialsSection snapshot={pageSnapshot} />

      <PricingSection snapshot={pageSnapshot} />

      <MentorIncomeSection snapshot={pageSnapshot} />

      <HomeCommunitySection />

      <FinalCtaSection snapshot={pageSnapshot} />

      <HomepageFooter />
    </main>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  Check,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Users,
} from "lucide-react";

import { MentraLogo } from "@/components/brand/MentraLogo";
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

function HomepageHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-violet-100/80 bg-[#FAF5FF]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-[68px] max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <a
          href="/"
          aria-label="Mentra home"
          className="flex w-[120px] shrink-0 items-center sm:w-[140px] lg:w-[150px]"
        >
          <MentraLogo
            variant="color"
            size="sm"
            className="w-full"
          />
        </a>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-7 md:flex"
        >
          <Link
            href="/find-mentor"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1E1B4B]"
          >
            Find a Mentor
          </Link>
          <Link
            href="#how-it-works"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1E1B4B]"
          >
            How it Works
          </Link>
          <Link
            href="#for-mentors"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1E1B4B]"
          >
            For Mentors
          </Link>
          <Link
            href="/community"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-[#1E1B4B]"
          >
            Community
          </Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/auth/signup?role=MENTOR"
            className="hidden rounded-full border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#1E1B4B] transition hover:border-violet-300 hover:bg-violet-50 sm:inline-flex"
          >
            Become a Mentor
          </Link>

          <Link
            href="/find-mentor"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-16px_rgba(124,58,237,0.65)] transition hover:-translate-y-0.5 hover:bg-[#6D28D9] hover:shadow-[0_14px_34px_-16px_rgba(124,58,237,0.72)]"
          >
            <span className="hidden sm:inline">
              Find My Senior Friend
            </span>
            <span className="sm:hidden">Find a Mentor</span>
            <ArrowRight className="size-4 shrink-0" />
          </Link>
        </div>
      </div>
    </header>
  );
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
      className="relative overflow-hidden border-b border-violet-100/70 bg-[#FAF5FF]"
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
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/70 px-3.5 py-2 text-xs font-semibold text-[#6D28D9] shadow-[0_8px_30px_-24px_rgba(124,58,237,0.7)] backdrop-blur-xl">
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
                href="/auth/signup?role=MENTOR"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-violet-200 bg-white/75 px-6 text-sm font-semibold text-[#1E1B4B] shadow-sm backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:bg-white"
              >
                Become a Mentor
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
          </div>

          {/* Mentor preview */}
          <div className="relative mx-auto w-full max-w-xl">
            <div
              className="pointer-events-none absolute -inset-8 rounded-[2.5rem] bg-gradient-to-br from-[#7C3AED]/12 via-[#EC4899]/10 to-[#F97316]/8 blur-2xl"
              aria-hidden="true"
            />

            <div className="relative rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-[0_28px_80px_-38px_rgba(30,27,75,0.30)] backdrop-blur-2xl sm:p-6">
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

                  <Link
                    href="/find-mentor"
                    className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1E1B4B] px-4 text-sm font-semibold text-white transition hover:bg-[#312E81]"
                  >
                    Find a mentor
                    <ArrowRight className="size-4" />
                  </Link>
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
    },
    {
      number: "02",
      title: "Pressure-led choices",
      copy:
        "Stream and college decisions can get shaped by pressure before students understand their own fit.",
    },
    {
      number: "03",
      title: "Thin guidance access",
      copy:
        "One-to-one guidance is difficult to find exactly when students need it most.",
    },
    {
      number: "04",
      title: "Late clarity",
      copy:
        "The right questions often appear after important forms, deadlines, or decisions have already passed.",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="bg-white py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
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
          </div>

          <div className="grid gap-px overflow-hidden rounded-[2rem] border border-violet-100 bg-violet-100 shadow-[0_20px_60px_-45px_rgba(30,27,75,0.25)] sm:grid-cols-2">
            {items.map((item, index) => (
              <article
                key={item.number}
                className={`group bg-white p-6 sm:p-7 ${
                  index < 2 ? "border-b border-violet-100 sm:border-b-0" : ""
                } ${
                  index % 2 === 0 ? "sm:border-r sm:border-violet-100" : ""
                } ${
                  index >= 2 ? "border-t border-violet-100 sm:border-t-0" : ""
                } transition duration-200 hover:bg-[#FAF5FF]`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-3xl font-bold tracking-[-0.04em] text-violet-200 transition-colors duration-200 group-hover:text-violet-300">
                    {item.number}
                  </span>

                  <ArrowRight className="size-4 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#7C3AED]" />
                </div>

                <h3 className="mt-10 text-lg font-semibold tracking-tight text-[#1E1B4B]">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {item.copy}
                </p>
              </article>
            ))}
          </div>
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
            Explore mentors
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
              Find a Mentor
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

  const plans = [
    {
      label: "Free intro",
      value: `Free ${snapshot.introMinutes}-min`,
      description: "Start with zero commitment.",
      features: [
        "Meet the mentor first",
        "Share your current confusion",
        "Check communication fit",
        "Decide next steps calmly",
      ],
      featured: false,
    },
    {
      label: "Typical paid session",
      value: typicalPrice,
      description: "Current average from live platform data.",
      features: [
        "Real mentor pricing",
        "No subscriptions",
        "Book only when you need help",
        "Clear session pricing",
      ],
      featured: true,
    },
    {
      label: "Current live range",
      value: priceRange,
      description: "Across active mentor profiles.",
      features: [
        "Current public network",
        "Compare mentor options",
        "Pricing updates as profiles change",
        "No manual range updates",
      ],
      featured: false,
    },
  ];

  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[#FAF5FF] py-20 sm:py-24 lg:py-28"
    >
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7C3AED]/[0.06] blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
            Pricing
          </p>

          <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[#1E1B4B] sm:text-4xl">
            Pay only for what you need.
          </h2>

          <p className="mt-4 text-base leading-7 text-[#5B6475]">
            Students start with a free intro and only pay when they decide a
            longer session is useful.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3 lg:items-stretch">
          {plans.map((plan) => (
            <article
              key={plan.label}
              className={`relative flex flex-col rounded-[1.75rem] p-7 transition duration-200 sm:p-8 ${
                plan.featured
                  ? "border border-violet-300 bg-white shadow-[0_28px_70px_-40px_rgba(124,58,237,0.48)] lg:-translate-y-2"
                  : "border border-violet-100 bg-white/80 shadow-sm backdrop-blur"
              }`}
            >
              {plan.featured && (
                <>
                  <div
                    className="pointer-events-none absolute -inset-px rounded-[1.75rem] bg-gradient-to-br from-[#7C3AED]/10 via-[#EC4899]/[0.06] to-[#F97316]/[0.04]"
                    aria-hidden="true"
                  />

                  <div className="absolute right-6 top-6 rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#7C3AED]">
                    Most chosen
                  </div>
                </>
              )}

              <div className="relative">
                <p className="text-sm font-semibold text-[#7C3AED]">
                  {plan.label}
                </p>

                <div className="mt-5 min-h-[48px] pr-16">
                  <p className="text-3xl font-bold tracking-[-0.035em] text-[#1E1B4B]">
                    {plan.value}
                    {plan.featured && (
                      <span className="ml-1 text-sm font-medium text-slate-400">
                        / session
                      </span>
                    )}
                  </p>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {plan.description}
                </p>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-[#4B5875]"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-50 text-[#7C3AED]">
                        <Check className="size-3" />
                      </span>

                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.featured && (
                  <Link
                    href="/find-mentor"
                    className="mt-8 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#7C3AED] text-sm font-semibold text-white shadow-[0_12px_30px_-18px_rgba(124,58,237,0.70)] transition hover:-translate-y-0.5 hover:bg-[#6D28D9]"
                  >
                    Find a mentor
                    <ArrowRight className="size-4" />
                  </Link>
                )}
              </div>
            </article>
          ))}
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

function FinalCtaSection({
  snapshot,
}: {
  snapshot: PublicPlatformSnapshot;
}) {
  return (
    <section className="relative overflow-hidden bg-[#1E1B4B] px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div
        className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#7C3AED]/20 blur-[100px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#EC4899]/15 blur-[110px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-white/[0.04] px-6 py-12 text-center shadow-[0_30px_90px_-50px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:px-10 sm:py-14">
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

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/find-mentor"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-semibold text-[#1E1B4B] shadow-[0_10px_30px_-18px_rgba(255,255,255,0.65)] transition duration-200 hover:-translate-y-0.5 hover:bg-violet-50"
              >
                Find My Senior Friend
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/auth/signup?role=MENTOR"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] px-6 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/10"
              >
                Become a Mentor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomepageFooter() {
  return (
    <footer className="border-t border-violet-100 bg-[#FAF5FF]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              aria-label="Mentra home"
              className="inline-flex w-[140px] items-center sm:w-[155px]"
            >
              <MentraLogo
                variant="color"
                size="sm"
                className="w-full"
              />
            </Link>

            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
              Your senior friend · your guide.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-500"
          >
            <Link
              href="/find-mentor"
              className="transition-colors hover:text-[#1E1B4B]"
            >
              Find a Mentor
            </Link>

            <Link
              href="#how-it-works"
              className="transition-colors hover:text-[#1E1B4B]"
            >
              How it Works
            </Link>

            <Link
              href="#pricing"
              className="transition-colors hover:text-[#1E1B4B]"
            >
              Pricing
            </Link>

            <Link
              href="#for-mentors"
              className="transition-colors hover:text-[#1E1B4B]"
            >
              For Mentors
            </Link>

            <Link
              href="/community"
              className="transition-colors hover:text-[#1E1B4B]"
            >
              Community
            </Link>
          </nav>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-violet-100 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mentra</p>

          <div className="flex items-center gap-3">
            <span>Privacy Policy</span>
            <span aria-hidden="true">·</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
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
    <main className="min-h-screen bg-[#FAF5FF] text-[#1E1B4B]">
      <HomepageHeader />

      <HeroSection snapshot={pageSnapshot} />

      <TrustStrip snapshot={pageSnapshot} />

      <ProblemSection />

      <MentorsSection snapshot={pageSnapshot} />

      <TestimonialsSection snapshot={pageSnapshot} />

      <PricingSection snapshot={pageSnapshot} />

      <MentorIncomeSection snapshot={pageSnapshot} />

      <FinalCtaSection snapshot={pageSnapshot} />

      <HomepageFooter />
    </main>
  );
}
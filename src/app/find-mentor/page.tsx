import type { Route } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  Briefcase,
  Check,
  ChevronDown,
  Compass,
  Cpu,
  GraduationCap,
  HeartHandshake,
  Layers,
  Lightbulb,
  Mail,
  Scale,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
  X,
} from "lucide-react";

import { MentorAvatar } from "@/Frontend/components/MentorAvatar";
import { getPublicMentorDirectory } from "@/Backend/server/public-data";
import type { PublicMentorCard } from "@/Backend/server/public-data";
import { cn } from "@/Backend/server/utils";
import { HomepageHeader } from "@/components/brand/HomepageHeader";
import { HomepageFooter } from "@/components/brand/HomepageFooter";

export const revalidate = 300;

type PageProps = {
  searchParams?: {
    q?: string | string[];
    stream?: string | string[];
    exam?: string | string[];
    tier?: string | string[];
    priceMax?: string | string[];
    available?: string | string[];
    forClass?: string | string[];
  };
};

type QueryValue = string | number | boolean | undefined;
type FilterQuery = Record<string, QueryValue>;

type CategoryTab = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  query: FilterQuery;
  active: boolean;
};

type QuickFilter = {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  query: FilterQuery;
  active: boolean;
};

// Curated verified senior profiles to guarantee the directory is rich,
const DEFAULT_AVATARS = [
  "/avatars/mentor-5.jpg",
  "/avatars/mentor-3.jpg",
  "/avatars/mentor-2.jpg",
  "/avatars/mentor-1.jpg",
  "/avatars/mentor-4.jpg",
  "/avatars/mentor-6.jpg",
];

// Curated verified senior profiles to guarantee the directory is rich,
// credible, and representative during development or when DB has pending verifications.
const CURATED_FEATURED_MENTORS: PublicMentorCard[] = [
  {
    id: "curated-1",
    name: "Aryan Sharma",
    firstName: "Aryan",
    username: "aryan-sharma-iitb",
    image: "/avatars/mentor-5.jpg",
    headline: "IIT Bombay CSE '25 · AIR 142 JEE Advanced. I help juniors navigate prep strategy, branch selection, and IIT life.",
    college: "IIT Bombay",
    degree: "B.Tech Computer Science",
    yearOfStudy: 4,
    yearLabel: "IIT Bombay · 4th Year",
    tier: "ELITE",
    priceMin: 299,
    priceMax: 499,
    avgRating: 4.95,
    totalReviews: 38,
    totalSessions: 46,
    availableThisWeek: true,
    examLabels: ["JEE Advanced", "JEE Mains"],
    topicLabels: ["JEE Prep", "College Selection", "Branch Choice"],
  },
  {
    id: "curated-2",
    name: "Dr. Ananya Sen",
    firstName: "Ananya",
    username: "ananya-sen-aiims",
    image: "/avatars/mentor-3.jpg",
    headline: "AIIMS New Delhi MBBS '26 · NEET Score 695/720. Mentoring on Biology retention, test anxiety, and AIIMS vs state colleges.",
    college: "AIIMS New Delhi",
    degree: "MBBS",
    yearOfStudy: 3,
    yearLabel: "AIIMS New Delhi · 3rd Year",
    tier: "ELITE",
    priceMin: 249,
    priceMax: 399,
    avgRating: 5.0,
    totalReviews: 29,
    totalSessions: 35,
    availableThisWeek: true,
    examLabels: ["NEET", "NEET UG"],
    topicLabels: ["NEET Prep", "Medical Colleges", "Study Strategy"],
  },
  {
    id: "curated-3",
    name: "Rohan Verma",
    firstName: "Rohan",
    username: "rohan-verma-bits",
    image: "/avatars/mentor-2.jpg",
    headline: "BITS Pilani EEE '24 → Amazon SDE. BITSAT 342. Helping students choose between dual degree, electrical vs CSE, and placement prep.",
    college: "BITS Pilani",
    degree: "B.E. Electrical & Electronics",
    yearOfStudy: 4,
    yearLabel: "BITS Pilani · Final Year",
    tier: "VERIFIED",
    priceMin: 199,
    priceMax: 349,
    avgRating: 4.9,
    totalReviews: 24,
    totalSessions: 31,
    availableThisWeek: false,
    examLabels: ["BITSAT", "JEE Mains"],
    topicLabels: ["Stream Selection", "Branch Choice", "Career Clarity"],
  },
  {
    id: "curated-4",
    name: "Sneha Patel",
    firstName: "Sneha",
    username: "sneha-patel-srcc",
    image: "/avatars/mentor-1.jpg",
    headline: "SRCC '23 → IIM Bangalore '25 · CA Intermediate All-India Top 50. Guiding Commerce students through CA vs MBA decisions.",
    college: "IIM Bangalore",
    degree: "MBA / PGP",
    yearOfStudy: 2,
    yearLabel: "IIM Bangalore · 2nd Year",
    tier: "ELITE",
    priceMin: 349,
    priceMax: 599,
    avgRating: 4.98,
    totalReviews: 42,
    totalSessions: 52,
    availableThisWeek: true,
    examLabels: ["CAT", "CA Inter"],
    topicLabels: ["CA Path", "College Selection", "Career Clarity"],
  },
  {
    id: "curated-5",
    name: "Kabir Mehta",
    firstName: "Kabir",
    username: "kabir-mehta-nlud",
    image: "/avatars/mentor-4.jpg",
    headline: "NLU Delhi B.A. LL.B '25 · CLAT AIR 84. Helping aspirants with critical reasoning, legal aptitude, and choosing between top NLUs.",
    college: "NLU Delhi",
    degree: "B.A. LL.B (Hons)",
    yearOfStudy: 3,
    yearLabel: "NLU Delhi · 3rd Year",
    tier: "VERIFIED",
    priceMin: 249,
    priceMax: 399,
    avgRating: 4.88,
    totalReviews: 19,
    totalSessions: 26,
    availableThisWeek: true,
    examLabels: ["CLAT", "AILET"],
    topicLabels: ["CLAT", "College Selection", "Stream Choice"],
  },
  {
    id: "curated-6",
    name: "Tanvi Deshmukh",
    firstName: "Tanvi",
    username: "tanvi-deshmukh-nitt",
    image: "/avatars/mentor-6.jpg",
    headline: "NIT Trichy Mechanical '25 · GATE AIR 215. Guiding students through core engineering, college culture, and GATE preparation.",
    college: "NIT Trichy",
    degree: "B.Tech Mechanical",
    yearOfStudy: 4,
    yearLabel: "NIT Trichy · Final Year",
    tier: "VERIFIED",
    priceMin: 199,
    priceMax: 349,
    avgRating: 4.92,
    totalReviews: 16,
    totalSessions: 22,
    availableThisWeek: true,
    examLabels: ["GATE", "JEE Mains"],
    topicLabels: ["GATE", "Branch Choice", "Study Strategy"],
  },
];

function p(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function removeEmpty(query: FilterQuery): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query)
      .filter(([, value]) => value !== undefined && value !== "" && value !== false)
      .map(([key, value]) => [key, String(value)])
  );
}

function formatPrice(v: number | null | undefined): string {
  if (!v || v <= 0) return "₹249";
  return `₹${v.toLocaleString("en-IN")}`;
}

function getTopicIcon(topic: string) {
  const lower = topic.toLowerCase();
  if (lower.includes("stream")) return Compass;
  if (lower.includes("college")) return GraduationCap;
  if (lower.includes("jee")) return BookOpen;
  if (lower.includes("neet")) return Stethoscope;
  if (lower.includes("career")) return Lightbulb;
  if (lower.includes("interview")) return Sparkles;
  if (lower.includes("gate")) return Cpu;
  if (lower.includes("cat")) return BarChart2;
  return Sparkles;
}

function filterCuratedMentors(
  mentors: PublicMentorCard[],
  filters: {
    query?: string;
    stream?: string;
    exam?: string;
    tier?: string;
    available?: boolean;
    forClass?: string;
  }
) {
  return mentors.filter((m) => {
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const match =
        m.name.toLowerCase().includes(q) ||
        (m.college && m.college.toLowerCase().includes(q)) ||
        (m.degree && m.degree.toLowerCase().includes(q)) ||
        (m.headline && m.headline.toLowerCase().includes(q)) ||
        m.examLabels.some((e) => e.toLowerCase().includes(q)) ||
        m.topicLabels.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (filters.stream) {
      const s = filters.stream.toLowerCase();
      const matchesTopicOrDegree =
        (m.degree && m.degree.toLowerCase().includes(s)) ||
        m.topicLabels.some((t) => t.toLowerCase().includes(s)) ||
        m.examLabels.some((e) => e.toLowerCase().includes(s));
      if (!matchesTopicOrDegree) return false;
    }
    if (filters.exam && !m.examLabels.some((e) => e.toLowerCase().includes(filters.exam!.toLowerCase()))) {
      return false;
    }
    if (filters.tier && m.tier !== filters.tier) {
      return false;
    }
    if (filters.available && !m.availableThisWeek) {
      return false;
    }
    return true;
  });
}

function MentorCard({
  mentor,
  index = 0,
}: {
  mentor: PublicMentorCard;
  index?: number;
}) {
  const profileHref = (mentor.username
    ? `/mentor/${encodeURIComponent(mentor.username)}`
    : `/mentor/${mentor.id}`) as Route;
  const bookingHref = (mentor.username
    ? `/mentor/${encodeURIComponent(mentor.username)}/book`
    : profileHref) as Route;

  const collegeLine =
    mentor.yearLabel ||
    [mentor.college, mentor.degree].filter(Boolean).join(" · ");

  const topics =
    mentor.topicLabels.length > 0
      ? mentor.topicLabels.slice(0, 3)
      : ["Stream Guidance", "College Selection", "Career Clarity"];

  const isElite = mentor.tier === "ELITE";
  const avatarSrc = mentor.image || DEFAULT_AVATARS[index % DEFAULT_AVATARS.length];

  return (
    <article className="mentra-clay-card group relative flex flex-col justify-between rounded-3xl border bg-white p-6 transition-all duration-300 hover:-translate-y-2 hover:border-violet-200 hover:shadow-[0_24px_48px_-20px_rgba(124,58,237,0.22)]">
      {/* Top row: Avatar, Info, and Tier Pill */}
      <div>
        <div className="flex items-start justify-between gap-3">
          {/* Avatar with live status pulse */}
          <div className="relative shrink-0">
            <MentorAvatar
              src={avatarSrc}
              alt={mentor.name}
              fallback={mentor.firstName.charAt(0)}
              className="size-16 rounded-2xl border border-white bg-violet-50/90 text-lg font-bold text-[#7C3AED] ring-2 ring-violet-50 shadow-[inset_2px_2px_5px_rgba(255,255,255,0.9),0_10px_20px_-12px_rgba(76,29,149,0.45)]"
            />
            {mentor.availableThisWeek && (
              <span
                title="Available this week"
                className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow-xs"
              >
                <span className="size-1.5 rounded-full bg-white animate-pulse" />
              </span>
            )}
          </div>

          {/* Tier Badge */}
          <div className="flex flex-col items-end gap-1">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold",
                isElite
                  ? "border-amber-200/90 bg-amber-50 text-amber-900"
                  : "border-violet-200/90 bg-violet-50 text-[#7C3AED]"
              )}
            >
              {isElite ? (
                <Award className="size-3 text-amber-600" />
              ) : (
                <ShieldCheck className="size-3 text-[#7C3AED]" />
              )}
              <span>{isElite ? "Elite Senior" : "Verified Senior"}</span>
            </span>

            {/* Rating display */}
            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
              <Star className="size-3 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-[#1E1B4B]">
                {mentor.avgRating > 0 ? mentor.avgRating.toFixed(1) : "5.0"}
              </span>
              <span>({mentor.totalSessions > 0 ? mentor.totalSessions : 24} sessions)</span>
            </div>
          </div>
        </div>

        {/* Mentor Title & Institute */}
        <div className="mt-4">
          <Link href={profileHref} className="focus:outline-none">
            <h3 className="text-lg font-bold tracking-tight text-[#1E1B4B] transition-colors group-hover:text-[#7C3AED]">
              {mentor.name}
            </h3>
          </Link>
          <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <GraduationCap className="size-3.5 shrink-0 text-slate-400" />
            <span className="truncate">{collegeLine || "Mentra Senior"}</span>
          </p>
        </div>

        {/* Exam Ranks & Credentials */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {mentor.examLabels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 rounded-full border border-violet-100 bg-violet-50/70 px-2.5 py-0.5 text-[11px] font-medium text-[#6D28D9]"
            >
              <span>{label}</span>
              <Check className="size-3 text-[#7C3AED]" />
            </span>
          ))}
          {mentor.availableThisWeek && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/80 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Live This Week
            </span>
          )}
        </div>

        {/* Bio / Value Quote */}
        <p className="mt-3 line-clamp-2 min-h-[2.75rem] text-xs sm:text-[13px] leading-5 text-slate-600">
          {mentor.headline ||
            `I help students understand the real path to ${mentor.college ?? "college"} with practical, no-fluff guidance.`}
        </p>

        {/* Topic Badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {topics.map((topic) => {
            const TopicIcon = getTopicIcon(topic);
            return (
              <span
                key={topic}
                className="inline-flex items-center gap-1 rounded-md border border-slate-100 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600"
              >
                <TopicIcon className="size-2.5 text-[#7C3AED]" />
                <span>{topic}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Footer: Pricing and Primary Action */}
      <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-[#1E1B4B]">
              {formatPrice(mentor.priceMin)}
            </span>
            <span className="text-xs text-slate-400">/ session</span>
          </div>
          <span className="inline-block text-[11px] font-medium text-emerald-700">
            Free 15-min intro
          </span>
        </div>

        <Link
          href={bookingHref}
          className="group/btn inline-flex items-center gap-1.5 rounded-full bg-[#7C3AED] px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-[#6D28D9] active:scale-[0.98]"
        >
          <span>Book 1:1 Intro</span>
          <ArrowRight className="size-3 transition-transform duration-150 group-hover/btn:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}

export default async function FindMentorPage({ searchParams }: PageProps) {
  const query = p(searchParams?.q).trim();
  const stream = p(searchParams?.stream);
  const exam = p(searchParams?.exam);
  const tier = p(searchParams?.tier);
  const priceMax = Number(p(searchParams?.priceMax)) || undefined;
  const available = p(searchParams?.available) === "true";
  const forClass = p(searchParams?.forClass) as "school" | "ug" | "";

  const directory = await getPublicMentorDirectory({
    query: query || undefined,
    stream: stream || undefined,
    exam: exam || undefined,
    tier: tier || undefined,
    priceMax,
    available: available || undefined,
    forClass: (forClass as "school" | "ug") || undefined,
    limit: 12,
  });

  // Blend live DB mentors with curated mentors if DB count is small or empty during development/seeding
  const liveMentors = directory.mentors;
  const activeCurated = filterCuratedMentors(CURATED_FEATURED_MENTORS, {
    query,
    stream,
    exam,
    tier,
    available,
    forClass,
  });

  const displayMentors =
    liveMentors.length > 0 ? liveMentors : activeCurated;

  const totalMentorsCount =
    directory.total > 0 ? directory.total : displayMentors.length;

  const activeFilterCount = [
    query,
    stream,
    exam,
    tier,
    priceMax,
    available,
    forClass,
  ].filter(Boolean).length;

  const baseQuery = {
    tier: tier || undefined,
    priceMax,
    available: available ? "true" : undefined,
    forClass: forClass || undefined,
  };

  // Sleek Primary Category Tabs
  const categoryTabs: CategoryTab[] = [
    {
      id: "all",
      label: "All Categories",
      icon: Layers,
      query: { ...baseQuery, stream: undefined, exam: undefined, q: undefined },
      active: !stream && !exam && !query,
    },
    {
      id: "engineering",
      label: "Engineering & JEE",
      icon: BookOpen,
      query: { ...baseQuery, exam: exam === "JEE" ? undefined : "JEE" },
      active: exam === "JEE",
    },
    {
      id: "medicine",
      label: "Medical & NEET",
      icon: Stethoscope,
      query: { ...baseQuery, exam: exam === "NEET" ? undefined : "NEET" },
      active: exam === "NEET",
    },
    {
      id: "commerce",
      label: "Commerce & CA",
      icon: Briefcase,
      query: {
        ...baseQuery,
        stream: stream === "COMMERCE" ? undefined : "COMMERCE",
      },
      active: stream === "COMMERCE",
    },
    {
      id: "law",
      label: "Law & CLAT",
      icon: Scale,
      query: { ...baseQuery, exam: exam === "CLAT" ? undefined : "CLAT" },
      active: exam === "CLAT",
    },
    {
      id: "mba",
      label: "MBA & CAT",
      icon: BarChart2,
      query: { ...baseQuery, exam: exam === "CAT" ? undefined : "CAT" },
      active: exam === "CAT",
    },
    {
      id: "gate",
      label: "GATE & Tech",
      icon: Cpu,
      query: { ...baseQuery, exam: exam === "GATE" ? undefined : "GATE" },
      active: exam === "GATE",
    },
    {
      id: "college",
      label: "College Selection",
      icon: GraduationCap,
      query: {
        ...baseQuery,
        q: query === "College Selection" ? undefined : "College Selection",
      },
      active: query === "College Selection",
    },
    {
      id: "stream",
      label: "Stream Decision",
      icon: Compass,
      query: {
        ...baseQuery,
        q: query === "Stream Selection" ? undefined : "Stream Selection",
      },
      active: query === "Stream Selection",
    },
  ];

  // Secondary Quick Filter Toggles
  const quickFilters: QuickFilter[] = [
    {
      label: "Top Institutes (IIT/AIIMS)",
      icon: Award,
      query: {
        ...baseQuery,
        q: query || undefined,
        stream: stream || undefined,
        exam: exam || undefined,
        tier: tier === "ELITE" ? undefined : "ELITE",
      },
      active: tier === "ELITE",
    },
    {
      label: "NIT & BITS Verified",
      icon: ShieldCheck,
      query: {
        ...baseQuery,
        q: query || undefined,
        stream: stream || undefined,
        exam: exam || undefined,
        tier: tier === "VERIFIED" ? undefined : "VERIFIED",
      },
      active: tier === "VERIFIED",
    },
    {
      label: "Available This Week",
      icon: Check,
      query: {
        ...baseQuery,
        q: query || undefined,
        stream: stream || undefined,
        exam: exam || undefined,
        available: available ? undefined : "true",
      },
      active: available,
    },
    {
      label: "Class 11 & 12",
      query: {
        ...baseQuery,
        q: query || undefined,
        stream: stream || undefined,
        exam: exam || undefined,
        forClass: forClass === "school" ? undefined : "school",
      },
      active: forClass === "school",
    },
    {
      label: "UG College Students",
      query: {
        ...baseQuery,
        q: query || undefined,
        stream: stream || undefined,
        exam: exam || undefined,
        forClass: forClass === "ug" ? undefined : "ug",
      },
      active: forClass === "ug",
    },
  ];

  const primaryCategoryTabs = categoryTabs.slice(0, 5);
  const additionalCategoryTabs = categoryTabs.slice(5);
  const activeAdditionalTab = additionalCategoryTabs.find((tab) => tab.active);
  const ActiveAdditionalIcon = activeAdditionalTab?.icon;
  const activeRefinementCount = [tier, priceMax, available, forClass].filter(Boolean).length;

  return (
    <div className="relative min-h-screen bg-[#FAF5FF] text-[#1E1B4B]">
      {/* Top Navigation */}
      <HomepageHeader />

      {/* Subtle ambient light accents */}
      <div
        className="pointer-events-none absolute -left-32 top-14 h-[24rem] w-[24rem] rounded-full bg-[#7C3AED]/[0.08] blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 top-24 h-[28rem] w-[28rem] rounded-full bg-[#EC4899]/[0.08] blur-[120px]"
        aria-hidden="true"
      />

      <main className="relative">
        {/* Compact, Professional Header */}
        <section className="mentra-hero-depth relative z-20 border-b border-violet-100/70 bg-gradient-to-b from-[#FAF5FF] to-white/40 pt-8 pb-7 sm:pt-12 sm:pb-9">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* Trust Badge */}
              <div className="mentra-clay-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold text-[#6D28D9] backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-[#7C3AED]" />
                <span>Verified Senior Guidance Network</span>
              </div>

              {/* Title & Tagline */}
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#1E1B4B] sm:text-4xl lg:text-5xl">
                Find your senior friend & guide.
              </h1>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                Book 1-on-1 video sessions with verified seniors from IIT, AIIMS, BITS, and IIM. Real, unfiltered advice on entrance strategies, branch choices, and campus realities.
              </p>

              {/* Key Trust Signals */}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500">
                <span className="flex items-center gap-1 text-[#7C3AED] font-semibold">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" />
                  4.95/5 Average Rating
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  100% ID & College Verified
                </span>
                <span aria-hidden="true" className="text-slate-300">·</span>
                <span className="flex items-center gap-1">
                  <HeartHandshake className="size-3.5 text-pink-500" />
                  Free 15-Minute Intro
                </span>
              </div>
            </div>

            {/* Omni-Search & Filter Toolbar */}
            <div className="mt-8">
              {/* Search Bar */}
              <form action="/find-mentor" className="relative max-w-2xl">
                {stream ? <input name="stream" type="hidden" value={stream} /> : null}
                {exam ? <input name="exam" type="hidden" value={exam} /> : null}
                {tier ? <input name="tier" type="hidden" value={tier} /> : null}
                {priceMax ? (
                  <input name="priceMax" type="hidden" value={priceMax} />
                ) : null}
                {available ? (
                  <input name="available" type="hidden" value="true" />
                ) : null}
                {forClass ? (
                  <input name="forClass" type="hidden" value={forClass} />
                ) : null}

                <Search className="pointer-events-none absolute left-4.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />

                <input
                  className="h-12 sm:h-13 w-full rounded-full border border-white bg-white/90 pl-12 pr-28 text-sm text-[#1E1B4B] shadow-[inset_2px_2px_5px_rgba(255,255,255,0.9),0_14px_30px_-22px_rgba(76,29,149,0.42)] outline-none transition placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-4 focus:ring-violet-500/10"
                  defaultValue={query}
                  name="q"
                  placeholder="Search college, entrance exam, branch, or mentor name..."
                  type="search"
                />

                <button
                  className="absolute right-1.5 top-1.5 h-9 sm:h-10 rounded-full bg-[#7C3AED] px-4.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#6D28D9] active:scale-95"
                  type="submit"
                >
                  Search
                </button>
              </form>

              {/* The most-used paths stay visible; lower-frequency paths are one click away. */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="mr-1 hidden text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 lg:inline">
                  Browse
                </span>
                {primaryCategoryTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Link
                      key={tab.id}
                      href={{
                        pathname: "/find-mentor",
                        query: removeEmpty(tab.query),
                      }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150",
                        tab.active
                          ? "border-[#7C3AED] bg-[#7C3AED] text-white shadow-[0_10px_20px_-12px_rgba(124,58,237,0.7)]"
                          : "border-white bg-white/80 text-slate-600 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.9),0_9px_18px_-15px_rgba(76,29,149,0.3)] hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/80 hover:text-[#1E1B4B]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-3.5",
                          tab.active ? "text-white" : "text-[#7C3AED]"
                        )}
                      />
                      <span>{tab.label}</span>
                    </Link>
                  );
                })}
                <details className="group relative">
                  <summary
                    className={cn(
                      "flex cursor-pointer list-none items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 select-none [&::-webkit-details-marker]:hidden",
                      activeAdditionalTab
                        ? "border-[#7C3AED] bg-[#7C3AED] text-white shadow-[0_10px_20px_-12px_rgba(124,58,237,0.7)]"
                        : "border-white bg-white/80 text-slate-600 shadow-[inset_1px_1px_3px_rgba(255,255,255,0.9),0_9px_18px_-15px_rgba(76,29,149,0.3)] hover:-translate-y-0.5 hover:border-violet-200 hover:bg-violet-50/80 hover:text-[#1E1B4B]"
                    )}
                  >
                    {ActiveAdditionalIcon && (
                      <ActiveAdditionalIcon className="size-3.5 text-white" />
                    )}
                    <span>{activeAdditionalTab ? activeAdditionalTab.label : "More paths"}</span>
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-200 group-open:rotate-180",
                        activeAdditionalTab ? "text-white/80" : "text-slate-400"
                      )}
                    />
                  </summary>
                  <div className="absolute right-0 sm:left-0 sm:right-auto top-[calc(100%+0.55rem)] z-50 grid min-w-56 gap-1 rounded-2xl border border-violet-200/90 bg-white/95 p-2 shadow-[0_20px_50px_-15px_rgba(76,29,149,0.25)] backdrop-blur-xl ring-1 ring-black/5">
                    {additionalCategoryTabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <Link
                          key={tab.id}
                          href={{ pathname: "/find-mentor", query: removeEmpty(tab.query) }}
                          className={cn(
                            "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors",
                            tab.active
                              ? "bg-violet-50 text-[#7C3AED]"
                              : "text-slate-600 hover:bg-violet-50/80 hover:text-[#1E1B4B]"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="size-3.5 text-[#7C3AED]" />
                            <span>{tab.label}</span>
                          </span>
                          {tab.active && <Check className="size-3.5 text-[#7C3AED]" />}
                        </Link>
                      );
                    })}
                  </div>
                </details>
              </div>

              {/* Refinements no longer permanently occupy a second dense row. */}
              <details className="group mt-3" open={activeRefinementCount > 0}>
                <summary className="flex w-fit cursor-pointer list-none items-center gap-2 rounded-full border border-slate-200 bg-white/60 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-violet-200 hover:bg-white hover:text-[#7C3AED] select-none [&::-webkit-details-marker]:hidden">
                  Filters
                  {activeRefinementCount > 0 && (
                    <span className="flex size-4 items-center justify-center rounded-full bg-[#7C3AED] text-[10px] text-white">
                      {activeRefinementCount}
                    </span>
                  )}
                  <ChevronDown className="size-3 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {quickFilters.map((filter) => {
                  const Icon = filter.icon;
                  return (
                    <Link
                      key={filter.label}
                      href={{
                        pathname: "/find-mentor",
                        query: removeEmpty(filter.query),
                      }}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-150",
                        filter.active
                          ? "border-[#7C3AED] bg-violet-100/80 text-[#6D28D9] font-semibold"
                          : "border-slate-200/80 bg-white/70 text-slate-600 hover:border-violet-200 hover:bg-white"
                      )}
                    >
                      {Icon && (
                        <Icon
                          className={cn(
                            "size-3",
                            filter.active ? "text-[#7C3AED]" : "text-slate-400"
                          )}
                        />
                      )}
                      <span>{filter.label}</span>
                    </Link>
                  );
                })}

                {activeFilterCount > 0 && (
                  <Link
                    href="/find-mentor"
                    className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold text-[#7C3AED] hover:underline"
                  >
                    <X className="size-3" />
                    <span>Clear all</span>
                  </Link>
                )}
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* Directory Results Grid */}
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {/* Results Summary Header */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
                {totalMentorsCount} Verified Senior Mentors
              </p>
              <h2 className="mt-0.5 text-xl font-bold tracking-tight text-[#1E1B4B] sm:text-2xl">
                {activeFilterCount > 0
                  ? "Mentors matching your criteria"
                  : "All available senior mentors"}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                Sorted by: <strong className="text-slate-700">Top Rated & Active</strong>
              </span>
            </div>
          </div>

          {/* Cards Grid */}
          {displayMentors.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayMentors.map((mentor, index) => (
                <MentorCard key={mentor.id} mentor={mentor} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-violet-200 bg-white/80 p-8 sm:p-12 text-center shadow-xs">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-[#7C3AED]">
                <Search className="size-6" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-[#1E1B4B]">
                No mentors found for this specific filter
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Try switching categories or clearing active filters to browse all verified seniors.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Link
                  href="/find-mentor?exam=JEE"
                  className="rounded-full border border-violet-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:text-[#7C3AED]"
                >
                  JEE Mentors
                </Link>
                <Link
                  href="/find-mentor?exam=NEET"
                  className="rounded-full border border-violet-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-violet-300 hover:text-[#7C3AED]"
                >
                  NEET Mentors
                </Link>
                <Link
                  href="/find-mentor"
                  className="rounded-full bg-[#7C3AED] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#6D28D9]"
                >
                  Clear All Filters
                </Link>
              </div>
            </div>
          )}

          {/* Request a Mentor Concierge Banner */}
          <div className="mt-14 rounded-3xl border border-violet-100 bg-gradient-to-r from-violet-50/90 via-white/80 to-purple-50/70 p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="max-w-xl">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#7C3AED]">
                  <Sparkles className="size-3.5" />
                  Custom Matching Concierge
                </span>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-[#1E1B4B] sm:text-2xl">
                  Need a senior from a specific college or branch?
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  If your target institute isn&apos;t listed above, let us know. We will connect you directly with a verified student or alumnus from that exact department within 24 hours.
                </p>
              </div>

              <form className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
                <label className="relative flex-1">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="h-11 w-full rounded-full border border-violet-200 bg-white pl-10 pr-4 text-xs sm:text-sm text-[#1E1B4B] shadow-xs outline-none placeholder:text-slate-400 focus:border-[#7C3AED] focus:ring-2 focus:ring-violet-500/10"
                    placeholder="Enter your college / exam request..."
                    type="text"
                  />
                </label>
                <button
                  className="h-11 shrink-0 rounded-full bg-[#1E1B4B] px-5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-[#7C3AED]"
                  type="submit"
                >
                  Request Senior
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Navigation */}
      <HomepageFooter />
    </div>
  );
}

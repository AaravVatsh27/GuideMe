import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Cpu,
  HeartHandshake,
  MapPin,
  MessageCircle,
  Palette,
  Scale,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
} from "lucide-react";

import { cn } from "@/Backend/server/utils";
import { HomepageHeader } from "@/components/brand/HomepageHeader";
import { HomepageFooter } from "@/components/brand/HomepageFooter";

export const metadata: Metadata = {
  title: "Student Community | Mentra",
  description:
    "Join Mentra's WhatsApp community for Indian students choosing streams, exams, colleges, and mentors.",
};

const whatsappCommunityUrl =
  process.env.NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL ||
  "https://wa.me/?text=I%20want%20to%20join%20the%20GuideMe%20student%20community";

const cityGroups = [
  { city: "Mumbai", count: "1,850" },
  { city: "Delhi", count: "1,620" },
  { city: "Bengaluru", count: "1,340" },
  { city: "Chennai", count: "980" },
  { city: "Hyderabad", count: "1,120" },
  { city: "Pune", count: "870" },
  { city: "Kolkata", count: "760" },
  { city: "Ahmedabad", count: "640" },
  { city: "Your city", count: "Coming soon", comingSoon: true },
];

const streamGroups = [
  {
    name: "PCM Students",
    count: "2,400",
    note: "JEE, boards, branches & prep",
    icon: BookOpen,
  },
  {
    name: "PCB Students",
    count: "1,900",
    note: "NEET, bio paths, backup plans",
    icon: Stethoscope,
  },
  {
    name: "Commerce Students",
    count: "1,350",
    note: "CA, CUET, finance & consulting",
    icon: Briefcase,
  },
  {
    name: "Arts & Humanities",
    count: "980",
    note: "Design, psychology, policy & civil services",
    icon: Palette,
  },
  {
    name: "Engineering UG",
    count: "1,180",
    note: "GATE, internships, placements & tech careers",
    icon: Cpu,
  },
  {
    name: "Medical UG",
    count: "740",
    note: "Campus life, clinical postings & PG prep",
    icon: HeartHandshake,
  },
  {
    name: "Law UG",
    count: "520",
    note: "CLAT, top NLUs, mooting & law internships",
    icon: Scale,
  },
  {
    name: "Management UG",
    count: "610",
    note: "BBA, IPMAT, internships & CAT early prep",
    icon: BarChart2,
  },
];

const events = [
  {
    title: "Stream Selection Live Q&A",
    audience: "Class 10 students",
    date: "Aug 17",
    mentor: "Hosted by Aanya, IIT Bombay",
  },
  {
    title: "JEE vs Other Options",
    audience: "Open panel with seniors",
    date: "Aug 24",
    mentor: "Panel: IIT, BITS, Ashoka seniors",
  },
  {
    title: "Life at IIT",
    audience: "Mentor-hosted session",
    date: "Sep 02",
    mentor: "Hosted by Arjun, IIT Madras",
  },
];

const stats = [
  { value: "10,000+", label: "Active Students", sublabel: "Across India" },
  { value: "50+", label: "College Cities", sublabel: "Local chapters" },
  { value: "8", label: "Stream Groups", sublabel: "Dedicated circles" },
  { value: "Weekly", label: "Live Events", sublabel: "Mentor Q&As" },
];

function WhatsAppButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={whatsappCommunityUrl}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group inline-flex items-center justify-center gap-2 rounded-full bg-[#7C3AED] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-10px_rgba(124,58,237,0.65)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6D28D9] active:scale-[0.98]",
        className
      )}
    >
      <MessageCircle className="size-4 shrink-0 transition-transform group-hover:scale-110" />
      <span>{children}</span>
      <ArrowRight className="size-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5" />
    </a>
  );
}

export default function CommunityPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FAF5FF] text-[#1E1B4B]">
      {/* Branded Header */}
      <HomepageHeader />

      {/* Subtle ambient gradient orbs */}
      <div
        className="pointer-events-none absolute -left-32 top-14 h-[28rem] w-[28rem] rounded-full bg-[#7C3AED]/10 blur-[110px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -right-32 top-24 h-[32rem] w-[32rem] rounded-full bg-[#EC4899]/10 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute left-1/2 top-[55%] h-[24rem] w-[24rem] -translate-x-1/2 rounded-full bg-[#F97316]/[0.05] blur-[110px]"
        aria-hidden="true"
      />

      <main className="relative">
        {/* Hero Section */}
        <section className="mentra-hero-depth relative overflow-hidden border-b border-violet-100/80 pt-12 pb-16 sm:pt-16 sm:pb-20 lg:pt-20 lg:pb-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              {/* Left copy */}
              <div>
                <div className="mentra-clay-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold text-[#6D28D9] backdrop-blur-sm">
                  <Users className="size-3.5 text-[#7C3AED]" />
                  <span>Mentra Student Community</span>
                </div>

                <h1 className="mt-5 text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[#1E1B4B] sm:text-5xl lg:text-6xl">
                  You&apos;re not figuring this out{" "}
                  <span className="bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F97316] bg-clip-text text-transparent">
                    alone.
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base sm:text-lg leading-relaxed text-slate-600">
                  Join thousands of students navigating the same confusion — stream
                  selection, exam prep, college choices, and branch realities. Find your people and learn from seniors who have walked your road.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <WhatsAppButton>Join WhatsApp Community</WhatsAppButton>

                  <a
                    href="#city-groups"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-violet-200 bg-white/90 px-5 py-3 text-sm font-semibold text-[#1E1B4B] shadow-xs transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50/70"
                  >
                    <MapPin className="size-4 text-[#7C3AED]" />
                    <span>Find your city</span>
                  </a>
                </div>

                <div className="mt-8 flex max-w-2xl flex-wrap items-center gap-3 text-xs sm:text-sm font-medium text-slate-600">
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/85 px-3.5 py-1.5 shadow-xs">
                    <ShieldCheck className="size-4 text-emerald-600" />
                    <span>A safe space for honest questions</span>
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-white/85 px-3.5 py-1.5 shadow-xs">
                    <MessageCircle className="size-4 text-[#7C3AED]" />
                    <span>WhatsApp-first for Indian students</span>
                  </span>
                </div>
              </div>

              {/* Right Live Preview Card */}
              <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                <div
                  className="pointer-events-none absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#7C3AED]/15 via-[#EC4899]/10 to-[#F97316]/10 blur-2xl"
                  aria-hidden="true"
                />

                <div className="mentra-clay-card relative rounded-3xl border bg-white/95 p-5 transition-transform duration-500 hover:-translate-y-1 sm:p-6 backdrop-blur-xl">
                  {/* Community Hero Image Banner */}
                  <div className="relative mb-5 overflow-hidden rounded-2xl border border-violet-100/90 shadow-xs group">
                    <Image
                      src="/community/community-hero.jpg"
                      alt="Indian college student community collaborating on campus"
                      width={640}
                      height={360}
                      className="w-full object-cover aspect-[16/9] transition-transform duration-500 group-hover:scale-[1.03]"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/80 via-transparent to-black/20 pointer-events-none" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold text-white drop-shadow-sm">Campus Chapters Live</span>
                      </div>
                      <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[10.5px] font-semibold backdrop-blur-md">
                        10,000+ Active Students
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-b border-violet-100 pb-4">
                    <div>
                      <p className="text-sm font-bold text-[#1E1B4B]">
                        Mentra Community Hub
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Live groups · City chapters · Mentor circles
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active now
                    </span>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      {
                        title: "Class 10: PCM vs Commerce?",
                        copy: "Ask seniors who chose both paths and are now in top colleges.",
                        tag: "Stream Decision",
                      },
                      {
                        title: "Mumbai & Pune JEE Circle",
                        copy: "Connect with students studying for JEE around you.",
                        tag: "City Chapter",
                      },
                      {
                        title: "Life at IIT Bombay — Ask Alumni",
                        copy: "Live mentor session starts tonight at 8:00 PM IST.",
                        tag: "Weekly Panel",
                      },
                    ].map((item) => (
                      <div
                        key={item.title}
                        className="rounded-2xl border border-violet-100/80 bg-violet-50/40 p-4 transition-all hover:bg-violet-50/80 hover:border-violet-200"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-[#1E1B4B]">
                            {item.title}
                          </p>
                          <span className="shrink-0 rounded-full border border-violet-200/70 bg-white px-2 py-0.5 text-[10px] font-semibold text-[#7C3AED]">
                            {item.tag}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs sm:text-[13px] leading-5 text-slate-600">
                          {item.copy}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-violet-100">
                    <a
                      href={whatsappCommunityUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-violet-200 bg-white py-2.5 text-xs sm:text-sm font-semibold text-[#7C3AED] shadow-xs transition hover:bg-violet-50"
                    >
                      <Sparkles className="size-3.5" />
                      <span>Explore all 20+ community channels</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Counter Strip */}
        <section className="border-b border-violet-100/70 bg-white/70 py-10 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-violet-100/80 bg-white/90 p-5 text-center shadow-xs transition hover:-translate-y-0.5 hover:border-violet-200"
              >
                <p className="text-3xl font-extrabold tracking-tight text-[#1E1B4B] sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-sm font-bold text-[#7C3AED]">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {stat.sublabel}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Community Moments & Campus Life Showcase */}
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-18 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                Life Inside The Community
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1E1B4B] sm:text-4xl">
                Real students. Real seniors. Real conversations.
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                From college lawn meetups to late-night WhatsApp study rooms, see how Mentra brings juniors and seniors together across India.
              </p>
            </div>

            <a
              href="#city-groups"
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#7C3AED] transition hover:text-[#6D28D9]"
            >
              <span>Explore active city meetups</span>
              <ArrowRight className="size-4" />
            </a>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Photo Card 1: Lawn Meetups */}
            <div className="group relative overflow-hidden rounded-3xl border border-violet-100/90 bg-white p-3.5 shadow-[0_4px_24px_-6px_rgba(30,27,75,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-300 hover:shadow-[0_20px_45px_-12px_rgba(124,58,237,0.18)]">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-violet-50">
                <Image
                  src="/community/campus-lawn-circle.jpg"
                  alt="Students participating in campus lawn study circle"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/85 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3.5 left-4 right-4 text-white">
                  <span className="inline-block rounded-full bg-amber-400/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-950">
                    City Chapters
                  </span>
                  <p className="mt-1 text-base font-bold text-white drop-shadow-sm">
                    Delhi & Mumbai Campus Circles
                  </p>
                </div>
              </div>
              <div className="p-3.5">
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600">
                  Weekend student meetups to discuss coaching choices, college visits, and form deadlines with seniors who walked the road.
                </p>
              </div>
            </div>

            {/* Photo Card 2: 1:1 Senior Guidance */}
            <div className="group relative overflow-hidden rounded-3xl border border-violet-100/90 bg-white p-3.5 shadow-[0_4px_24px_-6px_rgba(30,27,75,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-300 hover:shadow-[0_20px_45px_-12px_rgba(124,58,237,0.18)]">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-violet-50">
                <Image
                  src="/community/senior-junior-mentorship.jpg"
                  alt="Senior mentor Anjali advising junior Rahul on campus steps"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/85 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3.5 left-4 right-4 text-white">
                  <span className="inline-block rounded-full bg-violet-400/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-950">
                    1:1 Mentorship
                  </span>
                  <p className="mt-1 text-base font-bold text-white drop-shadow-sm">
                    Branch & Career Guidance
                  </p>
                </div>
              </div>
              <div className="p-3.5">
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600">
                  Direct answers about course load, campus life, and placement realities from verified seniors at premier colleges.
                </p>
              </div>
            </div>

            {/* Photo Card 3: Late night doubt jams */}
            <div className="group relative overflow-hidden rounded-3xl border border-violet-100/90 bg-white p-3.5 shadow-[0_4px_24px_-6px_rgba(30,27,75,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-violet-300 hover:shadow-[0_20px_45px_-12px_rgba(124,58,237,0.18)]">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-violet-50">
                <Image
                  src="/community/mentor-guidance.jpg"
                  alt="Senior mentor explaining engineering concepts in library study session"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/85 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-3.5 left-4 right-4 text-white">
                  <span className="inline-block rounded-full bg-emerald-400/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-950">
                    Study Jams
                  </span>
                  <p className="mt-1 text-base font-bold text-white drop-shadow-sm">
                    JEE, NEET & CA Circles
                  </p>
                </div>
              </div>
              <div className="p-3.5">
                <p className="text-xs sm:text-[13px] leading-relaxed text-slate-600">
                  Late-night doubt-solving and strategy sessions before exam milestones with mentors who scored in top percentiles.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* City Groups Section */}
        <section
          id="city-groups"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        >
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
              City Chapters
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1E1B4B] sm:text-4xl">
              Find students near you.
            </h2>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
              Local groups make the big decisions feel smaller: coaching centers,
              college visits, form deadlines, meetups, and seniors from your city.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cityGroups.map((group) => (
              <a
                key={group.city}
                href={whatsappCommunityUrl}
                target="_blank"
                rel="noreferrer"
                className="group flex flex-col justify-between rounded-3xl border border-violet-100/90 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(30,27,75,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_16px_36px_-12px_rgba(124,58,237,0.18)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-[#1E1B4B] transition-colors group-hover:text-[#7C3AED]">
                      {group.city}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm font-medium text-slate-500">
                      {group.comingSoon ? group.count : `${group.count} active members`}
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-[#7C3AED]">
                    <MapPin className="size-4.5" />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#7C3AED]">
                  <span>{group.comingSoon ? "Request city" : "Join City Group"}</span>
                  <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-1" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Stream Communities Section */}
        <section className="border-y border-violet-100/80 bg-white/60 py-16 sm:py-20 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                Stream Communities
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1E1B4B] sm:text-4xl">
                Talk to students choosing your exact path.
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                No one should have to ask serious questions in random comment sections.
                These groups are moderated, warm, and specific to your next choice.
              </p>
            </div>

            <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {streamGroups.map((group) => {
                const Icon = group.icon;
                return (
                  <a
                    key={group.name}
                    href={whatsappCommunityUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col justify-between rounded-3xl border border-violet-100/90 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(30,27,75,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_16px_36px_-12px_rgba(124,58,237,0.18)]"
                  >
                    <div>
                      <div className="flex size-10 items-center justify-center rounded-2xl border border-violet-100 bg-violet-50 text-[#7C3AED]">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-bold tracking-tight text-[#1E1B4B] transition-colors group-hover:text-[#7C3AED]">
                        {group.name}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-[#7C3AED]">
                        {group.count} members
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        {group.note}
                      </p>
                    </div>

                    <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-slate-600 transition group-hover:text-[#7C3AED]">
                      <span>Join Chapter</span>
                      <ArrowRight className="size-3 transition-transform duration-150 group-hover:translate-x-1" />
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>

        {/* Live Sessions & Events */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                Mentra Sessions & Events
              </span>
              <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-[#1E1B4B] sm:text-4xl">
                Monthly online events and local meetups.
              </h2>
              <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                Come for the Q&A, stay for the students who are asking the same
                questions you were scared to say out loud.
              </p>
            </div>

            <WhatsAppButton className="sm:self-center">
              Get event updates
            </WhatsAppButton>
          </div>

          <div className="mt-9 grid gap-6 lg:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.title}
                className="group flex flex-col justify-between rounded-3xl border border-violet-100/90 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(30,27,75,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-[0_16px_36px_-12px_rgba(124,58,237,0.18)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/90 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">
                      <CalendarDays className="size-3.5 text-amber-600" />
                      <span>{event.date}</span>
                    </span>
                    <span className="rounded-full border border-violet-100 bg-violet-50/70 px-2.5 py-0.5 text-[11px] font-semibold text-[#7C3AED]">
                      {event.audience}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-bold tracking-tight text-[#1E1B4B] transition-colors group-hover:text-[#7C3AED]">
                    {event.title}
                  </h3>
                  <p className="mt-2 min-h-10 text-xs sm:text-sm leading-6 text-slate-600">
                    {event.mentor}
                  </p>
                </div>

                <a
                  href={whatsappCommunityUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-violet-200 bg-white py-2.5 text-xs sm:text-sm font-semibold text-[#7C3AED] shadow-xs transition hover:border-[#7C3AED] hover:bg-violet-50"
                >
                  <span>Register on WhatsApp</span>
                  <ArrowRight className="size-3.5" />
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* Circular Community Model Banner */}
        <section className="border-t border-violet-100/80 bg-white/70 py-16 sm:py-20 backdrop-blur-sm">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="overflow-hidden rounded-3xl border border-violet-100/90 bg-white shadow-xs">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-violet-50">
                <Image
                  src="/community/senior-junior-mentorship.jpg"
                  alt="Senior mentor Anjali and junior mentee Rahul on campus steps"
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1E1B4B]/85 via-[#1E1B4B]/25 to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-5 right-5 text-white">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    <span>The Mentra Giving-Back Circle</span>
                  </div>
                </div>
              </div>
              <div className="p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1E1B4B]">
                  Once a mentee, now a mentor.
                </h2>
                <p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-600">
                  After getting guidance as a student, come back as a senior mentor. That circular community model keeps Mentra authentic, practical, current, and genuinely kind.
                </p>
              </div>
            </div>

            <div className="grid content-center gap-4">
              {[
                "Students ask honestly in a safe space with zero judgment.",
                "Mentors and seniors answer directly from recent lived experience.",
                "Guided students return as verified college mentors for the next batch.",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-2xl border border-violet-100/90 bg-white p-5 shadow-xs"
                >
                  <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                  <p className="text-sm sm:text-base font-semibold text-[#1E1B4B]">
                    {item}
                  </p>
                </div>
              ))}

              <div className="pt-2">
                <WhatsAppButton>Join the circle</WhatsAppButton>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <HomepageFooter />
    </div>
  );
}

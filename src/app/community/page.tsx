import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Compass,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Community",
  description:
    "Join GuideMe's WhatsApp community for Indian students choosing streams, exams, colleges, and mentors.",
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
  { name: "PCM Students", count: "2,400", note: "JEE, boards, branches" },
  { name: "PCB Students", count: "1,900", note: "NEET, bio paths, backup plans" },
  { name: "Commerce Students", count: "1,350", note: "CA, CUET, finance paths" },
  { name: "Arts Students", count: "980", note: "Humanities, design, policy" },
  { name: "Engineering UG", count: "1,180", note: "GATE, internships, careers" },
  { name: "Medical UG", count: "740", note: "College life and clinical years" },
  { name: "Law UG ⚖️", count: "520", note: "CLAT, NLUs, internships" },
  { name: "Management UG", count: "610", note: "BBA, IPMAT, CAT early prep" },
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
    audience: "Open panel with mentors",
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
  { value: "10,000+", label: "Students" },
  { value: "50+", label: "Cities" },
  { value: "8", label: "Stream Groups" },
  { value: "Weekly", label: "Events" },
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
      className={`inline-flex items-center justify-center gap-2 rounded-lg bg-[#f4a429] px-5 py-3 text-sm font-extrabold text-[#111827] shadow-[0_14px_34px_rgba(244,164,41,0.22)] transition hover:-translate-y-0.5 hover:bg-amber-300 ${className}`}
    >
      {children}
      <ArrowRight className="size-4" />
    </a>
  );
}

export default function CommunityPage() {
  return (
    <main className="min-h-screen bg-[#040913] text-[#edf3fb]">
      <section className="relative overflow-hidden border-b border-[#02c39a]/20">
        <div className="absolute left-1/2 top-[-18rem] h-[34rem] w-[48rem] -translate-x-1/2 rounded-full bg-[#028090]/18 blur-3xl" />
        <div className="absolute right-[-10rem] top-32 h-80 w-80 rounded-full bg-[#f4a429]/12 blur-3xl" />

        <div className="relative mx-auto grid min-h-[88svh] max-w-7xl content-center gap-12 px-4 py-28 sm:px-6 lg:grid-cols-[1.04fr_0.96fr] lg:px-8">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-[#02c39a]/35 bg-[#02c39a]/10 px-3 py-2 text-sm font-bold text-[#9ff7dd] transition hover:border-[#02c39a]/70"
            >
              <Compass className="size-4" />
              GuideMe Community
            </Link>

            <h1 className="mt-8 max-w-3xl text-5xl font-black leading-[1.02] text-white sm:text-7xl">
              You&apos;re not figuring this out alone.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#edf3fb]/72">
              Join thousands of students navigating the same confusion - stream
              selection, exam prep, college choices. Find your people.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <WhatsAppButton>Join WhatsApp Community</WhatsAppButton>
              <a
                href="#city-groups"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#028090]/70 px-5 py-3 text-sm font-extrabold text-white transition hover:-translate-y-0.5 hover:border-[#02c39a] hover:bg-[#02c39a]/10"
              >
                Find your city
                <MapPin className="size-4" />
              </a>
            </div>

            <div className="mt-8 flex max-w-2xl flex-wrap gap-3 text-sm text-[#edf3fb]/68">
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <ShieldCheck className="size-4 text-[#02c39a]" />
                A safe space for honest questions
              </span>
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
                <MessageCircle className="size-4 text-[#f4a429]" />
                WhatsApp-first for Indian students
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-lg border border-[#028090]/45 bg-[#0f1b2d]/88 p-5 shadow-[0_28px_80px_rgba(0,0,0,0.34)]">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-bold text-[#02c39a]">GuideMe WhatsApp</p>
                  <p className="mt-1 text-xs text-[#edf3fb]/48">Live groups, city chapters, mentor circles</p>
                </div>
                <span className="rounded-lg bg-[#02c39a]/15 px-3 py-1 text-xs font-bold text-[#9ff7dd]">
                  Online now
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["Class 10 PCM or Commerce?", "Ask seniors who picked both paths."],
                  ["Mumbai JEE group", "Meet people studying around you."],
                  ["Life at IIT tonight", "Mentor alumni panel starts at 8 PM."],
                ].map(([title, copy]) => (
                  <div key={title} className="rounded-lg border border-white/10 bg-[#08182a] p-4">
                    <p className="font-bold text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-[#edf3fb]/58">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#071120]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg bg-[#0f1b2d] p-5 text-center">
              <p className="text-3xl font-black text-white sm:text-4xl">{stat.value}</p>
              <p className="mt-2 text-sm font-bold text-[#edf3fb]/58">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="city-groups" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-black text-[#02c39a]">City Groups</p>
          <h2 className="mt-3 text-4xl font-black text-white">Find students near you.</h2>
          <p className="mt-4 leading-7 text-[#edf3fb]/62">
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
              className="group rounded-lg border border-[#028090]/35 bg-[#0f1b2d] p-5 transition hover:-translate-y-1 hover:border-[#02c39a] hover:bg-[#102940]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-2xl font-black text-white">{group.city}</p>
                  <p className="mt-2 text-sm text-[#edf3fb]/52">
                    {group.comingSoon ? group.count : `${group.count} members`}
                  </p>
                </div>
                <MapPin className="size-5 text-[#f4a429]" />
              </div>
              <p className="mt-6 inline-flex items-center gap-1.5 text-sm font-extrabold text-[#7cf0d8]">
                {group.comingSoon ? "Request city" : "Join Group"}
                <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
              </p>
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#071120]">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-black text-[#f4a429]">Stream Communities</p>
            <h2 className="mt-3 text-4xl font-black text-white">Talk to people choosing the same path.</h2>
            <p className="mt-4 leading-7 text-[#edf3fb]/62">
              No one should have to ask serious questions in random comment sections.
              These groups are moderated, warm, and specific to your next choice.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {streamGroups.map((group) => (
              <a
                key={group.name}
                href={whatsappCommunityUrl}
                target="_blank"
                rel="noreferrer"
                className="group min-h-44 rounded-lg border border-white/10 bg-[#0f1b2d] p-5 transition hover:-translate-y-1 hover:border-[#02c39a] hover:shadow-[0_20px_55px_rgba(2,128,144,0.18)]"
              >
                <Users className="size-5 text-[#02c39a]" />
                <h3 className="mt-5 text-xl font-black text-white">{group.name}</h3>
                <p className="mt-2 text-sm font-bold text-[#f4a429]">{group.count} members</p>
                <p className="mt-3 text-sm leading-6 text-[#edf3fb]/56">{group.note}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-black text-[#02c39a]">GuideMe Sessions</p>
            <h2 className="mt-3 text-4xl font-black text-white">Monthly online events and local meetups.</h2>
            <p className="mt-4 leading-7 text-[#edf3fb]/62">
              Come for the Q&A, stay for the students who are asking the same
              questions you were scared to say out loud.
            </p>
          </div>
          <WhatsAppButton className="sm:self-center">Get event updates</WhatsAppButton>
        </div>

        <div className="mt-9 grid gap-4 lg:grid-cols-3">
          {events.map((event) => (
            <article key={event.title} className="rounded-lg border border-[#028090]/35 bg-[#0f1b2d] p-5">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-lg bg-[#f4a429]/14 px-3 py-1 text-sm font-black text-[#ffd58a]">
                  {event.date}
                </span>
                <CalendarDays className="size-5 text-[#02c39a]" />
              </div>
              <h3 className="mt-5 text-2xl font-black text-white">{event.title}</h3>
              <p className="mt-2 text-sm font-bold text-[#edf3fb]/62">{event.audience}</p>
              <p className="mt-4 min-h-12 text-sm leading-6 text-[#edf3fb]/56">{event.mentor}</p>
              <a
                href={whatsappCommunityUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#02c39a]/55 px-4 py-3 text-sm font-extrabold text-[#9ff7dd] transition hover:border-[#02c39a] hover:bg-[#02c39a]/10"
              >
                Register on WhatsApp
                <ArrowRight className="size-4" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#071120]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="rounded-lg border border-[#f4a429]/28 bg-[#f4a429]/10 p-6">
            <CheckCircle2 className="size-8 text-[#f4a429]" />
            <h2 className="mt-5 text-4xl font-black text-white">Once a mentee, now a mentor.</h2>
            <p className="mt-4 leading-7 text-[#edf3fb]/66">
              After getting guidance as a student, come back as a mentor. That
              circular community model keeps GuideMe practical, current, and kind.
            </p>
          </div>

          <div className="grid content-center gap-4">
            {[
              "Students ask honestly in a safe space.",
              "Mentors and alumni answer from lived experience.",
              "Guided students return to help the next batch.",
            ].map((item) => (
              <div key={item} className="flex gap-4 rounded-lg border border-white/10 bg-[#0f1b2d] p-5">
                <ShieldCheck className="mt-1 size-5 shrink-0 text-[#02c39a]" />
                <p className="text-lg font-bold leading-7 text-[#edf3fb]">{item}</p>
              </div>
            ))}
            <div className="pt-3">
              <WhatsAppButton>Join the circle</WhatsAppButton>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

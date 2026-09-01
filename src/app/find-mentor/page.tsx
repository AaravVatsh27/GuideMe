import type { Route } from "next";
import Link from "next/link";
import { ArrowRight, Bell, Mail, Search } from "lucide-react";
import { MentorAvatar } from "@/Frontend/components/MentorAvatar";
import { getPublicMentorDirectory } from "@/Backend/server/public-data";
import type { PublicMentorCard } from "@/Backend/server/public-data";
import { cn } from "@/Backend/server/utils";

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

type FilterChip = {
  label: string;
  emoji?: string;
  query: FilterQuery;
  active: boolean;
};

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
  if (!v) return "₹249";
  return `₹${v.toLocaleString("en-IN")}`;
}

function tierLabel(tier: string | null): string {
  const map: Record<string, string> = {
    ELITE: "Elite",
    VERIFIED: "Verified",
    RISING: "Rising",
  };
  return tier ? (map[tier] ?? tier) : "Verified";
}

function tierStyle(tier: string | null): string {
  if (tier === "ELITE") return "border-amber-300/60 bg-amber-300/15 text-amber-200";
  if (tier === "RISING") return "border-[#02c39a]/40 bg-[#02c39a]/15 text-[#9ff7dd]";
  return "border-teal-300/50 bg-[#028090]/20 text-teal-100";
}

function topicWithEmoji(topic: string): string {
  const lower = topic.toLowerCase();
  if (lower.includes("stream")) return "🧭 Stream Selection";
  if (lower.includes("college")) return "🏫 College Guidance";
  if (lower.includes("jee")) return "📘 JEE Roadmap";
  if (lower.includes("neet")) return "🩺 NEET Prep";
  if (lower.includes("career")) return "💡 Career Clarity";
  if (lower.includes("interview")) return "🎤 Interview Prep";
  if (lower.includes("gate")) return "⚙️ GATE";
  if (lower.includes("cat")) return "📊 CAT";
  return `✨ ${topic}`;
}

function mentorBio(mentor: PublicMentorCard): string {
  if (mentor.headline && /\b(i|my|me|i'm|ive|i've)\b/i.test(mentor.headline)) {
    return mentor.headline;
  }

  const exam = mentor.examLabels[0] ?? "my entrance exam";
  const college = mentor.college ?? "college";
  const topic = mentor.topicLabels[0] ?? "choosing the right next step";

  return `I remember how confusing ${exam} and ${topic} felt. I can help you understand the path to ${college} with practical, no-fluff guidance.`;
}

function Chip({ chip }: { chip: FilterChip }) {
  return (
    <Link
      href={{ pathname: "/find-mentor", query: removeEmpty(chip.query) }}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-sm font-semibold text-white transition-all duration-200",
        "border-[#028090]/70 bg-[#0d2137] hover:-translate-y-0.5 hover:border-[#02c39a] hover:bg-[#102940]",
        chip.active &&
          "scale-[1.03] border-[#028090] bg-[#028090] shadow-[0_0_24px_rgba(2,195,154,0.18)]"
      )}
    >
      {chip.emoji ? <span className="mr-1.5">{chip.emoji}</span> : null}
      {chip.label}
    </Link>
  );
}

function FilterRow({ label, chips }: { label: string; chips: FilterChip[] }) {
  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-[#edf3fb]/80">{label}</p>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {chips.map((chip) => (
          <Chip key={chip.label} chip={chip} />
        ))}
      </div>
    </div>
  );
}

function MentorCard({ mentor }: { mentor: PublicMentorCard }) {
  const profileHref = (mentor.username
    ? `/mentor/${mentor.username}`
    : `/mentor/${mentor.id}`) as Route;
  const bookingHref = (mentor.username
    ? `/mentor/${mentor.username}/book`
    : profileHref) as Route;

  const collegeLine = mentor.yearLabel || [mentor.college, mentor.degree].filter(Boolean).join(" · ");
  const topics = mentor.topicLabels.length > 0
    ? mentor.topicLabels.slice(0, 3).map(topicWithEmoji)
    : ["🧭 Stream Selection", "🏫 College Guidance", "💡 Career Clarity"];

  return (
    <article className="group relative flex min-h-[440px] flex-col rounded-[2rem] border border-[#028090]/45 bg-[#0d2137] p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#02c39a] hover:shadow-[0_18px_55px_rgba(2,128,144,0.24)]">
      <span
        className={cn(
          "absolute right-5 top-5 rounded-full border px-3 py-1 text-xs font-bold",
          tierStyle(mentor.tier)
        )}
      >
        {tierLabel(mentor.tier)}
      </span>

      <div className="relative w-fit">
        <div className="absolute -inset-2 rounded-full bg-[#02c39a]/25 blur-md transition group-hover:bg-[#02c39a]/35" />
        <MentorAvatar
          src={mentor.image}
          alt={mentor.name}
          fallback={mentor.firstName.charAt(0)}
          className="relative size-20 border-2 border-[#02c39a]/70 bg-[#0f1b2d] text-xl ring-4 ring-[#02c39a]/15"
        />
        {mentor.availableThisWeek && (
          <span className="absolute bottom-1 right-0 size-4 rounded-full border-2 border-[#0d2137] bg-[#02c39a] shadow-[0_0_18px_rgba(2,195,154,0.8)]" />
        )}
      </div>

      <div className="mt-5">
        <h2 className="pr-20 text-xl font-bold tracking-tight text-white">{mentor.name}</h2>
        <p className="mt-1 text-sm font-medium text-[#edf3fb]/55">
          {collegeLine || "GuideMe Mentor"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {mentor.examLabels.slice(0, 3).map((label) => (
          <span
            key={label}
            className="rounded-full border border-[#028090]/50 bg-[#028090]/15 px-3 py-1 text-xs font-semibold text-teal-100"
          >
            {label} ✓
          </span>
        ))}
        {mentor.availableThisWeek && (
          <span className="rounded-full border border-[#02c39a]/40 bg-[#02c39a]/15 px-3 py-1 text-xs font-semibold text-[#b8ffe8]">
            Available now
          </span>
        )}
      </div>

      <p className="mt-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[#edf3fb]/65">
        {mentorBio(mentor)}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {topics.map((topic) => (
          <span
            key={topic}
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#edf3fb]/75"
          >
            {topic}
          </span>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 pt-5">
        <div>
          <p className="text-xs text-[#edf3fb]/35">Intro guidance</p>
          <p className="text-base font-bold text-[#edf3fb]">{formatPrice(mentor.priceMin)} / session</p>
        </div>
        <Link
          href={bookingHref}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#f4a429] px-4 py-2.5 text-sm font-extrabold text-[#0f1b2d] shadow-[0_10px_28px_rgba(244,164,41,0.18)] transition hover:-translate-y-0.5 hover:bg-amber-300"
        >
          Book Free Intro
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

function ComingSoonState() {
  return (
    <section className="col-span-full rounded-[2rem] border border-[#028090]/45 bg-[#0d2137] p-8 text-center shadow-[0_18px_55px_rgba(2,128,144,0.12)] sm:p-12">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-[#f4a429]/30 bg-[#f4a429]/10">
        <Bell className="size-7 text-[#f4a429]" />
      </div>
      <h2 className="mt-5 text-2xl font-bold text-[#edf3fb]">
        Our first mentors are joining — be notified
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#edf3fb]/55">
        We are onboarding verified IIT, AIIMS, NIT, IIM, CA, CLAT and GATE mentors. Drop your email
        and we will let you know when your stream goes live.
      </p>
      <form className="mx-auto mt-7 flex max-w-lg flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#edf3fb]/35" />
          <input
            className="h-12 w-full rounded-full border border-[#028090]/50 bg-[#0f1b2d] pl-11 pr-4 text-sm text-[#edf3fb] outline-none placeholder:text-[#edf3fb]/30 focus:border-[#02c39a] focus:ring-4 focus:ring-[#02c39a]/10"
            name="email"
            placeholder="you@example.com"
            type="email"
          />
        </label>
        <button
          className="h-12 rounded-full bg-[#f4a429] px-6 text-sm font-extrabold text-[#0f1b2d] transition hover:bg-amber-300"
          type="submit"
        >
          Notify me
        </button>
      </form>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="col-span-full rounded-[2rem] border border-[#028090]/35 bg-[#0d2137] p-8 text-center sm:p-12">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-[#02c39a]/30 bg-[#02c39a]/10">
        <Search className="size-7 text-[#02c39a]" />
      </div>
      <h2 className="mt-5 text-2xl font-bold text-[#edf3fb]">No mentors matched these filters</h2>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#edf3fb]/55">
        Try a broader stream, remove the mentor type filter, or browse all available mentors.
      </p>
      <Link
        href="/find-mentor"
        className="mt-7 inline-flex rounded-full border border-[#028090]/60 px-5 py-3 text-sm font-bold text-white transition hover:border-[#02c39a] hover:bg-[#02c39a]/10"
      >
        Clear filters
      </Link>
    </section>
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

  const activeFilterCount = [query, stream, exam, tier, priceMax, available, forClass]
    .filter(Boolean).length;

  const streamBase = {
    tier: tier || undefined,
    priceMax,
    available: available ? "true" : undefined,
    forClass: forClass || undefined,
  };
  const mentorTypeBase = {
    q: query || undefined,
    stream: stream || undefined,
    exam: exam || undefined,
    priceMax,
  };

  const streamChips: FilterChip[] = [
    { label: "Stream Selection", emoji: "🧭", query: { ...streamBase, q: query === "Stream Selection" ? undefined : "Stream Selection" }, active: query === "Stream Selection" },
    { label: "JEE Prep", emoji: "📘", query: { ...streamBase, exam: exam === "JEE" ? undefined : "JEE" }, active: exam === "JEE" },
    { label: "NEET Prep", emoji: "🩺", query: { ...streamBase, exam: exam === "NEET" ? undefined : "NEET" }, active: exam === "NEET" },
    { label: "CA Path", emoji: "💼", query: { ...streamBase, stream: stream === "COMMERCE" ? undefined : "COMMERCE" }, active: stream === "COMMERCE" },
    { label: "CLAT", emoji: "⚖️", query: { ...streamBase, exam: exam === "CLAT" ? undefined : "CLAT" }, active: exam === "CLAT" },
    { label: "GATE", emoji: "⚙️", query: { ...streamBase, exam: exam === "GATE" ? undefined : "GATE" }, active: exam === "GATE" },
    { label: "CAT", emoji: "📊", query: { ...streamBase, exam: exam === "CAT" ? undefined : "CAT" }, active: exam === "CAT" },
    { label: "College Selection", emoji: "🏫", query: { ...streamBase, q: query === "College Selection" ? undefined : "College Selection" }, active: query === "College Selection" },
    { label: "Career Confusion", emoji: "💡", query: { ...streamBase, q: query === "Career Confusion" ? undefined : "Career Confusion" }, active: query === "Career Confusion" },
  ];

  const mentorTypeChips: FilterChip[] = [
    { label: "For Class 10", query: { ...mentorTypeBase, forClass: forClass === "school" ? undefined : "school", tier: tier || undefined, available: available ? "true" : undefined }, active: forClass === "school" },
    { label: "For Class 11", query: { ...mentorTypeBase, forClass: forClass === "school" ? undefined : "school", tier: tier || undefined, available: available ? "true" : undefined }, active: forClass === "school" },
    { label: "For Class 12", query: { ...mentorTypeBase, forClass: forClass === "school" ? undefined : "school", tier: tier || undefined, available: available ? "true" : undefined }, active: forClass === "school" },
    { label: "For UG Students", query: { ...mentorTypeBase, forClass: forClass === "ug" ? undefined : "ug", tier: tier || undefined, available: available ? "true" : undefined }, active: forClass === "ug" },
    { label: "IIT/AIIMS/IIM", query: { ...mentorTypeBase, forClass: forClass || undefined, tier: tier === "ELITE" ? undefined : "ELITE", available: available ? "true" : undefined }, active: tier === "ELITE" },
    { label: "NIT Level", query: { ...mentorTypeBase, forClass: forClass || undefined, tier: tier === "VERIFIED" ? undefined : "VERIFIED", available: available ? "true" : undefined }, active: tier === "VERIFIED" },
    { label: "Available Now", query: { ...mentorTypeBase, forClass: forClass || undefined, tier: tier || undefined, available: available ? undefined : "true" }, active: available },
  ];

  return (
    <main className="min-h-screen bg-[#0f1b2d] text-[#edf3fb]">
      <section className="relative overflow-hidden border-b border-[#028090]/25">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-[760px] -translate-x-1/2 rounded-full bg-[#028090]/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-[#02c39a]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <p className="w-fit rounded-full border border-[#02c39a]/30 bg-[#02c39a]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-[#9ff7dd]">
            GuideMe mentor directory
          </p>
          <div className="mt-6 max-w-3xl">
            <h1 className="text-4xl font-black tracking-tight text-[#edf3fb] sm:text-6xl">
              Browse mentors who have lived your exact Indian student choices.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#edf3fb]/62">
              Pick a stream, exam, college path or mentor type first. Search is here only when you
              already know what you want.
            </p>
          </div>

          <div className="mt-9 space-y-5 rounded-[2rem] border border-[#028090]/35 bg-[#08182a]/72 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.18)] backdrop-blur sm:p-6">
            <FilterRow label="I need help with:" chips={streamChips} />
            <FilterRow label="Mentor type:" chips={mentorTypeChips} />
          </div>

          <form action="/find-mentor" className="mt-5 max-w-xl">
            <div className="relative">
              {stream ? <input name="stream" type="hidden" value={stream} /> : null}
              {exam ? <input name="exam" type="hidden" value={exam} /> : null}
              {tier ? <input name="tier" type="hidden" value={tier} /> : null}
              {priceMax ? <input name="priceMax" type="hidden" value={priceMax} /> : null}
              {available ? <input name="available" type="hidden" value="true" /> : null}
              {forClass ? <input name="forClass" type="hidden" value={forClass} /> : null}
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#edf3fb]/35" />
              <input
                className="h-12 w-full rounded-full border border-[#028090]/35 bg-[#0d2137] pl-11 pr-28 text-sm text-[#edf3fb] outline-none placeholder:text-[#edf3fb]/28 focus:border-[#02c39a] focus:ring-4 focus:ring-[#02c39a]/10"
                defaultValue={query}
                name="q"
                placeholder="Secondary search: IIT Bombay, CA, design, confusion..."
                type="search"
              />
              <button
                className="absolute right-1.5 top-1.5 h-9 rounded-full bg-[#028090] px-4 text-sm font-bold text-white transition hover:bg-[#02a0ad]"
                type="submit"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#02c39a]">
              {directory.total > 0
                ? `${directory.total.toLocaleString("en-IN")} mentor${directory.total !== 1 ? "s" : ""} found`
                : "Mentor results"}
            </p>
            <h2 className="mt-1 text-3xl font-black tracking-tight text-[#edf3fb]">
              {activeFilterCount > 0 ? "Mentors matching your path" : "Start with a category above"}
            </h2>
          </div>
          {activeFilterCount > 0 && (
            <Link
              href="/find-mentor"
              className="w-fit rounded-full border border-[#028090]/55 px-4 py-2 text-sm font-bold text-[#edf3fb]/75 transition hover:border-[#02c39a] hover:text-white"
            >
              Clear all filters
            </Link>
          )}
        </div>

        <div className="mt-7 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {directory.total === 0 && activeFilterCount === 0 ? (
            <ComingSoonState />
          ) : directory.mentors.length > 0 ? (
            directory.mentors.map((mentor) => <MentorCard key={mentor.id} mentor={mentor} />)
          ) : (
            <EmptyState />
          )}
        </div>
      </section>
    </main>
  );
}

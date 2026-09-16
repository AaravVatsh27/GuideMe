import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ChevronRight,
  Mail,
  Scale,
  ShieldAlert,
} from "lucide-react";

import { HomepageHeader } from "@/components/brand/HomepageHeader";
import { HomepageFooter } from "@/components/brand/HomepageFooter";

export const metadata: Metadata = {
  title: "Terms of Service | Mentra",
  description:
    "Review the terms of service, user agreement, booking policies, and community standards for the Mentra peer mentorship platform.",
};

export default function TermsOfServicePage() {
  const lastUpdated = "September 11, 2026";

  const sections = [
    { id: "acceptance-terms", title: "1. Acceptance & Eligibility" },
    { id: "platform-nature", title: "2. Nature of Services" },
    { id: "account-verification", title: "3. Accounts & Verification" },
    { id: "mentee-conduct", title: "4. Student Code of Conduct" },
    { id: "mentor-obligations", title: "5. Mentor Obligations" },
    { id: "bookings-refunds", title: "6. Bookings, Cancellations & Refunds" },
    { id: "intellectual-property", title: "7. Intellectual Property" },
    { id: "disclaimers-liability", title: "8. Disclaimers & Limitation of Liability" },
    { id: "governing-law", title: "9. Governing Law & Dispute Resolution" },
  ];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAF5FF] text-[#1E1B4B]">
      <HomepageHeader />

      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-violet-100/80 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div
          className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#7C3AED]/10 blur-[100px]"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -right-20 top-10 h-80 w-80 rounded-full bg-[#F97316]/[0.08] blur-[110px]"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="mb-6 flex items-center gap-2 text-xs font-medium text-slate-500"
          >
            <Link href="/" className="transition hover:text-[#7C3AED]">
              Home
            </Link>
            <ChevronRight className="size-3 text-slate-400" />
            <span className="text-slate-400">Legal</span>
            <ChevronRight className="size-3 text-slate-400" />
            <span className="font-semibold text-[#7C3AED]">Terms of Service</span>
          </nav>

          <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/80 bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[#7C3AED] shadow-[0_2px_10px_-4px_rgba(124,58,237,0.12)] backdrop-blur-sm">
            <Scale className="size-3.5 text-[#7C3AED]" />
            <span>User Agreement &amp; Rules</span>
          </div>

          <h1 className="mt-4 text-balance text-3xl font-extrabold tracking-tight text-[#1E1B4B] sm:text-4xl lg:text-5xl">
            Terms of Service
          </h1>

          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            Welcome to Mentra. These Terms of Service govern your access to and use of our platform, booking marketplace, community circles, and mentorship sessions. Please read these terms carefully before booking or offering guidance.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-500">
            <span className="rounded-full border border-violet-200/70 bg-white/80 px-3 py-1 text-[#7C3AED] shadow-xs">
              Effective Date: {lastUpdated}
            </span>
            <span className="rounded-full border border-violet-100 bg-white/60 px-3 py-1 text-slate-600">
              Version 3.1
            </span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span className="text-slate-500">Binding Agreement</span>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <section className="relative px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-4xl gap-10 lg:grid-cols-[240px_1fr] lg:gap-14">
          {/* Sticky Table of Contents Sidebar for Desktop */}
          <aside className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-violet-200/60 bg-white/80 p-4 shadow-[0_10px_30px_-15px_rgba(124,58,237,0.08)] backdrop-blur-xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#7C3AED]">
                Terms Sections
              </p>
              <nav className="flex flex-col space-y-1.5 text-xs font-medium text-slate-600">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="rounded-lg px-2.5 py-1.5 transition hover:bg-violet-50 hover:text-[#7C3AED]"
                  >
                    {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Legal Body Articles */}
          <div className="space-y-10 text-slate-600 leading-relaxed">
            {/* Essential Principle Box */}
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/80 to-white/90 p-6 text-amber-950 shadow-[0_10px_30px_-15px_rgba(245,158,11,0.08)] backdrop-blur-sm sm:p-7">
              <div className="flex items-center gap-2.5 font-bold text-amber-900">
                <ShieldAlert className="size-5 text-amber-600" />
                <h2 className="text-lg text-[#1E1B4B]">Honest Peer Guidance Disclaimer</h2>
              </div>
              <p className="mt-2.5 text-sm leading-6 text-slate-700">
                Mentra is a peer-to-peer mentorship platform connecting school students and college aspirants with verified undergraduate and postgraduate seniors who have recently navigated the same academic pathways. Mentors share their lived personal experiences, study strategies, and campus insights. Mentra does not guarantee college admissions, examination percentiles, job placements, or visa approvals.
              </p>
            </div>

            {/* Section 1 */}
            <article id="acceptance-terms" className="scroll-mt-28 space-y-4">
              <h2 className="text-xl font-bold text-[#1E1B4B] sm:text-2xl">
                1. Acceptance &amp; Eligibility
              </h2>
              <p className="text-sm sm:text-base">
                By registering an account, browsing mentor listings, or booking a guidance session on Mentra, you represent and warrant that:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600 sm:text-base">
                <li>
                  You are at least 13 years of age. Users under 18 years of age
                  require consent and oversight from a parent or legal guardian.
                </li>
                <li>
                  All profile registration details provided (including name,
                  school/college, and email) are truthful and accurate.
                </li>
                <li>
                  You agree to comply with all applicable local, state, national,
                  and international laws and regulations.
                </li>
              </ul>
            </article>

            {/* Section 2 */}
            <article id="platform-nature" className="scroll-mt-28 space-y-4">
              <h2 className="text-xl font-bold text-[#1E1B4B] sm:text-2xl">
                2. Nature of Services
              </h2>
              <p className="text-sm sm:text-base">
                Mentra provides a technology marketplace enabling:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600 sm:text-base">
                <li>
                  Discovery and filtered search of verified college seniors across
                  streams (Engineering, Medicine, Commerce, Law, Arts, Management).
                </li>
                <li>
                  Direct scheduling of free 15-minute introductory alignment calls
                  and in-depth paid 1:1 guidance sessions.
                </li>
                <li>
                  Access to moderated city-based and stream-specific student peer
                  community circles.
                </li>
              </ul>
              <p className="text-sm sm:text-base">
                Mentra acts solely as an intermediary and technology facilitator
                between independent students and independent mentors.
              </p>
            </article>

            {/* Section 3 */}
            <article id="account-verification" className="scroll-mt-28 space-y-4">
              <h2 className="text-xl font-bold text-[#1E1B4B] sm:text-2xl">
                3. Accounts &amp; Mentor Verification
              </h2>
              <p className="text-sm sm:text-base">
                Mentors must submit verifiable documentation of their educational
                credentials (college student ID card, official alumni institutional
                email, examination scorecards) before their profile is marked with
                the verified badge. Mentra reserves the absolute right to suspend
                or remove any profile that falsifies academic credentials or
                impersonates another person.
              </p>
            </article>

            {/* Section 4 */}
            <article id="mentee-conduct" className="scroll-mt-28 space-y-4">
              <h2 className="text-xl font-bold text-[#1E1B4B] sm:text-2xl">
                4. Student Code of Conduct
              </h2>
              <p className="text-sm sm:text-base">
                To maintain a supportive, harassment-free environment for all
                seniors and juniors:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600 sm:text-base">
                <li>
                  Do not record video or audio of guidance sessions without explicit
                  written consent from the mentor.
                </li>
                <li>
                  Do not solicit mentors to complete academic assignments, write
                  examination answers, or commit academic dishonesty.
                </li>
                <li>
                  Harassment, abusive language, discrimination based on gender,
                  caste, religion, or sexual orientation will result in immediate
                  permanent banning.
                </li>
              </ul>
            </article>

            {/* Section 5 */}
            <article id="mentor-obligations" className="scroll-mt-28 space-y-4">
              <h2 className="text-xl font-bold text-[#1E1B4B] sm:text-2xl">
                5. Mentor Obligations &amp; Standards
              </h2>
              <p className="text-sm sm:text-base">
                Verified mentors on Mentra agree to:
              </p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-slate-600 sm:text-base">
                <li>
                  Attend all booked sessions punctually and provide focused,
                  constructive, and supportive advice.
                </li>
                <li>
                  Never solicit students to move transactions off-platform or
                  request payments via private UPI accounts.
                </li>
                <li>
                  Maintain strict confidentiality regarding student doubts,
                  vulnerability, family context, and academic standing.
                </li>
              </ul>
            </article>

            {/* Section 6 */}
            <article id="bookings-refunds" className="scroll-mt-28 space-y-4">
              <h2 className="text-xl font-bold text-[#1E1B4B] sm:text-2xl">
                6. Bookings, Cancellations &amp; Refund Policy
              </h2>
              <div className="space-y-4 pl-1 text-sm sm:text-base">
                <div className="rounded-xl border border-violet-100 bg-white/70 p-4">
                  <h3 className="font-semibold text-[#1E1B4B]">
                    A. Free 15-Minute Intro Sessions:
                  </h3>
                  <p className="mt-1.5 text-slate-600">
                    Students may book one free 15-minute intro session per mentor
                    to confirm fit and chemistry with zero financial commitment.
                  </p>
                </div>
                <div className="rounded-xl border border-violet-100 bg-white/70 p-4">
                  <h3 className="font-semibold text-[#1E1B4B]">
                    B. Cancellation &amp; Rescheduling:
                  </h3>
                  <p className="mt-1.5 text-slate-600">
                    Sessions may be rescheduled without penalty up to <strong>2
                    hours prior</strong> to the scheduled start time through your
                    student dashboard.
                  </p>
                </div>
                <div className="rounded-xl border border-violet-100 bg-white/70 p-4">
                  <h3 className="font-semibold text-[#1E1B4B]">
                    C. 100% Refund Guarantee:
                  </h3>
                  <p className="mt-1.5 text-slate-600">
                    If a mentor fails to join the call within 10 minutes of the
                    session time or if technical issues prevent the call, the
                    student will receive a full 100% refund credited back to the
                    original payment method within 5-7 business days.
                  </p>
                </div>
              </div>
            </article>

            {/* Section 7 */}
            <article id="intellectual-property" className="scroll-mt-28 space-y-4">
              <h2 className="text-xl font-bold text-[#1E1B4B] sm:text-2xl">
                7. Intellectual Property
              </h2>
              <p className="text-sm sm:text-base">
                The Mentra name, logo, brand design, illustrations, and codebase
                are proprietary trademarks and intellectual property of Mentra
                EdTech Private Limited. You may not copy, reverse-engineer, or
                reproduce platform assets without express written authorization.
              </p>
            </article>

            {/* Section 8 */}
            <article id="disclaimers-liability" className="scroll-mt-28 space-y-4">
              <h2 className="text-xl font-bold text-[#1E1B4B] sm:text-2xl">
                8. Disclaimers &amp; Limitation of Liability
              </h2>
              <p className="text-sm sm:text-base">
                The platform is provided on an &quot;as is&quot; and &quot;as available&quot; basis. To the maximum extent permitted by
                applicable Indian law, Mentra disclaims all express or implied
                warranties. In no event shall Mentra&apos;s aggregate liability
                exceed the total fee paid by the student for the specific session
                giving rise to the dispute.
              </p>
            </article>

            {/* Section 9 */}
            <article id="governing-law" className="scroll-mt-28 space-y-4">
              <h2 className="text-xl font-bold text-[#1E1B4B] sm:text-2xl">
                9. Governing Law &amp; Dispute Resolution
              </h2>
              <p className="text-sm sm:text-base">
                These Terms shall be governed by and construed in accordance with
                the laws of the Republic of India. Any legal dispute or controversy
                arising out of these Terms shall be subject to the exclusive
                jurisdiction of the competent courts in New Delhi, India.
              </p>
              <div className="rounded-2xl border border-violet-200/80 bg-white/90 p-6 shadow-[0_10px_30px_-15px_rgba(124,58,237,0.08)] sm:p-7 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-violet-100 text-[#7C3AED]">
                    <Mail className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1E1B4B]">
                      Legal Team Contact
                    </h3>
                    <p className="text-xs text-slate-500">
                      Mentra EdTech Private Limited
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                  <p>
                    <strong className="text-[#1E1B4B]">Email:</strong>{" "}
                    <a href="mailto:legal@mentra.in" className="text-[#7C3AED] hover:underline">
                      legal@mentra.in
                    </a>{" "}
                    /{" "}
                    <a href="mailto:support@mentra.in" className="text-[#7C3AED] hover:underline">
                      support@mentra.in
                    </a>
                  </p>
                  <p>
                    <strong className="text-[#1E1B4B]">Response Time:</strong> Within 48 hours for legal and booking inquiries.
                  </p>
                </div>
              </div>
            </article>

            {/* Bottom Navigation Link */}
            <div className="border-t border-violet-100/80 pt-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1E1B4B] shadow-xs transition duration-200 hover:-translate-y-0.5 hover:bg-violet-50 hover:text-[#7C3AED]"
              >
                <ArrowLeft className="size-4" />
                Back to Mentra Home
              </Link>
            </div>
          </div>
        </div>
      </section>

      <HomepageFooter />
    </main>
  );
}
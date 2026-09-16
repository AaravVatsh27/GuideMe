import type { Route } from "next";
import Link from "next/link";
import { MentraLogo } from "@/components/brand/MentraLogo";

export function HomepageFooter() {
  return (
    <footer className="border-t border-violet-100 bg-[#FAF5FF]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              aria-label="Mentra home"
              className="inline-flex items-center transition-opacity hover:opacity-90"
            >
              <MentraLogo
                variant="color"
                layout="horizontal"
                showTagline={true}
                size="sm"
              />
            </Link>

            <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
              Your senior friend · your guide. Talk to a verified college senior who has lived your path.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-slate-600"
          >
            <Link
              href="/find-mentor"
              className="transition-colors hover:text-[#7C3AED]"
            >
              Find a Mentor
            </Link>

            <Link
              href="/#how-it-works"
              className="transition-colors hover:text-[#7C3AED]"
            >
              How it Works
            </Link>

            <Link
              href="/#pricing"
              className="transition-colors hover:text-[#7C3AED]"
            >
              Pricing
            </Link>

            <Link
              href="/#for-mentors"
              className="transition-colors hover:text-[#7C3AED]"
            >
              For Mentors
            </Link>

            <Link
              href="/community"
              className="transition-colors hover:text-[#7C3AED]"
            >
              Community
            </Link>

            <Link
              href="/admin/signin"
              className="transition-colors hover:text-[#7C3AED]"
            >
              Admin / HR Login
            </Link>
          </nav>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-violet-100 pt-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Mentra. All rights reserved.</p>

          <div className="flex items-center gap-3">
            <Link
              href={"/privacy" as Route}
              className="transition hover:text-slate-600"
            >
              Privacy Policy
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href={"/terms" as Route}
              className="transition hover:text-slate-600"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import type { Route } from "next";
import Link from "next/link";
import { MentraLogo } from "@/Frontend/components/brand/MentraLogo";

export function HomePageFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#07060F]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link
              href="/"
              aria-label="Mentra home"
              className="inline-flex items-center transition-opacity hover:opacity-90 motion-reduce:transition-none"
            >
              <MentraLogo
                variant="light"
                layout="horizontal"
                showTagline={true}
                size="sm"
              />
            </Link>

            <p className="mt-3 max-w-xs text-sm leading-6 text-white/[0.65]">
              Your senior friend · your guide. Talk to seniors reviewed before they go live who have lived your path.
            </p>
          </div>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium"
          >
            <Link
              href="/find-mentor"
              className="text-white/[0.65] transition-colors hover:text-white motion-reduce:transition-none"
            >
              Find a Mentor
            </Link>

            <Link
              href="/#how-it-works"
              className="text-white/[0.65] transition-colors hover:text-white motion-reduce:transition-none"
            >
              How it Works
            </Link>

            <Link
              href="/#pricing"
              className="text-white/[0.65] transition-colors hover:text-white motion-reduce:transition-none"
            >
              Pricing
            </Link>

            <Link
              href="/#for-mentors"
              className="text-white/[0.65] transition-colors hover:text-white motion-reduce:transition-none"
            >
              For Mentors
            </Link>

            <Link
              href="/community"
              className="text-white/[0.65] transition-colors hover:text-white motion-reduce:transition-none"
            >
              Community
            </Link>

            <Link
              href="/admin/signin"
              className="text-white/[0.65] transition-colors hover:text-white motion-reduce:transition-none"
            >
              Admin / HR Login
            </Link>
          </nav>
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-white/[0.08] pt-5 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-white/[0.46]">
            © {new Date().getFullYear()} Mentra. All rights reserved.
          </p>

          <div className="flex items-center gap-3 text-white/[0.65]">
            <Link
              href={"/privacy" as Route}
              className="transition-colors hover:text-white motion-reduce:transition-none"
            >
              Privacy Policy
            </Link>
            <span aria-hidden="true" className="text-white/[0.45]">
              ·
            </span>
            <Link
              href={"/terms" as Route}
              className="transition-colors hover:text-white motion-reduce:transition-none"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

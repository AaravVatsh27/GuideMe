import { HomepageHeader } from "@/Frontend/components/brand/HomepageHeader";
import { HomepageFooter } from "@/Frontend/components/brand/HomepageFooter";
import { getPublicPlatformSnapshot, getPublicReviewSpotlights, type PublicPlatformSnapshot } from "@/Backend/server/public-data";

import { HomeCommunitySection } from "@/Frontend/views/home/community-section";
import { FinalCtaSection } from "@/Frontend/views/home/final-cta-section";
import { HeroSection, TrustStrip } from "@/Frontend/views/home/hero-section";
import { MentorIncomeSection } from "@/Frontend/views/home/mentor-income-section";
import { MentorsSection } from "@/Frontend/views/home/mentors-section";
import { PricingSection } from "@/Frontend/views/home/pricing-section";
import { ProblemSection } from "@/Frontend/views/home/problem-section";
import { TestimonialsSection } from "@/Frontend/views/home/testimonials-section";

export const dynamic = "force-dynamic";

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

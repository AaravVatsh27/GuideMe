import { HomePageHeader } from "@/Frontend/views/home/home-page-header";
import { HomePageFooter } from "@/Frontend/views/home/home-page-footer";
import { HomeHowItWorksSection } from "@/Frontend/views/home/how-it-works-section";
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
    <main className="mentra-home min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--text)]">
      <HomePageHeader />

      <HeroSection snapshot={pageSnapshot} />

      <TrustStrip snapshot={pageSnapshot} />

      <ProblemSection />

      <HomeHowItWorksSection />

      <MentorsSection snapshot={pageSnapshot} />

      <TestimonialsSection snapshot={pageSnapshot} />

      <PricingSection snapshot={pageSnapshot} />

      <MentorIncomeSection snapshot={pageSnapshot} />

      <HomeCommunitySection />

      <FinalCtaSection snapshot={pageSnapshot} />

      <HomePageFooter />
    </main>
  );
}

import {
  MarketingMentorPlacement,
  MarketingNavPlacement,
  type MarketingHeroStat,
  type MarketingMentor,
  type MarketingMentorBenefit,
  type MarketingNavLink,
  type MarketingPricingTier,
  type MarketingProblemStat,
  type MarketingSiteSetting,
  type MarketingTestimonial,
} from "@prisma/client";

import { db } from "@/lib/db";

export type MarketingNavGroup = MarketingNavPlacement;

export type MarketingPageData = {
  heroStats: MarketingHeroStat[];
  heroSpotlightMentor: MarketingMentor | null;
  schoolMentors: MarketingMentor[];
  ugMentors: MarketingMentor[];
  problemStats: MarketingProblemStat[];
  testimonials: MarketingTestimonial[];
  pricingTiers: MarketingPricingTier[];
  mentorBenefits: MarketingMentorBenefit[];
  navLinks: Record<MarketingNavGroup, MarketingNavLink[]>;
  settings: Map<string, string>;
};

const EMPTY_NAV_LINKS: Record<MarketingNavGroup, MarketingNavLink[]> = {
  HEADER: [],
  MOBILE: [],
  SECTION_NAV: [],
  FOOTER_PLATFORM: [],
  FOOTER_MENTORS: [],
  FOOTER_CONNECT: [],
  FOOTER_LEGAL: [],
};

export async function loadMarketingPageData(): Promise<MarketingPageData> {
  const [
    heroStats,
    mentors,
    problemStats,
    testimonials,
    pricingTiers,
    mentorBenefits,
    navLinkRows,
    settingRows,
  ] = await Promise.all([
    db.marketingHeroStat.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.marketingMentor.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.marketingProblemStat.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.marketingTestimonial.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.marketingPricingTier.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.marketingMentorBenefit.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.marketingNavLink.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.marketingSiteSetting.findMany(),
  ]);

  const heroSpotlightMentor =
    mentors.find(
      (mentor) => mentor.placement === MarketingMentorPlacement.HERO_SPOTLIGHT,
    ) ?? null;
  const schoolMentors = mentors.filter(
    (mentor) => mentor.placement === MarketingMentorPlacement.SCHOOL_GRID,
  );
  const ugMentors = mentors.filter(
    (mentor) => mentor.placement === MarketingMentorPlacement.UG_GRID,
  );

  const navLinks = navLinkRows.reduce<Record<MarketingNavGroup, MarketingNavLink[]>>(
    (acc, link) => {
      acc[link.placement].push(link);
      return acc;
    },
    {
      HEADER: [],
      MOBILE: [],
      SECTION_NAV: [],
      FOOTER_PLATFORM: [],
      FOOTER_MENTORS: [],
      FOOTER_CONNECT: [],
      FOOTER_LEGAL: [],
    },
  );

  const settings = new Map<string, string>();
  for (const setting of settingRows as MarketingSiteSetting[]) {
    settings.set(setting.key, setting.value);
  }

  return {
    heroStats,
    heroSpotlightMentor,
    schoolMentors,
    ugMentors,
    problemStats,
    testimonials,
    pricingTiers,
    mentorBenefits,
    navLinks,
    settings,
  };
}

export function getSetting(
  settings: Map<string, string>,
  key: string,
  fallback = "",
) {
  return settings.get(key) ?? fallback;
}

export function emptyMarketingPageData(): MarketingPageData {
  return {
    heroStats: [],
    heroSpotlightMentor: null,
    schoolMentors: [],
    ugMentors: [],
    problemStats: [],
    testimonials: [],
    pricingTiers: [],
    mentorBenefits: [],
    navLinks: { ...EMPTY_NAV_LINKS },
    settings: new Map(),
  };
}

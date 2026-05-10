import {
  MarketingMentorAvatarTone,
  MarketingMentorPlacement,
  MarketingNavPlacement,
  MarketingPricingAccent,
  PrismaClient,
} from "@prisma/client";

import { PrismaPg } from "@prisma/adapter-pg";

function getPrismaClient() {
  const datasourceUrl = process.env.DATABASE_URL;

  if (!datasourceUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  return new PrismaClient({
    adapter: new PrismaPg(datasourceUrl),
  });
}

const prisma = getPrismaClient();

async function seedHeroStats() {
  const heroStats = [
    { label: "Trusted by 10,000+ students" },
    { label: "500+ verified mentors" },
    { label: "₹299 avg session" },
  ];

  await prisma.marketingHeroStat.deleteMany();
  await prisma.marketingHeroStat.createMany({
    data: heroStats.map((stat, index) => ({
      label: stat.label,
      sortOrder: index,
    })),
  });
}

async function seedMentors() {
  const mentors: Array<{
    placement: MarketingMentorPlacement;
    initials: string;
    displayName: string;
    collegeBadge?: string;
    laneCopy?: string;
    avatarTone: MarketingMentorAvatarTone;
    tags: string[];
    rating: number;
    sessionsCount: number;
    pricePerSession: number;
    ctaLabel?: string;
    availability?: string;
  }> = [
    {
      placement: MarketingMentorPlacement.HERO_SPOTLIGHT,
      initials: "AS",
      displayName: "Arjun S. · IIT Madras, CSE Year 2",
      avatarTone: MarketingMentorAvatarTone.TEAL,
      tags: ["#JEE2023", "#StreamAdvice", "#PCMGuide"],
      rating: 4.9,
      sessionsCount: 127,
      pricePerSession: 249,
      ctaLabel: "Book Free Intro \u2192",
      availability: "Available now",
    },
    {
      placement: MarketingMentorPlacement.SCHOOL_GRID,
      initials: "AM",
      displayName: "Aanya M. · B.Tech Yr 1, Electrical",
      collegeBadge: "IIT Bombay",
      laneCopy: "School students \u2192 JEE + stream clarity",
      avatarTone: MarketingMentorAvatarTone.TEAL,
      tags: ["#JEE2024", "#PCMStrategy", "#StreamAdvice"],
      rating: 4.9,
      sessionsCount: 163,
      pricePerSession: 199,
    },
    {
      placement: MarketingMentorPlacement.SCHOOL_GRID,
      initials: "KN",
      displayName: "Kabir N. · B.E. Yr 2, Computer Science",
      collegeBadge: "BITS Pilani",
      laneCopy: "School students \u2192 boards + college fit",
      avatarTone: MarketingMentorAvatarTone.TEAL,
      tags: ["#BITSAT2024", "#BoardsBalance", "#CollegeChoice"],
      rating: 4.8,
      sessionsCount: 118,
      pricePerSession: 249,
    },
    {
      placement: MarketingMentorPlacement.SCHOOL_GRID,
      initials: "MS",
      displayName: "Meher S. · Economics Yr 1, Liberal Arts",
      collegeBadge: "Ashoka University",
      laneCopy: "School students \u2192 humanities + applications",
      avatarTone: MarketingMentorAvatarTone.TEAL,
      tags: ["#CUETPrep", "#HumanitiesPath", "#Scholarships"],
      rating: 4.9,
      sessionsCount: 94,
      pricePerSession: 179,
    },
    {
      placement: MarketingMentorPlacement.UG_GRID,
      initials: "PR",
      displayName: "Priya R. · Masters Yr 1, Data Science",
      collegeBadge: "IIT Madras",
      laneCopy: "UG students \u2192 PG guidance",
      avatarTone: MarketingMentorAvatarTone.AMBER,
      tags: ["#GATE2024", "#MBAvsMS", "#CareerSwitch"],
      rating: 4.9,
      sessionsCount: 127,
      pricePerSession: 299,
    },
    {
      placement: MarketingMentorPlacement.UG_GRID,
      initials: "RT",
      displayName: "Raghav T. · MBA Yr 1, Product Strategy",
      collegeBadge: "IIM Bangalore",
      laneCopy: "UG students \u2192 MBA roadmap",
      avatarTone: MarketingMentorAvatarTone.AMBER,
      tags: ["#CAT2024", "#ProfileBuilding", "#ProductCareers"],
      rating: 4.8,
      sessionsCount: 88,
      pricePerSession: 349,
    },
    {
      placement: MarketingMentorPlacement.UG_GRID,
      initials: "NP",
      displayName: "Neha P. · M.Tech Yr 1, AI Systems",
      collegeBadge: "IISc Bengaluru",
      laneCopy: "UG students \u2192 research + higher studies",
      avatarTone: MarketingMentorAvatarTone.AMBER,
      tags: ["#MSAbroad", "#ResearchLabs", "#GatePrep"],
      rating: 5.0,
      sessionsCount: 64,
      pricePerSession: 279,
    },
  ];

  await prisma.marketingMentor.deleteMany();
  await prisma.marketingMentor.createMany({
    data: mentors.map((mentor, index) => ({
      placement: mentor.placement,
      initials: mentor.initials,
      displayName: mentor.displayName,
      collegeBadge: mentor.collegeBadge,
      laneCopy: mentor.laneCopy,
      avatarTone: mentor.avatarTone,
      tags: mentor.tags,
      rating: mentor.rating,
      sessionsCount: mentor.sessionsCount,
      pricePerSession: mentor.pricePerSession,
      ctaLabel: mentor.ctaLabel ?? "Book Free Intro",
      availability: mentor.availability ?? "Online",
      sortOrder: index,
    })),
  });
}

async function seedProblemStats() {
  const stats = [
    {
      value: 93,
      suffix: "%",
      ariaLabel: "93 percent",
      copy: "Students aware of only 7 career options out of 250+ that exist",
    },
    {
      value: 70,
      suffix: "%",
      ariaLabel: "70 percent",
      copy: "Choose stream due to parental pressure, not personal aptitude",
    },
    {
      value: 3000,
      suffix: ":1",
      ariaLabel: "3000 to 1",
      copy: "Student to counsellor ratio in India (global standard: 250:1)",
    },
    {
      value: 93,
      suffix: "%",
      ariaLabel: "93 percent",
      copy: "Indian schools have zero dedicated career counsellors",
    },
  ];

  await prisma.marketingProblemStat.deleteMany();
  await prisma.marketingProblemStat.createMany({
    data: stats.map((stat, index) => ({
      ...stat,
      sortOrder: index,
    })),
  });
}

async function seedTestimonials() {
  const testimonials = [
    {
      quote:
        "\"I was going to take PCM just because my parents wanted it. One session with my mentor made me realise Commerce with Maths was actually perfect for me. Got into SRCC.\"",
      studentName: "Sneha K.",
      studentDetail: "Class 11, Jaipur",
      mentorMention: "Mentored by Arjun S., IIT Madras",
      ratingDisplay: "\u2605\u2605\u2605\u2605\u2605",
    },
    {
      quote:
        "\"I had no idea GATE even existed as a path. My mentor walked me through exactly what she did to crack it. I'm now preparing seriously.\"",
      studentName: "Rahul M.",
      studentDetail: "UG Year 3, Pune",
      mentorMention: "Mentored by Neha P., IISc Bengaluru",
      ratingDisplay: "\u2605\u2605\u2605\u2605\u2605",
    },
    {
      quote:
        "\"Spent \u20b9249 and got more clarity than 2 years of googling. Worth every rupee.\"",
      studentName: "Ananya T.",
      studentDetail: "Class 10, Coimbatore",
      mentorMention: "Mentored by Kabir N., BITS Pilani",
      ratingDisplay: "\u2605\u2605\u2605\u2605\u2605",
    },
    {
      quote:
        "\"My mentor told me which NITs actually have good placements vs which just have good rankings. No one talks about this stuff online.\"",
      studentName: "Vikram S.",
      studentDetail: "Class 12, Bhopal",
      mentorMention: "Mentored by Aanya M., IIT Bombay",
      ratingDisplay: "\u2605\u2605\u2605\u2605\u2606",
    },
    {
      quote:
        "\"Everyone around me kept saying BBA because it sounded safe. My mentor broke down the actual outcomes, college quality, and where Economics would give me better options. I finally stopped guessing.\"",
      studentName: "Ritesh P.",
      studentDetail: "Class 12, Indore",
      mentorMention: "Mentored by Meher S., Ashoka University",
      ratingDisplay: "\u2605\u2605\u2605\u2605\u2605",
    },
    {
      quote:
        "\"I thought CAT was the only serious option after engineering. My mentor mapped out MS, product roles, and when each path actually makes sense. That changed how I'm planning final year.\"",
      studentName: "Farah A.",
      studentDetail: "UG Year 2, Hyderabad",
      mentorMention: "Mentored by Raghav T., IIM Bangalore",
      ratingDisplay: "\u2605\u2605\u2605\u2605\u2605",
    },
  ];

  await prisma.marketingTestimonial.deleteMany();
  await prisma.marketingTestimonial.createMany({
    data: testimonials.map((testimonial, index) => ({
      ...testimonial,
      sortOrder: index,
    })),
  });
}

async function seedPricingTiers() {
  const tiers = [
    {
      tierKey: "rising",
      name: "Rising Mentor",
      priceRange: "\u20b999 - \u20b9149",
      collegeLine: "Good college, Year 1-2",
      fitLine: "Best for: Tier 3 cities, budget-conscious students",
      features: [
        "Stream guidance",
        "Exam roadmap",
        "Resource recs",
        "30 min session",
      ],
      accent: MarketingPricingAccent.TEAL,
      badge: null,
    },
    {
      tierKey: "verified",
      name: "Verified Mentor",
      priceRange: "\u20b9199 - \u20b9299",
      collegeLine: "NIT / Top State College",
      fitLine: "Best for: Tier 2 cities, serious planners",
      features: [
        "Stream guidance",
        "Exam roadmap",
        "Resource recs",
        "30 min session",
        "College selection advice",
        "Follow-up chat",
      ],
      accent: MarketingPricingAccent.POPULAR,
      badge: "MOST POPULAR",
    },
    {
      tierKey: "elite",
      name: "Elite Mentor",
      priceRange: "\u20b9399 - \u20b9599",
      collegeLine: "IIT / AIIMS / IIM / NLU",
      fitLine: "Best for: Tier 1, high-stakes decisions",
      features: [
        "Stream guidance",
        "Exam roadmap",
        "College selection advice",
        "Follow-up chat",
        "Priority booking",
        "LinkedIn review",
        "45 min session",
      ],
      accent: MarketingPricingAccent.AMBER,
      badge: null,
    },
  ];

  await prisma.marketingPricingTier.deleteMany();

  for (let index = 0; index < tiers.length; index += 1) {
    const tier = tiers[index];

    await prisma.marketingPricingTier.upsert({
      where: { tierKey: tier.tierKey },
      create: {
        ...tier,
        sortOrder: index,
      },
      update: {
        ...tier,
        sortOrder: index,
      },
    });
  }
}

async function seedMentorBenefits() {
  const benefits = [
    {
      iconKey: "earnings",
      title: "Earn \u20b915,000-40,000/month",
      body: "Just 3-5 sessions a week. Better than any internship.",
    },
    {
      iconKey: "resume",
      title: "Build your resume",
      body: "Verified mentorship certificate after 10 sessions. Real LinkedIn value.",
    },
    {
      iconKey: "community",
      title: "Join the community",
      body: "Private mentor network. Weekly leaderboard. Monthly rewards.",
    },
  ];

  await prisma.marketingMentorBenefit.deleteMany();
  await prisma.marketingMentorBenefit.createMany({
    data: benefits.map((benefit, index) => ({
      ...benefit,
      sortOrder: index,
    })),
  });
}

async function seedNavLinks() {
  const headerLinks = [
    { label: "Home", href: "#top" },
    { label: "How it Works", href: "#tokens" },
    { label: "Find a Mentor", href: "#mentors" },
    { label: "For Mentors", href: "#for-mentors" },
    { label: "Pricing", href: "#pricing" },
  ];

  const sectionNavLinks = [
    { label: "Problem", href: "#problem" },
    { label: "Mentors", href: "#mentors" },
    { label: "Testimonials", href: "#testimonials" },
    { label: "Pricing", href: "#pricing" },
    { label: "For Mentors", href: "#for-mentors" },
    { label: "Tokens", href: "#tokens" },
    { label: "Typography", href: "#type" },
    { label: "Components", href: "#components" },
    { label: "Atmosphere", href: "#atmosphere" },
  ];

  const footerPlatform = [
    { label: "How it Works", href: "#tokens" },
    { label: "Find a Mentor", href: "#mentors" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#footer" },
  ];

  const footerMentors = [
    { label: "Become a Mentor", href: "#for-mentors" },
    { label: "Mentor Guidelines", href: "#for-mentors" },
    { label: "Payouts", href: "#for-mentors" },
    { label: "Community", href: "#for-mentors" },
  ];

  const footerConnect = [
    { label: "Instagram", href: "#footer" },
    { label: "LinkedIn", href: "#footer" },
    { label: "Twitter/X", href: "#footer" },
    { label: "WhatsApp Community", href: "#footer" },
  ];

  const footerLegal = [
    { label: "Privacy Policy", href: "#footer" },
    { label: "Terms of Service", href: "#footer" },
  ];

  const placements: Array<{
    placement: MarketingNavPlacement;
    items: Array<{ label: string; href: string }>;
  }> = [
    { placement: MarketingNavPlacement.HEADER, items: headerLinks },
    { placement: MarketingNavPlacement.MOBILE, items: headerLinks },
    { placement: MarketingNavPlacement.SECTION_NAV, items: sectionNavLinks },
    { placement: MarketingNavPlacement.FOOTER_PLATFORM, items: footerPlatform },
    { placement: MarketingNavPlacement.FOOTER_MENTORS, items: footerMentors },
    { placement: MarketingNavPlacement.FOOTER_CONNECT, items: footerConnect },
    { placement: MarketingNavPlacement.FOOTER_LEGAL, items: footerLegal },
  ];

  await prisma.marketingNavLink.deleteMany();

  for (const group of placements) {
    await prisma.marketingNavLink.createMany({
      data: group.items.map((item, index) => ({
        placement: group.placement,
        label: item.label,
        href: item.href,
        sortOrder: index,
      })),
    });
  }
}

async function seedSiteSettings() {
  const settings: Array<{ key: string; value: string; description?: string }> = [
    { key: "hero.badge", value: "India's #1 Near-Peer Mentoring Platform" },
    { key: "hero.titleLine1", value: "The Senior Friend" },
    { key: "hero.titleLine2", value: "Every Student" },
    { key: "hero.titleAccent", value: "Deserves." },
    {
      key: "hero.subheading",
      value:
        "Connect with college students who just cracked the same exams, chose the same stream, faced the same confusion \u2014 and came out the other side.",
    },
    { key: "hero.ctaPrimaryLabel", value: "Find My Mentor \u2192" },
    { key: "hero.ctaPrimaryHref", value: "#mentors" },
    { key: "hero.ctaSecondaryLabel", value: "Become a Mentor" },
    { key: "hero.ctaSecondaryHref", value: "#for-mentors" },

    { key: "navActions.becomeMentorLabel", value: "Become a Mentor" },
    { key: "navActions.becomeMentorHref", value: "#for-mentors" },
    { key: "navActions.findMentorLabel", value: "Find My Mentor" },
    { key: "navActions.findMentorHref", value: "#mentors" },

    { key: "mobileMenu.label", value: "Navigate GuideMe" },
    {
      key: "mobileMenu.blurb",
      value:
        "Mentorship for exams, college, and first-career decisions, wrapped in a quieter dark-luxury interface.",
    },

    { key: "problem.heading", value: "A crisis hiding in plain sight" },
    {
      key: "problem.callout",
      value:
        "\"One honest conversation with the right senior could have changed everything. That conversation doesn't happen today.\"",
    },

    { key: "mentors.kicker", value: "Meet Your Mentors" },
    {
      key: "mentors.heading",
      value: "Real students. Real experience. Real guidance.",
    },
    {
      key: "mentors.subcopy",
      value:
        "Every mentor on GuideMe recently lived the exact decisions you're facing.",
    },
    { key: "mentors.filterSchoolLabel", value: "For School Students" },
    { key: "mentors.filterUgLabel", value: "For UG Students" },

    { key: "testimonials.kicker", value: "Testimonials" },
    { key: "testimonials.heading", value: "Students who found clarity" },

    { key: "pricing.kicker", value: "Pricing" },
    {
      key: "pricing.heading",
      value: "Pay only for what you need. No subscriptions.",
    },
    {
      key: "pricing.subcopy",
      value:
        "Mentors set their own price. You choose based on your budget and their experience.",
    },
    { key: "pricing.revenueMentorLabel", value: "Mentor 80%" },
    { key: "pricing.revenuePlatformLabel", value: "Platform 20%" },
    {
      key: "pricing.revenueNote",
      value: "Mentors earn \u20b938,400/month doing just 4 sessions/week.",
    },

    { key: "mentorIncome.kicker", value: "FOR MENTORS" },
    { key: "mentorIncome.heading", value: "Turn your experience into income" },
    {
      key: "mentorIncome.subheading",
      value:
        "You just cracked JEE/NEET/CAT. That knowledge is worth something. Help the next batch \u2014 and earn real money doing it.",
    },
    { key: "mentorIncome.calcKicker", value: "Earnings Calculator" },
    { key: "mentorIncome.calcSessionsLabel", value: "Sessions per week" },
    { key: "mentorIncome.calcSessionsMeta", value: "Consistency" },
    { key: "mentorIncome.calcSessionsMin", value: "1" },
    { key: "mentorIncome.calcSessionsMax", value: "10" },
    { key: "mentorIncome.calcSessionsStep", value: "1" },
    { key: "mentorIncome.calcSessionsDefault", value: "4" },
    { key: "mentorIncome.calcPriceLabel", value: "Avg session price" },
    { key: "mentorIncome.calcPriceMeta", value: "Student demand" },
    { key: "mentorIncome.calcPriceMin", value: "99" },
    { key: "mentorIncome.calcPriceMax", value: "599" },
    { key: "mentorIncome.calcPriceStep", value: "10" },
    { key: "mentorIncome.calcPriceDefault", value: "249" },
    { key: "mentorIncome.calcPriceDefaultDisplay", value: "\u20b9249" },
    { key: "mentorIncome.calcEarnLabel", value: "You earn" },
    {
      key: "mentorIncome.calcEarnDefault",
      value: "\u20b912,938 per month",
    },
    {
      key: "mentorIncome.calcNote",
      value:
        "Estimate assumes steady weekly bookings and repeat sessions across the month.",
    },
    {
      key: "mentorIncome.calcCtaLabel",
      value: "Apply to Become a Mentor \u2192",
    },
    {
      key: "mentorIncome.guarantee",
      value:
        "We guarantee your first booking within 7 days or we promote your profile for free.",
    },

    { key: "tokens.kicker", value: "Foundations" },
    {
      key: "tokens.heading",
      value: "Color, spacing, and motion rules that hold the brand together.",
    },
    {
      key: "tokens.subcopy",
      value:
        "The system leans on quiet contrast, restrained glow, and a clear visual hierarchy so students feel guided rather than sold to.",
    },

    { key: "type.kicker", value: "Typography" },
    {
      key: "type.heading",
      value:
        "Syne brings confidence. DM Sans keeps the product calm and readable.",
    },
    {
      key: "type.subcopy",
      value:
        "The heading system should feel decisive and geometric. Body text stays conversational enough for student journeys, mentor discovery, and trust-building flows.",
    },

    { key: "components.kicker", value: "Components" },
    {
      key: "components.heading",
      value:
        "Reusable building blocks for discovery, trust, and booking flows.",
    },
    {
      key: "components.subcopy",
      value:
        "Components stay dense and polished. The tone should feel premium but still approachable to students making high-stakes decisions.",
    },

    { key: "atmosphere.kicker", value: "Atmosphere" },
    {
      key: "atmosphere.heading",
      value:
        "Motion and texture should keep the dark canvas alive without noise.",
    },
    {
      key: "atmosphere.subcopy",
      value:
        "The background behaves like deep space: extremely dark navy, corner glows in teal and mint, and a subtle animated grain layer to stop large surfaces from feeling flat.",
    },

    {
      key: "siteCta.eyebrow",
      value: "YOUR CLARITY IS ONE CONVERSATION AWAY",
    },
    { key: "siteCta.title", value: "Find the senior friend you never had." },
    { key: "siteCta.primaryLabel", value: "Find My Mentor \u2192" },
    { key: "siteCta.primaryHref", value: "#mentors" },
    { key: "siteCta.secondaryLabel", value: "Become a Mentor" },
    { key: "siteCta.secondaryHref", value: "#for-mentors" },
    {
      key: "siteCta.proof",
      value: "Free 10-min intro call \u00b7 No commitment \u00b7 \u20b999 onwards",
    },

    {
      key: "footer.tagline",
      value:
        "Near-peer mentorship for the decisions that shape your student life.",
    },
    { key: "footer.love", value: "Made with \u2764\ufe0f for Indian students" },
    { key: "footer.headingPlatform", value: "Platform" },
    { key: "footer.headingMentors", value: "Mentors" },
    { key: "footer.headingConnect", value: "Connect" },
    { key: "footer.copyright", value: "\u00a9 2025 GuideMe" },
    { key: "footer.builtIn", value: "Built in India" },
  ];

  for (const setting of settings) {
    await prisma.marketingSiteSetting.upsert({
      where: { key: setting.key },
      create: setting,
      update: { value: setting.value, description: setting.description },
    });
  }
}

async function main() {
  console.log("Seeding marketing content...");

  await seedHeroStats();
  await seedMentors();
  await seedProblemStats();
  await seedTestimonials();
  await seedPricingTiers();
  await seedMentorBenefits();
  await seedNavLinks();
  await seedSiteSettings();

  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

import type {
  AcademicCategory,
  InstitutionClassification,
  InstitutionTier,
} from "@prisma/client";

import { db } from "../../src/Backend/server/db";

export interface InstitutionSeed {
  name: string;
  shortName?: string;
  slug: string;

  academicCategory: AcademicCategory;
  institutionClassification: InstitutionClassification;
  institutionTier: InstitutionTier;

  city?: string;
  state?: string;
  website?: string;

  officialSource: string;
  officialId: string;

  /**
   * Domains that are already explicitly trusted for
   * college-email verification.
   *
   * This is NOT the complete website/domain list.
   * Only domains already present in CollegeDomain should
   * be linked by this seed.
   */
  verifiedEmailDomains: string[];
}

export const institutionSeeds: InstitutionSeed[] = [
  // ============================================================
  // IITs
  // ============================================================

  {
    name: "IIT Bombay",
    shortName: "IITB",
    slug: "iit-bombay",
    academicCategory: "ENGINEERING",
    institutionClassification: "IIT",
    institutionTier: "TIER_1",
    city: "Mumbai",
    state: "Maharashtra",
    website: "https://www.iitb.ac.in",
    officialSource: "MANUAL",
    officialId: "iit-bombay",
    verifiedEmailDomains: ["iitb.ac.in"],
  },

  {
    name: "IIT Delhi",
    shortName: "IITD",
    slug: "iit-delhi",
    academicCategory: "ENGINEERING",
    institutionClassification: "IIT",
    institutionTier: "TIER_1",
    city: "New Delhi",
    state: "Delhi",
    website: "https://home.iitd.ac.in",
    officialSource: "MANUAL",
    officialId: "iit-delhi",
    verifiedEmailDomains: ["iitd.ac.in"],
  },

  {
    name: "IIT Madras",
    shortName: "IITM",
    slug: "iit-madras",
    academicCategory: "ENGINEERING",
    institutionClassification: "IIT",
    institutionTier: "TIER_1",
    city: "Chennai",
    state: "Tamil Nadu",
    website: "https://www.iitm.ac.in",
    officialSource: "MANUAL",
    officialId: "iit-madras",
    verifiedEmailDomains: ["iitm.ac.in"],
  },

  {
    name: "IIT Kanpur",
    shortName: "IITK",
    slug: "iit-kanpur",
    academicCategory: "ENGINEERING",
    institutionClassification: "IIT",
    institutionTier: "TIER_1",
    city: "Kanpur",
    state: "Uttar Pradesh",
    website: "https://www.iitk.ac.in",
    officialSource: "MANUAL",
    officialId: "iit-kanpur",
    verifiedEmailDomains: ["iitk.ac.in"],
  },

  {
    name: "IIT Kharagpur",
    shortName: "IITKGP",
    slug: "iit-kharagpur",
    academicCategory: "ENGINEERING",
    institutionClassification: "IIT",
    institutionTier: "TIER_1",
    city: "Kharagpur",
    state: "West Bengal",
    website: "https://www.iitkgp.ac.in",
    officialSource: "MANUAL",
    officialId: "iit-kharagpur",
    verifiedEmailDomains: ["iitkgp.ac.in"],
  },

  {
    name: "IIT Roorkee",
    shortName: "IITR",
    slug: "iit-roorkee",
    academicCategory: "ENGINEERING",
    institutionClassification: "IIT",
    institutionTier: "TIER_1",
    city: "Roorkee",
    state: "Uttarakhand",
    website: "https://www.iitr.ac.in",
    officialSource: "MANUAL",
    officialId: "iit-roorkee",
    verifiedEmailDomains: ["iitr.ac.in"],
  },

  {
    name: "IIT Guwahati",
    shortName: "IITG",
    slug: "iit-guwahati",
    academicCategory: "ENGINEERING",
    institutionClassification: "IIT",
    institutionTier: "TIER_1",
    city: "Guwahati",
    state: "Assam",
    website: "https://iitg.ac.in",
    officialSource: "MANUAL",
    officialId: "iit-guwahati",
    verifiedEmailDomains: ["iitg.ac.in"],
  },

  {
    name: "IIT Hyderabad",
    shortName: "IITH",
    slug: "iit-hyderabad",
    academicCategory: "ENGINEERING",
    institutionClassification: "IIT",
    institutionTier: "TIER_1",
    city: "Hyderabad",
    state: "Telangana",
    website: "https://www.iith.ac.in",
    officialSource: "MANUAL",
    officialId: "iit-hyderabad",
    verifiedEmailDomains: ["iith.ac.in"],
  },

  {
    name: "IIT BHU",
    shortName: "IIT BHU",
    slug: "iit-bhu-varanasi",
    academicCategory: "ENGINEERING",
    institutionClassification: "IIT",
    institutionTier: "TIER_1",
    city: "Varanasi",
    state: "Uttar Pradesh",
    website: "https://www.iitbhu.ac.in",
    officialSource: "MANUAL",
    officialId: "iit-bhu-varanasi",
    verifiedEmailDomains: [],
  },

  // ============================================================
  // AIIMS
  // ============================================================

  {
    name: "All India Institute of Medical Sciences, New Delhi",
    shortName: "AIIMS Delhi",
    slug: "aiims-new-delhi",
    academicCategory: "MEDICAL",
    institutionClassification: "AIIMS",
    institutionTier: "TIER_1",
    city: "New Delhi",
    state: "Delhi",
    website: "https://www.aiims.edu",
    officialSource: "MANUAL",
    officialId: "aiims-new-delhi",
    verifiedEmailDomains: [],
  },

  {
    name: "All India Institute of Medical Sciences, Bhopal",
    shortName: "AIIMS Bhopal",
    slug: "aiims-bhopal",
    academicCategory: "MEDICAL",
    institutionClassification: "AIIMS",
    institutionTier: "TIER_1",
    city: "Bhopal",
    state: "Madhya Pradesh",
    website: "https://aiimsbhopal.edu.in",
    officialSource: "MANUAL",
    officialId: "aiims-bhopal",
    verifiedEmailDomains: [],
  },

  {
    name: "All India Institute of Medical Sciences, Rishikesh",
    shortName: "AIIMS Rishikesh",
    slug: "aiims-rishikesh",
    academicCategory: "MEDICAL",
    institutionClassification: "AIIMS",
    institutionTier: "TIER_1",
    city: "Rishikesh",
    state: "Uttarakhand",
    website: "https://aiimsrishikesh.edu.in",
    officialSource: "MANUAL",
    officialId: "aiims-rishikesh",
    verifiedEmailDomains: [],
  },

  // ============================================================
  // IIMs
  // ============================================================

  {
    name: "Indian Institute of Management Ahmedabad",
    shortName: "IIM Ahmedabad",
    slug: "iim-ahmedabad",
    academicCategory: "MANAGEMENT",
    institutionClassification: "IIM",
    institutionTier: "TIER_1",
    city: "Ahmedabad",
    state: "Gujarat",
    website: "https://www.iima.ac.in",
    officialSource: "MANUAL",
    officialId: "iim-ahmedabad",
    verifiedEmailDomains: [],
  },

  {
    name: "Indian Institute of Management Bangalore",
    shortName: "IIM Bangalore",
    slug: "iim-bangalore",
    academicCategory: "MANAGEMENT",
    institutionClassification: "IIM",
    institutionTier: "TIER_1",
    city: "Bengaluru",
    state: "Karnataka",
    website: "https://www.iimb.ac.in",
    officialSource: "MANUAL",
    officialId: "iim-bangalore",
    verifiedEmailDomains: [],
  },

  {
    name: "Indian Institute of Management Calcutta",
    shortName: "IIM Calcutta",
    slug: "iim-calcutta",
    academicCategory: "MANAGEMENT",
    institutionClassification: "IIM",
    institutionTier: "TIER_1",
    city: "Kolkata",
    state: "West Bengal",
    website: "https://www.iimcal.ac.in",
    officialSource: "MANUAL",
    officialId: "iim-calcutta",
    verifiedEmailDomains: [],
  },

  {
    name: "Indian Institute of Management Lucknow",
    shortName: "IIM Lucknow",
    slug: "iim-lucknow",
    academicCategory: "MANAGEMENT",
    institutionClassification: "IIM",
    institutionTier: "TIER_1",
    city: "Lucknow",
    state: "Uttar Pradesh",
    website: "https://www.iiml.ac.in",
    officialSource: "MANUAL",
    officialId: "iim-lucknow",
    verifiedEmailDomains: [],
  },

  // ============================================================
  // LAW
  // ============================================================

  {
    name: "National Law School of India University",
    shortName: "NLSIU",
    slug: "nlsiu-bengaluru",
    academicCategory: "LAW",
    institutionClassification: "NLU",
    institutionTier: "TIER_1",
    city: "Bengaluru",
    state: "Karnataka",
    website: "https://nls.ac.in",
    officialSource: "MANUAL",
    officialId: "nlsiu-bengaluru",
    verifiedEmailDomains: [],
  },

  {
    name: "National Law University, Delhi",
    shortName: "NLU Delhi",
    slug: "nlu-delhi",
    academicCategory: "LAW",
    institutionClassification: "NLU",
    institutionTier: "TIER_1",
    city: "New Delhi",
    state: "Delhi",
    website: "https://nludelhi.ac.in",
    officialSource: "MANUAL",
    officialId: "nlu-delhi",
    verifiedEmailDomains: [],
  },

  {
    name: "NALSAR University of Law",
    shortName: "NALSAR",
    slug: "nalsar-hyderabad",
    academicCategory: "LAW",
    institutionClassification: "NLU",
    institutionTier: "TIER_1",
    city: "Hyderabad",
    state: "Telangana",
    website: "https://www.nalsar.ac.in",
    officialSource: "MANUAL",
    officialId: "nalsar-hyderabad",
    verifiedEmailDomains: [],
  },

  // ============================================================
  // BITS
  // ============================================================

  {
    name: "Birla Institute of Technology and Science, Pilani",
    shortName: "BITS Pilani",
    slug: "bits-pilani",
    academicCategory: "ENGINEERING",
    institutionClassification: "PRIVATE_INSTITUTE",
    institutionTier: "TIER_1",
    city: "Pilani",
    state: "Rajasthan",
    website: "https://www.bits-pilani.ac.in/pilani",
    officialSource: "MANUAL",
    officialId: "bits-pilani",
    verifiedEmailDomains: ["pilani.bits-pilani.ac.in"],
  },

  {
    name: "Birla Institute of Technology and Science, Goa",
    shortName: "BITS Goa",
    slug: "bits-goa",
    academicCategory: "ENGINEERING",
    institutionClassification: "PRIVATE_INSTITUTE",
    institutionTier: "TIER_1",
    city: "Zuarinagar",
    state: "Goa",
    website: "https://www.bits-pilani.ac.in/goa",
    officialSource: "MANUAL",
    officialId: "bits-goa",
    verifiedEmailDomains: ["goa.bits-pilani.ac.in"],
  },

  {
    name: "Birla Institute of Technology and Science, Hyderabad",
    shortName: "BITS Hyderabad",
    slug: "bits-hyderabad",
    academicCategory: "ENGINEERING",
    institutionClassification: "PRIVATE_INSTITUTE",
    institutionTier: "TIER_1",
    city: "Hyderabad",
    state: "Telangana",
    website: "https://www.bits-pilani.ac.in/hyderabad",
    officialSource: "MANUAL",
    officialId: "bits-hyderabad",
    verifiedEmailDomains: ["hyderabad.bits-pilani.ac.in"],
  },

  // ============================================================
  // NITs
  // ============================================================

  {
    name: "National Institute of Technology, Tiruchirappalli",
    shortName: "NIT Trichy",
    slug: "nit-trichy",
    academicCategory: "ENGINEERING",
    institutionClassification: "NIT",
    institutionTier: "TIER_2",
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    website: "https://nitt.edu",
    officialSource: "MANUAL",
    officialId: "nit-trichy",
    verifiedEmailDomains: ["nitt.edu"],
  },

  {
    name: "National Institute of Technology, Warangal",
    shortName: "NIT Warangal",
    slug: "nit-warangal",
    academicCategory: "ENGINEERING",
    institutionClassification: "NIT",
    institutionTier: "TIER_2",
    city: "Warangal",
    state: "Telangana",
    website: "https://nitw.ac.in",
    officialSource: "MANUAL",
    officialId: "nit-warangal",
    verifiedEmailDomains: ["nitw.ac.in"],
  },

  {
    name: "National Institute of Technology Karnataka, Surathkal",
    shortName: "NIT Karnataka",
    slug: "nit-karnataka",
    academicCategory: "ENGINEERING",
    institutionClassification: "NIT",
    institutionTier: "TIER_2",
    city: "Surathkal",
    state: "Karnataka",
    website: "https://www.nitk.edu.in",
    officialSource: "MANUAL",
    officialId: "nit-karnataka",
    verifiedEmailDomains: ["nitk.edu.in"],
  },

  {
    name: "National Institute of Technology, Calicut",
    shortName: "NIT Calicut",
    slug: "nit-calicut",
    academicCategory: "ENGINEERING",
    institutionClassification: "NIT",
    institutionTier: "TIER_2",
    city: "Kozhikode",
    state: "Kerala",
    website: "https://nitc.ac.in",
    officialSource: "MANUAL",
    officialId: "nit-calicut",
    verifiedEmailDomains: ["nitc.ac.in"],
  },

  {
    name: "Motilal Nehru National Institute of Technology, Allahabad",
    shortName: "MNNIT Allahabad",
    slug: "mnnit-allahabad",
    academicCategory: "ENGINEERING",
    institutionClassification: "NIT",
    institutionTier: "TIER_2",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    website: "https://www.mnnit.ac.in",
    officialSource: "MANUAL",
    officialId: "mnnit-allahabad",
    verifiedEmailDomains: [],
  },

  {
    name: "National Institute of Technology, Rourkela",
    shortName: "NIT Rourkela",
    slug: "nit-rourkela",
    academicCategory: "ENGINEERING",
    institutionClassification: "NIT",
    institutionTier: "TIER_2",
    city: "Rourkela",
    state: "Odisha",
    website: "https://nitrkl.ac.in",
    officialSource: "MANUAL",
    officialId: "nit-rourkela",
    verifiedEmailDomains: [],
  },

  // ============================================================
  // BENGALURU ENGINEERING
  // ============================================================

  {
    name: "BMS Institute of Technology and Management",
    shortName: "BMSIT",
    slug: "bmsit-bengaluru",
    academicCategory: "ENGINEERING",
    institutionClassification: "PRIVATE_COLLEGE",
    institutionTier: "TIER_2",
    city: "Bengaluru",
    state: "Karnataka",
    website: "https://bmsit.ac.in",
    officialSource: "MANUAL",
    officialId: "bmsit-bengaluru",
    verifiedEmailDomains: ["bmsit.in"],
  },

  {
    name: "R.V. College of Engineering",
    shortName: "RVCE",
    slug: "rvce-bengaluru",
    academicCategory: "ENGINEERING",
    institutionClassification: "AUTONOMOUS_COLLEGE",
    institutionTier: "TIER_2",
    city: "Bengaluru",
    state: "Karnataka",
    website: "https://rvce.edu.in",
    officialSource: "MANUAL",
    officialId: "rvce-bengaluru",
    verifiedEmailDomains: [],
  },

  {
    name: "PES University",
    shortName: "PESU",
    slug: "pes-university-bengaluru",
    academicCategory: "ENGINEERING",
    institutionClassification: "PRIVATE_UNIVERSITY",
    institutionTier: "TIER_2",
    city: "Bengaluru",
    state: "Karnataka",
    website: "https://pes.edu",
    officialSource: "MANUAL",
    officialId: "pes-university-bengaluru",
    verifiedEmailDomains: [],
  },

  {
    name: "M. S. Ramaiah Institute of Technology",
    shortName: "MSRIT",
    slug: "msrit-bengaluru",
    academicCategory: "ENGINEERING",
    institutionClassification: "AUTONOMOUS_COLLEGE",
    institutionTier: "TIER_2",
    city: "Bengaluru",
    state: "Karnataka",
    website: "https://msrit.edu",
    officialSource: "MANUAL",
    officialId: "msrit-bengaluru",
    verifiedEmailDomains: [],
  },
];

function validateSeedDefinitions(): void {
  const slugs = new Set<string>();
  const verificationDomains = new Set<string>();

  for (const institution of institutionSeeds) {
    if (slugs.has(institution.slug)) {
      throw new Error(
        `Duplicate institution slug: ${institution.slug}`,
      );
    }

    slugs.add(institution.slug);

    for (const rawDomain of institution.verifiedEmailDomains) {
      const domain = rawDomain.trim().toLowerCase();

      if (!domain) {
        throw new Error(
          `Empty verification domain for ${institution.slug}`,
        );
      }

      if (verificationDomains.has(domain)) {
        throw new Error(
          `Duplicate verification domain: ${domain}`,
        );
      }

      verificationDomains.add(domain);
    }
  }
}

async function main(): Promise<void> {
  validateSeedDefinitions();

  console.log(
    `Starting institution seed for ${institutionSeeds.length} institutions...\n`,
  );

  let institutionsProcessed = 0;
  let newlyLinkedDomains = 0;
  const missingTrustedDomains: string[] = [];

  for (const seed of institutionSeeds) {
    const institution = await db.institution.upsert({
      where: {
        slug: seed.slug,
      },

      update: {
        name: seed.name,
        shortName: seed.shortName,
        academicCategory: seed.academicCategory,
        institutionClassification: seed.institutionClassification,
        institutionTier: seed.institutionTier,
        city: seed.city,
        state: seed.state,
        website: seed.website,
        officialSource: seed.officialSource,
        officialId: seed.officialId,
        isActive: true,
      },

      create: {
        name: seed.name,
        shortName: seed.shortName,
        slug: seed.slug,
        academicCategory: seed.academicCategory,
        institutionClassification: seed.institutionClassification,
        institutionTier: seed.institutionTier,
        city: seed.city,
        state: seed.state,
        website: seed.website,
        officialSource: seed.officialSource,
        officialId: seed.officialId,
        isActive: true,
      },
    });

    institutionsProcessed++;

    console.log(
      `✓ ${seed.name} → ${seed.slug}`,
    );

    for (const rawDomain of seed.verifiedEmailDomains) {
      const domain = rawDomain.trim().toLowerCase();

      const existingDomain = await db.collegeDomain.findUnique({
        where: {
          domain,
        },
        select: {
          id: true,
          domain: true,
          institutionId: true,
        },
      });

      if (!existingDomain) {
        missingTrustedDomains.push(domain);

        console.log(
          `  ⚠ Trusted CollegeDomain not found: ${domain}`,
        );

        continue;
      }

      if (existingDomain.institutionId === institution.id) {
        console.log(
          `  ↳ Already linked: ${domain}`,
        );

        continue;
      }

      await db.collegeDomain.update({
        where: {
          domain,
        },
        data: {
          institutionId: institution.id,
        },
      });

      newlyLinkedDomains++;

      console.log(
        `  ↳ Linked existing domain: ${domain}`,
      );
    }
  }

  const totalInstitutions = await db.institution.count();

  const totalCollegeDomains = await db.collegeDomain.count();

  const linkedCollegeDomains = await db.collegeDomain.count({
    where: {
      institutionId: {
        not: null,
      },
    },
  });

  const unlinkedCollegeDomains =
    await db.collegeDomain.findMany({
      where: {
        institutionId: null,
      },
      select: {
        domain: true,
        collegeName: true,
      },
      orderBy: {
        domain: "asc",
      },
    });

  console.log("\n========================================");
  console.log("INSTITUTION SEED COMPLETE");
  console.log("========================================");

  console.log(
    `Institutions processed: ${institutionsProcessed}`,
  );

  console.log(
    `Total institutions in DB: ${totalInstitutions}`,
  );

  console.log(
    `Existing domains newly linked: ${newlyLinkedDomains}`,
  );

  console.log(
    `Total CollegeDomain rows: ${totalCollegeDomains}`,
  );

  console.log(
    `Linked CollegeDomain rows: ${linkedCollegeDomains}`,
  );

  console.log(
    `Unlinked CollegeDomain rows: ${unlinkedCollegeDomains.length}`,
  );

  if (missingTrustedDomains.length > 0) {
    console.log(
      "\nTrusted domains declared by seed but missing from CollegeDomain:",
    );

    for (const domain of missingTrustedDomains) {
      console.log(`  - ${domain}`);
    }
  }

  if (unlinkedCollegeDomains.length > 0) {
    console.log(
      "\nExisting CollegeDomain rows still unlinked:",
    );

    for (const row of unlinkedCollegeDomains) {
      console.log(
        `  - ${row.domain} (${row.collegeName})`,
      );
    }
  }

  console.log("========================================\n");

  if (unlinkedCollegeDomains.length > 0) {
    throw new Error(
      `Backfill incomplete: ${unlinkedCollegeDomains.length} CollegeDomain rows remain unlinked.`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(
      "Institution seed failed:",
      error,
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
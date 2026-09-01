import { db } from "../../src/Backend/server/db";
import { institutionSeeds } from "./institutions";

async function main(): Promise<void> {
  console.log(
    `Running institution seed for ${institutionSeeds.length} institutions...\n`,
  );

  let institutionCount = 0;
  let linkedDomainCount = 0;
  let missingDomainCount = 0;

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

    institutionCount++;

    for (const domain of seed.verifiedEmailDomains) {
      const normalizedDomain = domain.trim().toLowerCase();

      const existingDomain = await db.collegeDomain.findUnique({
        where: {
          domain: normalizedDomain,
        },
        select: {
          id: true,
          domain: true,
          institutionId: true,
        },
      });

      if (!existingDomain) {
        console.log(
          `⚠ Trusted CollegeDomain not found, skipping: ${normalizedDomain}`,
        );
        missingDomainCount++;
        continue;
      }

      if (existingDomain.institutionId === institution.id) {
        console.log(
          `✓ Already linked: ${normalizedDomain} → ${seed.slug}`,
        );
        linkedDomainCount++;
        continue;
      }

      await db.collegeDomain.update({
        where: {
          domain: normalizedDomain,
        },
        data: {
          institutionId: institution.id,
        },
      });

      console.log(
        `✓ Linked: ${normalizedDomain} → ${seed.slug}`,
      );

      linkedDomainCount++;
    }
  }

  const totalInstitutions = await db.institution.count();

  const totalDomains = await db.collegeDomain.count();

  const linkedDomains = await db.collegeDomain.count({
    where: {
      institutionId: {
        not: null,
      },
    },
  });

  const unlinkedDomains = await db.collegeDomain.findMany({
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
  console.log("INSTITUTION SEED SUMMARY");
  console.log("========================================");
  console.log(`Institutions processed: ${institutionCount}`);
  console.log(`Total institutions in DB: ${totalInstitutions}`);
  console.log(`Domain links processed: ${linkedDomainCount}`);
  console.log(`Missing trusted domains: ${missingDomainCount}`);
  console.log(`Total CollegeDomain rows: ${totalDomains}`);
  console.log(`Linked CollegeDomain rows: ${linkedDomains}`);
  console.log(`Unlinked CollegeDomain rows: ${unlinkedDomains.length}`);

  if (unlinkedDomains.length > 0) {
    console.log("\nUnlinked CollegeDomain rows:");

    for (const domain of unlinkedDomains) {
      console.log(
        `  - ${domain.domain} (${domain.collegeName})`,
      );
    }
  }

  console.log("========================================\n");

  if (unlinkedDomains.length > 0) {
    throw new Error(
      `Seed incomplete: ${unlinkedDomains.length} existing CollegeDomain rows are still unlinked.`,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
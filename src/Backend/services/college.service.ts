import { db } from "@/Backend/server/db";

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "icloud.com",
]);

export function isInstitutionalEmail(email: string): boolean {
  const parts = email.trim().toLowerCase().split("@");

  if (parts.length !== 2) {
    return false;
  }

  const domain = parts[1];

  if (!domain || PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return false;
  }

  return (
    domain.endsWith(".ac.in") ||
    domain.endsWith(".edu.in") ||
    domain.endsWith(".edu")
  );
}

export function isVerifiableInstitutionalEmail(
  email: string,
  college?: { recognized: boolean } | null,
): boolean {
  const parts = email.trim().toLowerCase().split("@");

  if (parts.length !== 2) {
    return false;
  }

  const domain = parts[1];

  if (!domain || PERSONAL_EMAIL_DOMAINS.has(domain)) {
    return false;
  }

  return isInstitutionalEmail(email) || college?.recognized === true;
}

export async function resolveCollegeFromEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const domain = normalizedEmail.split("@")[1];

  if (!domain) {
    return null;
  }

  const college = await db.collegeDomain.findUnique({
    where: { domain },
  });

  if (!college || !college.isApproved) {
    return {
      domain,
      recognized: false,
      collegeName: null,
      tier: null,
      type: null,
    };
  }

  return {
    domain,
    recognized: true,
    collegeName: college.collegeName,
    tier: college.tier,
    type: college.type,
  };
}

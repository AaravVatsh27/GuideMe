/** Formatting and pricing helpers for the landing page sections. */

import { type PublicMentorCard, type PublicPlatformSnapshot, type PublicReviewSpotlight } from "@/Backend/server/public-data";
import { formatCurrency } from "@/shared/format";

const SCHOOL_MENTOR_YEARS = new Set([1, 2]);

export function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function getMentorInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "M";
}

export function getMentorGroup(mentor: PublicMentorCard) {
  return mentor.yearOfStudy !== null &&
    SCHOOL_MENTOR_YEARS.has(mentor.yearOfStudy)
    ? "school"
    : "ug";
}

export function getMentorPrice(mentor: PublicMentorCard) {
  return mentor.priceMin && mentor.priceMin > 0
    ? formatCurrency(mentor.priceMin)
    : "View pricing";
}

export function getMentorContext(mentor: PublicMentorCard) {
  const parts = [
    mentor.college,
    mentor.degree,
    mentor.yearLabel,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "Mentor profile";
}

export function getMentorTopic(mentor: PublicMentorCard) {
  return (
    mentor.topicLabels[0] ??
    mentor.examLabels[0] ??
    "Academic guidance"
  );
}

export function getMentorProof(mentor: PublicMentorCard) {
  if (mentor.totalReviews > 0) {
    return `${mentor.avgRating.toFixed(1)} · ${formatNumber(
      mentor.totalReviews,
    )} reviews`;
  }

  if (mentor.totalSessions > 0) {
    return `${formatNumber(mentor.totalSessions)} sessions`;
  }

  return "New mentor";
}

export function getStartingPrice(snapshot: PublicPlatformSnapshot) {
  if (snapshot.minPrice > 0) {
    return formatCurrency(snapshot.minPrice);
  }

  if (snapshot.averagePaidSessionPrice > 0) {
    return formatCurrency(snapshot.averagePaidSessionPrice);
  }

  return "₹—";
}

export function getTypicalPrice(snapshot: PublicPlatformSnapshot) {
  if (snapshot.averagePaidSessionPrice > 0) {
    return formatCurrency(snapshot.averagePaidSessionPrice);
  }

  if (snapshot.minPrice > 0) {
    return formatCurrency(snapshot.minPrice);
  }

  return "₹—";
}

export function getPriceRange(snapshot: PublicPlatformSnapshot) {
  if (snapshot.minPrice > 0 && snapshot.maxPrice > 0) {
    return `${formatCurrency(snapshot.minPrice)} – ${formatCurrency(
      snapshot.maxPrice,
    )}`;
  }

  if (snapshot.minPrice > 0) {
    return `${formatCurrency(snapshot.minPrice)} onwards`;
  }

  return "Pricing updates as mentors go live";
}

function estimateMonthlyEarnings(
  sessionsPerWeek: number,
  averagePrice: number,
) {
  return Math.round(sessionsPerWeek * averagePrice * 4.33 * 0.8);
}

export function getMentorIncomeEstimate(snapshot: PublicPlatformSnapshot) {
  const price =
    snapshot.averagePaidSessionPrice > 0
      ? snapshot.averagePaidSessionPrice
      : snapshot.minPrice > 0
        ? snapshot.minPrice
        : 249;

  return estimateMonthlyEarnings(4, price);
}

export function getReviewInitials(review: PublicReviewSpotlight) {
  return review.studentFirstName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

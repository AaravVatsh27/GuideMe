import fs from "node:fs/promises";
import path from "node:path";
import Script from "next/script";

import {
  getPublicPlatformSnapshot,
  getPublicReviewSpotlights,
  type PublicMentorCard,
  type PublicPlatformSnapshot,
  type PublicReviewSpotlight,
} from "@/server/public-data";

const legacyStaticDir = path.join(process.cwd(), "legacy-static");
const SCHOOL_MENTOR_YEARS = new Set([1, 2]);

export const dynamic = "force-dynamic";

async function readLegacyFile(fileName: string) {
  return fs.readFile(path.join(legacyStaticDir, fileName), "utf8");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNumber(value: number) {
  return value.toLocaleString("en-IN");
}

function formatCurrency(value: number) {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

function getMentorInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "GM";
}

function getMentorGroup(mentor: PublicMentorCard) {
  return mentor.yearOfStudy !== null && SCHOOL_MENTOR_YEARS.has(mentor.yearOfStudy)
    ? "school"
    : "ug";
}

function buildAverageSessionText(snapshot: PublicPlatformSnapshot) {
  return snapshot.averagePaidSessionPrice > 0
    ? `${formatCurrency(snapshot.averagePaidSessionPrice)} avg session`
    : `Free ${snapshot.introMinutes}-min intro`;
}

function buildFloorPriceText(snapshot: PublicPlatformSnapshot) {
  return snapshot.minPrice > 0
    ? `${formatCurrency(snapshot.minPrice)} onwards`
    : "Profiles opening now";
}

function buildLivePriceBandMarkup(snapshot: PublicPlatformSnapshot) {
  if (snapshot.minPrice > 0 && snapshot.maxPrice > 0) {
    return `${formatCurrency(snapshot.minPrice)} - ${formatCurrency(snapshot.maxPrice)} <span>/ current range</span>`;
  }

  return "Mentor pricing unlocks as live profiles go active";
}

function buildTypicalPriceMarkup(snapshot: PublicPlatformSnapshot) {
  return snapshot.averagePaidSessionPrice > 0
    ? `${formatCurrency(snapshot.averagePaidSessionPrice)} <span>/ session</span>`
    : "Awaiting live bookings";
}

function estimateMonthlyEarnings(sessionsPerWeek: number, averagePrice: number) {
  return Math.round(sessionsPerWeek * averagePrice * 4.33 * 3);
}

function roundToNearestTen(value: number) {
  return Math.round(value / 10) * 10;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getCalculatorPriceInputs(snapshot: PublicPlatformSnapshot) {
  const min = snapshot.minPrice > 0 ? roundToNearestTen(snapshot.minPrice) : 100;
  const max = snapshot.maxPrice > 0 ? roundToNearestTen(snapshot.maxPrice) : Math.max(min + 200, 500);
  const normalizedMax = Math.max(max, min + 100);
  const fallbackValue = roundToNearestTen((min + normalizedMax) / 2);
  const baseValue =
    snapshot.averagePaidSessionPrice > 0
      ? roundToNearestTen(snapshot.averagePaidSessionPrice)
      : fallbackValue;

  return {
    min,
    max: normalizedMax,
    value: clamp(baseValue, min, normalizedMax),
  };
}

function buildIncomeRangeText(snapshot: PublicPlatformSnapshot) {
  const calculator = getCalculatorPriceInputs(snapshot);
  const low = estimateMonthlyEarnings(3, calculator.value);
  const high = estimateMonthlyEarnings(5, calculator.value);

  return `Earn around ${formatCurrency(low)}-${formatCurrency(high)}/month`;
}

function buildRevenueNoteText(snapshot: PublicPlatformSnapshot) {
  const calculator = getCalculatorPriceInputs(snapshot);
  const monthlyEstimate = estimateMonthlyEarnings(4, calculator.value);

  return `At the current booking value, 4 sessions/week can generate about ${formatCurrency(monthlyEstimate)}/month.`;
}

function buildMentorDetailLine(mentor: PublicMentorCard) {
  const parts = [mentor.college];

  if (mentor.degree) {
    parts.push(mentor.degree);
  }

  if (mentor.yearOfStudy !== null) {
    parts.push(mentor.yearLabel);
  }

  if (parts.length === 0 && mentor.headline) {
    parts.push(mentor.headline);
  }

  return `${escapeHtml(mentor.name)}${parts.length > 0 ? ` · ${escapeHtml(parts.join(", "))}` : ""}`;
}

function buildMentorBadgeText(mentor: PublicMentorCard) {
  return mentor.college ?? mentor.degree ?? mentor.headline ?? "GuideMe mentor";
}

function buildMentorLane(mentor: PublicMentorCard) {
  const prefix = getMentorGroup(mentor) === "school" ? "School students" : "UG students";
  const labels = [...mentor.examLabels, ...mentor.topicLabels].slice(0, 2);

  if (labels.length === 0) {
    return `${prefix} → live mentor guidance`;
  }

  return `${prefix} → ${labels.join(" + ")}`;
}

function buildTagText(label: string) {
  const compact = label.replace(/[^a-zA-Z0-9]+/g, "");
  return compact ? `#${compact}` : "#GuideMe";
}

function buildMentorTagsMarkup(mentor: PublicMentorCard) {
  const labels = [...mentor.examLabels, ...mentor.topicLabels].slice(0, 3);
  const fallbackLabels =
    getMentorGroup(mentor) === "school"
      ? ["#SchoolMentor", "#LiveProfile"]
      : ["#UGMentor", "#LiveProfile"];

  return (labels.length > 0 ? labels.map(buildTagText) : fallbackLabels)
    .map((label) => `<span>${escapeHtml(label)}</span>`)
    .join("");
}

function buildMentorSocialProof(mentor: PublicMentorCard) {
  if (mentor.totalReviews > 0) {
    const proofCount =
      mentor.totalSessions > 0
        ? `${formatNumber(mentor.totalSessions)} sessions`
        : `${formatNumber(mentor.totalReviews)} reviews`;

    return `⭐ ${mentor.avgRating.toFixed(1)} <span>(${escapeHtml(proofCount)})</span>`;
  }

  if (mentor.totalSessions > 0) {
    return `Live mentor <span>(${formatNumber(mentor.totalSessions)} sessions)</span>`;
  }

  return "New mentor <span>(profile live)</span>";
}

function buildMentorPriceText(mentor: PublicMentorCard) {
  return mentor.priceMin && mentor.priceMin > 0
    ? `${formatCurrency(mentor.priceMin)} / session`
    : "Price on profile";
}

function buildHeroMentorCard(snapshot: PublicPlatformSnapshot) {
  const mentor = snapshot.featuredMentors[0];

  if (!mentor) {
    return `
      <article class="mentor-card-3d">
        <div class="mentor-card-top">
          <div class="mentor-avatar" aria-hidden="true">
            <span>GM</span>
          </div>
          <span class="availability-pill">
            <span class="availability-dot" aria-hidden="true"></span>
            Live feed
          </span>
        </div>

        <div class="mentor-card-body">
          <p class="mentor-card-name">
            The first verified mentor profile will appear here as soon as onboarding is complete.
          </p>

          <div class="mentor-tag-row">
            <span>#LiveProfiles</span>
            <span>#VerifiedNetwork</span>
          </div>

          <div class="mentor-stats">
            <p class="mentor-rating">Homepage cards only show live mentor data</p>
            <p class="mentor-price">Pricing appears when a profile goes live</p>
          </div>

          <a class="btn btn-card-cta" href="/auth/signup?role=MENTOR">Apply as First Mentor →</a>
        </div>
      </article>
    `.trim();
  }

  return `
    <article class="mentor-card-3d">
      <div class="mentor-card-top">
        <div class="mentor-avatar" aria-hidden="true">
          <span>${escapeHtml(getMentorInitials(mentor.name))}</span>
        </div>
        <span class="availability-pill">
          <span class="availability-dot" aria-hidden="true"></span>
          ${mentor.availableThisWeek ? "Available this week" : "Profile live"}
        </span>
      </div>

      <div class="mentor-card-body">
        <p class="mentor-card-name">${buildMentorDetailLine(mentor)}</p>

        <div class="mentor-tag-row">
          ${buildMentorTagsMarkup(mentor)}
        </div>

        <div class="mentor-stats">
          <p class="mentor-rating">${buildMentorSocialProof(mentor)}</p>
          <p class="mentor-price">${escapeHtml(buildMentorPriceText(mentor))}</p>
        </div>

        <a class="btn btn-card-cta" href="${mentor.username ? `/mentor/${encodeURIComponent(mentor.username)}` : "/find-mentor"}">
          ${mentor.username ? "View Mentor Profile →" : "Browse Live Mentors →"}
        </a>
      </div>
    </article>
  `.trim();
}

function buildMentorCarouselMarkup(snapshot: PublicPlatformSnapshot) {
  if (snapshot.featuredMentors.length === 0) {
    return `
      <div class="mentor-fallback-card">
        <p>No live mentors yet. <a href="/auth/signup?role=MENTOR">Apply to become the first profile</a></p>
      </div>
    `.trim();
  }

  return snapshot.featuredMentors
    .map((mentor) => {
      const group = getMentorGroup(mentor);
      const colorClass =
        group === "school" ? "mentor-avatar-shell--teal" : "mentor-avatar-shell--amber";

      return `
        <article class="mentor-profile-card" data-mentor-group="${group}">
          <div class="mentor-profile-top">
            <div class="mentor-avatar-shell ${colorClass}" aria-hidden="true">
              <span>${escapeHtml(getMentorInitials(mentor.name))}</span>
            </div>
            <span class="mentor-online">
              <span class="mentor-online-dot" aria-hidden="true"></span>
              ${mentor.availableThisWeek ? "Online" : "Profile live"}
            </span>
          </div>

          <p class="mentor-college-badge">
            <span>${escapeHtml(buildMentorBadgeText(mentor))}</span>
            <span class="verified-check" aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="8" />
                <path d="m4.7 8.2 2.1 2.1 4.5-4.7" />
              </svg>
            </span>
          </p>
          <h3 class="mentor-profile-name">${buildMentorDetailLine(mentor)}</h3>
          <p class="mentor-profile-lane">${escapeHtml(buildMentorLane(mentor))}</p>
          <div class="mentor-profile-tags">
            ${buildMentorTagsMarkup(mentor)}
          </div>
          <div class="mentor-profile-meta">
            <p>${buildMentorSocialProof(mentor)}</p>
            <p>${escapeHtml(buildMentorPriceText(mentor))}</p>
          </div>
          <a class="btn mentor-profile-cta" href="${mentor.username ? `/mentor/${encodeURIComponent(mentor.username)}` : "/find-mentor"}">
            ${mentor.username ? "View Profile" : "Browse Mentors"}
          </a>
        </article>
      `.trim();
    })
    .join("\n");
}

function buildReviewQuote(review: PublicReviewSpotlight) {
  const text = review.reviewText?.replace(/\s+/g, " ").trim();

  if (text) {
    return `&quot;${escapeHtml(text)}&quot;`;
  }

  return `&quot;${escapeHtml(
    `${review.studentFirstName} left a ${review.rating.toFixed(1)}-star public review after a GuideMe session.`,
  )}&quot;`;
}

function buildReviewStars(rating: number) {
  const filledStars = Math.max(1, Math.min(5, Math.round(rating)));
  return `${"★".repeat(filledStars)}${"☆".repeat(5 - filledStars)}`;
}

function buildTestimonialsMarkup(snapshot: PublicPlatformSnapshot) {
  if (snapshot.reviewSpotlights.length === 0) {
    return `
      <div class="testimonial-fallback-card">
        <p>Public student reviews will appear here after the first completed sessions.</p>
      </div>
    `.trim();
  }

  return snapshot.reviewSpotlights
    .map(
      (review, index) => `
        <article
          class="testimonial-card"
          data-scroll-reveal
          style="--reveal-stagger: ${0.05 + index * 0.07}s"
        >
          <p class="testimonial-quote">
            ${buildReviewQuote(review)}
          </p>
          <div class="testimonial-meta">
            <p class="testimonial-student">${escapeHtml(review.studentFirstName)}${review.studentCity ? `, ${escapeHtml(review.studentCity)}` : ""}</p>
            <p class="testimonial-detail">Reviewed ${escapeHtml(formatDate(review.createdAt))}</p>
            <p class="testimonial-mentor">Mentored by ${escapeHtml(review.mentorName)}${review.mentorCollege ? ` · ${escapeHtml(review.mentorCollege)}` : ""}</p>
            <p class="testimonial-rating">${buildReviewStars(review.rating)}</p>
          </div>
        </article>
      `,
    )
    .join("\n");
}


function buildHeroSection(snapshot: PublicPlatformSnapshot) {
  return `
    <section class="hero" id="top">
      <div class="hero-network" aria-hidden="true">
        <canvas class="hero-network-canvas"></canvas>
      </div>

      <div class="hero-inner">
        <div class="hero-content">
          <div class="hero-badge reveal-item" style="--reveal-delay: 0.1s">
            India's near-peer mentoring platform
          </div>

          <h1
            class="hero-title"
            aria-label="The Senior Friend Every Student Deserves."
          >
            <span class="hero-line">
              <span class="hero-word" style="--word-delay: 0.24s">The</span>
              <span class="hero-word" style="--word-delay: 0.34s">Senior</span>
              <span class="hero-word" style="--word-delay: 0.44s">Friend</span>
            </span>
            <span class="hero-line">
              <span class="hero-word" style="--word-delay: 0.54s">Every</span>
              <span class="hero-word" style="--word-delay: 0.64s">Student</span>
            </span>
            <span class="hero-line hero-line-accent">
              <span class="hero-word hero-word-accent" style="--word-delay: 0.76s">
                Deserves.
              </span>
            </span>
          </h1>

          <p class="hero-subheading reveal-item" style="--reveal-delay: 0.92s">
            Connect with college students who just cracked the same exams,
            chose the same stream, faced the same confusion — and came out
            the other side.
          </p>

          <div class="hero-actions reveal-item" style="--reveal-delay: 1.04s">
            <a class="btn btn-hero-primary" href="/find-mentor">Find My Mentor →</a>
            <a class="btn btn-hero-secondary" href="/auth/signup?role=MENTOR">Become a Mentor</a>
          </div>

          <p class="hero-proof reveal-item" style="--reveal-delay: 1.16s">
            <span data-live-total-students>${formatNumber(snapshot.totalStudents)}</span> students onboarded
            <span aria-hidden="true">·</span>
            <span data-live-total-mentors>${formatNumber(snapshot.totalMentors)}</span> verified mentors
            <span aria-hidden="true">·</span>
            <span data-live-average-price>${escapeHtml(buildAverageSessionText(snapshot))}</span>
          </p>
        </div>

        <div class="mentor-stage">
          <div class="hero-orb hero-orb-teal" aria-hidden="true"></div>
          <div class="hero-orb hero-orb-mint" aria-hidden="true"></div>

          <div class="mentor-card-wrap">
            ${buildHeroMentorCard(snapshot)}
          </div>
        </div>
      </div>
    </section>
  `.trim();
}

function buildProblemSection(snapshot: PublicPlatformSnapshot) {
  const { totalMentors, totalStudents, completedSessions, minPrice } = snapshot;
  type PlatformStat =
    | {
        value: string;
        label: string;
        tone: "metric";
        counterValue: number;
        suffix?: string;
        prefix?: string;
      }
    | {
        value: string;
        label: string;
        tone: "status";
      };

  const problemHighlights = [
    {
      title: "Narrow exposure",
      copy: "Most students hear only a small set of career paths from school, family, or coaching circles.",
    },
    {
      title: "Pressure-led choices",
      copy: "Stream and college decisions often get shaped by pressure before students understand their own fit.",
    },
    {
      title: "Thin guidance access",
      copy: "One-to-one guidance is still hard to find at the moment when students need it most.",
    },
    {
      title: "Late clarity",
      copy: "Students usually discover the right questions only after deadlines, forms, or opportunities have already passed.",
    },
  ];

  const platformStats: PlatformStat[] = [
    {
      value: formatNumber(totalMentors),
      label: "Verified mentors",
      tone: "metric",
      counterValue: totalMentors,
    },
    {
      value: formatNumber(totalStudents),
      label: "Students onboarded",
      tone: "metric",
      counterValue: totalStudents,
    },
    {
      value: formatNumber(completedSessions),
      label: "Sessions completed",
      tone: "metric",
      counterValue: completedSessions,
    },
    minPrice > 0
      ? {
          value: formatCurrency(minPrice),
          label: "Starting price per session",
          tone: "metric",
          counterValue: minPrice,
          prefix: "₹",
        }
      : {
          value: "Not listed",
          label: "Starting price per session",
          tone: "status",
        },
  ];

  return `
    <section class="problem-section section" id="problem">
      <div class="problem-inner">
        <div class="problem-head">
          <p class="section-kicker">The Problem</p>
          <h2>India's students are navigating blind</h2>
        </div>

        <div class="problem-grid">
          ${problemHighlights
            .map(
              (highlight) => `
            <article class="problem-card problem-card--issue">
              <p class="problem-stat problem-stat--issue-title">${highlight.title}</p>
              <p class="problem-copy">${highlight.copy}</p>
            </article>
          `,
            )
            .join("\n")}
        </div>

        <div class="platform-stats-divider">
          <span>Our Live Progress</span>
        </div>

        <div class="problem-grid platform-stats-grid">
          ${platformStats
            .map((stat) => {
              const counterAttributes =
                stat.tone === "metric"
                  ? ` data-counter data-value="${stat.counterValue}"${stat.prefix ? ` data-prefix="${stat.prefix}"` : ""}${stat.suffix ? ` data-suffix="${stat.suffix}"` : ""}`
                  : "";
              const statClassName =
                stat.tone === "metric"
                  ? "problem-stat problem-stat--live"
                  : "problem-stat problem-stat--status";

              return `
            <article class="problem-card platform-card">
              <p class="${statClassName}"${counterAttributes}>
                ${stat.value}
              </p>
              <p class="problem-copy">${stat.label}</p>
            </article>
          `;
            })
            .join("\n")}
        </div>
      </div>
    </section>
  `.trim();
}


function buildMentorsSection(snapshot: PublicPlatformSnapshot) {
  return `
    <section class="mentors-section section" id="mentors">
      <div class="section-head mentors-head">
        <p class="section-kicker">Meet Your Mentors</p>
        <h2>Real students. Real experience. Real guidance.</h2>
        <p>
          Every mentor on GuideMe recently lived the exact decisions you're
          facing.
        </p>
      </div>

      <div class="mentor-filter-row" role="group" aria-label="Mentor filters">
        <button
          class="mentor-filter is-active"
          type="button"
          data-mentor-filter="school"
          aria-pressed="true"
        >
          For School Students
        </button>
        <button
          class="mentor-filter is-active"
          type="button"
          data-mentor-filter="ug"
          aria-pressed="true"
        >
          For UG Students
        </button>
      </div>

      <div class="mentor-carousel-shell">
        <div class="mentor-carousel" data-mentor-carousel>
          ${buildMentorCarouselMarkup(snapshot)}
        </div>
      </div>
    </section>
  `.trim();
}

function buildTestimonialsSection(snapshot: PublicPlatformSnapshot) {
  return `
    <section class="testimonials-section section" id="testimonials">
      <div class="section-head testimonials-head">
        <p class="section-kicker">Testimonials</p>
        <h2>Students who found clarity</h2>
      </div>

      <div class="testimonials-masonry">
        ${buildTestimonialsMarkup(snapshot)}
      </div>
    </section>
  `.trim();
}

function buildPricingSection(snapshot: PublicPlatformSnapshot) {
  return `
    <section class="pricing-section section" id="pricing">
      <div class="section-head pricing-head">
        <p class="section-kicker">Pricing</p>
        <h2>Pay only for what you need. No subscriptions.</h2>
        <p>
          Students start with a free intro, then book current mentor pricing pulled
          from active verified profiles.
        </p>
      </div>

      <div class="pricing-grid">
        <article class="pricing-card pricing-card--teal">
          <div class="pricing-card-top">
            <p class="pricing-tier">Free intro</p>
            <p class="pricing-range">Free ${snapshot.introMinutes}-min call <span>/ first chat</span></p>
            <p class="pricing-college">Start with zero commitment</p>
          </div>
          <p class="pricing-fit">Best for: first-time students who need clarity before booking.</p>
          <ul class="pricing-features">
            <li>Meet the mentor first</li>
            <li>Share your current confusion</li>
            <li>Check communication fit</li>
            <li>Decide next steps calmly</li>
          </ul>
        </article>

        <article class="pricing-card pricing-card--popular">
          <div class="pricing-card-banner">
            <span class="pricing-badge">LIVE AVERAGE</span>
          </div>
          <div class="pricing-card-top">
            <p class="pricing-tier">Typical paid session</p>
            <p class="pricing-range" data-live-typical-price>${buildTypicalPriceMarkup(snapshot)}</p>
            <p class="pricing-college">Based on captured platform bookings</p>
          </div>
          <p class="pricing-fit">Best for: the current center of paid mentor demand on GuideMe.</p>
          <ul class="pricing-features">
            <li>Reflects real paid sessions</li>
            <li>Updates from current platform data</li>
            <li>No fake showcase pricing</li>
            <li>Helps students budget realistically</li>
            <li>Tracks mentor demand over time</li>
            <li>Aligned with live checkout data</li>
          </ul>
        </article>

        <article class="pricing-card pricing-card--amber">
          <div class="pricing-card-top">
            <p class="pricing-tier">Current live range</p>
            <p class="pricing-range" data-live-price-band>${buildLivePriceBandMarkup(snapshot)}</p>
            <p class="pricing-college">Across all active verified mentor profiles</p>
          </div>
          <p class="pricing-fit">Best for: understanding the full spread of available mentor pricing.</p>
          <ul class="pricing-features">
            <li>Low-end and top-end live price points</li>
            <li>Built from current mentor profiles</li>
            <li>Useful for comparing mentor tiers</li>
            <li>Helps set student expectations</li>
            <li>Changes as new mentors join</li>
            <li>Reflects the current public network</li>
            <li>No manual range updates needed</li>
          </ul>
        </article>
      </div>

      <div class="revenue-split-block">
        <div class="revenue-split-track" data-revenue-split>
          <div class="revenue-split-fill revenue-split-fill--mentor">
            <span>Mentor 80%</span>
          </div>
          <div class="revenue-split-fill revenue-split-fill--platform">
            <span>Platform 20%</span>
          </div>
        </div>
        <p class="revenue-split-note" data-live-revenue-note>
          ${escapeHtml(buildRevenueNoteText(snapshot))}
        </p>
      </div>
    </section>
  `.trim();
}

function buildMentorIncomeSection(snapshot: PublicPlatformSnapshot) {
  const calculator = getCalculatorPriceInputs(snapshot);
  const monthlyEstimate = estimateMonthlyEarnings(4, calculator.value);

  return `
    <section class="mentor-income-section section" id="for-mentors">
      <div class="mentor-income-layout">
        <div class="mentor-income-content">
          <p class="section-kicker">FOR MENTORS</p>
          <h2>Turn your experience into income</h2>
          <p class="mentor-income-subheading">
            You just cracked JEE/NEET/CAT. That knowledge is worth
            something. Help the next batch — and earn real money doing it.
          </p>

          <div class="mentor-benefit-list">
            <article class="mentor-benefit-card">
              <div class="mentor-benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v18" />
                  <path d="M16 7.2c0-1.8-1.8-3.2-4-3.2s-4 1.4-4 3.2 1.2 2.7 4 3.3 4 1.4 4 3.4-1.8 3.3-4 3.3-4-1.5-4-3.3" />
                </svg>
              </div>
              <div>
                <h3 data-live-income-range>${escapeHtml(buildIncomeRangeText(snapshot))}</h3>
                <p>Based on 3-5 sessions a week at current live booking values.</p>
              </div>
            </article>

            <article class="mentor-benefit-card">
              <div class="mentor-benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 3.5 4.5 7v5.2c0 4.4 3 8.5 7.5 9.8 4.5-1.3 7.5-5.4 7.5-9.8V7L12 3.5Z" />
                  <path d="m9.2 12.1 1.9 1.9 3.9-4.1" />
                </svg>
              </div>
              <div>
                <h3>Build your resume</h3>
                <p>
                  Verified mentorship certificate after 10 sessions. Real
                  LinkedIn value.
                </p>
              </div>
            </article>

            <article class="mentor-benefit-card">
              <div class="mentor-benefit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M7 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M17 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M12 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path d="M9.5 8.6 10.8 9.4" />
                  <path d="m14.5 8.6-1.3.8" />
                  <path d="m10.8 14.6-1.3.8" />
                  <path d="m13.2 14.6 1.3.8" />
                </svg>
              </div>
              <div>
                <h3>Join the community</h3>
                <p>
                  Private mentor network. Weekly leaderboard. Monthly
                  rewards.
                </p>
              </div>
            </article>
          </div>
        </div>

        <div class="mentor-calc-stage">
          <div class="mentor-calc-orb mentor-calc-orb--teal" aria-hidden="true"></div>
          <div class="mentor-calc-orb mentor-calc-orb--amber" aria-hidden="true"></div>

          <div class="mentor-calc-shell">
            <div class="mentor-calc-widget">
              <p class="panel-label">Earnings Calculator</p>

              <label class="mentor-range-field">
                <span class="mentor-range-label">Sessions per week</span>
                <div class="mentor-range-meta">
                  <span>Consistency</span>
                  <output data-sessions-output>4</output>
                </div>
                <input
                  class="mentor-range-input"
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value="4"
                  data-sessions-range
                />
              </label>

              <label class="mentor-range-field">
                <span class="mentor-range-label">Avg session price</span>
                <div class="mentor-range-meta">
                  <span>Current live range</span>
                  <output data-price-output>${formatCurrency(calculator.value)}</output>
                </div>
                <input
                  class="mentor-range-input"
                  type="range"
                  min="${calculator.min}"
                  max="${calculator.max}"
                  step="10"
                  value="${calculator.value}"
                  data-price-range
                />
              </label>

              <div class="mentor-calc-total">
                <p>You earn</p>
                <p class="mentor-calc-amount" data-monthly-earnings aria-live="polite">
                  ${formatCurrency(monthlyEstimate)} per month
                </p>
                <p class="mentor-calc-note">
                  Estimate uses the current live mentor pricing band and assumes
                  steady weekly bookings.
                </p>
              </div>

              <a class="btn btn-mentor-apply" href="/auth/signup?role=MENTOR">
                Apply to Become a Mentor →
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="mentor-guarantee-strip">
        Current mentor demand and pricing update automatically as profiles,
        bookings, and public sessions go live.
      </div>
    </section>
  `.trim();
}

function buildSiteCtaSection(snapshot: PublicPlatformSnapshot) {
  return `
    <section class="site-cta" id="cta">
      <div class="site-cta-shell">
        <div class="site-cta-orb" aria-hidden="true"></div>

        <div class="site-cta-content">
          <p class="eyebrow site-cta-eyebrow">YOUR CLARITY IS ONE CONVERSATION AWAY</p>
          <h2 class="site-cta-title">Find the senior friend you never had.</h2>

          <div class="site-cta-actions">
            <a class="btn btn-primary site-cta-primary" href="/find-mentor">Find My Mentor →</a>
            <a class="btn btn-ghost site-cta-ghost" href="/auth/signup?role=MENTOR">Become a Mentor</a>
          </div>

          <p class="site-cta-proof">
            <span data-live-intro-copy>Free ${snapshot.introMinutes}-min intro call</span>
            <span aria-hidden="true">·</span>
            No commitment
            <span aria-hidden="true">·</span>
            <span data-live-floor-price>${escapeHtml(buildFloorPriceText(snapshot))}</span>
          </p>
        </div>
      </div>
    </section>
  `.trim();
}

function replaceLegacyBlock(source: string, pattern: RegExp, replacement: string) {
  if (!pattern.test(source)) {
    throw new Error(`Could not replace legacy block for pattern: ${pattern.source}`);
  }

  pattern.lastIndex = 0;
  return source.replace(pattern, replacement);
}

async function getLegacyMarkup(snapshot: PublicPlatformSnapshot) {
  const html = await readLegacyFile("index.html");
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);

  if (!bodyMatch) {
    throw new Error("Could not locate legacy landing page body markup.");
  }

  let markup = bodyMatch[1]
    .replace(/\s*<script\s+src="script\.js"><\/script>\s*/i, "")
    .trim();

  markup = replaceLegacyBlock(
    markup,
    /<section class="hero" id="top">[\s\S]*?<\/section>/,
    buildHeroSection(snapshot),
  );
  markup = replaceLegacyBlock(
    markup,
    /<section class="problem-section section" id="problem">[\s\S]*?<\/section>/,
    buildProblemSection(snapshot),
  );
  markup = replaceLegacyBlock(
    markup,
    /<section class="mentors-section section" id="mentors">[\s\S]*?<\/section>/,
    buildMentorsSection(snapshot),
  );
  markup = replaceLegacyBlock(
    markup,
    /<section class="testimonials-section section" id="testimonials">[\s\S]*?<\/section>/,
    buildTestimonialsSection(snapshot),
  );
  markup = replaceLegacyBlock(
    markup,
    /<section class="pricing-section section" id="pricing">[\s\S]*?<\/section>/,
    buildPricingSection(snapshot),
  );
  markup = replaceLegacyBlock(
    markup,
    /<section class="mentor-income-section section" id="for-mentors">[\s\S]*?<\/section>/,
    buildMentorIncomeSection(snapshot),
  );
  markup = replaceLegacyBlock(
    markup,
    /<section class="site-cta" id="cta">[\s\S]*?<\/section>/,
    buildSiteCtaSection(snapshot),
  );
  markup = markup
    .replace(/\s*<section class="section" id="tokens">[\s\S]*?<\/section>/, "")
    .replace(/\s*<section class="section" id="type">[\s\S]*?<\/section>/, "")
    .replace(/\s*<section class="section" id="components">[\s\S]*?<\/section>/, "")
    .replace(/\s*<section class="section" id="atmosphere">[\s\S]*?<\/section>/, "");
  markup = markup.replace(/© 2025 GuideMe/g, `© ${new Date().getFullYear()} GuideMe`);

  return markup;
}

async function getLegacyScript() {
  const script = await readLegacyFile("script.js");

  return `
    (() => {
      const root = document.querySelector("[data-guideme-landing]");

      if (!root || root.dataset.legacyBound === "true") {
        return;
      }

      root.dataset.legacyBound = "true";
      ${script}
    })();
  `;
}

export default async function Home() {
  const [snapshot, reviews, legacyStyles, legacyScript] = await Promise.all([
    getPublicPlatformSnapshot(),
    getPublicReviewSpotlights(6),
    readLegacyFile("styles.css"),
    getLegacyScript(),
  ]);

  // Ensure snapshot has the fresh reviews for buildTestimonialsMarkup
  snapshot.reviewSpotlights = reviews;

  const legacyMarkup = await getLegacyMarkup(snapshot);

  return (
    <>
      <style
        data-guideme-legacy-styles
        dangerouslySetInnerHTML={{ __html: legacyStyles }}
      />
      <div
        className="guideme-landing"
        data-guideme-landing
        dangerouslySetInnerHTML={{ __html: legacyMarkup }}
      />
      <Script id="guideme-legacy-script" strategy="afterInteractive">
        {legacyScript}
      </Script>
    </>
  );
}

import Script from "next/script";

import "./marketing.css";

import {
  emptyMarketingPageData,
  getSetting,
  loadMarketingPageData,
  type MarketingPageData,
} from "@/lib/marketing";
import {
  type MarketingHeroStat,
  type MarketingMentor,
  type MarketingMentorBenefit,
  type MarketingNavLink,
  type MarketingPricingTier,
  type MarketingProblemStat,
  type MarketingTestimonial,
} from "@prisma/client";

export const dynamic = "force-dynamic";

const AVATAR_TONE_CLASS: Record<MarketingMentor["avatarTone"], string> = {
  TEAL: "mentor-avatar-shell--teal",
  AMBER: "mentor-avatar-shell--amber",
};

const PRICING_ACCENT_CLASS: Record<MarketingPricingTier["accent"], string> = {
  TEAL: "pricing-card--teal",
  POPULAR: "pricing-card--popular",
  AMBER: "pricing-card--amber",
};

const VERIFIED_CHECK_SVG = (
  <span className="verified-check" aria-hidden="true">
    <svg viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" />
      <path d="m4.7 8.2 2.1 2.1 4.5-4.7" />
    </svg>
  </span>
);

const BENEFIT_ICONS: Record<string, JSX.Element> = {
  earnings: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 3v18" />
      <path d="M16 7.2c0-1.8-1.8-3.2-4-3.2s-4 1.4-4 3.2 1.2 2.7 4 3.3 4 1.4 4 3.4-1.8 3.3-4 3.3-4-1.5-4-3.3" />
    </svg>
  ),
  resume: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 3.5 4.5 7v5.2c0 4.4 3 8.5 7.5 9.8 4.5-1.3 7.5-5.4 7.5-9.8V7L12 3.5Z" />
      <path d="m9.2 12.1 1.9 1.9 3.9-4.1" />
    </svg>
  ),
  community: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M7 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M17 10.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M12 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M9.5 8.6 10.8 9.4" />
      <path d="m14.5 8.6-1.3.8" />
      <path d="m10.8 14.6-1.3.8" />
      <path d="m13.2 14.6 1.3.8" />
    </svg>
  ),
};

const BRAND_MARK = (
  <span className="brand-mark" aria-hidden="true">
    <svg viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="14.5" />
      <path d="M20 8.5 23.3 16.7 31.5 20 23.3 23.3 20 31.5 16.7 23.3 8.5 20 16.7 16.7 20 8.5Z" />
      <path d="m20 13.5 1.7 4.8 4.8 1.7-4.8 1.7-1.7 4.8-1.7-4.8-4.8-1.7 4.8-1.7 1.7-4.8Z" />
    </svg>
  </span>
);

const BRAND_WORDMARK = (
  <span className="brand-wordmark">
    <span className="brand-guide">Guide</span>
    <span className="brand-me">Me</span>
  </span>
);

function HeroProof({ stats }: { stats: MarketingHeroStat[] }) {
  return (
    <p className="hero-proof reveal-item" style={{ "--reveal-delay": "1.16s" } as React.CSSProperties}>
      {stats.flatMap((stat, index) =>
        index === 0
          ? [<span key={stat.id}>{stat.label}</span>]
          : [
              <span key={`${stat.id}-sep`} aria-hidden="true">
                ·
              </span>,
              <span key={stat.id}>{stat.label}</span>,
            ],
      )}
    </p>
  );
}

function HeroMentorCard({ mentor }: { mentor: MarketingMentor | null }) {
  if (!mentor) {
    return null;
  }

  return (
    <div className="mentor-stage">
      <div className="hero-orb hero-orb-teal" aria-hidden="true" />
      <div className="hero-orb hero-orb-mint" aria-hidden="true" />

      <div className="mentor-card-wrap">
        <article className="mentor-card-3d">
          <div className="mentor-card-top">
            <div className="mentor-avatar" aria-hidden="true">
              <span>{mentor.initials}</span>
            </div>
            <span className="availability-pill">
              <span className="availability-dot" aria-hidden="true" />
              {mentor.availability}
            </span>
          </div>

          <div className="mentor-card-body">
            <p className="mentor-card-name">{mentor.displayName}</p>

            <div className="mentor-tag-row">
              {mentor.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>

            <div className="mentor-stats">
              <p className="mentor-rating">
                ⭐ {mentor.rating.toFixed(1)} <span>({mentor.sessionsCount} sessions)</span>
              </p>
              <p className="mentor-price">₹{mentor.pricePerSession} / session</p>
            </div>

            <a className="btn btn-card-cta" href="#mentors">
              {mentor.ctaLabel}
            </a>
          </div>
        </article>
      </div>
    </div>
  );
}

function MentorProfileCard({ mentor, group }: { mentor: MarketingMentor; group: "school" | "ug" }) {
  return (
    <article className="mentor-profile-card" data-mentor-group={group}>
      <div className="mentor-profile-top">
        <div
          className={`mentor-avatar-shell ${AVATAR_TONE_CLASS[mentor.avatarTone]}`}
          aria-hidden="true"
        >
          <span>{mentor.initials}</span>
        </div>
        <span className="mentor-online">
          <span className="mentor-online-dot" aria-hidden="true" />
          {mentor.availability}
        </span>
      </div>

      {mentor.collegeBadge ? (
        <p className="mentor-college-badge">
          <span>{mentor.collegeBadge}</span>
          {VERIFIED_CHECK_SVG}
        </p>
      ) : null}

      <h3 className="mentor-profile-name">{mentor.displayName}</h3>
      {mentor.laneCopy ? <p className="mentor-profile-lane">{mentor.laneCopy}</p> : null}

      <div className="mentor-profile-tags">
        {mentor.tags.map((tag) => (
          <span key={tag}>{tag}</span>
        ))}
      </div>

      <div className="mentor-profile-meta">
        <p>
          ⭐ {mentor.rating.toFixed(1)} <span>({mentor.sessionsCount} sessions)</span>
        </p>
        <p>₹{mentor.pricePerSession} / session</p>
      </div>

      <a className="btn mentor-profile-cta" href="#top">
        {mentor.ctaLabel}
      </a>
    </article>
  );
}

function ProblemCard({ stat }: { stat: MarketingProblemStat }) {
  const placeholder = `0${stat.suffix}`;

  return (
    <article className="problem-card">
      <p
        className="problem-stat"
        data-counter
        data-value={stat.value}
        data-suffix={stat.suffix}
        aria-label={stat.ariaLabel}
      >
        {placeholder}
      </p>
      <p className="problem-copy">{stat.copy}</p>
    </article>
  );
}

function TestimonialCard({
  testimonial,
  index,
}: {
  testimonial: MarketingTestimonial;
  index: number;
}) {
  const stagger = `${(0.05 + index * 0.07).toFixed(2)}s`;

  return (
    <article
      className="testimonial-card"
      data-scroll-reveal
      style={{ "--reveal-stagger": stagger } as React.CSSProperties}
    >
      <p className="testimonial-quote">{testimonial.quote}</p>
      <div className="testimonial-meta">
        <p className="testimonial-student">{testimonial.studentName}</p>
        <p className="testimonial-detail">{testimonial.studentDetail}</p>
        <p className="testimonial-mentor">{testimonial.mentorMention}</p>
        <p className="testimonial-rating">{testimonial.ratingDisplay}</p>
      </div>
    </article>
  );
}

function PricingCard({ tier }: { tier: MarketingPricingTier }) {
  return (
    <article className={`pricing-card ${PRICING_ACCENT_CLASS[tier.accent]}`}>
      {tier.badge ? (
        <div className="pricing-card-banner">
          <span className="pricing-badge">{tier.badge}</span>
        </div>
      ) : null}
      <div className="pricing-card-top">
        <p className="pricing-tier">{tier.name}</p>
        <p className="pricing-range">
          {tier.priceRange} <span>/ session</span>
        </p>
        <p className="pricing-college">{tier.collegeLine}</p>
      </div>
      <p className="pricing-fit">{tier.fitLine}</p>
      <ul className="pricing-features">
        {tier.features.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </article>
  );
}

function MentorBenefitCard({ benefit }: { benefit: MarketingMentorBenefit }) {
  const icon = BENEFIT_ICONS[benefit.iconKey] ?? null;

  return (
    <article className="mentor-benefit-card">
      <div className="mentor-benefit-icon" aria-hidden="true">
        {icon}
      </div>
      <div>
        <h3>{benefit.title}</h3>
        <p>{benefit.body}</p>
      </div>
    </article>
  );
}

function FooterColumn({
  heading,
  links,
  ariaLabel,
}: {
  heading: string;
  links: MarketingNavLink[];
  ariaLabel: string;
}) {
  return (
    <nav className="footer-column" aria-label={ariaLabel}>
      <p className="footer-heading">{heading}</p>
      <div className="footer-link-list">
        {links.map((link) => (
          <a key={`${link.id}-${link.href}-${link.label}`} className="footer-link" href={link.href}>
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
}

export default async function Home() {
  let data: MarketingPageData;

  try {
    data = await loadMarketingPageData();
  } catch (error) {
    console.error("Failed to load marketing data", error);
    data = emptyMarketingPageData();
  }

  const settings = data.settings;

  return (
    <>
      <svg className="sr-only-svg" aria-hidden="true" focusable="false">
        <filter id="grain-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves={2}
            stitchTiles="stitch"
          >
            <animate
              attributeName="baseFrequency"
              dur="16s"
              values="0.78;0.9;0.78"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </svg>

      <div className="bg-space" aria-hidden="true" />
      <div className="grain-overlay" aria-hidden="true" />
      <div className="cursor-dot" aria-hidden="true" />

      <header className="site-header">
        <div className="nav-shell">
          <a className="brand" href="#top" aria-label="GuideMe home">
            {BRAND_MARK}
            {BRAND_WORDMARK}
          </a>

          <nav className="site-nav" aria-label="Primary navigation">
            {data.navLinks.HEADER.map((link) => (
              <a key={`${link.id}`} className="nav-link" href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="nav-actions">
            <a
              className="btn btn-nav-ghost"
              href={getSetting(settings, "navActions.becomeMentorHref", "#for-mentors")}
            >
              {getSetting(settings, "navActions.becomeMentorLabel", "Become a Mentor")}
            </a>
            <a
              className="btn btn-nav-solid"
              href={getSetting(settings, "navActions.findMentorHref", "#mentors")}
            >
              {getSetting(settings, "navActions.findMentorLabel", "Find My Mentor")}
            </a>
          </div>

          <button
            className="menu-toggle"
            type="button"
            aria-expanded="false"
            aria-controls="mobile-menu"
            aria-label="Open menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      <div className="menu-overlay" id="mobile-menu" aria-hidden="true">
        <div className="menu-panel">
          <div className="menu-copy">
            <p className="panel-label">{getSetting(settings, "mobileMenu.label", "Navigate GuideMe")}</p>
            <p className="menu-blurb">{getSetting(settings, "mobileMenu.blurb")}</p>
          </div>

          <nav className="mobile-nav" aria-label="Mobile navigation">
            {data.navLinks.MOBILE.map((link, index) => (
              <a
                key={`${link.id}-mobile`}
                className="nav-link"
                href={link.href}
                style={{ "--item-index": index } as React.CSSProperties}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mobile-actions">
            <a
              className="btn btn-nav-ghost"
              href={getSetting(settings, "navActions.becomeMentorHref", "#for-mentors")}
            >
              {getSetting(settings, "navActions.becomeMentorLabel", "Become a Mentor")}
            </a>
            <a
              className="btn btn-nav-solid"
              href={getSetting(settings, "navActions.findMentorHref", "#mentors")}
            >
              {getSetting(settings, "navActions.findMentorLabel", "Find My Mentor")}
            </a>
          </div>
        </div>
      </div>

      <main className="page-shell">
        <section className="hero" id="top">
          <div className="hero-network" aria-hidden="true">
            <canvas className="hero-network-canvas" />
          </div>

          <div className="hero-inner">
            <div className="hero-content">
              <div
                className="hero-badge reveal-item"
                style={{ "--reveal-delay": "0.1s" } as React.CSSProperties}
              >
                {getSetting(settings, "hero.badge")}
              </div>

              <h1
                className="hero-title"
                aria-label={`${getSetting(settings, "hero.titleLine1")} ${getSetting(
                  settings,
                  "hero.titleLine2",
                )} ${getSetting(settings, "hero.titleAccent")}`}
              >
                <span className="hero-line">
                  {getSetting(settings, "hero.titleLine1")
                    .split(" ")
                    .map((word, index) => (
                      <span
                        key={`l1-${word}-${index}`}
                        className="hero-word"
                        style={{ "--word-delay": `${0.24 + index * 0.1}s` } as React.CSSProperties}
                      >
                        {word}
                      </span>
                    ))}
                </span>
                <span className="hero-line">
                  {getSetting(settings, "hero.titleLine2")
                    .split(" ")
                    .map((word, index) => (
                      <span
                        key={`l2-${word}-${index}`}
                        className="hero-word"
                        style={{ "--word-delay": `${0.54 + index * 0.1}s` } as React.CSSProperties}
                      >
                        {word}
                      </span>
                    ))}
                </span>
                <span className="hero-line hero-line-accent">
                  <span
                    className="hero-word hero-word-accent"
                    style={{ "--word-delay": "0.76s" } as React.CSSProperties}
                  >
                    {getSetting(settings, "hero.titleAccent")}
                  </span>
                </span>
              </h1>

              <p
                className="hero-subheading reveal-item"
                style={{ "--reveal-delay": "0.92s" } as React.CSSProperties}
              >
                {getSetting(settings, "hero.subheading")}
              </p>

              <div
                className="hero-actions reveal-item"
                style={{ "--reveal-delay": "1.04s" } as React.CSSProperties}
              >
                <a
                  className="btn btn-hero-primary"
                  href={getSetting(settings, "hero.ctaPrimaryHref", "#mentors")}
                >
                  {getSetting(settings, "hero.ctaPrimaryLabel")}
                </a>
                <a
                  className="btn btn-hero-secondary"
                  href={getSetting(settings, "hero.ctaSecondaryHref", "#for-mentors")}
                >
                  {getSetting(settings, "hero.ctaSecondaryLabel")}
                </a>
              </div>

              <HeroProof stats={data.heroStats} />
            </div>

            <HeroMentorCard mentor={data.heroSpotlightMentor} />
          </div>
        </section>

        <nav className="section-nav" aria-label="Section navigation">
          {data.navLinks.SECTION_NAV.map((link) => (
            <a key={`${link.id}-section`} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <section className="problem-section section" id="problem">
          <div className="problem-inner">
            <div className="problem-head">
              <h2>{getSetting(settings, "problem.heading")}</h2>
            </div>

            <div className="problem-grid">
              {data.problemStats.map((stat) => (
                <ProblemCard key={stat.id} stat={stat} />
              ))}
            </div>

            <blockquote className="problem-callout">
              {getSetting(settings, "problem.callout")}
            </blockquote>
          </div>
        </section>

        <section className="mentors-section section" id="mentors">
          <div className="section-head mentors-head">
            <p className="section-kicker">{getSetting(settings, "mentors.kicker")}</p>
            <h2>{getSetting(settings, "mentors.heading")}</h2>
            <p>{getSetting(settings, "mentors.subcopy")}</p>
          </div>

          <div className="mentor-filter-row" role="group" aria-label="Mentor filters">
            <button
              className="mentor-filter is-active"
              type="button"
              data-mentor-filter="school"
              aria-pressed="true"
            >
              {getSetting(settings, "mentors.filterSchoolLabel", "For School Students")}
            </button>
            <button
              className="mentor-filter is-active"
              type="button"
              data-mentor-filter="ug"
              aria-pressed="true"
            >
              {getSetting(settings, "mentors.filterUgLabel", "For UG Students")}
            </button>
          </div>

          <div className="mentor-carousel-shell">
            <div className="mentor-carousel" data-mentor-carousel>
              {data.schoolMentors.map((mentor) => (
                <MentorProfileCard key={mentor.id} mentor={mentor} group="school" />
              ))}
              {data.ugMentors.map((mentor) => (
                <MentorProfileCard key={mentor.id} mentor={mentor} group="ug" />
              ))}
            </div>
          </div>
        </section>

        <section className="testimonials-section section" id="testimonials">
          <div className="section-head testimonials-head">
            <p className="section-kicker">{getSetting(settings, "testimonials.kicker")}</p>
            <h2>{getSetting(settings, "testimonials.heading")}</h2>
          </div>

          <div className="testimonials-masonry">
            {data.testimonials.map((testimonial, index) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} index={index} />
            ))}
          </div>
        </section>

        <section className="pricing-section section" id="pricing">
          <div className="section-head pricing-head">
            <p className="section-kicker">{getSetting(settings, "pricing.kicker")}</p>
            <h2>{getSetting(settings, "pricing.heading")}</h2>
            <p>{getSetting(settings, "pricing.subcopy")}</p>
          </div>

          <div className="pricing-grid">
            {data.pricingTiers.map((tier) => (
              <PricingCard key={tier.id} tier={tier} />
            ))}
          </div>

          <div className="revenue-split-block">
            <div className="revenue-split-track" data-revenue-split>
              <div className="revenue-split-fill revenue-split-fill--mentor">
                <span>{getSetting(settings, "pricing.revenueMentorLabel")}</span>
              </div>
              <div className="revenue-split-fill revenue-split-fill--platform">
                <span>{getSetting(settings, "pricing.revenuePlatformLabel")}</span>
              </div>
            </div>
            <p className="revenue-split-note">{getSetting(settings, "pricing.revenueNote")}</p>
          </div>
        </section>

        <section className="mentor-income-section section" id="for-mentors">
          <div className="mentor-income-layout">
            <div className="mentor-income-content">
              <p className="section-kicker">{getSetting(settings, "mentorIncome.kicker")}</p>
              <h2>{getSetting(settings, "mentorIncome.heading")}</h2>
              <p className="mentor-income-subheading">
                {getSetting(settings, "mentorIncome.subheading")}
              </p>

              <div className="mentor-benefit-list">
                {data.mentorBenefits.map((benefit) => (
                  <MentorBenefitCard key={benefit.id} benefit={benefit} />
                ))}
              </div>
            </div>

            <div className="mentor-calc-stage">
              <div className="mentor-calc-orb mentor-calc-orb--teal" aria-hidden="true" />
              <div className="mentor-calc-orb mentor-calc-orb--amber" aria-hidden="true" />

              <div className="mentor-calc-shell">
                <div className="mentor-calc-widget">
                  <p className="panel-label">{getSetting(settings, "mentorIncome.calcKicker")}</p>

                  <label className="mentor-range-field">
                    <span className="mentor-range-label">
                      {getSetting(settings, "mentorIncome.calcSessionsLabel")}
                    </span>
                    <div className="mentor-range-meta">
                      <span>{getSetting(settings, "mentorIncome.calcSessionsMeta")}</span>
                      <output data-sessions-output>
                        {getSetting(settings, "mentorIncome.calcSessionsDefault", "4")}
                      </output>
                    </div>
                    <input
                      className="mentor-range-input"
                      type="range"
                      min={getSetting(settings, "mentorIncome.calcSessionsMin", "1")}
                      max={getSetting(settings, "mentorIncome.calcSessionsMax", "10")}
                      step={getSetting(settings, "mentorIncome.calcSessionsStep", "1")}
                      defaultValue={getSetting(
                        settings,
                        "mentorIncome.calcSessionsDefault",
                        "4",
                      )}
                      data-sessions-range
                    />
                  </label>

                  <label className="mentor-range-field">
                    <span className="mentor-range-label">
                      {getSetting(settings, "mentorIncome.calcPriceLabel")}
                    </span>
                    <div className="mentor-range-meta">
                      <span>{getSetting(settings, "mentorIncome.calcPriceMeta")}</span>
                      <output data-price-output>
                        {getSetting(settings, "mentorIncome.calcPriceDefaultDisplay", "₹249")}
                      </output>
                    </div>
                    <input
                      className="mentor-range-input"
                      type="range"
                      min={getSetting(settings, "mentorIncome.calcPriceMin", "99")}
                      max={getSetting(settings, "mentorIncome.calcPriceMax", "599")}
                      step={getSetting(settings, "mentorIncome.calcPriceStep", "10")}
                      defaultValue={getSetting(
                        settings,
                        "mentorIncome.calcPriceDefault",
                        "249",
                      )}
                      data-price-range
                    />
                  </label>

                  <div className="mentor-calc-total">
                    <p>{getSetting(settings, "mentorIncome.calcEarnLabel")}</p>
                    <p
                      className="mentor-calc-amount"
                      data-monthly-earnings
                      aria-live="polite"
                    >
                      {getSetting(settings, "mentorIncome.calcEarnDefault")}
                    </p>
                    <p className="mentor-calc-note">
                      {getSetting(settings, "mentorIncome.calcNote")}
                    </p>
                  </div>

                  <button className="btn btn-mentor-apply" type="button">
                    {getSetting(settings, "mentorIncome.calcCtaLabel")}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mentor-guarantee-strip">
            {getSetting(settings, "mentorIncome.guarantee")}
          </div>
        </section>

        <section className="section" id="tokens">
          <div className="section-head">
            <p className="section-kicker">{getSetting(settings, "tokens.kicker")}</p>
            <h2>{getSetting(settings, "tokens.heading")}</h2>
            <p>{getSetting(settings, "tokens.subcopy")}</p>
          </div>

          <div className="token-grid">
            <article className="tone-card">
              <div className="tone-swatch" style={{ "--swatch": "var(--color-bg)" } as React.CSSProperties} />
              <h3>Base</h3>
              <p>Use for page backgrounds and deep layout anchors.</p>
              <div className="token-meta">
                <span>Primary canvas</span>
                <code>--color-bg</code>
              </div>
            </article>

            <article className="tone-card">
              <div className="tone-swatch" style={{ "--swatch": "var(--color-primary)" } as React.CSSProperties} />
              <h3>Primary Accent</h3>
              <p>Use for focus rings, link treatments, and structural highlights.</p>
              <div className="token-meta">
                <span>System accent</span>
                <code>--color-primary</code>
              </div>
            </article>

            <article className="tone-card">
              <div className="tone-swatch" style={{ "--swatch": "var(--color-highlight)" } as React.CSSProperties} />
              <h3>Highlight</h3>
              <p>Use for positive moments, trust markers, and progressive states.</p>
              <div className="token-meta">
                <span>Optimistic cue</span>
                <code>--color-highlight</code>
              </div>
            </article>

            <article className="tone-card">
              <div className="tone-swatch" style={{ "--swatch": "var(--color-cta)" } as React.CSSProperties} />
              <h3>CTA</h3>
              <p>Use sparingly for the clearest next action on any screen.</p>
              <div className="token-meta">
                <span>Conversion color</span>
                <code>--color-cta</code>
              </div>
            </article>
          </div>

          <div className="spec-grid">
            <article className="spec-block">
              <h3>Spacing Scale</h3>
              <div className="token-inline">
                <span>XS</span>
                <code>0.5rem</code>
              </div>
              <div className="token-inline">
                <span>SM</span>
                <code>0.75rem</code>
              </div>
              <div className="token-inline">
                <span>MD</span>
                <code>1rem</code>
              </div>
              <div className="token-inline">
                <span>LG</span>
                <code>1.5rem</code>
              </div>
              <div className="token-inline">
                <span>XL</span>
                <code>2.5rem</code>
              </div>
            </article>

            <article className="spec-block">
              <h3>Surface Language</h3>
              <div className="token-inline">
                <span>Card radius</span>
                <code>18px</code>
              </div>
              <div className="token-inline">
                <span>Border tone</span>
                <code>Teal-glass</code>
              </div>
              <div className="token-inline">
                <span>Blur depth</span>
                <code>16px</code>
              </div>
              <div className="token-inline">
                <span>Shadow</span>
                <code>Soft lift</code>
              </div>
            </article>

            <article className="spec-block">
              <h3>Interaction Rhythm</h3>
              <div className="token-inline">
                <span>Hover lift</span>
                <code>180ms</code>
              </div>
              <div className="token-inline">
                <span>Cursor scale</span>
                <code>2.65x</code>
              </div>
              <div className="token-inline">
                <span>Scroll</span>
                <code>Smooth</code>
              </div>
              <div className="token-inline">
                <span>Focus ring</span>
                <code>Teal glow</code>
              </div>
            </article>
          </div>
        </section>

        <section className="section" id="type">
          <div className="section-head">
            <p className="section-kicker">{getSetting(settings, "type.kicker")}</p>
            <h2>{getSetting(settings, "type.heading")}</h2>
            <p>{getSetting(settings, "type.subcopy")}</p>
          </div>

          <div className="type-layout">
            <article className="type-showcase">
              <p className="type-label">Syne / Headings</p>
              <h3 className="type-display">Guide ambitious choices with calm clarity.</h3>
              <p className="type-note">
                Use bold, compact headlines for milestones like choosing a mentor, booking a
                session, and committing to next steps.
              </p>
            </article>

            <article className="type-showcase body-showcase">
              <p className="type-label">DM Sans / Body</p>
              <p className="body-large">
                GuideMe connects students with seniors who have already crossed the exams,
                colleges, and early-career decisions they are working through now.
              </p>
              <p>
                Body copy should stay warm, precise, and free of clutter. Keep paragraphs short
                and useful, especially in mentoring profiles, onboarding prompts, and
                reassurance-heavy product moments.
              </p>
              <div className="meta-row">
                <span className="mini-tag">16px base</span>
                <span className="mini-tag">1.65 line height</span>
                <span className="mini-tag">0 letter spacing</span>
              </div>
            </article>
          </div>
        </section>

        <section className="section" id="components">
          <div className="section-head">
            <p className="section-kicker">{getSetting(settings, "components.kicker")}</p>
            <h2>{getSetting(settings, "components.heading")}</h2>
            <p>{getSetting(settings, "components.subcopy")}</p>
          </div>

          <div className="component-grid">
            <article className="component-card">
              <h3>Buttons and Pills</h3>
              <p>Amber is reserved for the strongest next step on the screen.</p>
              <div className="button-stack">
                <a className="btn btn-primary" href="#top">
                  Book a Session
                </a>
                <a className="btn btn-secondary" href="#tokens">
                  Browse Mentors
                </a>
                <button className="btn btn-ghost" type="button">
                  View Profiles
                </button>
              </div>
              <div className="pill-row">
                <span className="pill pill-primary">Verified Seniors</span>
                <span className="pill pill-highlight">Exam Strategy</span>
                <span className="pill pill-muted">Career Discovery</span>
              </div>
            </article>

            <article className="component-card">
              <h3>Inputs</h3>
              <p>Keep form chrome quiet and let focus states carry the attention.</p>
              <label className="field">
                <span>What are you aiming for?</span>
                <input type="text" placeholder="IIT JEE, CUET, internships..." />
              </label>
              <label className="field">
                <span>Session brief</span>
                <textarea
                  rows={4}
                  placeholder="Share where you're stuck and what kind of mentor you need."
                />
              </label>
            </article>

            <article className="component-card mentor-card">
              <p className="panel-label">Mentor Card Preview</p>
              <h3>{data.heroSpotlightMentor?.displayName.split(" · ")[0] ?? "Mentor"}</h3>
              <p className="mentor-role">
                {data.heroSpotlightMentor?.displayName.split(" · ").slice(1).join(" · ") ??
                  ""}
              </p>
              <div className="meta-row">
                <span className="mini-tag">
                  {data.heroSpotlightMentor?.rating.toFixed(1) ?? "0.0"} rating
                </span>
                <span className="mini-tag">
                  {data.heroSpotlightMentor?.sessionsCount ?? 0} sessions
                </span>
                <span className="mini-tag">Hindi + English</span>
              </div>
              <p className="mentor-copy">
                Clear, tactical guidance with a calm tone for students who need momentum
                without pressure.
              </p>
              <a className="text-link" href="#atmosphere">
                See interaction rules
              </a>
            </article>

            <article className="component-card">
              <h3>Surface Rules</h3>
              <p>Panels should feel lifted, not glossy or decorative.</p>
              <ul className="principle-list">
                <li>Use thin teal-led borders instead of bright outlines.</li>
                <li>Let mint signal confidence, completion, or trust cues.</li>
                <li>Keep shadows soft and low-contrast against the dark canvas.</li>
                <li>Save dense glow for focal moments, not every component.</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section" id="atmosphere">
          <div className="section-head">
            <p className="section-kicker">{getSetting(settings, "atmosphere.kicker")}</p>
            <h2>{getSetting(settings, "atmosphere.heading")}</h2>
            <p>{getSetting(settings, "atmosphere.subcopy")}</p>
          </div>

          <div className="atmosphere-grid">
            <article className="atmosphere-card">
              <h3>Background System</h3>
              <p>
                Layer faint radial gradients into the corners and keep the center dark enough
                for strong contrast and easy reading.
              </p>
            </article>

            <article className="atmosphere-card">
              <h3>Cursor Behavior</h3>
              <p>
                The teal cursor dot expands on links, buttons, and fields. It drops away on
                touch devices and reduced-motion environments.
              </p>
            </article>

            <article className="atmosphere-card">
              <h3>Usage Rule</h3>
              <p>
                Keep amber scarce, let teal organize the interface, and use mint for moments of
                optimism or successful progress.
              </p>
            </article>
          </div>
        </section>

        <section className="site-cta" id="cta">
          <div className="site-cta-shell">
            <div className="site-cta-orb" aria-hidden="true" />

            <div className="site-cta-content">
              <p className="eyebrow site-cta-eyebrow">{getSetting(settings, "siteCta.eyebrow")}</p>
              <h2 className="site-cta-title">{getSetting(settings, "siteCta.title")}</h2>

              <div className="site-cta-actions">
                <a
                  className="btn btn-primary site-cta-primary"
                  href={getSetting(settings, "siteCta.primaryHref", "#mentors")}
                >
                  {getSetting(settings, "siteCta.primaryLabel")}
                </a>
                <a
                  className="btn btn-ghost site-cta-ghost"
                  href={getSetting(settings, "siteCta.secondaryHref", "#for-mentors")}
                >
                  {getSetting(settings, "siteCta.secondaryLabel")}
                </a>
              </div>

              <p className="site-cta-proof">{getSetting(settings, "siteCta.proof")}</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer" id="footer">
        <div className="site-footer-shell">
          <div className="site-footer-grid">
            <div className="footer-column footer-column-brand">
              <a className="brand footer-brand" href="#top" aria-label="GuideMe home">
                {BRAND_MARK}
                {BRAND_WORDMARK}
              </a>

              <p className="footer-tagline">{getSetting(settings, "footer.tagline")}</p>
              <p className="footer-love">{getSetting(settings, "footer.love")}</p>
            </div>

            <FooterColumn
              heading={getSetting(settings, "footer.headingPlatform", "Platform")}
              links={data.navLinks.FOOTER_PLATFORM}
              ariaLabel="Platform links"
            />

            <FooterColumn
              heading={getSetting(settings, "footer.headingMentors", "Mentors")}
              links={data.navLinks.FOOTER_MENTORS}
              ariaLabel="Mentor links"
            />

            <FooterColumn
              heading={getSetting(settings, "footer.headingConnect", "Connect")}
              links={data.navLinks.FOOTER_CONNECT}
              ariaLabel="Connect links"
            />
          </div>

          <div className="site-footer-bottom">
            <span className="footer-bottom-copy">{getSetting(settings, "footer.copyright")}</span>

            <div className="footer-bottom-links" aria-label="Legal links">
              {data.navLinks.FOOTER_LEGAL.map((link, index) => (
                <span key={`legal-${link.id}`} className="footer-legal-item">
                  <a className="footer-link" href={link.href}>
                    {link.label}
                  </a>
                  {index < data.navLinks.FOOTER_LEGAL.length - 1 ? (
                    <span aria-hidden="true"> · </span>
                  ) : null}
                </span>
              ))}
              <span aria-hidden="true"> · </span>
              <span className="footer-bottom-copy">{getSetting(settings, "footer.builtIn")}</span>
            </div>
          </div>
        </div>
      </footer>

      <Script src="/legacy/script.js" strategy="afterInteractive" />
    </>
  );
}

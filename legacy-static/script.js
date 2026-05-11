const cursor = document.querySelector(".cursor-dot");
const siteHeader = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const menuOverlay = document.querySelector(".menu-overlay");
const mobileMenuLinks = document.querySelectorAll(".mobile-nav a, .mobile-actions a");
const sectionSidebar = document.querySelector(".section-sidebar");
const sectionNavToggle = document.querySelector(".section-nav-toggle");
const sectionNav = document.querySelector(".section-nav");
const sectionNavBackdrop = document.querySelector(".section-nav-backdrop");
const sectionNavLinks = document.querySelectorAll(".section-nav-links a, .section-nav-signup");
const heroCanvas = document.querySelector(".hero-network-canvas");
const counterElements = document.querySelectorAll("[data-counter]");
const mentorCarousel = document.querySelector("[data-mentor-carousel]");
const mentorCards = document.querySelectorAll(".mentor-profile-card[data-mentor-group]");
const mentorFilterButtons = document.querySelectorAll("[data-mentor-filter]");
const revenueSplitTrack = document.querySelector("[data-revenue-split]");
const sessionsRange = document.querySelector("[data-sessions-range]");
const priceRange = document.querySelector("[data-price-range]");
const sessionsOutput = document.querySelector("[data-sessions-output]");
const priceOutput = document.querySelector("[data-price-output]");
const monthlyEarningsOutput = document.querySelector("[data-monthly-earnings]");
const scrollRevealElements = document.querySelectorAll("[data-scroll-reveal]");
const liveHeroStudents = document.querySelector("[data-live-total-students]");
const liveHeroMentors = document.querySelector("[data-live-total-mentors]");
const liveHeroAveragePrice = document.querySelector("[data-live-average-price]");
const liveSiteIntro = document.querySelector("[data-live-intro-copy]");
const liveSiteFloorPrice = document.querySelector("[data-live-floor-price]");
const liveTypicalPrice = document.querySelector("[data-live-typical-price]");
const livePriceBand = document.querySelector("[data-live-price-band]");
const liveIncomeRange = document.querySelector("[data-live-income-range]");
const liveRevenueNote = document.querySelector("[data-live-revenue-note]");
const liveCounterElements = {
  students: document.querySelector("[data-live-counter='students']"),
  mentors: document.querySelector("[data-live-counter='mentors']"),
  sessions: document.querySelector("[data-live-counter='sessions']"),
  reviews: document.querySelector("[data-live-counter='reviews']"),
};
const interactiveSelector =
  "a, button, input, select, textarea, label, [role='button'], .interactive";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const prefersCoarsePointer = window.matchMedia("(pointer: coarse)");

const supportsCustomCursor =
  cursor &&
  window.matchMedia("(pointer: fine)").matches &&
  !prefersReducedMotion.matches;
const landingDataEndpoint = "/api/public/landing";
const authDocumentLinks = document.querySelectorAll(
  'a[href^="/auth/signup"], a[href^="/auth/signin"]'
);
let syncMobileMenuState = null;
let syncSectionNavState = null;
const prefetchedDocuments = new Set();

const formatInteger = (value) => Math.max(0, Number(value || 0)).toLocaleString("en-IN");
const formatCurrencyAmount = (value) =>
  `₹${Math.round(Math.max(0, Number(value || 0))).toLocaleString("en-IN")}`;
const buildIntroCopy = (introMinutes) => `Free ${introMinutes}-min intro call`;
const buildAverageSessionCopy = (snapshot) =>
  snapshot.averagePaidSessionPrice > 0
    ? `${formatCurrencyAmount(snapshot.averagePaidSessionPrice)} avg session`
    : `Free ${snapshot.introMinutes}-min intro`;
const buildFloorPriceCopy = (snapshot) =>
  snapshot.minPrice > 0 ? `${formatCurrencyAmount(snapshot.minPrice)} onwards` : "Profiles opening now";
const buildTypicalPriceMarkup = (snapshot) =>
  snapshot.averagePaidSessionPrice > 0
    ? `${formatCurrencyAmount(snapshot.averagePaidSessionPrice)} <span>/ session</span>`
    : "Awaiting live bookings";
const buildPriceBandMarkup = (snapshot) =>
  snapshot.minPrice > 0 && snapshot.maxPrice > 0
    ? `${formatCurrencyAmount(snapshot.minPrice)} - ${formatCurrencyAmount(snapshot.maxPrice)} <span>/ current range</span>`
    : "Mentor pricing unlocks as live profiles go active";
const estimateMonthlyEarnings = (sessionsPerWeek, averagePrice) =>
  Math.round(Number(sessionsPerWeek) * Number(averagePrice) * 4.33 * 3);
const buildIncomeRangeCopy = (snapshot) => {
  const basePrice = snapshot.averagePaidSessionPrice || snapshot.maxPrice || snapshot.minPrice;

  if (basePrice > 0) {
    const low = estimateMonthlyEarnings(3, basePrice);
    const high = estimateMonthlyEarnings(5, basePrice);
    return `Earn around ${formatCurrencyAmount(low)}-${formatCurrencyAmount(high)}/month`;
  }

  return "Earnings move with live mentor pricing";
};
const buildRevenueNoteCopy = (snapshot) => {
  const basePrice = snapshot.averagePaidSessionPrice || snapshot.maxPrice || snapshot.minPrice;

  if (basePrice > 0) {
    return `At the current booking value, 4 sessions/week can generate about ${formatCurrencyAmount(
      estimateMonthlyEarnings(4, basePrice)
    )}/month.`;
  }

  return "Mentor payouts update automatically as live booking prices grow.";
};
const setCounterText = (element, value) => {
  if (!element) {
    return;
  }

  const safeValue = Math.max(0, Number(value || 0));
  element.dataset.value = String(safeValue);
  element.dataset.suffix = "+";
  element.textContent = `${formatInteger(safeValue)}+`;
};
const applyLiveSnapshot = (snapshot) => {
  if (!snapshot || typeof snapshot !== "object") {
    return;
  }

  if (liveHeroStudents) {
    liveHeroStudents.textContent = formatInteger(snapshot.totalStudents);
  }

  if (liveHeroMentors) {
    liveHeroMentors.textContent = formatInteger(snapshot.totalMentors);
  }

  if (liveHeroAveragePrice) {
    liveHeroAveragePrice.textContent = buildAverageSessionCopy(snapshot);
  }

  if (liveSiteIntro) {
    liveSiteIntro.textContent = buildIntroCopy(snapshot.introMinutes);
  }

  if (liveSiteFloorPrice) {
    liveSiteFloorPrice.textContent = buildFloorPriceCopy(snapshot);
  }

  if (liveTypicalPrice) {
    liveTypicalPrice.innerHTML = buildTypicalPriceMarkup(snapshot);
  }

  if (livePriceBand) {
    livePriceBand.innerHTML = buildPriceBandMarkup(snapshot);
  }

  if (liveIncomeRange) {
    liveIncomeRange.textContent = buildIncomeRangeCopy(snapshot);
  }

  if (liveRevenueNote) {
    liveRevenueNote.textContent = buildRevenueNoteCopy(snapshot);
  }

  setCounterText(liveCounterElements.students, snapshot.totalStudents);
  setCounterText(liveCounterElements.mentors, snapshot.totalMentors);
  setCounterText(liveCounterElements.sessions, snapshot.completedSessions);
  setCounterText(liveCounterElements.reviews, snapshot.totalReviews);
};

const markPageReady = () => {
  document.body.classList.add("page-ready");
};

const prefetchDocument = (href) => {
  if (!href) {
    return;
  }

  try {
    const url = new URL(href, window.location.origin);

    if (url.origin !== window.location.origin) {
      return;
    }

    const requestPath = `${url.pathname}${url.search}`;

    if (prefetchedDocuments.has(requestPath)) {
      return;
    }

    prefetchedDocuments.add(requestPath);

    fetch(requestPath, {
      method: "GET",
      credentials: "same-origin",
      cache: "force-cache",
    }).catch(() => {
      prefetchedDocuments.delete(requestPath);
    });
  } catch (_error) {
    // Ignore malformed URLs on progressively enhanced static links.
  }
};

const warmAuthRoutes = () => {
  prefetchDocument("/auth/signup");
  prefetchDocument("/auth/signup?role=MENTOR");
  prefetchDocument("/auth/signin");
};

if (document.readyState === "complete") {
  window.requestAnimationFrame(markPageReady);
} else {
  window.addEventListener("load", () => {
    window.requestAnimationFrame(markPageReady);
  });
}

if (typeof window.requestIdleCallback === "function") {
  window.requestIdleCallback(() => {
    warmAuthRoutes();
  }, { timeout: 2200 });
} else {
  window.setTimeout(warmAuthRoutes, 1400);
}

authDocumentLinks.forEach((link) => {
  const href = link.getAttribute("href");

  link.addEventListener("pointerenter", () => {
    prefetchDocument(href);
  }, { passive: true });

  link.addEventListener("focus", () => {
    prefetchDocument(href);
  });
});

if (
  liveHeroStudents ||
  liveHeroMentors ||
  liveHeroAveragePrice ||
  liveSiteFloorPrice ||
  liveTypicalPrice ||
  livePriceBand ||
  liveIncomeRange ||
  liveRevenueNote
) {
  let isPolling = false;
  const pollLiveSnapshot = async () => {
    if (isPolling || document.hidden) {
      return;
    }

    isPolling = true;

    try {
      const response = await fetch(`${landingDataEndpoint}?ts=${Date.now()}`, {
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      });

      if (response.ok) {
        const snapshot = await response.json();
        applyLiveSnapshot(snapshot);
      }
    } catch (_error) {
      // Ignore transient polling failures on the public landing page.
    } finally {
      isPolling = false;
    }
  };

  const pollTimer = window.setInterval(pollLiveSnapshot, 15000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      pollLiveSnapshot();
    }
  });

  window.addEventListener("pagehide", () => {
    window.clearInterval(pollTimer);
  });
}

if (siteHeader) {
  const syncNavState = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 18);
  };

  window.addEventListener("scroll", syncNavState, { passive: true });
  syncNavState();
}

if (menuToggle && menuOverlay) {
  const toggleMenu = (isOpen) => {
    if (isOpen && typeof syncSectionNavState === "function") {
      syncSectionNavState(false);
    }

    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    menuOverlay.classList.toggle("is-open", isOpen);
    menuOverlay.setAttribute("aria-hidden", String(!isOpen));
  };

  syncMobileMenuState = toggleMenu;

  menuToggle.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    toggleMenu(!isOpen);
  });

  menuOverlay.addEventListener("click", (event) => {
    if (event.target === menuOverlay) {
      toggleMenu(false);
    }
  });

  mobileMenuLinks.forEach((link) => {
    link.addEventListener("click", () => {
      toggleMenu(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleMenu(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 1040) {
      toggleMenu(false);
    }
  });
}

if (sectionSidebar && sectionNavToggle && sectionNav && sectionNavBackdrop) {
  const firstSectionLink = sectionNav.querySelector("a");

  const toggleSectionNav = (isOpen, options = {}) => {
    const { returnFocus = true } = options;

    if (isOpen && typeof syncMobileMenuState === "function") {
      syncMobileMenuState(false);
    }

    document.body.classList.toggle("section-nav-open", isOpen);
    sectionSidebar.classList.toggle("is-open", isOpen);
    sectionNavToggle.classList.toggle("is-open", isOpen);
    sectionNavToggle.setAttribute("aria-expanded", String(isOpen));
    sectionNavToggle.setAttribute(
      "aria-label",
      isOpen ? "Close section navigation" : "Open section navigation"
    );
    sectionNav.setAttribute("aria-hidden", String(!isOpen));
    sectionNavBackdrop.setAttribute("aria-hidden", String(!isOpen));

    if (isOpen) {
      window.requestAnimationFrame(() => {
        firstSectionLink?.focus({ preventScroll: true });
      });
      return;
    }

    if (returnFocus) {
      sectionNavToggle.focus({ preventScroll: true });
    }
  };

  syncSectionNavState = toggleSectionNav;

  sectionNavToggle.addEventListener("click", () => {
    const isOpen = sectionNavToggle.getAttribute("aria-expanded") === "true";
    toggleSectionNav(!isOpen);
  });

  sectionNavBackdrop.addEventListener("click", () => {
    toggleSectionNav(false);
  });

  sectionNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      toggleSectionNav(false, { returnFocus: false });
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      toggleSectionNav(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth <= 1040) {
      toggleSectionNav(false, { returnFocus: false });
    }
  });
}

if (heroCanvas) {
  const context = heroCanvas.getContext("2d");
  const heroScene = heroCanvas.parentElement;

  if (context && heroScene) {
    const particles = [];
    const depthLimit = 460;
    const perspective = 720;
    let width = 0;
    let height = 0;
    let animationFrameId = 0;

    const createParticle = () => ({
      x: (Math.random() - 0.5) * width,
      y: (Math.random() - 0.5) * height,
      z: Math.random() * depthLimit,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.16,
      vz: (Math.random() - 0.5) * 0.18,
      radius: 0.8 + Math.random() * 1.4,
      tint: Math.random() > 0.82 ? "mint" : "teal",
      phase: Math.random() * Math.PI * 2,
    });

    const syncCanvasSize = () => {
      const rect = heroScene.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;

      heroCanvas.width = Math.floor(width * dpr);
      heroCanvas.height = Math.floor(height * dpr);
      heroCanvas.style.width = `${width}px`;
      heroCanvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const nextCount = Math.max(40, Math.min(86, Math.floor((width * height) / 18000)));

      while (particles.length < nextCount) {
        particles.push(createParticle());
      }

      while (particles.length > nextCount) {
        particles.pop();
      }
    };

    const updateParticle = (particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.z += particle.vz;

      const xLimit = width * 0.55;
      const yLimit = height * 0.55;

      if (particle.x > xLimit || particle.x < -xLimit) {
        particle.vx *= -1;
      }

      if (particle.y > yLimit || particle.y < -yLimit) {
        particle.vy *= -1;
      }

      if (particle.z > depthLimit || particle.z < 0) {
        particle.vz *= -1;
      }
    };

    const projectParticle = (particle, time) => {
      const depthWave = Math.sin(time * 0.00035 + particle.phase) * 28;
      const z = particle.z + depthWave;
      const scale = perspective / (perspective + z);

      return {
        x: width / 2 + particle.x * scale,
        y: height / 2 + particle.y * scale,
        scale,
        radius: particle.radius * scale,
        tint: particle.tint,
      };
    };

    const drawFrame = (time) => {
      context.clearRect(0, 0, width, height);

      particles.forEach(updateParticle);
      const projectedParticles = particles.map((particle) => projectParticle(particle, time));

      for (let index = 0; index < projectedParticles.length; index += 1) {
        const source = projectedParticles[index];

        for (let neighborIndex = index + 1; neighborIndex < projectedParticles.length; neighborIndex += 1) {
          const target = projectedParticles[neighborIndex];
          const dx = source.x - target.x;
          const dy = source.y - target.y;
          const distance = Math.hypot(dx, dy);
          const maxDistance = 118 * ((source.scale + target.scale) * 0.72 + 0.62);

          if (distance < maxDistance) {
            const alpha = (1 - distance / maxDistance) * 0.18;
            context.strokeStyle = `rgba(2, 128, 144, ${alpha})`;
            context.lineWidth = 0.65;
            context.beginPath();
            context.moveTo(source.x, source.y);
            context.lineTo(target.x, target.y);
            context.stroke();
          }
        }
      }

      projectedParticles.forEach((particle) => {
        const alpha = Math.min(0.95, 0.28 + particle.scale * 0.62);
        const fillColor =
          particle.tint === "mint"
            ? `rgba(2, 195, 154, ${alpha})`
            : `rgba(132, 233, 244, ${alpha})`;

        context.beginPath();
        context.fillStyle = fillColor;
        context.shadowBlur = 16;
        context.shadowColor = fillColor;
        context.arc(particle.x, particle.y, Math.max(0.75, particle.radius), 0, Math.PI * 2);
        context.fill();
      });

      context.shadowBlur = 0;

      if (!prefersReducedMotion.matches) {
        animationFrameId = window.requestAnimationFrame(drawFrame);
      }
    };

    const startScene = () => {
      window.cancelAnimationFrame(animationFrameId);
      syncCanvasSize();
      drawFrame(window.performance.now());
    };

    window.addEventListener("resize", syncCanvasSize);
    startScene();
  }
}

if (counterElements.length > 0) {
  const formatCounterValue = (value, suffix, prefix = "") =>
    `${prefix}${value.toLocaleString("en-IN")}${suffix}`;

  const animateCounter = (element) => {
    if (element.dataset.counted === "true") {
      return;
    }

    const targetValue = Number(element.dataset.value || "0");
    const suffix = element.dataset.suffix || "";
    const prefix = element.dataset.prefix || "";
    element.dataset.counted = "true";

    if (prefersReducedMotion.matches) {
      element.textContent = formatCounterValue(targetValue, suffix, prefix);
      return;
    }

    const duration = suffix === ":1" ? 1800 : 1400;
    const startTime = window.performance.now();

    const tick = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(targetValue * easedProgress);

      element.textContent = formatCounterValue(currentValue, suffix, prefix);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        element.textContent = formatCounterValue(targetValue, suffix, prefix);
      }
    };

    window.requestAnimationFrame(tick);
  };

  if (typeof IntersectionObserver === "function") {
    const counterObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.45,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    counterElements.forEach((element) => {
      counterObserver.observe(element);
    });
  } else {
    counterElements.forEach(animateCounter);
  }
}

if (mentorCarousel && mentorCards.length > 0 && mentorFilterButtons.length > 0) {
  const mentorOriginalCards = Array.from(mentorCards);
  let activeMentorFilter = "all";
  let isCarouselPaused = false;
  let pauseUntil = 0;
  let mentorAnimationFrameId = 0;
  let visibleLoopWidth = 0;

  const syncMentorFilterButtons = () => {
    mentorFilterButtons.forEach((button) => {
      const matchesFilter = activeMentorFilter === "all" || button.dataset.mentorFilter === activeMentorFilter;
      button.classList.toggle("is-active", matchesFilter);
      button.setAttribute("aria-pressed", String(matchesFilter));
    });
  };

  const syncMentorClones = () => {
    mentorCarousel.querySelectorAll("[data-mentor-clone='true']").forEach((clone) => {
      clone.remove();
    });

    const visibleOriginalCards = mentorOriginalCards.filter((card) => !card.hidden);

    visibleOriginalCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.dataset.mentorClone = "true";
      clone.classList.add("is-clone");
      clone.setAttribute("aria-hidden", "true");

      clone.querySelectorAll("a, button, input, select, textarea").forEach((element) => {
        element.setAttribute("tabindex", "-1");
      });

      mentorCarousel.appendChild(clone);
    });

    window.requestAnimationFrame(() => {
      const firstVisibleCard = visibleOriginalCards[0];
      const lastVisibleCard = visibleOriginalCards[visibleOriginalCards.length - 1];

      if (firstVisibleCard && lastVisibleCard) {
        visibleLoopWidth =
          lastVisibleCard.offsetLeft + lastVisibleCard.offsetWidth - firstVisibleCard.offsetLeft;
      } else {
        visibleLoopWidth = 0;
      }
    });
  };

  const applyMentorFilter = (filter) => {
    activeMentorFilter = filter;

    mentorOriginalCards.forEach((card) => {
      const matchesFilter = filter === "all" || card.dataset.mentorGroup === filter;
      card.hidden = !matchesFilter;
    });

    syncMentorFilterButtons();
    syncMentorClones();
    mentorCarousel.scrollLeft = 0;
  };

  mentorFilterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.mentorFilter || "all";
      applyMentorFilter(activeMentorFilter === filter ? "all" : filter);
      pauseUntil = window.performance.now() + 2200;
    });
  });

  applyMentorFilter("all");

  const pauseCarousel = () => {
    isCarouselPaused = true;
  };

  const resumeCarousel = () => {
    isCarouselPaused = false;
  };

  mentorCarousel.addEventListener("mouseenter", pauseCarousel);
  mentorCarousel.addEventListener("mouseleave", resumeCarousel);
  mentorCarousel.addEventListener("focusin", pauseCarousel);
  mentorCarousel.addEventListener("focusout", (event) => {
    if (!mentorCarousel.contains(event.relatedTarget)) {
      resumeCarousel();
    }
  });

  ["pointerdown", "wheel", "touchstart"].forEach((eventName) => {
    mentorCarousel.addEventListener(
      eventName,
      () => {
        pauseUntil = window.performance.now() + 3200;
      },
      { passive: true }
    );
  });

  const autoScrollCarousel = (timestamp) => {
    const maxScrollLeft = mentorCarousel.scrollWidth - mentorCarousel.clientWidth;
    const allowMotion =
      !prefersReducedMotion.matches &&
      !prefersCoarsePointer.matches &&
      !document.hidden &&
      !isCarouselPaused &&
      timestamp > pauseUntil &&
      visibleLoopWidth > mentorCarousel.clientWidth + 4 &&
      maxScrollLeft > 4;

    if (allowMotion) {
      mentorCarousel.scrollLeft += 0.32;

      if (mentorCarousel.scrollLeft >= visibleLoopWidth) {
        mentorCarousel.scrollLeft -= visibleLoopWidth;
      }
    }

    mentorAnimationFrameId = window.requestAnimationFrame(autoScrollCarousel);
  };

  mentorAnimationFrameId = window.requestAnimationFrame(autoScrollCarousel);

  window.addEventListener("resize", () => {
    syncMentorClones();
  });

  window.addEventListener("beforeunload", () => {
    window.cancelAnimationFrame(mentorAnimationFrameId);
  });
}

if (revenueSplitTrack) {
  const revealRevenueSplit = () => {
    revenueSplitTrack.classList.add("is-visible");
  };

  if (prefersReducedMotion.matches) {
    revealRevenueSplit();
  } else if (typeof IntersectionObserver === "function") {
    const revenueObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealRevenueSplit();
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.55,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    revenueObserver.observe(revenueSplitTrack);
  } else {
    revealRevenueSplit();
  }
}

if (sessionsRange && priceRange && sessionsOutput && priceOutput && monthlyEarningsOutput) {
  const formatCurrency = (value) => `₹${Math.round(value).toLocaleString("en-IN")}`;

  const setRangeProgress = (input) => {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const value = Number(input.value);
    const progress = ((value - min) / (max - min)) * 100;
    input.style.setProperty("--range-progress", `${progress}%`);
  };

  const syncMentorCalculator = () => {
    const sessionsPerWeek = Number(sessionsRange.value);
    const averagePrice = Number(priceRange.value);
    const monthlyEstimate = sessionsPerWeek * averagePrice * 4.33 * 3;

    sessionsOutput.textContent = String(sessionsPerWeek);
    priceOutput.textContent = formatCurrency(averagePrice);
    monthlyEarningsOutput.textContent = `${formatCurrency(monthlyEstimate)} per month`;

    setRangeProgress(sessionsRange);
    setRangeProgress(priceRange);
  };

  [sessionsRange, priceRange].forEach((input) => {
    input.addEventListener("input", syncMentorCalculator);
    input.addEventListener("change", syncMentorCalculator);
  });

  syncMentorCalculator();
}

if (scrollRevealElements.length > 0) {
  const revealElement = (element) => {
    element.classList.add("is-visible");
  };

  if (prefersReducedMotion.matches) {
    scrollRevealElements.forEach(revealElement);
  } else if (typeof IntersectionObserver === "function") {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            revealElement(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.18,
        rootMargin: "0px 0px -8% 0px",
      }
    );

    scrollRevealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    scrollRevealElements.forEach(revealElement);
  }
}

if (supportsCustomCursor) {
  document.body.classList.add("has-custom-cursor");

  const setCursorPosition = (event) => {
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
    cursor.classList.add("is-visible");
  };

  window.addEventListener("mousemove", setCursorPosition);

  document.addEventListener("mouseover", (event) => {
    if (event.target.closest(interactiveSelector)) {
      cursor.classList.add("is-active");
    }
  });

  document.addEventListener("mouseout", (event) => {
    const leftInteractive = event.target.closest(interactiveSelector);
    const nextInteractive = event.relatedTarget?.closest?.(interactiveSelector);

    if (leftInteractive && leftInteractive !== nextInteractive) {
      cursor.classList.remove("is-active");
    }
  });

  document.documentElement.addEventListener("mouseleave", () => {
    cursor.classList.remove("is-visible");
    cursor.classList.remove("is-active");
  });
} else if (cursor) {
  cursor.remove();
}

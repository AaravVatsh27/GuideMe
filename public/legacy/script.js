const cursor = document.querySelector(".cursor-dot");
const siteHeader = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const menuOverlay = document.querySelector(".menu-overlay");
const mobileMenuLinks = document.querySelectorAll(".mobile-nav a, .mobile-actions a");
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
const interactiveSelector =
  "a, button, input, select, textarea, label, [role='button'], .interactive";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const prefersCoarsePointer = window.matchMedia("(pointer: coarse)");

const supportsCustomCursor =
  cursor &&
  window.matchMedia("(pointer: fine)").matches &&
  !prefersReducedMotion.matches;

const markPageReady = () => {
  document.body.classList.add("page-ready");
};

if (document.readyState === "complete") {
  window.requestAnimationFrame(markPageReady);
} else {
  window.addEventListener("load", () => {
    window.requestAnimationFrame(markPageReady);
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
    document.body.classList.toggle("menu-open", isOpen);
    menuToggle.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    menuOverlay.classList.toggle("is-open", isOpen);
    menuOverlay.setAttribute("aria-hidden", String(!isOpen));
  };

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
  const formatCounterValue = (value, suffix) => `${value.toLocaleString("en-IN")}${suffix}`;

  const animateCounter = (element) => {
    if (element.dataset.counted === "true") {
      return;
    }

    const targetValue = Number(element.dataset.value || "0");
    const suffix = element.dataset.suffix || "";
    element.dataset.counted = "true";

    if (prefersReducedMotion.matches) {
      element.textContent = formatCounterValue(targetValue, suffix);
      return;
    }

    const duration = suffix === ":1" ? 1800 : 1400;
    const startTime = window.performance.now();

    const tick = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(targetValue * easedProgress);

      element.textContent = formatCounterValue(currentValue, suffix);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        element.textContent = formatCounterValue(targetValue, suffix);
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

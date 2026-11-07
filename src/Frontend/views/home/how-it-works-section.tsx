"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowUpRight,
  Compass,
  MessageCircle,
  Search,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { HowItWorksCubeFallback } from "@/Frontend/views/home/how-it-works-cube-fallback";

const HowItWorksCube = dynamic(() => import("./how-it-works-cube"), {
  ssr: false,
  loading: () => <HowItWorksCubeFallback />,
});

type HowItWorksStep = {
  index: string;
  icon: LucideIcon;
  title: string;
  caption: string;
  href?: "/find-mentor";
  placement: string;
};

type Point = { x: number; y: number };
type Connector = { id: string; start: Point; end: Point };
type ConnectorLayout = {
  width: number;
  height: number;
  nodes: Record<string, Point>;
  connectors: Connector[];
};

const steps: HowItWorksStep[] = [
  {
    index: "01 —",
    icon: Compass,
    title: "Tell us your decision",
    caption: "Stream, college, branch, or coaching, start with what you're stuck on.",
    placement: "order-2 md:order-none md:col-start-1 md:row-start-1",
  },
  {
    index: "02 —",
    icon: Search,
    title: "Find a senior",
    caption: "Browse mentors who've walked the same road.",
    href: "/find-mentor",
    placement: "order-3 md:order-none md:col-start-3 md:row-start-1",
  },
  {
    index: "03 —",
    icon: MessageCircle,
    title: "Start with a free intro",
    caption: "A 10-minute call to see if it feels right.",
    placement: "order-4 md:order-none md:col-start-1 md:row-start-2",
  },
  {
    index: "04 —",
    icon: Sparkles,
    title: "Decide with clarity",
    caption: "Book a full session when you're ready.",
    placement: "order-5 md:order-none md:col-start-3 md:row-start-2",
  },
];

const nodeFractions: Record<string, Point> = {
  "01 —": { x: 0.07, y: 0.07 },
  "02 —": { x: 0.93, y: 0.07 },
  "03 —": { x: 0.07, y: 0.93 },
  "04 —": { x: 0.93, y: 0.93 },
};

function nearestEdgeMidpoint(rect: DOMRect, origin: Point): Point {
  const candidates = [
    { x: (rect.left + rect.right) / 2, y: rect.top },
    { x: (rect.left + rect.right) / 2, y: rect.bottom },
    { x: rect.left, y: (rect.top + rect.bottom) / 2 },
    { x: rect.right, y: (rect.top + rect.bottom) / 2 },
  ];

  return candidates.reduce((nearest, candidate) => {
    const candidateDistance = Math.hypot(
      candidate.x - origin.x,
      candidate.y - origin.y,
    );
    const nearestDistance = Math.hypot(
      nearest.x - origin.x,
      nearest.y - origin.y,
    );
    return candidateDistance < nearestDistance ? candidate : nearest;
  });
}

function StepCard({
  step,
  setCardRef,
}: {
  step: HowItWorksStep;
  setCardRef: (id: string, element: HTMLElement | null) => void;
}) {
  const Icon = step.icon;
  const cardRef = useCallback(
    (element: HTMLElement | null) => setCardRef(step.index, element),
    [setCardRef, step.index],
  );
  const cardClassName = `home-glass-card group relative z-10 flex min-h-[188px] flex-col p-5 transition-colors duration-200 motion-reduce:transition-none sm:p-6 ${step.placement}`;

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-[var(--muted)]">
          {step.index}
        </span>
        <span className="home-accent-surface flex size-10 items-center justify-center rounded-2xl">
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--text)]">
          {step.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {step.caption}
        </p>
      </div>

      <ArrowUpRight
        className="mt-auto size-4 self-end text-[var(--accent)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
        aria-hidden="true"
      />
    </>
  );

  if (step.href) {
    return (
      <Link ref={cardRef} href={step.href} className={cardClassName}>
        {content}
      </Link>
    );
  }

  return (
    <article ref={cardRef} className={cardClassName}>
      {content}
    </article>
  );
}

export function HomeHowItWorksSection() {
  const stageRef = useRef<HTMLDivElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Record<string, HTMLElement | null>>({});
  const [layout, setLayout] = useState<ConnectorLayout>({
    width: 0,
    height: 0,
    nodes: {},
    connectors: [],
  });

  const setCardRef = useCallback((id: string, element: HTMLElement | null) => {
    cardRefs.current[id] = element;
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const cube = cubeRef.current;
    if (!stage || !cube) return;

    const measure = () => {
      const stageRect = stage.getBoundingClientRect();
      const cubeRect = cube.getBoundingClientRect();
      if (!stageRect.width || !stageRect.height || !cubeRect.width) return;

      const nodes = Object.fromEntries(
        Object.entries(nodeFractions).map(([id, fraction]) => [
          id,
          {
            x: cubeRect.left - stageRect.left + cubeRect.width * fraction.x,
            y: cubeRect.top - stageRect.top + cubeRect.height * fraction.y,
          },
        ]),
      );

      const connectors = steps.flatMap((step) => {
        const card = cardRefs.current[step.index];
        const start = nodes[step.index];
        if (!card || !start) return [];

        const rect = card.getBoundingClientRect();
        const end = nearestEdgeMidpoint(rect, {
          x: start.x + stageRect.left,
          y: start.y + stageRect.top,
        });

        return [
          {
            id: step.index,
            start,
            end: {
              x: end.x - stageRect.left,
              y: end.y - stageRect.top,
            },
          },
        ];
      });

      setLayout({
        width: stageRect.width,
        height: stageRect.height,
        nodes,
        connectors,
      });
    };

    measure();
    window.addEventListener("resize", measure, { passive: true });

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measure);
    [stage, cube, ...Object.values(cardRefs.current)].forEach((element) => {
      if (element) resizeObserver?.observe(element);
    });

    return () => {
      window.removeEventListener("resize", measure);
      resizeObserver?.disconnect();
    };
  }, []);

  const viewBox = `0 0 ${Math.max(1, layout.width)} ${Math.max(1, layout.height)}`;

  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-[100px] bg-[var(--bg)] py-20 sm:py-24 lg:py-28"
    >
      <div
        className="home-ambient-glow pointer-events-none absolute left-1/2 top-[55%] z-0 size-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="home-section-label text-xs font-semibold uppercase tracking-[0.18em]">
            How it works
          </p>

          <h2 className="mx-auto mt-5 max-w-2xl text-balance text-3xl font-bold leading-tight tracking-[-0.04em] text-[var(--text)] sm:text-4xl lg:text-5xl">
            From confusion to{" "}
            <span className="text-[var(--accent)]">
              clarity
            </span>{" "}
            in four steps.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[var(--muted)]">
            Talk through your next decision with a senior who has already walked the road.
          </p>
        </div>

        <div
          ref={stageRef}
          className="relative mx-auto mt-10 grid grid-cols-1 gap-4 md:mt-14 md:min-h-[460px] md:grid-cols-[minmax(0,1fr)_minmax(15rem,0.88fr)_minmax(0,1fr)] md:grid-rows-2 md:gap-x-7 md:gap-y-5"
        >
          <svg
            className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
            viewBox={viewBox}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g
              className="motion-safe:animate-pulse"
              style={{ animationDuration: "4s" }}
              fill="none"
              stroke="rgba(199,210,254,0.35)"
              strokeDasharray="2 8"
              strokeLinecap="round"
              strokeWidth="1.5"
            >
              {layout.connectors.map((connector) => (
                <path
                  key={connector.id}
                  d={`M ${connector.start.x} ${connector.start.y} L ${connector.end.x} ${connector.end.y}`}
                />
              ))}
            </g>
          </svg>

          <div
            ref={cubeRef}
            className="relative z-10 order-1 col-span-full mx-auto aspect-square w-full max-w-[460px] self-center overflow-visible md:order-none md:col-span-1 md:col-start-2 md:row-span-2 md:row-start-1"
          >
            <HowItWorksCube />
          </div>

          <svg
            className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
            viewBox={viewBox}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <g className="motion-safe:animate-pulse">
              {Object.entries(layout.nodes).map(([id, point]) => (
                <g key={id}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="10"
                    fill="#7C3AED"
                    fillOpacity="0.22"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#A5B4FC"
                    style={{ filter: "drop-shadow(0 0 7px rgba(165,180,252,0.85))" }}
                  />
                </g>
              ))}
            </g>
          </svg>

          {steps.map((step) => (
            <StepCard key={step.index} step={step} setCardRef={setCardRef} />
          ))}
        </div>
      </div>
    </section>
  );
}

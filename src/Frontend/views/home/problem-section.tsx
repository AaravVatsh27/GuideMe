/** Landing page: the problem students face. */

import { Clock3, Compass, Flame, Sparkles, Users } from "lucide-react";

export function ProblemSection() {
  const items = [
    {
      number: "01",
      title: "Narrow exposure",
      copy:
        "Students often hear only a small set of options from school, family, or coaching circles.",
      solution: "Real paths from seniors who've been there",
    },
    {
      number: "02",
      title: "Pressure-led choices",
      copy:
        "Stream and college decisions can get shaped by pressure before students understand their own fit.",
      solution: "Zero-pressure, honest 1-on-1 talks",
    },
    {
      number: "03",
      title: "Thin guidance access",
      copy:
        "One-to-one guidance is difficult to find exactly when students need it most.",
      solution: "Seniors reviewed before they go live",
    },
    {
      number: "04",
      title: "Late clarity",
      copy:
        "The right questions often appear after important forms, deadlines, or decisions have already passed.",
      solution: "Clear answers before you decide",
    },
  ];
  const icons = [Compass, Flame, Users, Clock3];

  return (
    <section
      id="problem"
      className="relative overflow-hidden bg-[var(--bg)] py-20 sm:py-24 lg:py-28"
    >
      <div
        className="home-ambient-glow pointer-events-none absolute -left-32 top-24 size-[26rem] rounded-full blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-12 lg:gap-16">
          <div className="max-w-xl">
            <p className="home-section-label text-xs font-semibold uppercase tracking-[0.2em]">
              The problem
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] text-[var(--text)] sm:text-4xl lg:text-5xl">
              Big decisions are easier when someone has{" "}
              <span className="text-[var(--accent)]">
                already been there.
              </span>
            </h2>

            <p className="mt-5 text-base leading-7 text-[var(--muted)]">
              Mentra exists for the moment when students need more than
              generic advice and less than a giant career-consulting process.
            </p>

            <div className="mt-8 flex items-start gap-3">
              <span className="home-accent-surface flex size-10 shrink-0 items-center justify-center rounded-2xl">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
                  From uncertainty to a next step
                </p>
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  A conversation turns a huge decision into a clear path forward.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {items.map((item, index) => {
              const Icon = icons[index];

              return (
                <article
                  key={item.number}
                  className="home-glass-card group p-6 transition-colors duration-200 motion-reduce:transition-none sm:p-7"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span
                      className={`font-mono text-2xl font-black tracking-tight ${
                        index === 0 ? "text-[var(--accent)]" : "text-[var(--muted)]"
                      }`}
                    >
                      {item.number}
                    </span>
                    <span className="home-accent-surface flex size-10 items-center justify-center rounded-2xl">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-bold tracking-tight text-[var(--text)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                    {item.copy}
                  </p>

                  <div className="mt-6 border-t border-[var(--border)] pt-4">
                    <p className="text-sm font-semibold leading-5 text-[var(--muted)]">
                      {item.solution}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Landing page: the problem students face. */

import Image from "next/image";
import { HowItWorksSteps } from "@/Frontend/components/HowItWorksSteps";

export function ProblemSection() {
  const items = [
    {
      number: "01",
      title: "Narrow exposure",
      copy:
        "Students often hear only a small set of options from school, family, or coaching circles.",
      solution: "50+ real paths mapped by seniors",
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
      solution: "Verified seniors on demand in minutes",
    },
    {
      number: "04",
      title: "Late clarity",
      copy:
        "The right questions often appear after important forms, deadlines, or decisions have already passed.",
      solution: "Proactive guidance before deadlines",
    },
  ];

  return (
    <section
      id="how-it-works"
      className="bg-white py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.74fr_1.26fr] lg:gap-16">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7C3AED]">
              The problem
            </p>

            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-0.04em] text-[#1E1B4B] sm:text-4xl lg:text-5xl">
              Big decisions are easier when someone has already been there.
            </h2>

            <p className="mt-5 text-base leading-7 text-[#5B6475]">
              Mentra exists for the moment when students need more than
              generic advice and less than a giant career-consulting process.
            </p>

            <div className="group relative mt-8 overflow-hidden rounded-[1.75rem] border border-violet-100 bg-[#F8F5FF] shadow-[0_22px_55px_-38px_rgba(76,29,149,0.45)] transition-all duration-300 hover:shadow-[0_28px_65px_-35px_rgba(124,58,237,0.35)]">
              <Image
                src="/brand/decision-guidance-illustration.png"
                alt="A senior helping a student see their academic options more clearly"
                width={1024}
                height={1536}
                sizes="(min-width: 1024px) 29vw, (min-width: 640px) 48vw, 100vw"
                className="aspect-[1.12/1] w-full object-cover object-[50%_34%] transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/70 bg-white/85 p-3.5 shadow-lg shadow-violet-950/10 backdrop-blur-md transition-colors duration-300 group-hover:bg-white/95">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7C3AED]">
                  From uncertainty to a next step
                </p>
                <p className="mt-1 text-sm font-semibold leading-5 text-[#1E1B4B]">
                  A conversation turns a huge decision into a clear path forward.
                </p>
              </div>
            </div>
          </div>

          <HowItWorksSteps items={items} />
        </div>
      </div>
    </section>
  );
}

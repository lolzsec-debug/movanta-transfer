"use client";

import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { useLanguage } from "@/lib/i18n";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";

export function HowItWorks() {
  const { lang, t } = useLanguage();
  const { howItWorksSteps } = lang === "sv" ? sv : en;

  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow={t("How it works", "Så fungerar det")}
          title={t("From search to return, in four steps.", "Från sökning till återlämning, i fyra steg.")}
          align="center"
        />

        <div className="relative mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="pointer-events-none absolute left-0 right-0 top-[2.1rem] hidden h-px bg-ink/10 lg:block"
            aria-hidden
          />

          {howItWorksSteps.map((step, i) => (
            <Reveal key={step.number} delay={i * 90} className="relative flex flex-col gap-4">
              <div className="relative z-10 flex h-[4.2rem] w-[4.2rem] items-center justify-center rounded-2xl border border-ink/10 bg-card text-lg font-semibold text-yellow">
                {step.number}
              </div>
              <h3 className="text-lg font-semibold text-text-primary">{step.title}</h3>
              <p className="text-sm leading-relaxed text-text-secondary">{step.description}</p>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

"use client";

import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { useLanguage } from "@/lib/i18n";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { CheckIcon } from "./ui/CheckIcon";

export function ImpactSection() {
  const { lang, t } = useLanguage();
  const { impactPoints } = lang === "sv" ? sv : en;

  return (
    <section id="impact" className="py-24 sm:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <SectionHeading
            eyebrow={t("The bigger picture", "Den större bilden")}
            title={t(
              "A more efficient way to use the vehicles already around us.",
              "Ett effektivare sätt att använda fordonen som redan finns omkring oss."
            )}
            description={t(
              "Movanta's long-term aim goes beyond any single rental — it's about making better use of resources that already exist.",
              "Movantas långsiktiga mål sträcker sig bortom varje enskild uthyrning — det handlar om att göra bättre bruk av resurser som redan finns."
            )}
          />

          <Reveal delay={100}>
            <ul className="grid gap-4 sm:grid-cols-2">
              {impactPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 rounded-xl border border-ink/10 bg-card/50 p-4 text-sm text-text-secondary transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20 hover:bg-card">
                  <CheckIcon tone="yellow" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

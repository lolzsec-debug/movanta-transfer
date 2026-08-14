"use client";

import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { useLanguage } from "@/lib/i18n";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";

export function ProblemSection() {
  const { lang, t } = useLanguage();
  const { problemPoints } = lang === "sv" ? sv : en;

  return (
    <section id="problem" className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow={t("The problem", "Problemet")}
          title={t("Most vehicles spend the day parked, not driven.", "De flesta fordon tillbringar dagen parkerade, inte körda.")}
          description={t(
            "Ownership rarely matches actual use — and renting one when you need it isn't always simple.",
            "Ägande matchar sällan faktisk användning — och att hyra ett fordon när man behöver det är inte alltid enkelt."
          )}
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <Reveal delay={80} className="order-2 lg:order-1">
            <div className="rounded-2xl border border-ink/10 bg-card p-7">
              <p className="text-sm font-medium text-text-secondary">{t("A privately owned vehicle, in a typical day", "Ett privatägt fordon, under en typisk dag")}</p>
              <div className="mt-5 flex h-10 w-full overflow-hidden rounded-full border border-ink/10 bg-bg-secondary">
                <div className="flex h-full w-[12%] items-center justify-center bg-yellow">
                  <span className="sr-only">{t("Driving", "Körning")}</span>
                </div>
                <div className="flex h-full flex-1 items-center bg-surface" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-yellow" /> {t("Driving", "Körning")}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-surface ring-1 ring-ink/15" /> {t("Parked and unused", "Parkerat och oanvänt")}
                </span>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-text-muted">
                {t("Illustrative only — actual use varies by owner, vehicle and location.", "Endast illustrativt — faktisk användning varierar beroende på ägare, fordon och plats.")}
              </p>
            </div>
          </Reveal>

          <div className="order-1 grid gap-4 sm:grid-cols-2 lg:order-2">
            {problemPoints.map((point, i) => (
              <Reveal key={point.title} delay={i * 60}>
                <div className="h-full rounded-2xl border border-ink/10 bg-card/60 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_20px_40px_-28px_rgba(0,0,0,0.55)]">
                  <h3 className="text-base font-semibold text-text-primary">{point.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">{point.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

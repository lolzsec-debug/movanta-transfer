"use client";

import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { useLanguage } from "@/lib/i18n";
import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { Badge } from "./ui/Badge";

export function DropsSection() {
  const { lang, t } = useLanguage();
  const { dropsFeatures } = lang === "sv" ? sv : en;

  return (
    <section id="drops" className="py-24 sm:py-32">
      <Container>
        <div className="overflow-hidden rounded-[2rem] border border-ink/10 bg-gradient-to-br from-card to-bg-secondary p-8 sm:p-12">
          <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
            <div>
              <Reveal>
                <Badge tone="planned">{t("Future product concept", "Framtida produktkoncept")}</Badge>
              </Reveal>
              <Reveal delay={70}>
                <h2 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl">
                  Movanta Drops
                </h2>
              </Reveal>
              <Reveal delay={120}>
                <p className="mt-4 text-balance text-base leading-relaxed text-text-secondary sm:text-lg">
                  {t(
                    "A future network of secure pickup points — so collecting a vehicle doesn't always have to depend on meeting the owner in person.",
                    "Ett framtida nätverk av säkra upphämtningspunkter — så att det inte alltid behöver kräva ett möte med ägaren för att hämta ett fordon."
                  )}
                </p>
              </Reveal>

              <ul className="mt-8 flex flex-col gap-5">
                {dropsFeatures.map((feature, i) => (
                  <Reveal key={feature.title} delay={160 + i * 60} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{feature.title}</p>
                      <p className="text-sm text-text-secondary">{feature.description}</p>
                    </div>
                  </Reveal>
                ))}
              </ul>
            </div>

            <Reveal delay={140} className="relative">
              <div className="relative mx-auto aspect-square w-full max-w-sm rounded-2xl border border-ink/10 bg-bg-secondary p-6">
                <svg className="h-full w-full opacity-70" viewBox="0 0 200 200" fill="none" aria-hidden>
                  <path d="M-10 50 L60 60 L100 30 L210 70" stroke="#C6CBD1" strokeOpacity="0.25" />
                  <path d="M-10 150 L80 140 L140 175 L210 150" stroke="#C6CBD1" strokeOpacity="0.25" />
                  <path d="M40 -10 L60 210" stroke="#C6CBD1" strokeOpacity="0.18" />
                  <path d="M150 -10 L140 210" stroke="#C6CBD1" strokeOpacity="0.18" />
                  {[
                    [60, 60],
                    [140, 90],
                    [90, 140],
                    [150, 150],
                  ].map(([cx, cy], i) => (
                    <g key={i}>
                      <circle cx={cx} cy={cy} r="14" fill="#17191C" stroke="#FFD400" strokeOpacity="0.4" />
                      <rect x={cx - 5} y={cy - 4} width="10" height="8" rx="1.5" stroke="#FFD400" strokeWidth="1.2" />
                    </g>
                  ))}
                </svg>
                <span className="absolute bottom-4 left-4 rounded-full bg-bg/80 px-3 py-1 text-xs text-text-secondary backdrop-blur">
                  {t("Concept illustration", "Konceptillustration")}
                </span>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

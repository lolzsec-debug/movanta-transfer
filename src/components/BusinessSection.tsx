"use client";

import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { useLanguage } from "@/lib/i18n";
import { Container } from "./ui/Container";
import { Reveal } from "./ui/Reveal";
import { ButtonLink } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { BusinessDashboard } from "./BusinessDashboard";

export function BusinessSection() {
  const { lang, t } = useLanguage();
  const { businessFeatures, dealerJourneySteps } = lang === "sv" ? sv : en;

  return (
    <section id="business" className="relative border-y border-ink/10 bg-bg-secondary py-24 sm:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
          <div>
            <Reveal>
              <Badge tone="planned">{t("Planned business product", "Planerad företagsprodukt")}</Badge>
            </Reveal>
            <Reveal delay={70}>
              <h2 className="mt-5 text-balance text-3xl font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-[2.75rem]">
                {t("Turn idle inventory into an active revenue stream.", "Gör stillastående lager till en aktiv intäktskälla.")}
              </h2>
            </Reveal>
            <Reveal delay={130}>
              <p className="mt-5 text-balance text-base leading-relaxed text-text-secondary sm:text-lg">
                {t(
                  "Movanta Business is built for car, motorcycle and boat dealers and other professional vehicle owners who want to put standing fleet and stock vehicles to work — reaching renters directly, on their own terms.",
                  "Movanta Business är byggt för bil-, motorcykel- och båthandlare och andra professionella fordonsägare som vill sätta stillastående flotta och lagerfordon i arbete — och nå hyresgäster direkt, på sina egna villkor."
                )}
              </p>
            </Reveal>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {businessFeatures.map((feature, i) => (
                <Reveal key={feature.title} delay={160 + i * 50}>
                  <h3 className="text-sm font-semibold text-text-primary">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                    {feature.description}
                  </p>
                </Reveal>
              ))}
            </div>

            <Reveal delay={480} className="mt-10">
              <ButtonLink href="#waitlist">{t("Become a pilot partner", "Bli pilotpartner")}</ButtonLink>
            </Reveal>
          </div>

          <Reveal delay={120}>
            <BusinessDashboard />
          </Reveal>
        </div>

        <Reveal delay={200} className="mt-16 rounded-2xl border border-ink/10 bg-card/50 p-6 sm:p-8">
          <p className="text-sm font-semibold text-text-primary">
            {t("From showroom uncertainty to a real-world experience", "Från osäkerhet i showroomet till en verklig upplevelse")}
          </p>
          <p className="mt-1.5 max-w-2xl text-sm text-text-secondary">
            {t(
              "A planned path for stock vehicles: a customer can rent one for a few days before deciding to buy.",
              "En planerad väg för lagerfordon: en kund kan hyra ett i några dagar innan de bestämmer sig för att köpa."
            )}
          </p>
          <ol className="mt-6 grid gap-4 sm:grid-cols-5">
            {dealerJourneySteps.map((step, i) => (
              <li key={step} className="flex items-start gap-2.5 sm:flex-col sm:gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink/15 text-xs font-medium text-yellow">
                  {i + 1}
                </span>
                <span className="text-sm text-text-secondary">{step}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </Container>
    </section>
  );
}

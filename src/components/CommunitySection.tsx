"use client";

import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { useLanguage } from "@/lib/i18n";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";

export function CommunitySection() {
  const { lang, t } = useLanguage();
  const { communityFeatures } = lang === "sv" ? sv : en;

  return (
    <section id="community" className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow={t("Community", "Gemenskap")}
          title={t("Every journey can help create another journey.", "Varje resa kan hjälpa till att skapa en annan resa.")}
          description={t(
            "Movanta is meant to be more than transactions between strangers — it's a network of people making better use of what's already around them.",
            "Movanta är tänkt att vara mer än transaktioner mellan främlingar — det är ett nätverk av människor som gör bättre bruk av det som redan finns omkring dem."
          )}
          align="center"
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {communityFeatures.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 50}>
              <div className="h-full rounded-2xl border border-ink/10 bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_20px_40px_-28px_rgba(0,0,0,0.55)]">
                <h3 className="text-base font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

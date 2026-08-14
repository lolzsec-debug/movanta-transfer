"use client";

import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { useLanguage } from "@/lib/i18n";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";
import { ButtonLink } from "./ui/Button";
import { CheckIcon } from "./ui/CheckIcon";

export function PrivateSection() {
  const { lang, t } = useLanguage();
  const { ownerFeatures, renterFeatures } = lang === "sv" ? sv : en;

  return (
    <section id="private" className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow={t("Movanta Private", "Movanta Private")}
          title={t("For people renting, and people who own.", "För de som hyr, och de som äger.")}
          description={t(
            "Whether you need a vehicle for an afternoon or want to earn from one that's sitting still, Movanta Private is built around you.",
            "Oavsett om du behöver ett fordon för en eftermiddag eller vill tjäna på ett som står stilla, är Movanta Private byggt kring dig."
          )}
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          <Reveal className="rounded-2xl border border-ink/10 bg-card p-8 transition-colors duration-200 hover:border-ink/20">
            <h3 className="text-xl font-semibold text-text-primary">{t("For renters", "För hyresgäster")}</h3>
            <p className="mt-2 text-sm text-text-secondary">
              {t("Find what you need nearby, and book it with confidence.", "Hitta det du behöver i närheten, och boka det med förtroende.")}
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {renterFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
                  <CheckIcon />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={100} className="rounded-2xl border border-yellow/20 bg-card p-8 transition-colors duration-200 hover:border-yellow/35">
            <h3 className="text-xl font-semibold text-text-primary">{t("For vehicle owners", "För fordonsägare")}</h3>
            <p className="mt-2 text-sm text-text-secondary">
              {t("Turn time your vehicle would spend parked into income, on your terms.", "Gör tiden ditt fordon annars skulle stå parkerat till inkomst, på dina villkor.")}
            </p>
            <ul className="mt-6 flex flex-col gap-3">
              {ownerFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-text-secondary">
                  <CheckIcon tone="yellow" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        <Reveal delay={160} className="mt-10 flex justify-center">
          <ButtonLink href="#waitlist">{t("Register your interest", "Anmäl ditt intresse")}</ButtonLink>
        </Reveal>
      </Container>
    </section>
  );
}

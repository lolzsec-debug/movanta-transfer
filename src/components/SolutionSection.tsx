"use client";

import Image from "next/image";
import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { withBasePath } from "@/lib/basePath";
import { useLanguage } from "@/lib/i18n";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";

export function SolutionSection() {
  const { lang, t } = useLanguage();
  const { marketComparison, positioningPillars, solutionPoints, visionLine } = lang === "sv" ? sv : en;
  return (
    <section id="about" className="py-24 sm:py-32">
      <Container>
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-balance text-lg italic leading-snug text-text-secondary">
            &ldquo;{visionLine}&rdquo;
          </p>
        </Reveal>

        <div className="mt-6">
          <SectionHeading
            eyebrow={t("The Movanta layer", "Movanta-lagret")}
            title={t("Access when you need it. Income when you don't.", "Tillgång när du behöver det. Inkomst när du inte gör det.")}
            description={t(
              "Movanta is the digital infrastructure that brings everyone in a rental together — safely, and in one flow.",
              "Movanta är den digitala infrastrukturen som för samman alla parter i en uthyrning — säkert och i ett enda flöde."
            )}
            align="center"
          />
        </div>

        <div className="mt-20">
          <Reveal className="mx-auto flex w-fit items-center gap-3 rounded-2xl border border-yellow/25 bg-yellow/[0.06] px-6 py-4">
            <Image src={withBasePath("/assets/movanta-logo.png")} alt="" width={512} height={512} className="h-7 w-7 rounded-md" aria-hidden />
            <div className="text-left">
              <p className="text-sm font-semibold text-text-primary">Movanta</p>
              <p className="text-xs text-text-secondary">{t("Booking, agreements & protection", "Bokning, avtal & skydd")}</p>
            </div>
          </Reveal>

          <div className="relative mt-4">
            <div className="mx-auto h-10 w-px bg-ink/15" aria-hidden />
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-10 border-t border-ink/10 pt-10 sm:grid-cols-3 lg:grid-cols-5">
            {solutionPoints.map((point, i) => (
              <Reveal key={point} delay={i * 60} className="relative flex justify-center">
                <span className="absolute -top-10 h-10 w-px bg-ink/15 sm:block" aria-hidden />
                <div className="w-full max-w-[180px] rounded-xl border border-ink/10 bg-card px-4 py-5 text-center">
                  <p className="text-sm font-medium leading-snug text-text-primary">{point}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {positioningPillars.map((pillar, i) => (
            <Reveal key={pillar.title} delay={i * 50}>
              <div className="h-full rounded-2xl border border-ink/10 bg-card/60 px-5 py-5">
                <p className="text-sm font-semibold text-yellow">{pillar.title}</p>
                <p className="mt-1 text-sm text-text-secondary">{pillar.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-20">
          <Reveal className="mx-auto max-w-lg text-center">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-text-muted">
              {t("Where Movanta fits", "Var Movanta passar in")}
            </p>
          </Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {marketComparison.map((item, i) => (
              <Reveal key={item.label} delay={i * 70}>
                <div
                  className={`h-full rounded-2xl border p-6 ${
                    item.highlight
                      ? "border-yellow/30 bg-yellow/[0.06]"
                      : "border-ink/10 bg-card/50"
                  }`}
                >
                  <p
                    className={`text-base font-semibold ${
                      item.highlight ? "text-yellow" : "text-text-primary"
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {item.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

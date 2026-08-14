"use client";

import Image from "next/image";
import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { withBasePath } from "@/lib/basePath";
import { useLanguage } from "@/lib/i18n";
import { ButtonLink } from "./ui/Button";
import { VehicleMarketplacePreview } from "./VehicleMarketplacePreview";
import { Reveal } from "./ui/Reveal";
import { Container } from "./ui/Container";
import { CursorSpotlight } from "./ui/CursorSpotlight";

export function Hero() {
  const { lang, t } = useLanguage();
  const { brand } = lang === "sv" ? sv : en;
  return (
    <section id="top" className="relative overflow-hidden pb-20 pt-36 sm:pb-28 sm:pt-44">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute left-1/2 top-[-10%] h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-yellow/[0.05] blur-[120px]" />
        <svg
          className="absolute inset-x-0 top-0 h-full w-full opacity-[0.15]"
          viewBox="0 0 1200 800"
          fill="none"
          preserveAspectRatio="xMidYMin slice"
        >
          <path d="M-50 120 L340 200 L540 90 L1250 260" stroke="#C6CBD1" strokeWidth="1" />
          <path d="M-50 420 L300 380 L620 560 L1250 480" stroke="#C6CBD1" strokeWidth="1" />
          <path
            d="M180 -50 L260 380 L120 850"
            stroke="#FFD400"
            strokeOpacity="0.5"
            strokeDasharray="6 10"
            className="animate-dash"
          />
        </svg>
        <CursorSpotlight />
      </div>

      <Container className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div className="max-w-xl">
          <Reveal>
            <Image
              src={withBasePath("/assets/movanta-logo.png")}
              alt=""
              width={512}
              height={512}
              aria-hidden
              className="h-11 w-11 rounded-xl"
            />
          </Reveal>

          <Reveal delay={40} className="mt-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-ink/[0.03] px-4 py-1.5 text-sm text-text-secondary">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow" />
              {brand.slogan}
            </span>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-tight text-text-primary sm:text-5xl lg:text-[3.4rem]">
              {t("Your next vehicle is closer than you think.", "Ditt nästa fordon är närmare än du tror.")}
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-6 text-balance text-lg leading-relaxed text-text-secondary">
              {t(
                "Rent nearby cars, motorcycles, boats and other motorised vehicles from private owners and verified businesses — with booking, agreements and protection in one place.",
                "Hyr bilar, motorcyklar, båtar och andra motordrivna fordon i närheten från privatpersoner och verifierade företag — med bokning, avtal och skydd på ett och samma ställe."
              )}
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href={withBasePath("/app")}>{t("Try the app demo", "Testa appen (demo)")}</ButtonLink>
              <ButtonLink href="#waitlist" variant="secondary">{brand.waitlistCta}</ButtonLink>
              <ButtonLink href="#private" variant="secondary">
                {t("List your vehicle", "Lista ditt fordon")}
              </ButtonLink>
            </div>
          </Reveal>

          <Reveal delay={260}>
            <a
              href="#business"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
            >
              {t("Explore Movanta Business", "Utforska Movanta Business")}
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M4 8h8M8.5 4.5L12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </Reveal>
        </div>

        <Reveal delay={160} className="lg:justify-self-end">
          <VehicleMarketplacePreview />
        </Reveal>
      </Container>
    </section>
  );
}

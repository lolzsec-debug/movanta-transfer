"use client";

import type { ReactNode } from "react";
import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { useLanguage } from "@/lib/i18n";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";

// Indexed to match trustFeatures order (not keyed by title, since the title
// text changes with language but the icon for a given feature does not).
const icons: ReactNode[] = [
  <path key="0" d="M12 3l7 3v5c0 4.8-3 8.4-7 10-4-1.6-7-5.2-7-10V6l7-3z" />,
  <path key="1" d="M4 6h16v12H4z M4 10h16 M8 15h4" />,
  <path key="2" d="M6 3h9l3 3v15H6z M9 11h6 M9 15h6" />,
  <path key="3" d="M4 8l1-3h14l1 3 M4 8v11h16V8 M4 8h16 M9 12a3 3 0 006 0" />,
  <path key="4" d="M12 3a9 9 0 100 18 9 9 0 000-18z M12 7v5l3.5 2" />,
  <path key="5" d="M4 5h16v10H8l-4 4z" />,
];

export function TrustSection() {
  const { lang, t } = useLanguage();
  const { trustFeatures } = lang === "sv" ? sv : en;

  return (
    <section id="trust" className="py-24 sm:py-32">
      <Container>
        <SectionHeading
          eyebrow={t("Trust and protection", "Förtroende och skydd")}
          title={t("Built around safety, from the first booking.", "Byggt kring säkerhet, från första bokningen.")}
          description={t(
            "Every rental on Movanta is designed to be verified, documented and protected — not left to a handshake.",
            "Varje uthyrning på Movanta är utformad för att vara verifierad, dokumenterad och skyddad — inte överlåten åt ett handslag."
          )}
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trustFeatures.map((feature, i) => (
            <Reveal key={feature.title} delay={i * 50}>
              <div className="h-full rounded-2xl border border-ink/10 bg-card p-6 transition-all duration-200 hover:-translate-y-1 hover:border-ink/20 hover:shadow-[0_20px_40px_-28px_rgba(0,0,0,0.55)]">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-ink/10 bg-ink/[0.03] text-yellow">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    {icons[i]}
                  </svg>
                </span>
                <h3 className="mt-4 text-base font-semibold text-text-primary">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">{feature.description}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={280} className="mt-10 rounded-2xl border border-ink/10 bg-ink/[0.02] p-6">
          <p className="text-sm leading-relaxed text-text-secondary">
            {t(
              "Insurance protection is intended to be provided through an external insurance partner. Coverage details will be shared ahead of launch.",
              "Försäkringsskydd är tänkt att tillhandahållas via en extern försäkringspartner. Detaljer om täckning delas inför lansering."
            )}
          </p>
        </Reveal>
      </Container>
    </section>
  );
}

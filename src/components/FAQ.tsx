"use client";

import { useState } from "react";
import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { useLanguage } from "@/lib/i18n";
import { Container } from "./ui/Container";
import { SectionHeading } from "./ui/SectionHeading";
import { Reveal } from "./ui/Reveal";

export function FAQ() {
  const { lang, t } = useLanguage();
  const { faqItems } = lang === "sv" ? sv : en;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow="FAQ" title={t("Common questions", "Vanliga frågor")} align="center" />

        <Reveal delay={80} className="mx-auto mt-12 flex max-w-3xl flex-col divide-y divide-ink/10 rounded-2xl border border-ink/10 bg-card">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-button-${index}`;
            const panelId = `faq-panel-${index}`;

            return (
              <div key={item.question}>
                <h3>
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-medium text-text-primary">{item.question}</span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink/15 text-text-secondary transition-transform duration-200 ${
                        isOpen ? "rotate-45 border-yellow/40 text-yellow" : ""
                      }`}
                      aria-hidden
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                  </button>
                </h3>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0">
                    <p className="px-6 pb-5 text-sm leading-relaxed text-text-secondary">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </Container>
    </section>
  );
}

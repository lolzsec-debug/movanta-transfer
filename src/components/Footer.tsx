"use client";

import Image from "next/image";
import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { withBasePath } from "@/lib/basePath";
import { useLanguage } from "@/lib/i18n";
import { Container } from "./ui/Container";

export function Footer() {
  const { lang, t } = useLanguage();
  const { brand, navLinks } = lang === "sv" ? sv : en;

  const legalLinks = [
    { label: t("Privacy", "Integritet"), href: "/privacy" },
    { label: t("Terms", "Villkor"), href: "/terms" },
    { label: t("Cookies", "Cookies"), href: "/cookies" },
  ];

  const socialLinks = [
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "TikTok", href: "#" },
  ];

  return (
    <footer className="border-t border-ink/10 bg-bg-secondary">
      <Container className="py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <a href="#top" className="inline-flex items-center gap-2.5 text-text-primary" aria-label="Movanta home">
              <Image
                src={withBasePath("/assets/movanta-logo.png")}
                alt="Movanta"
                width={512}
                height={512}
                className="h-8 w-8 rounded-lg"
              />
              <span className="text-lg font-semibold tracking-tight">Movanta</span>
            </a>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-text-secondary">{brand.slogan}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-primary">{t("Navigate", "Navigera")}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                    {link.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#waitlist" className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                  {brand.waitlistCta}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-primary">{t("Contact", "Kontakt")}</p>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-text-secondary">
              <li>
                <a href="mailto:hello@movanta.com" className="transition-colors hover:text-text-primary">
                  hello@movanta.com
                </a>
              </li>
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="transition-colors hover:text-text-primary">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-text-primary">{t("Legal", "Juridiskt")}</p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a href={withBasePath(link.href)} className="text-sm text-text-secondary transition-colors hover:text-text-primary">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-ink/10 pt-8 text-sm text-text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>{t("Movanta is currently under development.", "Movanta är för närvarande under utveckling.")}</p>
          <p>© {new Date().getFullYear()} Movanta. {t("All rights reserved.", "Alla rättigheter förbehållna.")}</p>
        </div>
      </Container>
    </footer>
  );
}

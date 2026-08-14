"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { withBasePath } from "@/lib/basePath";
import { useLanguage } from "@/lib/i18n";
import { ButtonLink } from "./ui/Button";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const { lang } = useLanguage();
  const { brand, navLinks } = lang === "sv" ? sv : en;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeHref, setActiveHref] = useState<string>("");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    // Hrefs are identical across languages (only labels translate), so this
    // can safely run once against the language-independent link list.
    const sections = en.navLinks
      .map((link) => document.querySelector(link.href))
      .filter((el): el is Element => el !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveHref(`#${entry.target.id}`);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-ink/10 bg-bg/80 backdrop-blur-lg"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-10"
      >
        <a href="#top" className="flex items-center gap-2.5 text-text-primary" aria-label="Movanta home">
          <Image
            src={withBasePath("/assets/movanta-logo.png")}
            alt="Movanta"
            width={512}
            height={512}
            priority
            className="h-8 w-8 rounded-lg sm:h-9 sm:w-9"
          />
          <span className="text-lg font-semibold tracking-tight">Movanta</span>
        </a>

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`group relative py-1 text-sm font-medium transition-colors ${
                activeHref === link.href
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {link.label}
              <span
                className={`absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-yellow transition-transform duration-300 ${
                  activeHref === link.href ? "scale-x-100" : "group-hover:scale-x-50"
                }`}
                aria-hidden
              />
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <ThemeToggle />
          <LanguageSwitcher />
          <ButtonLink href={withBasePath("/app")} variant="secondary" className="text-sm">
            {brand.appCta}
          </ButtonLink>
          <ButtonLink href="#waitlist" className="text-sm">
            {brand.waitlistCta}
          </ButtonLink>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeToggle />
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-text-primary"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <span className="relative block h-3.5 w-4">
              <span
                className={`absolute left-0 top-0 h-[1.5px] w-full bg-current transition-transform duration-200 ${
                  menuOpen ? "translate-y-[6.5px] rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 bottom-0 h-[1.5px] w-full bg-current transition-transform duration-200 ${
                  menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className={`grid overflow-hidden border-b border-ink/10 bg-bg transition-[grid-template-rows] duration-300 ease-out lg:hidden ${
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr] border-b-0"
        }`}
      >
        <div className="min-h-0">
          <div className="flex flex-col gap-1 px-5 pb-6 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-text-secondary transition-colors hover:bg-ink/[0.04] hover:text-text-primary"
              >
                {link.label}
              </a>
            ))}
            <ButtonLink
              href={withBasePath("/app")}
              variant="secondary"
              onClick={() => setMenuOpen(false)}
              className="mt-3 w-full"
            >
              {brand.appCta}
            </ButtonLink>
            <ButtonLink href="#waitlist" onClick={() => setMenuOpen(false)} className="mt-2 w-full">
              {brand.waitlistCta}
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}

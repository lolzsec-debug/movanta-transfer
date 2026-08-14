"use client";

import { useLanguage } from "@/lib/i18n";

export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();

  return (
    <div
      className={`flex items-center rounded-full border border-ink/10 bg-ink/[0.03] p-0.5 text-xs font-semibold ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-full px-2.5 py-1.5 transition-colors ${
          lang === "en" ? "bg-yellow text-[#08090A]" : "text-text-secondary hover:text-text-primary"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("sv")}
        aria-pressed={lang === "sv"}
        className={`rounded-full px-2.5 py-1.5 transition-colors ${
          lang === "sv" ? "bg-yellow text-[#08090A]" : "text-text-secondary hover:text-text-primary"
        }`}
      >
        SV
      </button>
    </div>
  );
}

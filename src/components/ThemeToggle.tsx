"use client";

import { useId } from "react";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const maskId = useId();

  return (
    <button
      type="button"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      }}
      aria-label={
        theme === "dark"
          ? t("Switch to light theme", "Byt till ljust tema")
          : t("Switch to dark theme", "Byt till mörkt tema")
      }
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-ink/[0.03] text-text-secondary transition-colors hover:border-ink/25 hover:text-text-primary ${className}`}
    >
      {/* Moon in dark mode; the mask circle slides away and rays fade in to
          become a sun in light mode (see .theme-icon rules in globals.css). */}
      <svg viewBox="0 0 24 24" className="theme-icon h-[18px] w-[18px]" aria-hidden>
        <mask id={maskId}>
          <rect x="-6" y="-6" width="36" height="36" fill="white" />
          <circle className="theme-icon-mask" cx="16.5" cy="7.5" r="7" fill="black" />
        </mask>
        <circle cx="12" cy="12" r="8" fill="currentColor" mask={`url(#${maskId})`} className="theme-icon-sun" />
        <g
          className="theme-icon-rays"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        >
          <line x1="12" y1="1.2" x2="12" y2="3.4" />
          <line x1="12" y1="20.6" x2="12" y2="22.8" />
          <line x1="1.2" y1="12" x2="3.4" y2="12" />
          <line x1="20.6" y1="12" x2="22.8" y2="12" />
          <line x1="4.4" y1="4.4" x2="5.9" y2="5.9" />
          <line x1="18.1" y1="18.1" x2="19.6" y2="19.6" />
          <line x1="4.4" y1="19.6" x2="5.9" y2="18.1" />
          <line x1="18.1" y1="5.9" x2="19.6" y2="4.4" />
        </g>
      </svg>
    </button>
  );
}

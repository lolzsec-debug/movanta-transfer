"use client";

import { useState } from "react";
import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import type { PreviewVehicleKind } from "@/lib/data";
import { useLanguage } from "@/lib/i18n";

const vehicleIconPaths: Record<PreviewVehicleKind, string> = {
  car: "M4 16l1.2-4.8A2 2 0 0 1 7.14 9.6h9.72a2 2 0 0 1 1.94 1.6L20 16M4 16v3a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-1h10v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3M4 16h16",
  motorcycle: "M5 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.3 15.5L10 11h3.5l1.7 2M13.5 11L11 7H8M14.5 13h2.8",
  boat: "M3.5 15h17l-1.8 4.2a1 1 0 0 1-.92.8H6.2a1 1 0 0 1-.92-.8L3.5 15zM6 15V8.5h7l3 6.5M11 8.5V4",
};

/**
 * A hand-built, non-photographic preview of the Movanta booking interface:
 * a map view with nearby vehicles, distance and price, and a booking card.
 * Deliberately avoids real map tiles or vehicle photography.
 */
export function VehicleMarketplacePreview() {
  const { lang, t } = useLanguage();
  const { previewVehicles } = lang === "sv" ? sv : en;
  const [activeId, setActiveId] = useState(previewVehicles[0].id);
  const active = previewVehicles.find((v) => v.id === activeId) ?? previewVehicles[0];

  return (
    <div className="relative mx-auto w-full max-w-md select-none">
      <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-yellow/[0.06] blur-3xl" aria-hidden />

      <div className="overflow-hidden rounded-[1.75rem] border border-ink/10 bg-card shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
        {/* Status / search bar */}
        <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
          <div>
            <p className="text-xs text-text-muted">{t("Searching near", "Söker nära")}</p>
            <p className="text-sm font-medium text-text-primary">{t("Central Stockholm", "Centrala Stockholm")}</p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/[0.06]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" className="text-text-secondary" />
              <path d="M11 11L14.5 14.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" className="text-text-secondary" />
            </svg>
          </div>
        </div>

        {/* Map area */}
        <div className="relative h-64 overflow-hidden bg-bg-secondary">
          <svg
            className="absolute inset-0 h-full w-full opacity-40"
            viewBox="0 0 300 240"
            fill="none"
            aria-hidden
          >
            <path d="M-10 40 L120 60 L160 30 L310 70" stroke="#C6CBD1" strokeOpacity="0.25" strokeWidth="1" />
            <path d="M-10 140 L100 130 L180 190 L310 160" stroke="#C6CBD1" strokeOpacity="0.25" strokeWidth="1" />
            <path d="M40 -10 L70 120 L30 250" stroke="#C6CBD1" strokeOpacity="0.2" strokeWidth="1" />
            <path d="M230 -10 L210 110 L250 250" stroke="#C6CBD1" strokeOpacity="0.2" strokeWidth="1" />
            <path
              d="M60 190 Q 120 120 150 100 T 230 40"
              stroke="#FFD400"
              strokeOpacity="0.55"
              strokeWidth="1.6"
              strokeDasharray="4 6"
              className="animate-dash"
            />
          </svg>

          {previewVehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => setActiveId(vehicle.id)}
              aria-pressed={activeId === vehicle.id}
              aria-label={t(
                `${vehicle.name}, ${vehicle.distanceKm} km away, ${vehicle.pricePerDay} SEK per day`,
                `${vehicle.name}, ${vehicle.distanceKm} km bort, ${vehicle.pricePerDay} kr per dag`
              )}
              style={{ top: vehicle.top, left: vehicle.left }}
              className="group absolute -translate-x-1/2 -translate-y-1/2 focus-visible:z-10"
            >
              <span className="relative flex h-9 w-9 items-center justify-center">
                {activeId === vehicle.id && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-yellow/50" aria-hidden />
                )}
                <span
                  className={`relative flex h-9 w-9 items-center justify-center rounded-full border shadow-lg transition-all duration-200 ${
                    activeId === vehicle.id
                      ? "scale-110 border-yellow bg-yellow text-[#08090A]"
                      : "border-ink/20 bg-card text-text-primary group-hover:border-ink/40"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path
                      d={vehicleIconPaths[vehicle.kind]}
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </span>
              {activeId !== vehicle.id && (
                <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-bg/90 px-2 py-0.5 text-[11px] text-text-secondary opacity-0 transition-opacity group-hover:opacity-100">
                  {vehicle.distanceKm} km
                </span>
              )}
            </button>
          ))}

          <span className="absolute left-[8%] top-[10%] h-2 w-2 animate-pulse-soft rounded-full bg-metal/50" aria-hidden />
          <span className="absolute right-[12%] bottom-[14%] h-1.5 w-1.5 animate-pulse-soft rounded-full bg-metal/40" aria-hidden />
        </div>

        {/* Booking card */}
        <div className="border-t border-ink/10 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-text-primary">{active.name}</h3>
                {active.verified && (
                  <span
                    className="flex items-center gap-1 rounded-full border border-yellow/30 bg-yellow/10 px-2 py-0.5 text-[11px] font-medium text-yellow"
                    title={t("Identity and licence verified", "Identitet och körkort verifierat")}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
                      <path d="M12 2l7 3v6c0 5-3.4 8.4-7 11-3.6-2.6-7-6-7-11V5l7-3z" fill="currentColor" />
                    </svg>
                    {t("Verified", "Verifierad")}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary">
                {active.category} · {active.distanceKm} {t("km away", "km bort")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-text-primary">{active.pricePerDay} SEK</p>
              <p className="text-xs text-text-muted">{t("per day", "per dag")}</p>
            </div>
          </div>

          <button
            type="button"
            className="mt-4 w-full rounded-full bg-yellow py-3 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {t("Request to book", "Begär bokning")}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import * as en from "@/lib/data";
import * as sv from "@/lib/data.sv";
import { useLanguage } from "@/lib/i18n";
import { CountUp } from "./ui/CountUp";

const utilisationBars = [38, 52, 44, 61, 70, 55, 66];

/**
 * A conceptual preview of the planned Movanta Business dashboard.
 * All figures are illustrative sample data, not real platform metrics.
 */
export function BusinessDashboard() {
  const { lang, t } = useLanguage();
  const { businessDashboardRequests, businessDashboardStats } = lang === "sv" ? sv : en;
  const chartRef = useRef<HTMLDivElement | null>(null);
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const node = chartRef.current;
    if (!node) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBarsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setBarsVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-ink/10 bg-card shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)]">
      <div className="flex items-center justify-between border-b border-ink/10 px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-text-primary">{t("Fleet overview", "Flottöversikt")}</p>
          <p className="text-xs text-text-muted">{t("Sample data, for illustration only", "Exempeldata, endast för illustration")}</p>
        </div>
        <span className="rounded-full border border-ink/15 bg-ink/[0.04] px-3 py-1 text-[11px] font-medium text-metal">
          {t("Planned dashboard", "Planerad instrumentpanel")}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px bg-ink/10 sm:grid-cols-4">
        {businessDashboardStats.map((stat) => (
          <div key={stat.label} className="bg-card px-5 py-5">
            <p className="text-xl font-semibold text-text-primary">
              <CountUp value={stat.value} />
            </p>
            <p className="text-xs text-text-muted">
              {stat.label} · {stat.suffix}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-px bg-ink/10 sm:grid-cols-2">
        <div ref={chartRef} className="bg-card p-6">
          <p className="text-sm font-medium text-text-secondary">{t("Utilisation, last 7 days", "Nyttjande, senaste 7 dagarna")}</p>
          <div className="mt-5 flex h-28 items-end gap-2.5">
            {utilisationBars.map((value, i) => (
              <div key={i} className="flex-1 rounded-t-md bg-surface">
                <div
                  className="w-full rounded-t-md bg-yellow/80 transition-[height] duration-700 ease-out"
                  style={{ height: barsVisible ? `${value}%` : "0%", transitionDelay: `${i * 60}ms` }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card p-6">
          <p className="text-sm font-medium text-text-secondary">{t("Recent requests", "Senaste förfrågningar")}</p>
          <ul className="mt-4 flex flex-col gap-3">
            {businessDashboardRequests.map((request) => (
              <li
                key={request.vehicle}
                className="flex items-center justify-between rounded-lg border border-ink/10 bg-bg-secondary px-3.5 py-3 text-sm transition-colors duration-200 hover:border-ink/20"
              >
                <div>
                  <p className="font-medium text-text-primary">{request.vehicle}</p>
                  <p className="text-xs text-text-muted">{request.location}</p>
                </div>
                <span className="text-xs font-medium text-text-secondary">{request.status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric string (e.g. "142,300") counting up from 0 once it
 * enters the viewport. Falls back to the final value immediately when the
 * user prefers reduced motion.
 */
export function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    const node = ref.current;
    const target = Number(value.replace(/[^0-9]/g, ""));
    if (!node || Number.isNaN(target)) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(value);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();

          const duration = 1100;
          const start = performance.now();

          function tick(now: number) {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * eased);
            setDisplay(progress < 1 ? current.toLocaleString("en-US") : value);
            if (progress < 1) requestAnimationFrame(tick);
          }

          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}

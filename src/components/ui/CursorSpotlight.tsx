"use client";

import { useEffect, useRef } from "react";

/**
 * A soft radial glow that follows the pointer within the nearest <section>
 * ancestor. Skipped under prefers-reduced-motion and on touch devices,
 * where there is no meaningful pointer to track. Listens on window rather
 * than the section itself, since this element sits inside a
 * pointer-events-none decorative layer and would never receive events.
 */
export function CursorSpotlight() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const container = node.closest("section");
    if (!container) return;

    function handleMove(e: MouseEvent) {
      const rect = container!.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      const inside = x >= 0 && x <= 100 && y >= 0 && y <= 100;
      node!.style.opacity = inside ? "1" : "0";
      if (inside) {
        node!.style.setProperty("--spot-x", `${x}%`);
        node!.style.setProperty("--spot-y", `${y}%`);
      }
    }

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
      style={{
        background:
          "radial-gradient(480px circle at var(--spot-x, 50%) var(--spot-y, 0%), rgba(255,212,0,0.07), transparent 60%)",
      }}
      aria-hidden
    />
  );
}

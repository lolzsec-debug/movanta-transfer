"use client";

import { useEffect, useRef } from "react";

/**
 * A thin fixed progress bar reflecting scroll position through the page.
 * Purely decorative and driven by user scrolling, so it stays active even
 * under prefers-reduced-motion (there is nothing to animate on its own).
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ticking = false;

    function update() {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      if (barRef.current) {
        barRef.current.style.width = `${Math.min(100, Math.max(0, progress))}%`;
      }
      ticking = false;
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent" aria-hidden>
      <div ref={barRef} className="h-full w-0 bg-yellow transition-[width] duration-150 ease-out" />
    </div>
  );
}

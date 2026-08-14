"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { flushSync } from "react-dom";

export type Theme = "dark" | "light";

const STORAGE_KEY = "movanta_theme";

type ThemeContextValue = {
  theme: Theme;
  /**
   * Switch between dark and light. Pass the toggle button's center so the
   * circular reveal expands from it; without an origin it expands from the
   * top center of the viewport.
   */
  toggleTheme: (origin?: { x: number; y: number }) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void) => { ready: Promise<void> };
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // The inline script in layout.tsx applies the stored theme before first
    // paint; sync React state with whatever it decided.
    if (document.documentElement.classList.contains("light")) setTheme("light");
  }, []);

  const toggleTheme = useCallback(
    (origin?: { x: number; y: number }) => {
      const next: Theme = theme === "dark" ? "light" : "dark";
      const root = document.documentElement;

      const apply = () => {
        flushSync(() => setTheme(next));
        root.classList.toggle("light", next === "light");
      };

      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Private browsing or blocked storage — the switch still works for this visit.
      }

      const doc = document as DocumentWithViewTransition;
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduceMotion || typeof doc.startViewTransition !== "function") {
        // Fallback (or reduced motion): cross-fade every themed property in
        // place via the .theme-switching rules in globals.css. Under reduced
        // motion those transitions are collapsed to ~0ms, giving an instant flip.
        root.classList.add("theme-switching");
        apply();
        window.setTimeout(() => root.classList.remove("theme-switching"), 450);
        return;
      }

      const x = origin?.x ?? window.innerWidth / 2;
      const y = origin?.y ?? 0;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      doc
        .startViewTransition(apply)
        .ready.then(() => {
          root.animate(
            {
              clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
            },
            {
              duration: 550,
              easing: "cubic-bezier(0.4, 0, 0.2, 1)",
              pseudoElement: "::view-transition-new(root)",
            }
          );
        })
        .catch(() => {
          // The transition was skipped (e.g. another one was running); the
          // theme itself has already been applied.
        });
    },
    [theme]
  );

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

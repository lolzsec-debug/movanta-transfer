"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import type { IntroHandle } from "./highwayScene";

/**
 * Full-screen 3D highway intro. The inline gate script in page.tsx decides
 * before first paint whether the intro should play (every load, unless the
 * visitor prefers reduced motion) and covers the page via html[data-intro]
 * CSS; this component takes over that cover, runs the scene, and fades out.
 */
export function HighwayIntro() {
  const [phase, setPhase] = useState<"idle" | "running" | "leaving" | "done">("idle");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const handleRef = useRef<IntroHandle | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!document.documentElement.hasAttribute("data-intro")) return;
    setPhase("running");
  }, []);

  useEffect(() => {
    if (phase !== "running") return;

    let cancelled = false;
    const leave = () => {
      if (!cancelled) setPhase("leaving");
    };

    // If the scene can't start promptly (slow network, WebGL failure), skip it.
    const bail = window.setTimeout(leave, 5000);

    import("./highwayScene")
      .then((m) => {
        if (cancelled) return;
        window.clearTimeout(bail);
        const canvas = canvasRef.current;
        if (!canvas) return leave();
        try {
          handleRef.current = m.startHighwayIntro(canvas, leave);
        } catch {
          leave(); // e.g. WebGL unavailable
        }
      })
      .catch(() => {
        window.clearTimeout(bail);
        leave();
      });

    // The pre-paint CSS cover has done its job once the canvas overlay exists.
    document.documentElement.removeAttribute("data-intro");

    return () => {
      cancelled = true;
      window.clearTimeout(bail);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "leaving") return;
    // Keep rendering beneath the fade, then release everything.
    const cleanup = window.setTimeout(() => {
      handleRef.current?.dispose();
      handleRef.current = null;
      setPhase("done");
    }, 550);
    return () => window.clearTimeout(cleanup);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running" && phase !== "leaving") return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [phase]);

  if (phase === "idle" || phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#08090a] transition-opacity duration-500 ease-out ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      aria-hidden
    >
      <canvas ref={canvasRef} className="h-full w-full" />
      <button
        type="button"
        onClick={() => (handleRef.current ? handleRef.current.skip() : setPhase("leaving"))}
        className="absolute bottom-6 right-6 rounded-full border border-white/25 px-4 py-2 text-xs font-medium text-white/70 transition-colors hover:border-white/50 hover:text-white"
      >
        {t("Skip intro", "Hoppa över intro")}
      </button>
    </div>
  );
}

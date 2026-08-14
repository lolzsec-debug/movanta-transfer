"use client";

import { HTMLAttributes, ReactNode, useEffect, useRef, useState } from "react";

/**
 * Fades and slides content into view once it enters the viewport.
 * Renders content visible-by-default so it degrades gracefully without JS,
 * and honours prefers-reduced-motion via the animation CSS itself.
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
} & HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${visible ? "animate-fade-up" : "opacity-0"}`}
      style={visible ? { animationDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}

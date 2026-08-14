"use client";

import type { ChangeEventHandler, CSSProperties } from "react";

/**
 * Range slider in the brand style: yellow thumb and filled portion on a
 * theme-aware track (see .themed-range in globals.css). WebKit cannot style
 * the filled portion natively, so the fill percentage is passed down as a
 * CSS custom property.
 */
export function RangeInput({
  min,
  max,
  step = 1,
  value,
  onChange,
  className = "",
}: {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  className?: string;
}) {
  const fill = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={onChange}
      className={`themed-range w-full ${className}`}
      style={{ "--range-fill": `${fill}%` } as CSSProperties}
    />
  );
}

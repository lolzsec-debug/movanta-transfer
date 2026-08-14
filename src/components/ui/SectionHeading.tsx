import { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
}) {
  const alignClasses = align === "center" ? "mx-auto text-center items-center" : "text-left";

  return (
    <Reveal className={`flex max-w-2xl flex-col gap-4 ${alignClasses}`}>
      {eyebrow ? (
        <span className="text-sm font-medium uppercase tracking-[0.14em] text-yellow">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-balance text-3xl font-semibold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {description ? (
        <p className="text-balance text-base leading-relaxed text-text-secondary sm:text-lg">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}

import { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold transition-transform duration-200 ease-out focus-visible:outline-2 focus-visible:outline-yellow disabled:opacity-50 disabled:pointer-events-none";

const variants = {
  primary:
    "overflow-hidden bg-yellow text-[#08090A] px-6 py-3.5 hover:-translate-y-0.5 hover:brightness-95 active:translate-y-0",
  secondary:
    "border border-ink/15 bg-ink/[0.03] text-text-primary px-6 py-3.5 hover:border-ink/25 hover:bg-ink/[0.06] active:translate-y-0",
  ghost:
    "text-text-secondary px-2 py-1 hover:text-text-primary underline-offset-4 hover:underline",
};

type CommonProps = {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
};

function Shine({ variant }: { variant: keyof typeof variants }) {
  if (variant !== "primary") return null;
  return (
    <span
      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-ink/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
      aria-hidden
    />
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  ...props
}: CommonProps & { href: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a href={href} className={`${base} ${variants[variant]} ${className}`} {...props}>
      <Shine variant={variant} />
      <span className="relative">{children}</span>
    </a>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      <Shine variant={variant} />
      <span className="relative">{children}</span>
    </button>
  );
}

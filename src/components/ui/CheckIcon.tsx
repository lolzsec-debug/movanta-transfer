export function CheckIcon({ tone = "default" }: { tone?: "default" | "yellow" }) {
  return (
    <span
      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
        tone === "yellow" ? "bg-yellow/15 text-yellow" : "bg-ink/10 text-metal"
      }`}
      aria-hidden
    >
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.2L4.8 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

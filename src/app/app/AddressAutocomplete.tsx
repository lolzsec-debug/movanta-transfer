"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { autocompleteAddress, type AddressSuggestion } from "./geo";

export function AddressAutocomplete({
  value, onChange, onSelect, placeholder,
}: {
  value: string;
  onChange: (text: string) => void;
  onSelect: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
}) {
  const { t } = useLanguage();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  function runSearch(query: string) {
    const thisRequest = ++requestId.current;
    setLoading(true);
    autocompleteAddress(query).then((result) => {
      if (requestId.current !== thisRequest) return;
      setLoading(false);
      setSearched(true);
      setFailed(result.failed);
      setSuggestions(result.suggestions);
      setOpen(true);
      setActiveIndex(-1);
    });
  }

  // Debounced search-as-you-type — fires ~350ms after typing stops, and only
  // once the query is at least 3 characters, so we never hit the (free,
  // rate-limited) geocoding service on every keystroke.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 3) {
      requestId.current++;
      setSuggestions([]);
      setSearched(false);
      setFailed(false);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(value), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function choose(s: AddressSuggestion) {
    onSelect(s);
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIndex >= 0) {
        e.preventDefault();
        choose(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="address-suggestions"
        className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
      />
      {loading && <span className="absolute right-3 top-[calc(50%+4px)] -translate-y-1/2 text-[11px] text-text-muted">{t("Searching…", "Söker…")}</span>}
      {open && (
        <div id="address-suggestions" className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-ink/10 bg-card shadow-xl">
          {suggestions.length > 0 ? (
            <ul role="listbox">
              {suggestions.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === activeIndex}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(s)}
                    className={`flex w-full flex-col items-start gap-0.5 px-3.5 py-2.5 text-left text-sm ${
                      i === activeIndex ? "bg-yellow/10 text-yellow" : "text-text-primary hover:bg-ink/[0.04]"
                    }`}
                  >
                    <span>{s.street || s.label}</span>
                    <span className="text-xs text-text-muted">{[s.postcode, s.city, s.municipality].filter(Boolean).join(" · ")}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : searched && !loading && failed ? (
            <div className="flex items-center justify-between gap-2 px-3.5 py-3 text-xs">
              <span className="text-text-muted">{t("Couldn't search for an address right now.", "Kunde inte söka adress just nu.")}</span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runSearch(value)}
                className="shrink-0 font-medium text-yellow hover:underline"
              >
                {t("Try again", "Försök igen")}
              </button>
            </div>
          ) : searched && !loading ? (
            <p className="px-3.5 py-3 text-xs text-text-muted">
              {t("No address found — you can still type it in manually.", "Ingen adress hittades — du kan fortfarande skriva in den manuellt.")}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

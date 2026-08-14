// Shared icon set for the app — extracted so both AppShell.tsx and the
// listing-creation components (ListingWizard, OwnerDashboard) can use the
// same glyphs without a circular import between them and AppShell.
import type { VehicleType } from "./data";

export type IconName =
  | "search" | "pin" | "calendar" | "clock" | "star" | "chevronLeft" | "chevronRight"
  | "eye" | "eyeOff" | "user" | "filter" | "list" | "map" | "compass" | "ticket"
  | "settings" | "logout" | "card" | "shield" | "close" | "check" | "bolt"
  | "seat" | "gear" | "fuel" | "edit" | "arrowRight" | "trash" | "car" | "van"
  | "motorcycle" | "boat" | "jetski" | "rv" | "moped" | "trailer" | "camera" | "plus" | "dots"
  | "chat" | "send" | "signature" | "pdf";

export function Icon({ name, className = "h-4 w-4" }: { name: IconName; className?: string }) {
  const sw = 1.6;
  switch (name) {
    case "search":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={sw} /><path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>);
    case "pin":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M12 21.5s7-7 7-12.5a7 7 0 10-14 0c0 5.5 7 12.5 7 12.5z" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" /><circle cx="12" cy="9" r="2.4" stroke="currentColor" strokeWidth={sw} /></svg>);
    case "calendar":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth={sw} /><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>);
    case "clock":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={sw} /><path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>);
    case "star":
      return (<svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.6l-5.9 3 1.2-6.5-4.8-4.6 6.6-.9L12 2.5z" /></svg>);
    case "chevronLeft":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "chevronRight":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "eye":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth={sw} /><circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth={sw} /></svg>);
    case "eyeOff":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M3 3l18 18M10.6 5.2A10.9 10.9 0 0112 5c6.4 0 10 7 10 7a15.4 15.4 0 01-3.2 4M6.5 6.6C4 8.3 2 12 2 12s3.6 7 10 7c1.3 0 2.5-.2 3.5-.6M9.9 9.9a3 3 0 004.2 4.2" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "user":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><circle cx="12" cy="8" r="3.6" stroke="currentColor" strokeWidth={sw} /><path d="M4.5 20c1.4-3.8 4.6-5.5 7.5-5.5s6.1 1.7 7.5 5.5" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>);
    case "filter":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>);
    case "list":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>);
    case "map":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M9 4L3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4z" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" /><path d="M9 4v13M15 7v13" stroke="currentColor" strokeWidth={sw} /></svg>);
    case "compass":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={sw} /><path d="M15 9l-2 6-4 2 2-6 4-2z" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" /></svg>);
    case "ticket":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 000-4V8z" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" /></svg>);
    case "settings":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth={sw} /><path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.9 2.9l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.9-2.9l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.9-2.9l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.9 2.9l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" stroke="currentColor" strokeWidth={1.2} strokeLinejoin="round" /></svg>);
    case "logout":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "card":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><rect x="2.5" y="5.5" width="19" height="13" rx="2" stroke="currentColor" strokeWidth={sw} /><path d="M2.5 10h19" stroke="currentColor" strokeWidth={sw} /></svg>);
    case "shield":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M12 2.5l7 3v6c0 5-3.4 8.4-7 11-3.6-2.6-7-6-7-11v-6l7-3z" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "close":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>);
    case "check":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M4 12.5l5 5L20 6" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "bolt":
      return (<svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" /></svg>);
    case "seat":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M7 4v9a2 2 0 002 2h6M7 13H5.5A1.5 1.5 0 004 14.5V19a1 1 0 001 1h1M17 15v3a1 1 0 001 1h1a1 1 0 001-1v-5.5" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "gear":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth={sw} /><path d="M8 8v8M12 8v8M16 8v5" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>);
    case "fuel":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><rect x="4" y="4" width="10" height="16" rx="1.5" stroke="currentColor" strokeWidth={sw} /><path d="M14 9h2a2 2 0 012 2v5.5a1.5 1.5 0 003 0V9l-3-3" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "edit":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M4 20l.9-4L16.5 4.4a1.5 1.5 0 012.1 0l1 1a1.5 1.5 0 010 2.1L8 19.1 4 20z" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" /></svg>);
    case "arrowRight":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M4 12h16M13 5l7 7-7 7" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "trash":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M4 7h16M9 7V4.5A1.5 1.5 0 0110.5 3h3A1.5 1.5 0 0115 4.5V7m2 0v12a2 2 0 01-2 2H9a2 2 0 01-2-2V7" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "car":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M4 16l1.2-4.8A2 2 0 017.14 9.6h9.72a2 2 0 011.94 1.6L20 16M4 16v3a1 1 0 001 1h1a1 1 0 001-1v-1h10v1a1 1 0 001 1h1a1 1 0 001-1v-3M4 16h16" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "van":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M3 16V8a1 1 0 011-1h9l4 4v5" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><path d="M3 16h1m16 0h1M8 16a2 2 0 104 0m5 0a2 2 0 104 0H12" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>);
    case "motorcycle":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M5 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.3 15.5L10 11h3.5l1.7 2M13.5 11L11 7H8M14.5 13h2.8" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "boat":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M3.5 15h17l-1.8 4.2a1 1 0 01-.92.8H6.2a1 1 0 01-.92-.8L3.5 15zM6 15V8.5h7l3 6.5M11 8.5V4" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "jetski":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M3 16.5c2.5-3 5.5-4.5 9-4.5 3 0 6.5 1.7 9 3.5M9 12l2-4h2.5l1 4M13 8V5" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><circle cx="6.5" cy="16.5" r="1.1" fill="currentColor" /></svg>);
    case "rv":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M3 16V6a1 1 0 011-1h10v5h6v6" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /><path d="M7 8.5h4M3 16h1m16 0h1M7.5 16a2 2 0 104 0m5 0a2 2 0 104 0h-4" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>);
    case "moped":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M6.5 18a2.3 2.3 0 100-4.6 2.3 2.3 0 000 4.6zM17 18a2.3 2.3 0 100-4.6 2.3 2.3 0 000 4.6zM8.7 15.5h6l1-3.5h2M9 12H6l-1 1.5M9 12V8h3.5" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "trailer":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><rect x="5" y="7" width="14" height="8" rx="1" stroke="currentColor" strokeWidth={sw} /><path d="M2 10h3v5M5 15h1" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /><circle cx="9" cy="18" r="1.6" stroke="currentColor" strokeWidth={sw} /><circle cx="16" cy="18" r="1.6" stroke="currentColor" strokeWidth={sw} /></svg>);
    case "camera":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" /><circle cx="12" cy="13.5" r="3.5" stroke="currentColor" strokeWidth={sw} /></svg>);
    case "plus":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M12 4v16M4 12h16" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" /></svg>);
    case "dots":
      return (<svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>);
    case "chat":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M4 5.5A1.5 1.5 0 015.5 4h13A1.5 1.5 0 0120 5.5v9A1.5 1.5 0 0118.5 16H9l-4 4v-4H5.5A1.5 1.5 0 014 14.5v-9z" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" /></svg>);
    case "send":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M4 12L20 4l-6.5 16-2.7-7.3L4 12z" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" /></svg>);
    case "signature":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M3 18c2-4 3-1 5-3s1-4 3-4 1 4 3 3 2-4 4-3M3 20.5h18" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /></svg>);
    case "pdf":
      return (<svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden><path d="M7 3h7l4 4v14a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" /><path d="M14 3v4h4" stroke="currentColor" strokeWidth={sw} strokeLinejoin="round" /><path d="M8.5 17.2v-4.4h1.2a1.4 1.4 0 010 2.8H8.5M12.3 17.2v-4.4h1a1.6 1.6 0 010 4.4h-1zM16.3 13v4.2M16.3 15h1.4" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" /></svg>);
  }
}

export function vehicleIcon(type: VehicleType): IconName {
  switch (type) {
    case "Transportbil": return "van";
    case "Motorcykel": return "motorcycle";
    case "Båt": return "boat";
    case "Jetski": return "jetski";
    case "Husbil": return "rv";
    case "Moped": return "moped";
    case "Släpvagn": return "trailer";
    default: return "car";
  }
}

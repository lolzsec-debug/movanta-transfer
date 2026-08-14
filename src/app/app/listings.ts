// User-created vehicle listings ("List your vehicle"). Same architecture as
// the rest of the app: no backend, no database — everything lives in
// localStorage. Photos are compressed client-side to a data URL; there is no
// real file storage, which is disclosed to the user rather than faked.
import type { Vehicle, VehicleType, Transmission, Fuel, User, InsuranceOption, ListingIdentityType } from "./data";
import { getUsers, localTodayISO } from "./data";
import { DEFAULT_ENERGY_PRICES } from "./pricing";
import type { Lang } from "@/lib/i18n";
import type { LatLng } from "./geo";

export type ListingStatus = "Utkast" | "Publicerad" | "Pausad" | "Granskning";

export type DateRange = { start: string; end: string };

export type Listing = {
  id: string;
  ownerId: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;

  type: VehicleType;
  title: string;
  brand: string;
  model: string;
  year: number;
  regNumber: string;
  fuel: Fuel;
  transmission: Transmission;
  seats: number;
  mileage: number;
  location: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];

  // All six categories are collected during listing creation (see
  // ListingWizard's Photos and Documentation steps), never post-booking.
  // Exterior/interior become the public gallery shown to browsing customers
  // (see listingToVehicle below); the other four are private documentation
  // only revealed to a renter after their booking is confirmed.
  exteriorPhotos: string[]; // data URLs, already compressed; exteriorPhotos[0] is the cover
  interiorPhotos: string[];
  conditionPhotos: string[]; // mileage & general vehicle condition
  damagePhotos: string[]; // existing damage
  includedItemsPhotos: string[]; // e.g. charger, child seat, roof box
  documentPhotos: string[]; // e.g. registration certificate, insurance
  color: string;
  coord: LatLng | null; // geocoded from pickupLocation/location; null until resolved

  pricePerHour: number | null;
  pricePerDay: number;
  pricePerWeek: number | null;
  deposit: number;
  minDurationDays: number;
  maxDurationDays: number | null;
  availableFrom: string;
  availableTo: string;
  unavailableRanges: DateRange[];
  pickupInstructions: string;
  pickupLocation: string;

  minRenterAge: number;
  minLicenseYears: number;
  smokingAllowed: boolean;
  petsAllowed: boolean;
  travelOutsideSweden: boolean;
  maxMileagePerDay: number | null;
  extraMileagePrice: number | null;
  fuelReturnPolicy: string;
  cleaningRules: string;
  lateReturnRules: string;
  customRules: string;

  // Pricing/profit calculator inputs
  fuelConsumptionPer100Km: number | null; // L/100km
  electricConsumptionPer100Km: number | null; // kWh/100km
  electricDrivingShare: number | null; // 0–1, Laddhybrid only
  combinedEnergyCostPer100Km: number | null; // Laddhybrid alternative single-figure entry
  assumedFuelPrice: number; // SEK/L, editable, defaults from pricing.ts config
  assumedElectricityPrice: number; // SEK/kWh, editable, defaults from pricing.ts config
  fuelIncluded: boolean;
  expectedBookedDays: number; // 1–7
  expectedDailyDistance: number; // km
  otherExpenses: number;

  insuranceOption: InsuranceOption;

  // Listing identity
  identityType: ListingIdentityType;
  companyId: string | null;
  createdByUserId: string;
  publicDisplayName: string;

  // Snapshot of the market recommendation shown at the time of publishing
  // (the live calculator always recomputes fresh while editing).
  recommendedDailyPrice: number | null;
  recommendedHourlyPrice: number | null;
  recommendedWeeklyPrice: number | null;
  comparableListingCount: number | null;
  pricingRecommendationDate: string | null;
};

const LISTINGS_KEY = "movanta_listings";
const PALETTE = ["#5B8DEF", "#6E7B8B", "#4FB286", "#8C8C94", "#D1785A", "#4E6E9E", "#C99A3B", "#6FC2C0"];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function colorForId(id: string): string {
  return PALETTE[hashString(id) % PALETTE.length];
}

export function uid(prefix = "id"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function blankListing(ownerId: string): Listing {
  const now = new Date().toISOString();
  return {
    fuelConsumptionPer100Km: null,
    electricConsumptionPer100Km: null,
    electricDrivingShare: 0.5,
    combinedEnergyCostPer100Km: null,
    assumedFuelPrice: DEFAULT_ENERGY_PRICES.petrolPerLitre,
    assumedElectricityPrice: DEFAULT_ENERGY_PRICES.electricityPerKwh,
    fuelIncluded: false,
    expectedBookedDays: 4,
    expectedDailyDistance: 50,
    otherExpenses: 0,
    insuranceOption: "Skydd",
    identityType: "Privat",
    companyId: null,
    createdByUserId: ownerId,
    publicDisplayName: "",
    recommendedDailyPrice: null,
    recommendedHourlyPrice: null,
    recommendedWeeklyPrice: null,
    comparableListingCount: null,
    pricingRecommendationDate: null,
    id: uid("lst"),
    ownerId,
    status: "Utkast",
    createdAt: now,
    updatedAt: now,
    type: "Bil",
    title: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    regNumber: "",
    fuel: "Bensin",
    transmission: "Automat",
    seats: 5,
    mileage: 0,
    location: "",
    shortDescription: "",
    fullDescription: "",
    features: [],
    exteriorPhotos: [],
    interiorPhotos: [],
    conditionPhotos: [],
    damagePhotos: [],
    includedItemsPhotos: [],
    documentPhotos: [],
    color: colorForId(now + Math.random()),
    coord: null,
    pricePerHour: null,
    pricePerDay: 0,
    pricePerWeek: null,
    deposit: 0,
    minDurationDays: 1,
    maxDurationDays: null,
    availableFrom: localTodayISO(),
    availableTo: "",
    unavailableRanges: [],
    pickupInstructions: "",
    pickupLocation: "",
    minRenterAge: 20,
    minLicenseYears: 2,
    smokingAllowed: false,
    petsAllowed: false,
    travelOutsideSweden: false,
    maxMileagePerDay: null,
    extraMileagePrice: null,
    fuelReturnPolicy: "",
    cleaningRules: "",
    lateReturnRules: "",
    customRules: "",
  };
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const PHOTO_FIELDS = ["exteriorPhotos", "interiorPhotos", "conditionPhotos", "damagePhotos", "includedItemsPhotos", "documentPhotos"] as const;

// Backfills listings saved before the six-category photo split existed —
// those older records have a single flat `photos` array instead (folded
// into exteriorPhotos here so the vehicle still shows its real photo rather
// than going blank) and are missing the other five arrays entirely. Without
// this, any UI indexing into e.g. listing.exteriorPhotos[0] crashes on that
// old browser-local data. Persists the backfill once so it's a one-time
// cost, not a per-read cost.
function normalizeListings(raw: Listing[]): { listings: Listing[]; changed: boolean } {
  let changed = false;
  const listings = raw.map((entry) => {
    const legacy = entry as Listing & { photos?: string[] };
    if (PHOTO_FIELDS.every((f) => Array.isArray(entry[f]))) return entry;
    changed = true;
    const patched: Listing & { photos?: string[] } = { ...legacy };
    delete patched.photos;
    for (const field of PHOTO_FIELDS) {
      if (!Array.isArray(patched[field])) {
        patched[field] = field === "exteriorPhotos" && Array.isArray(legacy.photos) ? legacy.photos : [];
      }
    }
    return patched;
  });
  return { listings, changed };
}

export function getListings(): Listing[] {
  const raw = read<Listing[]>(LISTINGS_KEY, []);
  const { listings, changed } = normalizeListings(raw);
  if (changed) saveListings(listings);
  return listings;
}

// Returns false (instead of throwing) if localStorage quota is exceeded —
// realistic with several photos as data URLs on a real device.
export function saveListings(listings: Listing[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
    return true;
  } catch {
    return false;
  }
}

export function getListingsByOwner(ownerId: string): Listing[] {
  return getListings()
    .filter((l) => l.ownerId === ownerId)
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function upsertListing(listing: Listing): boolean {
  const all = getListings();
  const idx = all.findIndex((l) => l.id === listing.id);
  const updated = { ...listing, updatedAt: new Date().toISOString() };
  if (idx >= 0) all[idx] = updated;
  else all.unshift(updated);
  return saveListings(all);
}

export function deleteListing(id: string) {
  saveListings(getListings().filter((l) => l.id !== id));
}

export function isAvailableToday(listing: Listing): boolean {
  const today = localTodayISO();
  if (listing.availableFrom && today < listing.availableFrom) return false;
  if (listing.availableTo && today > listing.availableTo) return false;
  return !listing.unavailableRanges.some((r) => today >= r.start && today <= r.end);
}

function ownerDisplay(l: Listing): { name: string; memberSince: string; business: boolean } {
  const user: User | undefined = getUsers().find((u) => u.id === l.ownerId);
  if (!user) return { name: "Movanta-användare", memberSince: String(new Date().getFullYear()), business: false };
  const memberSince = new Date(user.createdAt).getFullYear().toString();
  if (l.identityType === "Företag" && user.company) {
    return { name: user.company.name, memberSince, business: true };
  }
  return { name: `${user.firstName} ${user.lastName}`, memberSince, business: false };
}

function formatRules(l: Listing, lang: Lang): string[] {
  const sv = (en: string, sve: string) => (lang === "sv" ? sve : en);
  const years = Math.max(1, l.minLicenseYears);
  const rules: string[] = [];
  rules.push(
    sv(
      `The renter must have held a valid driving licence for at least ${years} year${years === 1 ? "" : "s"}.`,
      `Föraren måste ha haft giltigt körkort i minst ${years} år.`
    )
  );
  rules.push(`${sv("Minimum renter age", "Lägsta ålder för hyresgäst")}: ${l.minRenterAge} ${sv("years", "år")}`);
  rules.push(l.smokingAllowed ? sv("Smoking allowed", "Rökning tillåten") : sv("No smoking", "Rökning ej tillåten"));
  rules.push(l.petsAllowed ? sv("Pets allowed", "Husdjur tillåtet") : sv("No pets", "Inga husdjur"));
  rules.push(l.travelOutsideSweden ? sv("Travel outside Sweden allowed", "Resa utanför Sverige tillåten") : sv("No travel outside Sweden", "Ingen resa utanför Sverige"));
  if (l.maxMileagePerDay) rules.push(`${sv("Max mileage", "Max körsträcka")}: ${l.maxMileagePerDay} km/${sv("day", "dag")}`);
  if (l.extraMileagePrice) rules.push(`${sv("Extra mileage price", "Pris extra körsträcka")}: ${l.extraMileagePrice} kr/km`);
  if (l.fuelReturnPolicy) rules.push(l.fuelReturnPolicy);
  if (l.cleaningRules) rules.push(l.cleaningRules);
  if (l.lateReturnRules) rules.push(l.lateReturnRules);
  if (l.customRules) rules.push(l.customRules);
  return rules;
}

// Maps a rich Listing down to the existing Vehicle shape so it can flow
// through every existing view (Explore, map, detail, booking) unchanged.
export function listingToVehicle(l: Listing, lang: Lang = "sv"): Vehicle {
  const owner = ownerDisplay(l);
  const t = (en: string, sv: string) => (lang === "sv" ? sv : en);
  const insuranceText =
    l.insuranceOption === "Skydd"
      ? t(
          "Insurance protection selected by the owner. Insurance-related fees for this booking are included on the owner's behalf.",
          "Ägaren har valt försäkringsskydd. Försäkringsrelaterade avgifter för denna bokning ingår på ägarens vägnar."
        )
      : t(
          "No additional Movanta insurance protection has been selected for this vehicle. Existing legal and vehicle-insurance requirements may still apply — confirm coverage with the owner before booking.",
          "Inget ytterligare Movanta-försäkringsskydd har valts för detta fordon. Befintliga lagkrav och fordonsförsäkringskrav kan fortfarande gälla — bekräfta täckning med ägaren innan bokning."
        );
  return {
    id: l.id,
    brand: l.brand || t("Unnamed", "Namnlöst"),
    model: l.model,
    year: l.year,
    type: l.type,
    transmission: l.transmission,
    fuel: l.fuel,
    seats: l.seats,
    pricePerDay: l.pricePerDay,
    rating: 5,
    reviews: 0,
    distanceKm: 0,
    verified: owner.business && !!getUsers().find((u) => u.id === l.ownerId)?.company?.verified,
    available: l.status === "Publicerad" && isAvailableToday(l),
    color: l.color,
    location: l.location,
    owner: { name: owner.name, memberSince: owner.memberSince, rating: 5, trips: 0, business: owner.business },
    description: l.fullDescription || l.shortDescription,
    features: l.features,
    rules: formatRules(l, lang),
    insurance: insuranceText,
    photos: [...(l.exteriorPhotos ?? []), ...(l.interiorPhotos ?? [])].length ? [...(l.exteriorPhotos ?? []), ...(l.interiorPhotos ?? [])] : undefined,
    mileage: l.mileage,
    conditionPhotos: l.conditionPhotos?.length ? l.conditionPhotos : undefined,
    damagePhotos: l.damagePhotos?.length ? l.damagePhotos : undefined,
    includedItemsPhotos: l.includedItemsPhotos?.length ? l.includedItemsPhotos : undefined,
    documentPhotos: l.documentPhotos?.length ? l.documentPhotos : undefined,
    coord: l.coord ?? undefined,
    minLicenseYears: Math.max(1, l.minLicenseYears),
    insuranceOption: l.insuranceOption,
    identityType: l.identityType,
    ownerId: l.ownerId,
    availableFrom: l.availableFrom || undefined,
    pricePerWeek: l.pricePerWeek ?? undefined,
  };
}

// --- Image handling --------------------------------------------------------
// No real storage backend, so photos are downscaled/compressed client-side
// with <canvas> and kept as data URLs. Capped in size and count so a listing
// stays well inside typical localStorage quotas (~5–10MB per origin).

export const MAX_PHOTOS = 8;
export const MAX_SOURCE_FILE_BYTES = 10 * 1024 * 1024; // 10MB pre-compression
const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 0.72;

export type PhotoError = { fileName: string; message: string };

export function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("not-an-image"));
      return;
    }
    if (file.size > MAX_SOURCE_FILE_BYTES) {
      reject(new Error("too-large"));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("read-failed"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("decode-failed"));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("canvas-unsupported"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function statusLabel(status: ListingStatus, lang: Lang): string {
  if (lang === "sv") return status;
  const map: Record<ListingStatus, string> = { Utkast: "Draft", Publicerad: "Published", Pausad: "Paused", Granskning: "In review" };
  return map[status];
}

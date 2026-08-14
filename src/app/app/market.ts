// Market-based price recommendation. Compares a candidate listing against
// real vehicles already on Movanta — the 12 curated listings plus any
// published (non-draft, non-paused) user listings, excluding the listing
// being priced itself. No external market-pricing API is connected; this is
// disclosed wherever the recommendation is shown. Written as an isolated
// module so a real market-pricing API could replace getComparablePrices()
// later without touching the UI.
import type { Vehicle, VehicleType } from "./data";

export type ComparisonTier = "model-location" | "model-region" | "category-year" | "category-national" | "none";

export type MarketComparison = {
  tier: ComparisonTier;
  count: number;
  low: number;
  median: number;
  high: number;
  recommendedDaily: number;
  recommendedHourly: number;
  recommendedWeekly: number;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

// "Region" has no real geo boundaries in this prototype (everything is
// Växjö), so it's approximated as "same city" — i.e. it collapses toward the
// same pool as the wider tiers. Disclosed, not hidden.
function sameCity(a: string, b: string): boolean {
  const cityOf = (s: string) => s.split(",").pop()?.trim().toLowerCase() ?? s.toLowerCase();
  return cityOf(a) === cityOf(b);
}

const MIN_COMPARABLES = 3;

export function getMarketComparison(
  candidate: { id?: string; type: VehicleType; brand: string; model: string; year: number; location: string },
  pool: Vehicle[]
): MarketComparison {
  const others = pool.filter((v) => v.id !== candidate.id);

  const byModelLocation = others.filter(
    (v) => v.brand === candidate.brand && v.model === candidate.model && sameCity(v.location, candidate.location)
  );
  if (byModelLocation.length >= MIN_COMPARABLES) return summarize("model-location", byModelLocation);

  const byModelRegion = others.filter((v) => v.brand === candidate.brand && v.model === candidate.model);
  if (byModelRegion.length >= MIN_COMPARABLES) return summarize("model-region", byModelRegion);

  const byCategoryYear = others.filter((v) => v.type === candidate.type && Math.abs(v.year - candidate.year) <= 2);
  if (byCategoryYear.length >= MIN_COMPARABLES) return summarize("category-year", byCategoryYear);

  const byCategory = others.filter((v) => v.type === candidate.type);
  if (byCategory.length >= MIN_COMPARABLES) return summarize("category-national", byCategory);

  // Not enough real comparables anywhere — fall back to whatever category
  // matches exist (even below the usual minimum) rather than nothing at all.
  if (byCategory.length > 0) return summarize("category-national", byCategory);

  return { tier: "none", count: 0, low: 0, median: 0, high: 0, recommendedDaily: 0, recommendedHourly: 0, recommendedWeekly: 0 };
}

function summarize(tier: ComparisonTier, listings: Vehicle[]): MarketComparison {
  const prices = listings.map((v) => v.pricePerDay);
  const med = median(prices);
  return {
    tier,
    count: listings.length,
    low: Math.min(...prices),
    median: med,
    high: Math.max(...prices),
    recommendedDaily: Math.round(med),
    recommendedHourly: Math.round(med / 8), // rough hourly rate, roughly a business-day fraction of the daily rate
    recommendedWeekly: Math.round(med * 6), // a week priced slightly below 7x daily, as an incentive to book longer
  };
}

export function tierLabel(tier: ComparisonTier, lang: "en" | "sv"): string {
  const map: Record<ComparisonTier, [string, string]> = {
    "model-location": ["same model nearby", "samma modell i närheten"],
    "model-region": ["same model in the wider region", "samma modell i en vidare region"],
    "category-year": ["similar vehicles of a similar age", "liknande fordon av liknande ålder"],
    "category-national": ["similar vehicles across Movanta", "liknande fordon på hela Movanta"],
    none: ["no comparable listings", "inga jämförbara annonser"],
  };
  return lang === "sv" ? map[tier][1] : map[tier][0];
}

export type PriceStanding = "below" | "within" | "above";

export function priceStanding(price: number, comparison: MarketComparison): PriceStanding {
  if (price < comparison.low) return "below";
  if (price > comparison.high) return "above";
  return "within";
}

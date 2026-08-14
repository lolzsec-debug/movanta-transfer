// Geolocation helpers for the mock map. No paid map API — just the free
// OpenStreetMap tile layer (via Leaflet) and the free OSRM demo routing
// server, plus locally computed coordinates.

export type LatLng = { lat: number; lng: number };

export const VAXJO_CENTER: LatLng = { lat: 56.8777, lng: 14.8091 };

export const approxLocationCoords: Record<string, LatLng> = {
  "Centrum, Växjö": { lat: 56.8777, lng: 14.8091 },
  "Öster, Växjö": { lat: 56.876, lng: 14.832 },
  "Väster, Växjö": { lat: 56.879, lng: 14.787 },
  "Teleborg, Växjö": { lat: 56.846, lng: 14.813 },
  "Hovshaga, Växjö": { lat: 56.902, lng: 14.83 },
  "Dalbo, Växjö": { lat: 56.885, lng: 14.775 },
  "Sandsbro, Växjö": { lat: 56.887, lng: 14.852 },
  "Evedal, Växjö": { lat: 56.912, lng: 14.827 },
  "Araby, Växjö": { lat: 56.889, lng: 14.79 },
};

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function jitter(id: string, base: LatLng, maxKm = 0.3): LatLng {
  const h = hashString(id + "_j");
  const bearing = (h % 360) * (Math.PI / 180);
  const radiusKm = ((h >> 8) % 100) / 100 * maxKm;
  const dLat = (radiusKm * Math.cos(bearing)) / 111.32;
  const dLng = (radiusKm * Math.sin(bearing)) / (111.32 * Math.cos((base.lat * Math.PI) / 180));
  return { lat: base.lat + dLat, lng: base.lng + dLng };
}

export type RouteResult = { path: LatLng[]; distanceKm: number; durationMin: number };

export type AddressSuggestion = {
  id: string;
  label: string; // full display string
  street: string;
  postcode: string;
  city: string;
  municipality: string;
  coord: LatLng;
};

export type AddressSearchResult = {
  suggestions: AddressSuggestion[];
  // True when the search itself failed (network error, timeout, rate
  // limit) rather than genuinely returning zero matches — callers use this
  // to show "couldn't search right now, try again" instead of the
  // incorrect "no address found for what you typed".
  failed: boolean;
};

async function fetchAddressResults(url: string): Promise<AddressSuggestion[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) throw new Error(`geocoding request failed: ${res.status}`);
  const results = await res.json();
  if (!Array.isArray(results)) throw new Error("unexpected geocoding response shape");
  return results
    .map((r): AddressSuggestion | null => {
      const lat = parseFloat(r.lat);
      const lng = parseFloat(r.lon);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      const addr = r.address ?? {};
      const street = [addr.road, addr.house_number].filter(Boolean).join(" ");
      return {
        id: String(r.place_id ?? r.osm_id ?? r.display_name),
        label: r.display_name,
        street: street || addr.road || "",
        postcode: addr.postcode ?? "",
        city: addr.city ?? addr.town ?? addr.village ?? "",
        municipality: addr.municipality ?? addr.county ?? "",
        coord: { lat, lng },
      };
    })
    .filter((s): s is AddressSuggestion => s !== null);
}

// Multi-result address search behind the "address provider" the pickup
// autocomplete uses — Nominatim today (free, no key). Swapping in Mapbox,
// Google Places, or another provider later only means rewriting this one
// function; callers only depend on AddressSuggestion.
//
// Nominatim's free endpoint is occasionally rate-limited or momentarily
// unavailable, which used to come back indistinguishable from "you typed
// a place that doesn't exist" — one quick retry clears up the vast
// majority of those blips instead of misleading the user.
export async function autocompleteAddress(query: string): Promise<AddressSearchResult> {
  const trimmed = query.trim();
  if (trimmed.length < 3) return { suggestions: [], failed: false };
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&countrycodes=se&q=${encodeURIComponent(trimmed)}`;
  try {
    return { suggestions: await fetchAddressResults(url), failed: false };
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      return { suggestions: await fetchAddressResults(url), failed: false };
    } catch {
      return { suggestions: [], failed: true };
    }
  }
}

// Address → coordinates via the free OpenStreetMap Nominatim service (no API
// key). Biased to Sweden since that's Movanta's market. Falls back to null on
// any failure so callers can keep whatever placeholder position they had.
export async function geocodeAddress(query: string): Promise<LatLng | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=se&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: "application/json" } });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const results = await res.json();
    const first = results?.[0];
    if (!first) return null;
    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

// Fastest-route lookup via the free public OSRM demo server (no API key).
// Falls back to null on any failure so callers can draw a straight line instead.
export async function fetchFastestRoute(a: LatLng, b: LatLng): Promise<RouteResult | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const url = `https://router.project-osrm.org/route/v1/driving/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const json = await res.json();
    const route = json?.routes?.[0];
    if (!route) return null;
    const path: LatLng[] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ lat, lng }));
    return {
      path,
      distanceKm: Math.round((route.distance / 1000) * 10) / 10,
      durationMin: Math.max(1, Math.round(route.duration / 60)),
    };
  } catch {
    return null;
  }
}

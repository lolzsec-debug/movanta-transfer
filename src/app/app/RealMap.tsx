"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup, Marker, TileLayer } from "leaflet";
import type * as LeafletNS from "leaflet";
import { useTheme } from "@/lib/theme";
import { formatSEK } from "./data";
import type { VehicleType } from "./data";
import { fetchFastestRoute } from "./geo";
import type { LatLng, RouteResult } from "./geo";

export type MapVehicle = {
  id: string;
  brand: string;
  model: string;
  pricePerDay: number;
  distanceKm: number;
  type: VehicleType;
  color: string;
  coord: LatLng;
};

const glyphStyle = 'stroke="#08090A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"';

function typeGlyph(type: VehicleType): string {
  switch (type) {
    case "Transportbil":
      return `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 16V8a1 1 0 011-1h9l4 4v5" ${glyphStyle}/><path d="M3 16h1m16 0h1M8 16a2 2 0 104 0m5 0a2 2 0 104 0H12" ${glyphStyle}/></svg>`;
    case "Motorcykel":
      return `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M5 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM17 18a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM7.3 15.5L10 11h3.5l1.7 2M13.5 11L11 7H8M14.5 13h2.8" ${glyphStyle}/></svg>`;
    case "Båt":
      return `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3.5 15h17l-1.8 4.2a1 1 0 01-.92.8H6.2a1 1 0 01-.92-.8L3.5 15zM6 15V8.5h7l3 6.5M11 8.5V4" ${glyphStyle}/></svg>`;
    case "Jetski":
      return `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 16.5c2.5-3 5.5-4.5 9-4.5 3 0 6.5 1.7 9 3.5M9 12l2-4h2.5l1 4M13 8V5" ${glyphStyle}/><circle cx="6.5" cy="16.5" r="1.1" fill="#08090A"/></svg>`;
    case "Husbil":
      return `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M3 16V6a1 1 0 011-1h10v5h6v6" ${glyphStyle}/><path d="M7 8.5h4M3 16h1m16 0h1M7.5 16a2 2 0 104 0m5 0a2 2 0 104 0h-4" ${glyphStyle}/></svg>`;
    default:
      return `<svg width="18" height="18" viewBox="0 0 24 24"><path d="M4 16l1.2-4.8A2 2 0 017.14 9.6h9.72a2 2 0 011.94 1.6L20 16M4 16v3a1 1 0 001 1h1a1 1 0 001-1v-1h10v1a1 1 0 001 1h1a1 1 0 001-1v-3M4 16h16" ${glyphStyle}/></svg>`;
  }
}

function tileUrl(theme: "dark" | "light"): string {
  return `https://{s}.basemaps.cartocdn.com/${theme === "light" ? "light_all" : "dark_all"}/{z}/{x}/{y}{r}.png`;
}

function buildBadgeIcon(L: typeof LeafletNS, v: MapVehicle, active: boolean) {
  const size = active ? 40 : 34;
  const html = `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">
    <div style="width:${size}px;height:${size}px;border-radius:999px;background:${v.color};border:${active ? 3 : 2}px solid ${active ? "#FFD400" : "var(--color-bg)"};display:flex;align-items:center;justify-content:center;box-shadow:0 8px 20px rgba(0,0,0,0.55);transition:all .15s ease">${typeGlyph(v.type)}</div>
    <div style="padding:2px 7px;border-radius:999px;background:${active ? "#FFD400" : "var(--color-card)"};border:1px solid ${active ? "#FFD400" : "var(--color-border-strong)"};color:${active ? "#08090A" : "var(--color-text-primary)"};font:600 10px/1 system-ui,sans-serif;white-space:nowrap">${formatSEK(v.pricePerDay)}</div>
  </div>`;
  return L.divIcon({ className: "", html, iconSize: [1, 1], iconAnchor: [size / 2, size / 2] });
}

export default function RealMap({
  vehicles,
  center,
  userCoord,
  selectedId,
  onSelectVehicle,
  routeVehicleId,
  onRouteResult,
  height = "h-[420px]",
}: {
  vehicles: MapVehicle[];
  center: LatLng;
  userCoord: LatLng | null;
  selectedId: string | null;
  onSelectVehicle: (id: string) => void;
  routeVehicleId: string | null;
  onRouteResult: (vehicleId: string, result: RouteResult | null) => void;
  height?: string;
}) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tileLayerRef = useRef<TileLayer | null>(null);
  // Read via ref during async map init so the once-only effect never closes
  // over a stale theme.
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const markersLayerRef = useRef<LayerGroup | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const highlightedRef = useRef<string | null>(null);
  const routeRequestId = useRef(0);

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, { zoomControl: false }).setView([center.lat, center.lng], 13);
      tileLayerRef.current = L.tileLayer(tileUrl(themeRef.current), {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
    });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Swap between CARTO's dark and light basemaps when the site theme changes.
  useEffect(() => {
    tileLayerRef.current?.setUrl(tileUrl(theme));
  }, [theme]);

  // Recenter only when `center` itself actually changes (e.g. location acquired) —
  // never as a side effect of unrelated re-renders, so manual pan/zoom sticks.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center]);

  // Build markers only when the underlying data actually changes — cheap and rare.
  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      const map = mapRef.current;
      if (!map || cancelled) return;

      const layer = markersLayerRef.current ?? L.layerGroup().addTo(map);
      markersLayerRef.current = layer;
      layer.clearLayers();
      markersRef.current.clear();
      highlightedRef.current = null;

      if (userCoord) {
        const youIcon = L.divIcon({
          className: "",
          html: '<div style="width:16px;height:16px;border-radius:999px;background:#FFD400;border:3px solid var(--color-bg);box-shadow:0 0 0 6px rgba(255,212,0,0.22)"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });
        L.marker([userCoord.lat, userCoord.lng], { icon: youIcon, zIndexOffset: 1000 })
          .addTo(layer)
          .bindTooltip("Din plats", { direction: "top" });
      }

      vehicles.forEach((v) => {
        const marker = L.marker([v.coord.lat, v.coord.lng], { icon: buildBadgeIcon(L, v, false) })
          .addTo(layer)
          .bindTooltip(`${v.brand} ${v.model} · ${v.distanceKm} km fågelväg`, { direction: "top", offset: [0, -34] })
          .on("click", () => onSelectVehicle(v.id));
        markersRef.current.set(v.id, marker);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [vehicles, userCoord, onSelectVehicle]);

  // Selection changes only swap the affected marker icons — no rebuild, no flicker.
  useEffect(() => {
    import("leaflet").then((L) => {
      const prev = highlightedRef.current;
      if (prev && prev !== selectedId) {
        const prevMarker = markersRef.current.get(prev);
        const prevVehicle = vehicles.find((v) => v.id === prev);
        if (prevMarker && prevVehicle) {
          prevMarker.setIcon(buildBadgeIcon(L, prevVehicle, false));
          prevMarker.setZIndexOffset(0);
        }
      }
      if (selectedId) {
        const marker = markersRef.current.get(selectedId);
        const vehicle = vehicles.find((v) => v.id === selectedId);
        if (marker && vehicle) {
          marker.setIcon(buildBadgeIcon(L, vehicle, true));
          marker.setZIndexOffset(500);
        }
      }
      highlightedRef.current = selectedId;
    });
  }, [selectedId, vehicles]);

  // Route is only fetched once the user explicitly asks for it.
  useEffect(() => {
    const requestId = ++routeRequestId.current;
    import("leaflet").then((L) => {
      const layer = routeLayerRef.current;
      if (!layer) return;
      layer.clearLayers();

      if (!routeVehicleId || !userCoord) return;
      const vehicle = vehicles.find((v) => v.id === routeVehicleId);
      if (!vehicle) return;

      L.polyline(
        [
          [userCoord.lat, userCoord.lng],
          [vehicle.coord.lat, vehicle.coord.lng],
        ],
        { color: "#FFD400", weight: 1.5, opacity: 0.3, dashArray: "4 6" }
      ).addTo(layer);

      fetchFastestRoute(userCoord, vehicle.coord).then((route) => {
        if (routeRequestId.current !== requestId || !mapRef.current) return;
        onRouteResult(routeVehicleId, route);
        if (!route) return;

        layer.clearLayers();
        L.polyline(
          route.path.map((p) => [p.lat, p.lng]),
          { color: "#FFD400", weight: 3.5, opacity: 0.8 }
        ).addTo(layer);

        const mid = route.path[Math.floor(route.path.length / 2)] ?? {
          lat: (userCoord.lat + vehicle.coord.lat) / 2,
          lng: (userCoord.lng + vehicle.coord.lng) / 2,
        };
        const labelIcon = L.divIcon({
          className: "",
          html: `<div style="padding:3px 8px;border-radius:999px;background:rgba(8,9,10,0.9);border:1px solid rgba(255,212,0,0.4);color:#FFD400;font:700 11px/1 system-ui,sans-serif;white-space:nowrap">${route.durationMin} min · ${route.distanceKm} km</div>`,
          iconSize: [1, 1],
          iconAnchor: [-8, 8],
        });
        L.marker([mid.lat, mid.lng], { icon: labelIcon, interactive: false }).addTo(layer);
      });
    });
  }, [routeVehicleId, userCoord, vehicles, onRouteResult]);

  return <div ref={containerRef} className={`w-full overflow-hidden rounded-2xl border border-ink/10 bg-bg-secondary ${height}`} />;
}

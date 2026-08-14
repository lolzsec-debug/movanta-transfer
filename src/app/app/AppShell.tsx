"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { withBasePath } from "@/lib/basePath";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Booking,
  ConditionReport,
  Message,
  User,
  Company,
  Vehicle,
  VerificationRequest,
  VerificationRequestStatus,
  addBooking,
  addMessage,
  addVerificationRequest,
  addListingReviewRequest,
  bookingNumber,
  clearSession,
  formatSEK,
  getBookings,
  getListingReviewRequests,
  getMessagesByBooking,
  getSession,
  getUsers,
  getVerificationRequests,
  localTodayISO,
  resetAllData,
  saveBookings,
  saveUsers,
  seedDemoData,
  setSession,
  uid,
  updateListingReviewRequest,
  updateVerificationRequest,
  vehicles,
  Transmission,
  VehicleType,
} from "./data";
import { VAXJO_CENTER, approxLocationCoords, jitter, haversineKm, LatLng, RouteResult } from "./geo";
import { localizeVehicle, typeLabel, transmissionLabel, fuelLabel, statusLabel, licenseLabel } from "./i18nVehicle";
import { Listing, compressImage, getListings, getListingsByOwner, listingToVehicle, upsertListing, deleteListing as deleteListingRecord, blankListing } from "./listings";
import { grossRevenueForPeriod } from "./pricing";
import { generateContractPdfDataUrl } from "./contract";
import { Icon, vehicleIcon, type IconName } from "./icons";
import { OwnerDashboard } from "./OwnerDashboard";
import { AdminDashboard } from "./AdminDashboard";
import { BookingRoomView } from "./BookingRoom";
import { ListingWizard } from "./ListingWizard";
import type { MapVehicle } from "./RealMap";
import { useLanguage, type Lang } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { RangeInput } from "@/components/ui/RangeInput";

const RealMap = dynamic(() => import("./RealMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[420px] w-full items-center justify-center rounded-2xl border border-ink/10 bg-bg-secondary text-sm text-text-muted">
      Loading map…
    </div>
  ),
});

type LocationStatus = "idle" | "loading" | "granted" | "denied" | "unavailable";
type LiveVehicle = Vehicle & { coord: LatLng };

type View =
  | "explore"
  | "map"
  | "vehicle"
  | "booking"
  | "confirmation"
  | "auth"
  | "profile"
  | "profileEdit"
  | "bookings"
  | "payments"
  | "settings"
  | "myListings"
  | "listingEditor"
  | "bookingRoom"
  | "licenseVerify"
  | "adminDashboard";

type AuthMode = "login" | "register" | "forgot";

type BookingDraft = {
  startDate: string;
  endDate: string;
  pickupTime: string;
  returnTime: string;
  firstName: string;
  lastName: string;
  phone: string;
  acceptTerms: boolean;
  cardName: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
};


function VehicleThumb({ vehicle, className = "h-40 w-full", compact = false }: { vehicle: Vehicle; className?: string; compact?: boolean }) {
  const { t } = useLanguage();
  const upcoming = upcomingFrom(vehicle);
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl ${className}`}
      style={{ background: `linear-gradient(135deg, ${vehicle.color}33, #101214 75%)` }}
    >
      {vehicle.photos?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element -- user photos are local data: URLs, not next/image-compatible remote assets
        <img src={vehicle.thumb ?? vehicle.photos[0]} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <Icon name={vehicleIcon(vehicle.type)} className={compact ? "h-7 w-7 text-ink/30" : "h-16 w-16 text-ink/25"} />
      )}
      {!compact && vehicle.fuel === "El" && (
        <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-bg/70 text-yellow">
          <Icon name="bolt" className="h-4 w-4" />
        </span>
      )}
      {!compact && vehicle.verified && (
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full border border-yellow/30 bg-bg/70 px-2 py-1 text-[11px] font-medium text-yellow">
          <Icon name="shield" className="h-3 w-3" /> {t("Verified", "Verifierad")}
        </span>
      )}
      {!compact && (
        <span
          className={`absolute bottom-3 right-3 rounded-full px-2.5 py-1 text-[11px] font-medium ${
            vehicle.available ? "bg-yellow/15 text-yellow" : upcoming ? "bg-ink/10 text-text-secondary" : "bg-ink/10 text-text-muted"
          }`}
        >
          {vehicle.available ? t("Available now", "Tillgänglig nu") : upcoming ? `${t("Available from", "Tillgänglig från")} ${upcoming}` : t("Booked", "Bokad")}
        </span>
      )}
    </div>
  );
}

function DocPhotoRow({ label, photos }: { label: string; photos?: string[] }) {
  const { t } = useLanguage();
  return (
    <div>
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      {photos && photos.length > 0 ? (
        <div className="themed-scrollbar mt-1.5 flex gap-2 overflow-x-auto pb-1">
          {photos.map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element -- local data: URL photos
            <img key={i} src={p} alt="" className="h-20 w-28 shrink-0 rounded-lg border border-ink/10 object-cover" />
          ))}
        </div>
      ) : (
        <p className="mt-1 text-xs text-text-muted">{t("Not provided by the owner.", "Ej angivet av ägaren.")}</p>
      )}
    </div>
  );
}

function RatingRow({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1 text-sm text-text-secondary">
      <Icon name="star" className="h-3.5 w-3.5 text-yellow" />
      <span className="font-medium text-text-primary">{rating.toFixed(1)}</span>
      <span className="text-text-muted">({reviews})</span>
    </div>
  );
}

function VehicleCard({ vehicle, onOpen }: { vehicle: Vehicle; onOpen: () => void }) {
  const { lang, t } = useLanguage();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ink/10 bg-card p-3 text-left shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)] transition-transform duration-200 hover:-translate-y-1 hover:border-ink/20"
    >
      <VehicleThumb vehicle={vehicle} />
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">
            {vehicle.brand} {vehicle.model}
          </h3>
          <p className="text-xs text-text-muted">
            {vehicle.type === "Släpvagn"
              ? `${vehicle.year} · ${typeLabel(vehicle.type, lang)}`
              : `${vehicle.year} · ${transmissionLabel(vehicle.transmission, lang)} · ${fuelLabel(vehicle.fuel, lang)}`}
          </p>
        </div>
        <RatingRow rating={vehicle.rating} reviews={vehicle.reviews} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
        {vehicle.type !== "Släpvagn" && (
          <span className="flex items-center gap-1"><Icon name="seat" className="h-3.5 w-3.5" />{vehicle.seats} {t("seats", "säten")}</span>
        )}
        <span className="flex items-center gap-1"><Icon name="pin" className="h-3.5 w-3.5" />{vehicle.distanceKm} km</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
        <span className="text-base font-semibold text-text-primary">{formatSEK(vehicle.pricePerDay)}<span className="text-xs font-normal text-text-muted">/{t("day", "dag")}</span></span>
        <span className="flex items-center gap-1 text-xs font-medium text-yellow opacity-0 transition-opacity group-hover:opacity-100">
          {t("View vehicle", "Se fordon")} <Icon name="arrowRight" className="h-3 w-3" />
        </span>
      </div>
    </button>
  );
}

function locationLabel(status: LocationStatus, t: (en: string, sv: string) => string): string {
  switch (status) {
    case "granted": return t("Showing vehicles near you", "Visar fordon nära din plats");
    case "loading": return t("Getting your location…", "Hämtar din plats…");
    case "denied": return t("Location access denied – showing Växjö", "Platsåtkomst nekad – visar Växjö");
    case "unavailable": return t("Location unavailable – showing Växjö", "Plats ej tillgänglig – visar Växjö");
    default: return t("Approximate location in Växjö", "Ungefärlig plats i Växjö");
  }
}

function AppMap({
  list, userCoord, locationStatus, onRequestLocation, onOpenVehicle, height = "h-[420px]",
}: {
  list: LiveVehicle[];
  userCoord: LatLng | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
  onOpenVehicle: (id: string) => void;
  height?: string;
}) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [routeVehicleId, setRouteVehicleId] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteResult | null>(null);
  const [routeState, setRouteState] = useState<"idle" | "loading" | "done" | "failed">("idle");

  const center = userCoord ?? list[0]?.coord ?? VAXJO_CENTER;
  const mapVehicles = useMemo<MapVehicle[]>(
    () => list.map((v) => ({ id: v.id, brand: v.brand, model: v.model, pricePerDay: v.pricePerDay, distanceKm: v.distanceKm, type: v.type, color: v.color, coord: v.coord })),
    [list]
  );
  const selectedVehicle = list.find((v) => v.id === selectedId) ?? null;

  const selectVehicle = useCallback((id: string) => {
    setSelectedId(id);
    setRouteVehicleId(null);
    setRouteInfo(null);
    setRouteState("idle");
  }, []);

  const handleRouteResult = useCallback(
    (vehicleId: string, result: RouteResult | null) => {
      if (vehicleId !== selectedId) return;
      setRouteInfo(result);
      setRouteState(result ? "done" : "failed");
    },
    [selectedId]
  );

  function closeSelection() {
    setSelectedId(null);
    setRouteVehicleId(null);
    setRouteInfo(null);
    setRouteState("idle");
  }

  function calculateRoute() {
    if (!selectedId) return;
    if (!userCoord) {
      onRequestLocation();
      return;
    }
    setRouteState("loading");
    setRouteInfo(null);
    setRouteVehicleId(selectedId);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/10 bg-card px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-xs text-text-secondary">
          <Icon name="pin" className="h-3.5 w-3.5 text-yellow" />
          {locationLabel(locationStatus, t)}
        </span>
        <button
          type="button"
          onClick={onRequestLocation}
          disabled={locationStatus === "loading"}
          className="flex items-center gap-1.5 rounded-full bg-yellow px-3.5 py-1.5 text-[11px] font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Icon name="compass" className="h-3.5 w-3.5" />
          {locationStatus === "granted" ? t("Update location", "Uppdatera plats") : t("Use my location", "Använd min plats")}
        </button>
      </div>
      {list.length === 0 ? (
        <div className={`flex w-full items-center justify-center rounded-2xl border border-ink/10 bg-bg-secondary text-sm text-text-muted ${height}`}>
          {t("No vehicles to show on the map", "Inga fordon att visa på kartan")}
        </div>
      ) : (
        <div className="relative">
          <RealMap
            vehicles={mapVehicles}
            center={center}
            userCoord={userCoord}
            selectedId={selectedId}
            onSelectVehicle={selectVehicle}
            routeVehicleId={routeVehicleId}
            onRouteResult={handleRouteResult}
            height={height}
          />
          {selectedVehicle && (
            <div className="animate-fade-up fixed inset-x-3 bottom-24 z-[1200] mx-auto max-w-xl rounded-2xl border border-ink/10 bg-card/95 p-4 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur lg:bottom-6">
              <button
                type="button"
                onClick={closeSelection}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-text-muted hover:text-text-primary"
                aria-label={t("Close", "Stäng")}
              >
                <Icon name="close" className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-3 pr-7">
                <VehicleThumb vehicle={selectedVehicle} className="h-16 w-16 shrink-0" compact />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-text-primary">{selectedVehicle.brand} {selectedVehicle.model}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-text-secondary">
                    <Icon name="pin" className="h-3 w-3 shrink-0 text-yellow" />
                    <span className="truncate">{selectedVehicle.location} · {selectedVehicle.distanceKm} {t("km away", "km bort")}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-text-muted">{selectedVehicle.description}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                {routeState === "loading" ? (
                  <span className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-yellow" />
                    {t("Calculating the fastest route…", "Beräknar snabbaste vägen…")}
                  </span>
                ) : routeState === "done" && routeInfo ? (
                  <span className="text-xs font-medium text-yellow">{t("Fastest route", "Snabbaste vägen")}: {routeInfo.distanceKm} km · ~{routeInfo.durationMin} min</span>
                ) : routeState === "failed" ? (
                  <span className="text-xs text-text-muted">{t("No route found", "Ingen rutt hittades")} · {selectedVehicle.distanceKm} km {t("as the crow flies", "fågelväg")}</span>
                ) : (
                  <button
                    type="button"
                    onClick={calculateRoute}
                    className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-ink/[0.04] px-3.5 py-2 text-xs font-medium text-text-primary transition-colors hover:border-yellow/40 hover:text-yellow"
                  >
                    <Icon name="compass" className="h-3.5 w-3.5" />
                    {userCoord ? t("Calculate fastest route", "Beräkna snabbaste väg") : t("Share location to calculate route", "Dela plats för att beräkna väg")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenVehicle(selectedVehicle.id)}
                  className="ml-auto shrink-0 rounded-full bg-yellow px-4 py-2 text-xs font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5"
                >
                  {t("Open vehicle", "Öppna fordon")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const todayISO = localTodayISO;
// A listing that isn't available today because its scheduled start date
// hasn't arrived yet is "not open yet," not "booked" — those read very
// differently to an owner who just published and made no bookings at all.
const upcomingFrom = (vehicle: Vehicle): string | null =>
  !vehicle.available && vehicle.availableFrom && vehicle.availableFrom > todayISO() ? vehicle.availableFrom : null;
const addDaysISO = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};
const nightsBetween = (start: string, end: string) => {
  const diff = (new Date(end).getTime() - new Date(start).getTime()) / 86400000;
  return Math.max(1, Math.round(diff));
};

const SERVICE_FEE = 99;
const PROTECTION_FEE_PER_NIGHT = 89;

export default function AppShell() {
  const { lang, t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("explore");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [pendingView, setPendingView] = useState<{ view: View; vehicleId?: string } | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [exploreMode, setExploreMode] = useState<"list" | "map">("list");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<Booking[]>([]);
  const [ownerConfirmedBookings, setOwnerConfirmedBookings] = useState<Booking[]>([]);
  const [bookingsTab, setBookingsTab] = useState<"Kommande" | "Aktiv" | "Tidigare">("Kommande");
  const [bookingStep, setBookingStep] = useState(1);
  const [bookingDraft, setBookingDraft] = useState<BookingDraft | null>(null);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [moreFilters, setMoreFilters] = useState(false);
  const [listingsVersion, setListingsVersion] = useState(0);
  const [verificationsVersion, setVerificationsVersion] = useState(0);
  const [listingReviewsVersion, setListingReviewsVersion] = useState(0);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [previewListingId, setPreviewListingId] = useState<string | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [roomMessages, setRoomMessages] = useState<Message[]>([]);
  const [roomOrigin, setRoomOrigin] = useState<"bookings" | "myListings">("bookings");

  const [filters, setFilters] = useState({
    types: [] as VehicleType[],
    transmissions: [] as Transmission[],
    elOnly: false,
    availableNow: false,
    maxPrice: Infinity,
    maxDistance: Infinity,
    minSeats: 0,
    query: "",
  });
  const [searchDates, setSearchDates] = useState({ start: "", end: "", pickupTime: "10:00", returnTime: "18:00" });

  useEffect(() => {
    seedDemoData();
    const session = getSession();
    if (session) {
      const user = getUsers().find((u) => u.id === session.userId) ?? null;
      setCurrentUser(user);
    }
    const timer = setTimeout(() => setReady(true), 450);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentUser) {
      setBookings(getBookings().filter((b) => b.userId === currentUser.id));
      setIncomingRequests(getBookings().filter((b) => b.ownerId === currentUser.id && b.status === "Väntar"));
      setOwnerConfirmedBookings(getBookings().filter((b) => b.ownerId === currentUser.id && (b.status === "Kommande" || b.status === "Aktiv")));
    } else {
      setBookings([]);
      setIncomingRequests([]);
      setOwnerConfirmedBookings([]);
    }
  }, [currentUser]);

  // Two accounts, two tabs of this same browser: since users/bookings/
  // listings/messages all live in this origin's localStorage, the native
  // "storage" event (fired in every OTHER tab on that origin whenever one
  // tab writes) is enough to make the two tabs feel live — no backend,
  // polling, or websocket needed. This never fires in the tab that made the
  // write itself, but that tab already updates its own state optimistically
  // wherever it writes.
  const activeBookingRef = useRef<Booking | null>(null);
  useEffect(() => {
    activeBookingRef.current = activeBooking;
  }, [activeBooking]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "movanta_bookings") {
        if (currentUser) {
          setBookings(getBookings().filter((b) => b.userId === currentUser.id));
          setIncomingRequests(getBookings().filter((b) => b.ownerId === currentUser.id && b.status === "Väntar"));
          setOwnerConfirmedBookings(getBookings().filter((b) => b.ownerId === currentUser.id && (b.status === "Kommande" || b.status === "Aktiv")));
        }
        const current = activeBookingRef.current;
        if (current) setActiveBooking(getBookings().find((b) => b.id === current.id) ?? current);
      }
      if (e.key === "movanta_messages") {
        const current = activeBookingRef.current;
        if (current) setRoomMessages(getMessagesByBooking(current.id));
      }
      if (e.key === "movanta_listings") {
        setListingsVersion((v) => v + 1);
      }
      if (e.key === "movanta_verifications") {
        setVerificationsVersion((v) => v + 1);
      }
      if (e.key === "movanta_listing_reviews") {
        setListingReviewsVersion((v) => v + 1);
      }
      if (e.key === "movanta_users" && currentUser) {
        const fresh = getUsers().find((u) => u.id === currentUser.id);
        if (fresh) setCurrentUser(fresh);
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [currentUser]);

  useEffect(() => {
    if (view === "booking" && currentUser && bookingDraft && !bookingDraft.firstName) {
      setBookingDraft((d) => (d ? { ...d, firstName: currentUser.firstName, lastName: currentUser.lastName, phone: currentUser.phone } : d));
    }
  }, [view, currentUser, bookingDraft]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [userCoord, setUserCoord] = useState<LatLng | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    setLocationStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoord({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus("granted");
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  useEffect(() => {
    const viewingMap = view === "map" || (view === "explore" && exploreMode === "map");
    if (viewingMap && locationStatus === "idle") requestLocation();
  }, [view, exploreMode, locationStatus, requestLocation]);

  const vehiclesLive = useMemo<LiveVehicle[]>(() => {
    const published = getListings()
      .filter((l) => l.status === "Publicerad")
      .map((l) => listingToVehicle(l, lang));
    return [...vehicles, ...published].map((v) => {
      const localized = localizeVehicle(v, lang);
      const base = approxLocationCoords[v.location] ?? VAXJO_CENTER;
      const coord = v.coord ?? jitter(v.id, base);
      if (userCoord) {
        return { ...localized, distanceKm: Math.round(haversineKm(userCoord, coord) * 10) / 10, coord };
      }
      return { ...localized, coord };
    });
    // listingsVersion intentionally forces a refetch from localStorage after create/edit/delete
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCoord, lang, listingsVersion]);

  const selectedVehicle = useMemo(() => vehiclesLive.find((v) => v.id === selectedVehicleId) ?? null, [selectedVehicleId, vehiclesLive]);

  // verificationsVersion intentionally forces a refetch from localStorage after submit/approve/reject
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const verificationRequestsLive = useMemo(() => getVerificationRequests(), [verificationsVersion]);

  const myVerificationRequests = useMemo(
    () => (currentUser ? verificationRequestsLive.filter((r) => r.userId === currentUser.id) : []),
    [verificationRequestsLive, currentUser]
  );
  const myLatestVerification = myVerificationRequests[0];

  // listingReviewsVersion intentionally forces a refetch from localStorage after submit/approve/reject
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const listingReviewRequestsLive = useMemo(() => getListingReviewRequests(), [listingReviewsVersion]);

  const myListingReviewRequests = useMemo(
    () => (currentUser ? listingReviewRequestsLive.filter((r) => r.ownerId === currentUser.id) : []),
    [listingReviewRequestsLive, currentUser]
  );

  const previewVehicle = useMemo(() => {
    if (!previewListingId) return null;
    const listing = getListings().find((l) => l.id === previewListingId);
    return listing ? listingToVehicle(listing, lang) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewListingId, lang, listingsVersion]);

  const roomVehicle = useMemo(() => {
    if (!activeBooking) return null;
    const fromLive = vehiclesLive.find((v) => v.id === activeBooking.vehicleId);
    if (fromLive) return fromLive;
    // The listing may have been paused (and so dropped from vehiclesLive)
    // after the booking was made — fall back to the raw listing so the
    // contract still renders correctly either way.
    const listing = getListings().find((l) => l.id === activeBooking.vehicleId);
    return listing ? listingToVehicle(listing, lang) : null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBooking, vehiclesLive, lang, listingsVersion]);

  const filteredVehicles = useMemo(() => {
    return vehiclesLive
      .filter((v) => {
        if (filters.types.length && !filters.types.includes(v.type)) return false;
        if (filters.transmissions.length && !filters.transmissions.includes(v.transmission)) return false;
        if (filters.elOnly && v.fuel !== "El") return false;
        if (filters.availableNow && !v.available) return false;
        if (v.pricePerDay > filters.maxPrice) return false;
        if (v.distanceKm > filters.maxDistance) return false;
        if (v.seats < filters.minSeats) return false;
        if (filters.query.trim() && !v.location.toLowerCase().includes(filters.query.trim().toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [filters, vehiclesLive]);

  function go(v: View) {
    setView(v);
    setMobileMenu(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }

  function openVehicle(id: string) {
    setSelectedVehicleId(id);
    go("vehicle");
  }

  function requireAuth(nextView: View, vehicleId?: string) {
    if (vehicleId) setSelectedVehicleId(vehicleId);
    if (currentUser) {
      go(nextView);
    } else {
      setPendingView({ view: nextView, vehicleId });
      setAuthMode("login");
      go("auth");
    }
  }

  function resolveAfterAuth(user: User) {
    if (pendingView) {
      const target = pendingView;
      setPendingView(null);
      if (target.view === "booking" && user.licenseStatus !== "Verifierat") {
        if (target.vehicleId) setSelectedVehicleId(target.vehicleId);
        setToast(t("Verify your driving licence before you can book.", "Verifiera ditt körkort innan du kan boka."));
        go("licenseVerify");
        return;
      }
      go(target.view);
    } else {
      go("explore");
    }
  }

  function handleLogin(email: string, password: string, remember: boolean): boolean {
    const user = getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password);
    if (!user) return false;
    setSession(user.id, remember);
    setCurrentUser(user);
    setToast(t(`Welcome back, ${user.firstName}!`, `Välkommen tillbaka, ${user.firstName}!`));
    resolveAfterAuth(user);
    return true;
  }

  function handleRegister(payload: { firstName: string; lastName: string; email: string; phone: string; password: string; licenseYears: number }): string | null {
    const users = getUsers();
    if (users.some((u) => u.email.toLowerCase() === payload.email.trim().toLowerCase())) {
      return t("This email is already used by an account.", "E-postadressen används redan av ett konto.");
    }
    const newUser: User = {
      id: uid("u"),
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim(),
      phone: payload.phone.trim(),
      password: payload.password,
      createdAt: new Date().toISOString(),
      verified: false,
      // No submission yet — becomes "Väntar" once they actually submit
      // licence photos, in submitLicenseVerification below.
      licenseStatus: "Saknas",
      licenseYears: Math.max(0, payload.licenseYears),
    };
    saveUsers([...users, newUser]);
    setSession(newUser.id, true);
    setCurrentUser(newUser);
    setToast(t(`Account created. Welcome, ${newUser.firstName}!`, `Kontot är skapat. Välkommen, ${newUser.firstName}!`));
    resolveAfterAuth(newUser);
    return null;
  }

  function handleLogout() {
    clearSession();
    setCurrentUser(null);
    setToast(t("You're signed out.", "Du är utloggad."));
    go("explore");
  }

  function startBooking(vehicleId: string) {
    const v = vehiclesLive.find((x) => x.id === vehicleId);
    if (!v) return;
    if (currentUser && currentUser.licenseStatus !== "Verifierat") {
      setSelectedVehicleId(vehicleId);
      setToast(t("Verify your driving licence before you can book.", "Verifiera ditt körkort innan du kan boka."));
      go("licenseVerify");
      return;
    }
    setBookingDraft({
      startDate: searchDates.start || todayISO(),
      endDate: searchDates.end || addDaysISO(2),
      pickupTime: searchDates.pickupTime || "10:00",
      returnTime: searchDates.returnTime || "18:00",
      firstName: currentUser?.firstName ?? "",
      lastName: currentUser?.lastName ?? "",
      phone: currentUser?.phone ?? "",
      acceptTerms: false,
      cardName: "",
      cardNumber: "",
      expiry: "",
      cvc: "",
    });
    setBookingStep(1);
    requireAuth("booking", vehicleId);
  }

  function finalizeBooking() {
    if (!currentUser || !selectedVehicle || !bookingDraft) return;
    setSubmitting(true);
    const nights = nightsBetween(bookingDraft.startDate, bookingDraft.endDate);
    const rentalPrice = grossRevenueForPeriod(selectedVehicle.pricePerDay, nights, selectedVehicle.pricePerWeek ?? null);
    const protectionFee = nights * PROTECTION_FEE_PER_NIGHT;
    const totalPrice = rentalPrice + protectionFee + SERVICE_FEE;
    setTimeout(() => {
      // A vehicle only has ownerId set when it's a user-created listing with
      // a real owner account. Booking one of those sends a request the owner
      // must approve, rather than confirming instantly like the curated fleet.
      const requestsApproval = !!selectedVehicle.ownerId && selectedVehicle.ownerId !== currentUser.id;
      const booking: Booking = {
        id: uid("bk"),
        bookingNumber: bookingNumber(),
        userId: currentUser.id,
        vehicleId: selectedVehicle.id,
        startDate: bookingDraft.startDate,
        endDate: bookingDraft.endDate,
        pickupTime: bookingDraft.pickupTime,
        returnTime: bookingDraft.returnTime,
        driverPhone: bookingDraft.phone,
        rentalPrice,
        serviceFee: SERVICE_FEE,
        protectionFee,
        totalPrice,
        status: requestsApproval ? "Väntar" : "Kommande",
        createdAt: new Date().toISOString(),
        ownerId: requestsApproval ? selectedVehicle.ownerId : undefined,
      };
      addBooking(booking);
      setBookings((prev) => [booking, ...prev]);
      setLastBooking(booking);
      setSubmitting(false);
      go("confirmation");
    }, 900);
  }

  function respondToBookingRequest(id: string, approve: boolean) {
    const all = getBookings();
    const target = all.find((b) => b.id === id);
    const updated = all.map((b) => (b.id === id ? { ...b, status: approve ? ("Kommande" as const) : ("Avbokad" as const) } : b));
    saveBookings(updated);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: approve ? "Kommande" : "Avbokad" } : b)));
    setIncomingRequests((prev) => prev.filter((b) => b.id !== id));
    if (approve && target) {
      // Block the booked dates on the listing itself so the vehicle
      // correctly shows as booked (not just "available") for that range —
      // everywhere it's displayed, not only to the two parties involved.
      const listing = getListings().find((l) => l.id === target.vehicleId);
      if (listing) {
        upsertListing({ ...listing, unavailableRanges: [...listing.unavailableRanges, { start: target.startDate, end: target.endDate }] });
        setListingsVersion((v) => v + 1);
      }
      const confirmed = updated.find((b) => b.id === id);
      if (confirmed) setOwnerConfirmedBookings((prev) => [confirmed, ...prev]);
    }
    setToast(approve ? t("Booking request accepted.", "Bokningsförfrågan accepterad.") : t("Booking request declined.", "Bokningsförfrågan nekad."));
  }

  function openBookingRoom(id: string, origin: "bookings" | "myListings") {
    const b = getBookings().find((x) => x.id === id) ?? null;
    if (!b) return;
    setActiveBooking(b);
    setRoomMessages(getMessagesByBooking(b.id));
    setRoomOrigin(origin);
    go("bookingRoom");
  }

  function signContract() {
    if (!activeBooking || !currentUser) return;
    const isRenter = currentUser.id === activeBooking.userId;
    const isOwner = currentUser.id === activeBooking.ownerId;
    if (!isRenter && !isOwner) return;
    // Defensive re-check: the UI already disables the Sign button until this
    // is true, but never trust client-only state exclusively.
    const conditionReady = !!activeBooking.conditionReport && activeBooking.conditionReport.photos.length >= 3;
    if (!conditionReady) return;
    const now = new Date().toISOString();
    const all = getBookings();
    let updated = all.map((b) =>
      b.id === activeBooking.id
        ? { ...b, renterSignedAt: isRenter ? now : b.renterSignedAt, ownerSignedAt: isOwner ? now : b.ownerSignedAt }
        : b
    );
    const justSigned = updated.find((b) => b.id === activeBooking.id);
    // Generate the contract exactly once, the moment the second signature
    // lands — frozen from here on, never regenerated (see contract.ts).
    if (justSigned?.renterSignedAt && justSigned.ownerSignedAt && !justSigned.contractPdf) {
      const renterUser = getUsers().find((u) => u.id === justSigned.userId);
      const ownerUser = justSigned.ownerId ? getUsers().find((u) => u.id === justSigned.ownerId) : undefined;
      const contractPdf = generateContractPdfDataUrl(justSigned, roomVehicle, renterUser, ownerUser);
      updated = updated.map((b) => (b.id === activeBooking.id ? { ...b, contractPdf } : b));
    }
    const ok = saveBookings(updated);
    if (!ok) {
      setToast(t("Couldn't save — storage is full on this device.", "Kunde inte spara — lagringsutrymmet är fullt på den här enheten."));
      return;
    }
    const fresh = updated.find((b) => b.id === activeBooking.id) ?? null;
    setActiveBooking(fresh);
    setBookings((prev) => prev.map((b) => (b.id === activeBooking.id ? { ...b, ...fresh } : b)));
    setOwnerConfirmedBookings((prev) => prev.map((b) => (b.id === activeBooking.id ? { ...b, ...fresh } : b)));
    setToast(t("Contract signed.", "Kontraktet är signerat."));
  }

  function completeBooking(id: string) {
    const all = getBookings();
    const target = all.find((b) => b.id === id);
    if (!target || !currentUser || target.ownerId !== currentUser.id) return;
    const bothSigned = !!target.renterSignedAt && !!target.ownerSignedAt;
    if (!bothSigned || localTodayISO() < target.endDate) return;
    const completedAt = new Date().toISOString();
    const updated = all.map((b) => (b.id === id ? { ...b, status: "Avslutad" as const, completedAt } : b));
    const ok = saveBookings(updated);
    if (!ok) {
      setToast(t("Couldn't save — storage is full on this device.", "Kunde inte spara — lagringsutrymmet är fullt på den här enheten."));
      return;
    }
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "Avslutad", completedAt } : b)));
    setOwnerConfirmedBookings((prev) => prev.filter((b) => b.id !== id));
    if (activeBooking?.id === id) setActiveBooking((b) => (b ? { ...b, status: "Avslutad", completedAt } : b));
    setToast(t("Rental marked as completed.", "Uthyrningen är markerad som avslutad."));
  }

  function saveConditionReport(report: ConditionReport) {
    if (!activeBooking) return;
    const all = getBookings();
    const updated = all.map((b) => (b.id === activeBooking.id ? { ...b, conditionReport: report } : b));
    saveBookings(updated);
    const fresh = updated.find((b) => b.id === activeBooking.id) ?? null;
    setActiveBooking(fresh);
    setBookings((prev) => prev.map((b) => (b.id === activeBooking.id ? { ...b, conditionReport: report } : b)));
    setOwnerConfirmedBookings((prev) => prev.map((b) => (b.id === activeBooking.id ? { ...b, conditionReport: report } : b)));
    setToast(t("Condition report saved.", "Skicksrapporten är sparad."));
  }

  function sendRoomMessage(text: string) {
    if (!activeBooking || !currentUser || !text.trim()) return;
    const message: Message = { id: uid("msg"), bookingId: activeBooking.id, senderId: currentUser.id, text: text.trim(), createdAt: new Date().toISOString() };
    addMessage(message);
    setRoomMessages((prev) => [...prev, message]);
  }

  function cancelBooking(id: string) {
    const all = getBookings();
    const updated = all.map((b) => (b.id === id ? { ...b, status: "Avbokad" as const } : b));
    saveBookings(updated);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "Avbokad" } : b)));
    setToast(t("Booking cancelled.", "Bokningen är avbokad."));
  }

  function updateProfile(patch: Partial<User>) {
    if (!currentUser) return;
    const updated = { ...currentUser, ...patch };
    const users = getUsers().map((u) => (u.id === updated.id ? updated : u));
    saveUsers(users);
    setCurrentUser(updated);
    setToast(t("Profile updated.", "Profilen är uppdaterad."));
  }

  function submitLicenseVerification(photos: [string, string], licenseYears: number) {
    if (!currentUser) return;
    // A pending or already-approved request blocks a new one — resubmission
    // is only allowed after a rejection. The UI already hides the form in
    // that case; this is the backstop.
    const latest = getVerificationRequests().filter((r) => r.userId === currentUser.id)[0];
    if (latest && latest.status !== "rejected") return;
    const request: VerificationRequest = {
      id: uid("ver"),
      userId: currentUser.id,
      photos,
      licenseYears,
      status: "pending",
      submittedAt: new Date().toISOString(),
    };
    addVerificationRequest(request);
    // licenseYears moved here from registration — persist what the user just
    // entered so booking-eligibility checks use it.
    const users = getUsers().map((u) => (u.id === currentUser.id ? { ...u, licenseStatus: "Väntar" as const, licenseYears } : u));
    saveUsers(users);
    setCurrentUser(users.find((u) => u.id === currentUser.id) ?? null);
    setVerificationsVersion((v) => v + 1);
    setToast(t("Driving licence submitted for review.", "Körkortet är inskickat för granskning."));
    go("profile");
  }

  function reviewVerification(requestId: string, decision: "approved" | "rejected") {
    const request = getVerificationRequests().find((r) => r.id === requestId);
    if (!request) return;
    updateVerificationRequest(requestId, { status: decision, reviewedAt: new Date().toISOString() });
    const users = getUsers().map((u) =>
      u.id === request.userId ? { ...u, licenseStatus: decision === "approved" ? ("Verifierat" as const) : ("Saknas" as const) } : u
    );
    saveUsers(users);
    if (currentUser?.id === request.userId) {
      setCurrentUser(users.find((u) => u.id === request.userId) ?? null);
    }
    setVerificationsVersion((v) => v + 1);
    setToast(decision === "approved" ? t("Licence approved.", "Körkortet är godkänt.") : t("Licence rejected.", "Körkortet är nekat."));
  }

  function submitListingForReview(listingId: string) {
    if (!currentUser) return;
    addListingReviewRequest({ id: uid("lrv"), listingId, ownerId: currentUser.id, status: "pending", submittedAt: new Date().toISOString() });
    setListingReviewsVersion((v) => v + 1);
  }

  function reviewListingRequest(requestId: string, decision: "approved" | "rejected") {
    const request = getListingReviewRequests().find((r) => r.id === requestId);
    if (!request) return;
    updateListingReviewRequest(requestId, { status: decision, reviewedAt: new Date().toISOString() });
    const listing = getListings().find((l) => l.id === request.listingId);
    // Guard: only act if the listing is still actually awaiting review —
    // defends against a stale double-click re-triggering after it's already
    // resolved and stomping a since-changed status.
    if (listing && listing.status === "Granskning") {
      upsertListing({ ...listing, status: decision === "approved" ? "Publicerad" : "Utkast" });
      setListingsVersion((v) => v + 1);
    }
    setListingReviewsVersion((v) => v + 1);
    setToast(decision === "approved" ? t("Listing approved.", "Annonsen är godkänd.") : t("Listing rejected.", "Annonsen är nekad."));
  }

  function startNewListing() {
    if (!currentUser) return;
    if (currentUser.licenseStatus !== "Verifierat") {
      setToast(t("Verify your driving licence before you can list a vehicle.", "Verifiera ditt körkort innan du kan lista ett fordon."));
      go("licenseVerify");
      return;
    }
    setEditingListing(blankListing(currentUser.id));
    go("listingEditor");
  }

  function editListing(id: string) {
    const listing = getListings().find((l) => l.id === id);
    if (!listing || !currentUser || listing.ownerId !== currentUser.id) {
      setToast(t("You don't have permission to edit this listing.", "Du har inte behörighet att redigera denna annons."));
      return;
    }
    setEditingListing(listing);
    go("listingEditor");
  }

  function previewListing(id: string) {
    setPreviewListingId(id);
    go("vehicle");
  }

  function saveListing(listing: Listing, publish: boolean) {
    const toSave: Listing = { ...listing, status: publish ? "Granskning" : listing.status };
    const ok = upsertListing(toSave);
    setListingsVersion((v) => v + 1);
    if (!ok) {
      setToast(t("Couldn't save — storage is full on this device.", "Kunde inte spara — lagringsutrymmet är fullt på den här enheten."));
      return;
    }
    setEditingListing(null);
    if (publish) {
      submitListingForReview(toSave.id);
      setToast(t("Listing submitted for review. We'll notify you once it's approved.", "Annonsen är inskickad för granskning. Vi meddelar dig när den är godkänd."));
      // Not previewListing() — a Granskning listing renders as unavailable
      // in the preview, which is confusing right after submitting.
      go("myListings");
    } else {
      setToast(t("Draft saved.", "Utkastet är sparat."));
      go("myListings");
    }
  }

  function removeListing(id: string) {
    const listing = getListings().find((l) => l.id === id);
    if (!listing || !currentUser || listing.ownerId !== currentUser.id) return;
    deleteListingRecord(id);
    setListingsVersion((v) => v + 1);
    setToast(t("Listing deleted.", "Annonsen är borttagen."));
  }

  function setListingStatus(id: string, status: Listing["status"]) {
    const listing = getListings().find((l) => l.id === id);
    if (!listing || !currentUser || listing.ownerId !== currentUser.id) return;
    if (status === "Publicerad") {
      // Publishing — whether the very first time or re-publishing a paused
      // or draft listing — always re-enters the admin review queue rather
      // than going live directly.
      upsertListing({ ...listing, status: "Granskning" });
      setListingsVersion((v) => v + 1);
      submitListingForReview(id);
      return;
    }
    upsertListing({ ...listing, status });
    setListingsVersion((v) => v + 1);
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-4">
          <Image src={withBasePath("/assets/movanta-logo.png")} alt="Movanta" width={56} height={56} className="animate-pulse-soft rounded-xl" />
          <p className="text-sm text-text-muted">{t("Loading Movanta…", "Laddar Movanta…")}</p>
        </div>
      </div>
    );
  }

  const navItems: { view: View; label: string; icon: IconName }[] = [
    { view: "explore", label: t("Explore", "Utforska"), icon: "compass" },
    { view: "map", label: t("Map", "Karta"), icon: "map" },
    { view: "bookings", label: t("Bookings", "Bokningar"), icon: "ticket" },
    { view: "profile", label: t("Profile", "Profil"), icon: "user" },
  ];

  const focusedFlow = view === "booking" || view === "auth" || view === "confirmation";

  return (
    <div className="min-h-screen bg-bg pb-20 lg:pb-0">
      {!focusedFlow && (
        <header className="sticky top-0 z-40 border-b border-ink/10 bg-bg/90 backdrop-blur-lg">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
            <button type="button" onClick={() => go("explore")} className="flex items-center gap-2.5 text-text-primary">
              <Image src={withBasePath("/assets/movanta-logo.png")} alt="Movanta" width={512} height={512} className="h-8 w-8 rounded-lg" />
              <span className="text-lg font-semibold tracking-tight">Movanta</span>
            </button>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="App">
              {navItems.map((item) => (
                <button
                  key={item.view}
                  type="button"
                  onClick={() => (item.view === "bookings" || item.view === "profile" ? requireAuth(item.view) : go(item.view))}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    view === item.view ? "bg-ink/[0.06] text-text-primary" : "text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <ThemeToggle />
              <LanguageSwitcher />
              {currentUser ? (
                <button
                  type="button"
                  onClick={() => go("profile")}
                  className="flex items-center gap-2 rounded-full border border-ink/10 bg-ink/[0.03] py-1.5 pl-1.5 pr-4 text-sm font-medium text-text-primary hover:border-ink/25"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow text-xs font-bold text-[#08090A]">
                    {currentUser.firstName[0]}{currentUser.lastName[0]}
                  </span>
                  {currentUser.firstName}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => requireAuth("explore")}
                  className="rounded-full bg-yellow px-5 py-2.5 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5"
                >
                  {t("Log in", "Logga in")}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 lg:hidden">
              <ThemeToggle />
              <LanguageSwitcher />
              <button
                type="button"
                onClick={() => setMobileMenu((m) => !m)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 text-text-primary"
                aria-label={t("Menu", "Meny")}
              >
                <Icon name={mobileMenu ? "close" : "list"} className="h-5 w-5" />
              </button>
            </div>
          </div>

          {mobileMenu && (
            <div className="border-t border-ink/10 px-5 py-3 lg:hidden">
              {currentUser ? (
                <button type="button" onClick={() => go("profile")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-text-primary">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-yellow text-xs font-bold text-[#08090A]">
                    {currentUser.firstName[0]}{currentUser.lastName[0]}
                  </span>
                  {t("Signed in as", "Inloggad som")} {currentUser.firstName}
                </button>
              ) : (
                <button type="button" onClick={() => requireAuth("explore")} className="w-full rounded-full bg-yellow px-5 py-2.5 text-sm font-semibold text-[#08090A]">
                  {t("Log in", "Logga in")}
                </button>
              )}
            </div>
          )}
        </header>
      )}

      <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
        {view === "explore" && (
          <ExploreView
            filters={filters}
            setFilters={setFilters}
            searchDates={searchDates}
            setSearchDates={setSearchDates}
            list={filteredVehicles}
            mode={exploreMode}
            setMode={setExploreMode}
            onOpenVehicle={openVehicle}
            moreFilters={moreFilters}
            setMoreFilters={setMoreFilters}
            userCoord={userCoord}
            locationStatus={locationStatus}
            onRequestLocation={requestLocation}
          />
        )}

        {view === "map" && (
          <div>
            <h1 className="mb-4 text-xl font-semibold text-text-primary">{t("Vehicles on the map", "Fordon på kartan")}</h1>
            <AppMap
              list={filteredVehicles}
              userCoord={userCoord}
              locationStatus={locationStatus}
              onRequestLocation={requestLocation}
              onOpenVehicle={openVehicle}
              height="h-[calc(100vh-260px)] min-h-[420px]"
            />
          </div>
        )}

        {view === "vehicle" && previewListingId && previewVehicle && (
          <VehicleDetailView
            vehicle={previewVehicle}
            isOwnerPreview
            hasActiveBooking={bookings.some((b) => b.vehicleId === previewVehicle.id && (b.status === "Väntar" || b.status === "Kommande" || b.status === "Aktiv"))}
            onBack={() => { setPreviewListingId(null); go("myListings"); }}
            onBook={() => {}}
            onEditListing={() => { setPreviewListingId(null); editListing(previewVehicle.id); }}
          />
        )}

        {view === "vehicle" && !previewListingId && selectedVehicle && (
          <VehicleDetailView
            vehicle={selectedVehicle}
            hasActiveBooking={bookings.some((b) => b.vehicleId === selectedVehicle.id && (b.status === "Väntar" || b.status === "Kommande" || b.status === "Aktiv"))}
            onBack={() => go("explore")}
            onBook={() => startBooking(selectedVehicle.id)}
          />
        )}

        {view === "booking" && selectedVehicle && bookingDraft && (
          <BookingFlow
            vehicle={selectedVehicle}
            draft={bookingDraft}
            setDraft={setBookingDraft}
            step={bookingStep}
            setStep={setBookingStep}
            onCancel={() => go("vehicle")}
            onSubmit={finalizeBooking}
            submitting={submitting}
            renterLicenseYears={currentUser?.licenseYears ?? 0}
            renterLicenseStatus={currentUser?.licenseStatus ?? "Saknas"}
          />
        )}

        {view === "confirmation" && lastBooking && (
          <ConfirmationView booking={lastBooking} vehicle={localizeVehicle(vehiclesLive.find((v) => v.id === lastBooking.vehicleId)!, lang)} onDone={() => go("bookings")} onHome={() => go("explore")} />
        )}

        {view === "auth" && (
          <AuthView
            mode={authMode}
            setMode={setAuthMode}
            onLogin={handleLogin}
            onRegister={handleRegister}
            onCancel={() => (pendingView ? go("explore") : go("explore"))}
          />
        )}

        {view === "profile" && currentUser && (
          <ProfileView
            user={currentUser}
            bookingsCount={bookings.length}
            pendingRequestsCount={incomingRequests.length}
            pendingVerificationsCount={verificationRequestsLive.filter((r) => r.status === "pending").length}
            pendingListingReviewsCount={listingReviewRequestsLive.filter((r) => r.status === "pending").length}
            latestVerificationStatus={myLatestVerification?.status}
            onEdit={() => go("profileEdit")}
            onBookings={() => go("bookings")}
            onPayments={() => go("payments")}
            onSettings={() => go("settings")}
            onListings={() => go("myListings")}
            onLicenseVerify={() => go("licenseVerify")}
            onAdminDashboard={() => go("adminDashboard")}
            onLogout={handleLogout}
          />
        )}

        {view === "myListings" && currentUser && (
          <OwnerDashboard
            listings={getListingsByOwner(currentUser.id)}
            requests={incomingRequests}
            confirmedBookings={ownerConfirmedBookings}
            vehicles={vehiclesLive}
            reviewRequests={myListingReviewRequests}
            onNew={startNewListing}
            onEdit={editListing}
            onPreview={previewListing}
            onDelete={removeListing}
            onSetStatus={setListingStatus}
            onAcceptRequest={(id) => respondToBookingRequest(id, true)}
            onDeclineRequest={(id) => respondToBookingRequest(id, false)}
            onOpenRoom={(id) => openBookingRoom(id, "myListings")}
            onBack={() => go("profile")}
          />
        )}

        {view === "listingEditor" && currentUser && editingListing && (
          <ListingWizard
            listing={editingListing}
            onSave={saveListing}
            onCancel={() => { setEditingListing(null); go("myListings"); }}
          />
        )}

        {view === "profileEdit" && currentUser && (
          <ProfileEditView user={currentUser} onSave={(patch) => { updateProfile(patch); go("profile"); }} onCancel={() => go("profile")} />
        )}

        {view === "licenseVerify" && currentUser && (
          <LicenseVerificationView
            user={currentUser}
            requests={myVerificationRequests}
            onSubmit={submitLicenseVerification}
            onBack={() => go("profile")}
          />
        )}

        {view === "adminDashboard" && currentUser?.role === "admin" && (
          <AdminDashboard
            requests={verificationRequestsLive}
            users={getUsers()}
            onApprove={(id) => reviewVerification(id, "approved")}
            onReject={(id) => reviewVerification(id, "rejected")}
            listingRequests={listingReviewRequestsLive}
            listings={getListings()}
            onApproveListing={(id) => reviewListingRequest(id, "approved")}
            onRejectListing={(id) => reviewListingRequest(id, "rejected")}
            onResetAllData={() => { resetAllData(); window.location.reload(); }}
            onBack={() => go("profile")}
          />
        )}

        {view === "bookings" && currentUser && (
          <BookingsView
            bookings={bookings}
            vehicles={vehiclesLive}
            tab={bookingsTab}
            setTab={setBookingsTab}
            onCancel={cancelBooking}
            onExplore={() => go("explore")}
            onOpenRoom={(id) => openBookingRoom(id, "bookings")}
          />
        )}

        {view === "bookingRoom" && currentUser && activeBooking && (
          <BookingRoomView
            booking={activeBooking}
            vehicle={roomVehicle}
            currentUser={currentUser}
            renter={getUsers().find((u) => u.id === activeBooking.userId)}
            owner={activeBooking.ownerId ? getUsers().find((u) => u.id === activeBooking.ownerId) : undefined}
            messages={roomMessages}
            onSign={signContract}
            onSendMessage={sendRoomMessage}
            onSaveConditionReport={saveConditionReport}
            onComplete={() => completeBooking(activeBooking.id)}
            onBack={() => go(roomOrigin)}
          />
        )}

        {view === "payments" && <PaymentsView onBack={() => go("profile")} />}
        {view === "settings" && <SettingsView onBack={() => go("profile")} />}
      </main>

      {!focusedFlow && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-bg/95 backdrop-blur-lg lg:hidden" aria-label={t("Mobile navigation", "Mobil navigering")}>
          <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
            {navItems.map((item) => (
              <button
                key={item.view}
                type="button"
                onClick={() => (item.view === "bookings" || item.view === "profile" ? requireAuth(item.view) : go(item.view))}
                className={`flex flex-col items-center gap-1 rounded-xl px-4 py-1.5 text-[11px] font-medium transition-colors ${
                  view === item.view ? "text-yellow" : "text-text-muted"
                }`}
              >
                <Icon name={item.icon} className="h-5 w-5" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-ink/10 bg-card px-5 py-2.5 text-sm text-text-primary shadow-xl lg:bottom-6">
          {toast}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
        active ? "border-yellow bg-yellow/10 text-yellow" : "border-ink/10 bg-ink/[0.03] text-text-secondary hover:border-ink/25"
      }`}
    >
      {children}
    </button>
  );
}

type Filters = {
  types: VehicleType[];
  transmissions: Transmission[];
  elOnly: boolean;
  availableNow: boolean;
  maxPrice: number;
  maxDistance: number;
  minSeats: number;
  query: string;
};

function ExploreView({
  filters, setFilters, searchDates, setSearchDates, list, mode, setMode, onOpenVehicle, moreFilters, setMoreFilters,
  userCoord, locationStatus, onRequestLocation,
}: {
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  searchDates: { start: string; end: string; pickupTime: string; returnTime: string };
  setSearchDates: React.Dispatch<React.SetStateAction<{ start: string; end: string; pickupTime: string; returnTime: string }>>;
  list: LiveVehicle[];
  mode: "list" | "map";
  setMode: (m: "list" | "map") => void;
  onOpenVehicle: (id: string) => void;
  moreFilters: boolean;
  setMoreFilters: (b: boolean) => void;
  userCoord: LatLng | null;
  locationStatus: LocationStatus;
  onRequestLocation: () => void;
}) {
  const { lang, t } = useLanguage();
  const toggleType = (ty: VehicleType) => setFilters((f) => ({ ...f, types: f.types.includes(ty) ? f.types.filter((x) => x !== ty) : [...f.types, ty] }));
  const toggleTransmission = (tr: Transmission) => setFilters((f) => ({ ...f, transmissions: f.transmissions.includes(tr) ? f.transmissions.filter((x) => x !== tr) : [...f.transmissions, tr] }));
  const clearFilters = () => setFilters({ types: [], transmissions: [], elOnly: false, availableNow: false, maxPrice: Infinity, maxDistance: Infinity, minSeats: 0, query: filters.query });

  return (
    <div>
      <div className="mb-5 flex items-center gap-2.5">
        <Image src={withBasePath("/assets/movanta-logo.png")} alt="" width={512} height={512} className="h-8 w-8 rounded-lg lg:hidden" />
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{t("Explore vehicles", "Utforska fordon")}</h1>
          <p className="text-sm text-text-muted">{t("Your next trip, ready nearby.", "Din nästa resa, redo i närheten.")}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-ink/10 bg-card p-4 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-xl border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5">
            <Icon name="search" className="h-4 w-4 text-text-muted" />
            <input
              value={filters.query}
              onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
              placeholder={t("Search location, e.g. Teleborg", "Sök plats, t.ex. Teleborg")}
              className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5">
              <Icon name="calendar" className="h-4 w-4 text-text-muted" />
              <input type="date" value={searchDates.start} onChange={(e) => setSearchDates((s) => ({ ...s, start: e.target.value }))} className="w-full bg-transparent text-sm text-text-primary focus:outline-none" />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5">
              <Icon name="calendar" className="h-4 w-4 text-text-muted" />
              <input type="date" value={searchDates.end} onChange={(e) => setSearchDates((s) => ({ ...s, end: e.target.value }))} className="w-full bg-transparent text-sm text-text-primary focus:outline-none" />
            </label>
          </div>
        </div>

        <div className="themed-scrollbar mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <Chip active={filters.types.includes("Bil")} onClick={() => toggleType("Bil")}>{typeLabel("Bil", lang)}</Chip>
          <Chip active={filters.types.includes("Transportbil")} onClick={() => toggleType("Transportbil")}>{typeLabel("Transportbil", lang)}</Chip>
          <Chip active={filters.types.includes("Motorcykel")} onClick={() => toggleType("Motorcykel")}>{typeLabel("Motorcykel", lang)}</Chip>
          <Chip active={filters.types.includes("Båt")} onClick={() => toggleType("Båt")}>{typeLabel("Båt", lang)}</Chip>
          <Chip active={filters.types.includes("Jetski")} onClick={() => toggleType("Jetski")}>{typeLabel("Jetski", lang)}</Chip>
          <Chip active={filters.types.includes("Husbil")} onClick={() => toggleType("Husbil")}>{typeLabel("Husbil", lang)}</Chip>
          <Chip active={filters.types.includes("Moped")} onClick={() => toggleType("Moped")}>{typeLabel("Moped", lang)}</Chip>
          <Chip active={filters.types.includes("Släpvagn")} onClick={() => toggleType("Släpvagn")}>{typeLabel("Släpvagn", lang)}</Chip>
          <Chip active={filters.types.includes("Annat")} onClick={() => toggleType("Annat")}>{typeLabel("Annat", lang)}</Chip>
          <Chip active={filters.transmissions.includes("Automat")} onClick={() => toggleTransmission("Automat")}>{transmissionLabel("Automat", lang)}</Chip>
          <Chip active={filters.transmissions.includes("Manuell")} onClick={() => toggleTransmission("Manuell")}>{transmissionLabel("Manuell", lang)}</Chip>
          <Chip active={filters.elOnly} onClick={() => setFilters((f) => ({ ...f, elOnly: !f.elOnly }))}>{t("Electric", "Elbil")}</Chip>
          <Chip active={filters.availableNow} onClick={() => setFilters((f) => ({ ...f, availableNow: !f.availableNow }))}>{t("Available now", "Tillgänglig nu")}</Chip>
          <Chip active={moreFilters} onClick={() => setMoreFilters(!moreFilters)}>
            <span className="flex items-center gap-1"><Icon name="filter" className="h-3.5 w-3.5" />{t("More filters", "Fler filter")}</span>
          </Chip>
        </div>

        {moreFilters && (
          <div className="mt-3 grid gap-4 rounded-xl border border-ink/10 bg-ink/[0.02] p-4 sm:grid-cols-3">
            <div>
              <p className="mb-1.5 text-xs text-text-muted">{t("Price per day, max", "Pris per dag, max")} {Number.isFinite(filters.maxPrice) ? formatSEK(filters.maxPrice) : t("any", "alla")}</p>
              <RangeInput
                min={200}
                max={2000}
                step={50}
                value={Number.isFinite(filters.maxPrice) ? filters.maxPrice : 2000}
                onChange={(e) => setFilters((f) => ({ ...f, maxPrice: Number(e.target.value) >= 2000 ? Infinity : Number(e.target.value) }))}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-text-muted">{t("Distance, max", "Avstånd, max")} {Number.isFinite(filters.maxDistance) ? `${filters.maxDistance} km` : t("any", "alla")}</p>
              <RangeInput
                min={1}
                max={50}
                value={Number.isFinite(filters.maxDistance) ? filters.maxDistance : 50}
                onChange={(e) => setFilters((f) => ({ ...f, maxDistance: Number(e.target.value) }))}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs text-text-muted">{t("Number of seats, minimum", "Antal säten, minst")}</p>
              <select value={filters.minSeats} onChange={(e) => setFilters((f) => ({ ...f, minSeats: Number(e.target.value) }))} className="w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2 text-sm text-text-primary focus:outline-none">
                <option value={0}>{t("All", "Alla")}</option>
                <option value={2}>2+</option>
                <option value={4}>4+</option>
                <option value={5}>5+</option>
              </select>
            </div>
            <button type="button" onClick={clearFilters} className="text-xs font-medium text-text-secondary underline-offset-4 hover:text-text-primary hover:underline sm:col-span-3">
              {t("Clear filters", "Rensa filter")}
            </button>
          </div>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-text-secondary">{list.length} {t("vehicles near you", "fordon nära dig")}</p>
        <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-ink/[0.03] p-1">
          <button type="button" onClick={() => setMode("list")} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${mode === "list" ? "bg-yellow text-[#08090A]" : "text-text-secondary"}`}>
            <Icon name="list" className="h-3.5 w-3.5" /> {t("List", "Lista")}
          </button>
          <button type="button" onClick={() => setMode("map")} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${mode === "map" ? "bg-yellow text-[#08090A]" : "text-text-secondary"}`}>
            <Icon name="map" className="h-3.5 w-3.5" /> {t("Map", "Karta")}
          </button>
        </div>
      </div>

      <div className="mt-4">
        {mode === "map" ? (
          <AppMap list={list} userCoord={userCoord} locationStatus={locationStatus} onRequestLocation={onRequestLocation} onOpenVehicle={onOpenVehicle} />
        ) : list.length === 0 ? (
          <div className="rounded-2xl border border-ink/10 bg-card p-10 text-center">
            <p className="text-sm text-text-secondary">{t("No vehicles match your filters.", "Inga fordon matchar dina filter.")}</p>
            <button type="button" onClick={clearFilters} className="mt-3 text-sm font-medium text-yellow underline-offset-4 hover:underline">{t("Clear filters", "Rensa filter")}</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((v) => <VehicleCard key={v.id} vehicle={v} onOpen={() => onOpenVehicle(v.id)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function VehicleDetailView({
  vehicle, onBack, onBook, isOwnerPreview = false, onEditListing, hasActiveBooking = false,
}: {
  vehicle: Vehicle;
  onBack: () => void;
  onBook: () => void;
  isOwnerPreview?: boolean;
  onEditListing?: () => void;
  hasActiveBooking?: boolean;
}) {
  const { lang, t } = useLanguage();
  const [activePhoto, setActivePhoto] = useState(0);
  const photos = vehicle.photos ?? [];
  const upcoming = upcomingFrom(vehicle);
  return (
    <div className="pb-24 lg:pb-0">
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <Icon name="chevronLeft" className="h-4 w-4" /> {t("Back", "Tillbaka")}
      </button>

      {isOwnerPreview && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-yellow/30 bg-yellow/10 px-4 py-2.5 text-xs font-medium text-yellow">
          <span className="flex items-center gap-1.5"><Icon name="eye" className="h-3.5 w-3.5" />{t("Owner preview — this is how renters will see your listing", "Ägarförhandsvisning — så här ser hyresgäster din annons")}</span>
          {onEditListing && (
            <button type="button" onClick={onEditListing} className="flex items-center gap-1 rounded-full bg-yellow px-3 py-1.5 text-[11px] font-semibold text-[#08090A]">
              <Icon name="edit" className="h-3 w-3" />{t("Edit listing", "Redigera annons")}
            </button>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          {photos.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL photos */}
              <img src={photos[activePhoto]} alt="" className="h-72 w-full rounded-2xl border border-ink/10 object-cover" />
              {photos.length > 1 && (
                <div className="themed-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setActivePhoto(i)}
                      className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border ${i === activePhoto ? "border-yellow" : "border-ink/10 opacity-70 hover:opacity-100"}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL photos */}
                      <img src={p} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <VehicleThumb vehicle={vehicle} className="h-72" />
          )}

          <div className="mt-5 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-text-primary">{vehicle.brand} {vehicle.model}</h1>
              <p className="mt-1 text-sm text-text-muted">{vehicle.year} · {typeLabel(vehicle.type, lang)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-text-primary">{formatSEK(vehicle.pricePerDay)}</p>
              <p className="text-xs text-text-muted">{t("per day", "per dag")}</p>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <RatingRow rating={vehicle.rating} reviews={vehicle.reviews} />
            {vehicle.verified && <span className="flex items-center gap-1 rounded-full border border-yellow/30 bg-yellow/10 px-2.5 py-1 text-xs font-medium text-yellow"><Icon name="shield" className="h-3 w-3" />{t("Verified owner", "Verifierad ägare")}</span>}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-text-secondary">{vehicle.description}</p>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ...(vehicle.type === "Släpvagn"
                ? [{ icon: "gear" as IconName, label: typeLabel(vehicle.type, lang) }]
                : [
                    { icon: "gear" as IconName, label: transmissionLabel(vehicle.transmission, lang) },
                    { icon: "fuel" as IconName, label: fuelLabel(vehicle.fuel, lang) },
                    { icon: "seat" as IconName, label: `${vehicle.seats} ${t("seats", "säten")}` },
                  ]),
              { icon: "pin" as IconName, label: `${vehicle.distanceKm} ${t("km away", "km bort")}` },
            ].map((spec) => (
              <div key={spec.label} className="flex flex-col items-center gap-1.5 rounded-xl border border-ink/10 bg-card py-3 text-center">
                <Icon name={spec.icon} className="h-5 w-5 text-yellow" />
                <span className="text-xs text-text-secondary">{spec.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-text-primary">{t("Equipment", "Utrustning")}</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {vehicle.features.map((f) => (
                <span key={f} className="rounded-full border border-ink/10 bg-ink/[0.03] px-3 py-1.5 text-xs text-text-secondary">{f}</span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-text-primary">{t("Rules", "Regler")}</h2>
            <ul className="mt-2 space-y-1.5">
              {vehicle.rules.map((r) => (
                <li key={r} className="flex items-start gap-2 text-sm text-text-secondary"><Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow" />{r}</li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-text-primary">{t("Condition & documentation", "Skick & dokumentation")}</h2>
            {hasActiveBooking ? (
              <div className="mt-2 space-y-4">
                {vehicle.mileage != null && (
                  <p className="text-sm text-text-secondary">
                    {t("Mileage at listing", "Mätarställning vid annonsering")}: <span className="text-text-primary">{vehicle.mileage.toLocaleString(lang === "sv" ? "sv-SE" : "en-GB")} km</span>
                  </p>
                )}
                <DocPhotoRow label={t("Mileage & vehicle condition", "Mätarställning & fordonets skick")} photos={vehicle.conditionPhotos} />
                <DocPhotoRow label={t("Existing damage", "Befintliga skador")} photos={vehicle.damagePhotos} />
                <DocPhotoRow label={t("Included items", "Inkluderade tillbehör")} photos={vehicle.includedItemsPhotos} />
                <DocPhotoRow label={t("Documents", "Dokument")} photos={vehicle.documentPhotos} />
              </div>
            ) : (
              <div className="mt-2 rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
                <p className="text-xs text-text-muted">
                  {t("Sent to you once your booking request has been sent to the owner:", "Skickas till dig när din bokningsförfrågan har skickats till ägaren:")}
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-text-secondary">
                  <li>{t("Mileage & vehicle condition", "Mätarställning & fordonets skick")}</li>
                  <li>{t("Existing damage", "Befintliga skador")}</li>
                  <li>{t("Included items", "Inkluderade tillbehör")}</li>
                  <li>{t("Documents", "Dokument")}</li>
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold text-text-primary">{t("Pickup location", "Upphämtningsplats")}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary"><Icon name="pin" className="h-4 w-4 text-yellow" />{vehicle.location}</p>
            <div className="mt-3">
              <RealMap
                vehicles={[{ id: vehicle.id, brand: vehicle.brand, model: vehicle.model, pricePerDay: vehicle.pricePerDay, distanceKm: vehicle.distanceKm, type: vehicle.type, color: vehicle.color, coord: vehicle.coord ?? approxLocationCoords[vehicle.location] ?? VAXJO_CENTER }]}
                center={vehicle.coord ?? approxLocationCoords[vehicle.location] ?? VAXJO_CENTER}
                userCoord={null}
                selectedId={null}
                onSelectVehicle={() => {}}
                routeVehicleId={null}
                onRouteResult={() => {}}
                height="h-56"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-ink/10 bg-card p-5">
            <h2 className="text-sm font-semibold text-text-primary">{t("Owner", "Ägare")}</h2>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow text-sm font-bold text-[#08090A]">
                {vehicle.owner.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </span>
              <div>
                <p className="text-sm font-medium text-text-primary">{vehicle.owner.name}</p>
                <p className="text-xs text-text-muted">
                  {vehicle.owner.business ? (vehicle.verified ? t("Verified company", "Verifierat företag") : t("Company", "Företag")) : t("Private owner", "Privat ägare")} · {t("Since", "Sedan")} {vehicle.owner.memberSince}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-text-secondary">
              <span className="flex items-center gap-1"><Icon name="star" className="h-3.5 w-3.5 text-yellow" />{vehicle.owner.rating.toFixed(1)}</span>
              <span>{vehicle.owner.trips} {t("trips", "resor")}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary"><Icon name="shield" className="h-4 w-4 text-yellow" />{t("Insurance & protection", "Försäkring & skydd")}</h2>
            <p className="mt-2 text-sm text-text-secondary">{vehicle.insurance}</p>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-card p-5">
            <h2 className="text-sm font-semibold text-text-primary">{t("Availability", "Tillgänglighet")}</h2>
            <p className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${vehicle.available ? "bg-yellow/10 text-yellow" : "bg-ink/10 text-text-muted"}`}>
              {vehicle.available
                ? t("Available now", "Tillgänglig nu")
                : upcoming
                ? `${t("Available from", "Tillgänglig från")} ${upcoming}`
                : t("Booked right now", "Bokad just nu")}
            </p>
          </div>

          {!isOwnerPreview && (
            <div className="hidden lg:block">
              <button type="button" onClick={onBook} disabled={!vehicle.available} className="w-full rounded-full bg-yellow py-3.5 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5 disabled:opacity-40">
                {vehicle.available ? t("Book vehicle", "Boka fordon") : upcoming ? `${t("Available from", "Tillgänglig från")} ${upcoming}` : t("Not available", "Ej tillgänglig")}
              </button>
            </div>
          )}
        </div>
      </div>

      {!isOwnerPreview && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-ink/10 bg-bg/95 p-4 backdrop-blur lg:hidden">
          <button type="button" onClick={onBook} disabled={!vehicle.available} className="flex w-full items-center justify-center gap-2 rounded-full bg-yellow py-3.5 text-sm font-semibold text-[#08090A] disabled:opacity-40">
            {vehicle.available
              ? `${t("Book vehicle", "Boka fordon")} · ${formatSEK(vehicle.pricePerDay)}/${t("day", "dag")}`
              : upcoming
              ? `${t("Available from", "Tillgänglig från")} ${upcoming}`
              : t("Not available", "Ej tillgänglig")}
          </button>
        </div>
      )}
    </div>
  );
}

function StepHeader({ step, vehicle }: { step: number; vehicle: Vehicle }) {
  const { t } = useLanguage();
  const labels = [t("Dates", "Datum"), t("Price", "Pris"), t("Driver", "Förare"), t("Payment", "Betalning")];
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 rounded-2xl border border-ink/10 bg-card p-3">
        <VehicleThumb vehicle={vehicle} className="h-14 w-14 shrink-0" compact />
        <div>
          <p className="text-sm font-semibold text-text-primary">{vehicle.brand} {vehicle.model}</p>
          <p className="text-xs text-text-muted">{formatSEK(vehicle.pricePerDay)}/{t("day", "dag")}</p>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
        {labels.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i + 1 <= step ? "bg-yellow text-[#08090A]" : "bg-ink/10 text-text-muted"}`}>
              {i + 1 < step ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
            </div>
            <span className={`hidden text-xs sm:inline ${i + 1 <= step ? "text-text-primary" : "text-text-muted"}`}>{label}</span>
            {i < labels.length - 1 && <div className={`h-px flex-1 ${i + 1 < step ? "bg-yellow" : "bg-ink/10"}`} />}
          </div>
        ))}
      </div>
    </div>
  );
}

function BookingFlow({
  vehicle, draft, setDraft, step, setStep, onCancel, onSubmit, submitting, renterLicenseYears, renterLicenseStatus,
}: {
  vehicle: Vehicle;
  draft: BookingDraft;
  setDraft: React.Dispatch<React.SetStateAction<BookingDraft | null>>;
  step: number;
  setStep: (n: number) => void;
  onCancel: () => void;
  onSubmit: () => void;
  submitting: boolean;
  renterLicenseYears: number;
  renterLicenseStatus: User["licenseStatus"];
}) {
  const { lang, t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const nights = nightsBetween(draft.startDate, draft.endDate);
  const rentalPrice = grossRevenueForPeriod(vehicle.pricePerDay, nights, vehicle.pricePerWeek ?? null);
  const protectionFee = nights * PROTECTION_FEE_PER_NIGHT;
  const totalPrice = rentalPrice + protectionFee + SERVICE_FEE;

  function patch(p: Partial<BookingDraft>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  function next() {
    setError(null);
    if (step === 1) {
      if (!draft.startDate || !draft.endDate) return setError(t("Choose both a start and end date.", "Välj både startdatum och slutdatum."));
      if (new Date(draft.endDate) <= new Date(draft.startDate)) return setError(t("End date must be after the start date.", "Slutdatum måste vara efter startdatum."));
    }
    if (step === 3) {
      if (!draft.firstName || !draft.lastName) return setError(t("Fill in first and last name.", "Fyll i förnamn och efternamn."));
      if (!/^[\d+][\d\s-]{6,}$/.test(draft.phone.trim())) return setError(t("Enter a valid phone number.", "Ange ett giltigt telefonnummer."));
      const required = Math.max(1, vehicle.minLicenseYears ?? 1);
      if (renterLicenseYears < required) {
        return setError(
          t(
            `This vehicle requires the renter to have held a driving licence for at least ${required} year${required === 1 ? "" : "s"}. Update your years with licence in Profile to book.`,
            `Detta fordon kräver att föraren har haft körkort i minst ${required} år. Uppdatera dina år med körkort under Profil för att kunna boka.`
          )
        );
      }
      if (!draft.acceptTerms) return setError(t("You must accept the terms to continue.", "Du måste godkänna villkoren för att fortsätta."));
    }
    if (step === 4) {
      const digits = draft.cardNumber.replace(/\s/g, "");
      if (!draft.cardName.trim()) return setError(t("Enter the cardholder's name.", "Ange kortinnehavarens namn."));
      if (!/^\d{16}$/.test(digits)) return setError(t("The card number must be 16 digits.", "Kortnumret måste vara 16 siffror."));
      if (!/^\d{2}\/\d{2}$/.test(draft.expiry)) return setError(t("Expiry date should be entered as MM/YY.", "Utgångsdatum ska anges som MM/ÅÅ."));
      if (!/^\d{3}$/.test(draft.cvc)) return setError(t("CVC should be 3 digits.", "CVC ska vara 3 siffror."));
      onSubmit();
      return;
    }
    setStep(step + 1);
  }

  function back() {
    setError(null);
    if (step === 1) onCancel();
    else setStep(step - 1);
  }

  return (
    <div className="mx-auto max-w-xl pb-10">
      <StepHeader step={step} vehicle={vehicle} />

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      {step === 1 && (
        <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5">
          <h2 className="text-base font-semibold text-text-primary">{t("Choose date and time", "Välj datum och tid")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-text-muted">{t("Start date", "Startdatum")}
              <input type="date" min={todayISO()} value={draft.startDate} onChange={(e) => patch({ startDate: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm text-text-primary focus:outline-none" />
            </label>
            <label className="text-xs text-text-muted">{t("End date", "Slutdatum")}
              <input type="date" min={draft.startDate || todayISO()} value={draft.endDate} onChange={(e) => patch({ endDate: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm text-text-primary focus:outline-none" />
            </label>
            <label className="text-xs text-text-muted">{t("Pickup time", "Upphämtningstid")}
              <input type="time" value={draft.pickupTime} onChange={(e) => patch({ pickupTime: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm text-text-primary focus:outline-none" />
            </label>
            <label className="text-xs text-text-muted">{t("Return time", "Återlämningstid")}
              <input type="time" value={draft.returnTime} onChange={(e) => patch({ returnTime: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm text-text-primary focus:outline-none" />
            </label>
          </div>
          <p className="text-sm text-text-secondary">{nights} {t(nights === 1 ? "night selected" : "nights selected", "dygn valda")}</p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5">
          <h2 className="text-base font-semibold text-text-primary">{t("Price breakdown", "Prisberäkning")}</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between text-text-secondary">
              <span>
                {t("Rental price", "Hyrespris")}{" "}
                {vehicle.pricePerWeek && nights >= 7
                  ? `(${nights} ${t("nights", "dygn")}, ${t("weekly rate applied", "veckopris tillämpat")})`
                  : `(${nights} ${t("nights", "dygn")} × ${formatSEK(vehicle.pricePerDay)})`}
              </span>
              <span className="text-text-primary">{formatSEK(rentalPrice)}</span>
            </div>
            <div className="flex justify-between text-text-secondary"><span>{t("Service fee", "Serviceavgift")}</span><span className="text-text-primary">{formatSEK(SERVICE_FEE)}</span></div>
            <div className="flex justify-between text-text-secondary"><span>{t("Protection fee", "Skyddsavgift")} ({nights} {t("nights", "dygn")})</span><span className="text-text-primary">{formatSEK(protectionFee)}</span></div>
            <div className="flex justify-between border-t border-ink/10 pt-2.5 text-base font-semibold text-text-primary"><span>{t("Total", "Totalt")}</span><span>{formatSEK(totalPrice)}</span></div>
          </div>
          <p className="text-xs text-text-muted">{t("Preliminary calculation. No payment is taken until step 4.", "Preliminär beräkning. Ingen betalning genomförs förrän i steg 4.")}</p>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5">
          <h2 className="text-base font-semibold text-text-primary">{t("Driver details", "Föraruppgifter")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-text-muted">{t("First name", "Förnamn")}
              <input value={draft.firstName} onChange={(e) => patch({ firstName: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm text-text-primary focus:outline-none" />
            </label>
            <label className="text-xs text-text-muted">{t("Last name", "Efternamn")}
              <input value={draft.lastName} onChange={(e) => patch({ lastName: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm text-text-primary focus:outline-none" />
            </label>
          </div>
          <label className="block text-xs text-text-muted">{t("Phone number", "Telefonnummer")}
            <input value={draft.phone} onChange={(e) => patch({ phone: e.target.value })} placeholder="070-123 45 67" className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm text-text-primary focus:outline-none" />
          </label>
          <div className="rounded-lg border border-ink/10 bg-ink/[0.02] px-3.5 py-2.5 text-sm text-text-secondary">
            <p>{t("Licence status", "Körkortsstatus")}: <span className="font-medium text-yellow">{licenseLabel(renterLicenseStatus, lang)}</span></p>
            <p className="mt-1 text-xs">
              {t("This vehicle requires", "Detta fordon kräver")} {Math.max(1, vehicle.minLicenseYears ?? 1)}+ {t("years with a licence", "år med körkort")} · {t("You have", "Du har")} {renterLicenseYears} {t(renterLicenseYears === 1 ? "year" : "years", "år")}
              {renterLicenseYears < Math.max(1, vehicle.minLicenseYears ?? 1) && (
                <span className="ml-1 text-red-300">({t("not eligible — update in Profile", "ej behörig — uppdatera under Profil")})</span>
              )}
            </p>
          </div>
          <label className="flex items-start gap-2.5 text-sm text-text-secondary">
            <input type="checkbox" checked={draft.acceptTerms} onChange={(e) => patch({ acceptTerms: e.target.checked })} className="mt-0.5 h-4 w-4 accent-yellow" />
            {t("I accept Movanta's terms and rental agreement", "Jag godkänner Movantas villkor och hyresavtal")}
          </label>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary"><Icon name="card" className="h-4 w-4 text-yellow" />{t("Payment (simulated)", "Betalning (simulerad)")}</h2>
          <label className="block text-xs text-text-muted">{t("Cardholder", "Kortinnehavare")}
            <input value={draft.cardName} onChange={(e) => patch({ cardName: e.target.value })} placeholder={t("Name on card", "Namn på kortet")} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm text-text-primary focus:outline-none" />
          </label>
          <label className="block text-xs text-text-muted">{t("Card number", "Kortnummer")}
            <input
              value={draft.cardNumber}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 16);
                patch({ cardNumber: digits.replace(/(\d{4})(?=\d)/g, "$1 ") });
              }}
              placeholder="1234 5678 9012 3456"
              inputMode="numeric"
              className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm text-text-primary focus:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-text-muted">{t("Expiry date (MM/YY)", "Utgångsdatum (MM/ÅÅ)")}
              <input
                value={draft.expiry}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                  patch({ expiry: digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits });
                }}
                placeholder="08/29"
                inputMode="numeric"
                className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm text-text-primary focus:outline-none"
              />
            </label>
            <label className="text-xs text-text-muted">CVC
              <input value={draft.cvc} onChange={(e) => patch({ cvc: e.target.value.replace(/\D/g, "").slice(0, 3) })} placeholder="123" inputMode="numeric" className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3 py-2.5 text-sm text-text-primary focus:outline-none" />
            </label>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-text-muted"><Icon name="shield" className="h-3.5 w-3.5" />{t("This is a simulated payment. No real card details are processed.", "Detta är en simulerad betalning. Inga riktiga kortuppgifter behandlas.")}</p>
          <div className="flex justify-between border-t border-ink/10 pt-3 text-sm font-semibold text-text-primary"><span>{t("Total to pay", "Att betala")}</span><span>{formatSEK(totalPrice)}</span></div>
        </div>
      )}

      <div className="mt-5 flex gap-3">
        <button type="button" onClick={back} className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-ink/[0.03] px-5 py-3 text-sm font-medium text-text-primary hover:border-ink/25">
          <Icon name="chevronLeft" className="h-4 w-4" />{t("Back", "Tillbaka")}
        </button>
        <button type="button" onClick={next} disabled={submitting} className="flex-1 rounded-full bg-yellow py-3 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5 disabled:opacity-60">
          {submitting ? t("Processing…", "Bearbetar…") : step === 4 ? t("Confirm and book", "Bekräfta och boka") : step === 3 ? t("Continue to payment", "Fortsätt till betalning") : t("Next", "Nästa")}
        </button>
      </div>
    </div>
  );
}

function ConfirmationView({ booking, vehicle, onDone, onHome }: { booking: Booking; vehicle: Vehicle; onDone: () => void; onHome: () => void }) {
  const { t } = useLanguage();
  const pending = booking.status === "Väntar";
  return (
    <div className="mx-auto max-w-lg pb-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow/15 text-yellow">
        <Icon name={pending ? "clock" : "check"} className="h-8 w-8" />
      </div>
      <h1 className="mt-4 text-xl font-semibold text-text-primary">
        {pending ? t("Booking request sent!", "Bokningsförfrågan skickad!") : t("Booking confirmed!", "Bokning bekräftad!")}
      </h1>
      {pending && (
        <p className="mt-1 text-sm text-text-secondary">
          {t("The owner needs to approve this booking before it's confirmed. You'll see it update in \"My bookings\".", "Ägaren behöver godkänna denna bokning innan den bekräftas. Du ser uppdateringen under \"Mina bokningar\".")}
        </p>
      )}
      <p className="mt-1 text-sm text-text-muted">{t("Booking number", "Bokningsnummer")} {booking.bookingNumber}</p>

      <div className="mt-6 space-y-3 rounded-2xl border border-ink/10 bg-card p-5 text-left">
        <div className="flex items-center gap-3">
          <VehicleThumb vehicle={vehicle} className="h-14 w-14 shrink-0" compact />
          <div>
            <p className="text-sm font-semibold text-text-primary">{vehicle.brand} {vehicle.model}</p>
            <p className="text-xs text-text-muted">{vehicle.location}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-ink/10 pt-3 text-sm">
          <div><p className="text-text-muted">{t("Start date", "Startdatum")}</p><p className="text-text-primary">{booking.startDate}</p></div>
          <div><p className="text-text-muted">{t("End date", "Slutdatum")}</p><p className="text-text-primary">{booking.endDate}</p></div>
          <div><p className="text-text-muted">{t("Pickup location", "Upphämtningsplats")}</p><p className="text-text-primary">{vehicle.location}</p></div>
          <div><p className="text-text-muted">{t("Total price", "Totalpris")}</p><p className="text-text-primary">{formatSEK(booking.totalPrice)}</p></div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={onHome} className="flex-1 rounded-full border border-ink/15 bg-ink/[0.03] py-3 text-sm font-medium text-text-primary hover:border-ink/25">{t("To the homepage", "Till startsidan")}</button>
        <button type="button" onClick={onDone} className="flex-1 rounded-full bg-yellow py-3 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5">{t("To my bookings", "Till mina bokningar")}</button>
      </div>
    </div>
  );
}

function AuthView({
  mode, setMode, onLogin, onRegister, onCancel,
}: {
  mode: AuthMode;
  setMode: (m: AuthMode) => void;
  onLogin: (email: string, password: string, remember: boolean) => boolean;
  onRegister: (payload: { firstName: string; lastName: string; email: string; phone: string; password: string; licenseYears: number }) => string | null;
  onCancel: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-md pb-10">
      <button type="button" onClick={onCancel} className="mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <Icon name="chevronLeft" className="h-4 w-4" />{t("Back", "Tillbaka")}
      </button>

      <div className="mb-6 flex justify-center">
        <Image src={withBasePath("/assets/movanta-logo.png")} alt="Movanta" width={512} height={512} className="h-12 w-12 rounded-xl" />
      </div>

      <div className="rounded-2xl border border-ink/10 bg-card p-6 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.8)]">
        {mode !== "forgot" && (
          <div className="mb-5 flex rounded-full border border-ink/10 bg-ink/[0.03] p-1">
            <button type="button" onClick={() => setMode("login")} className={`flex-1 rounded-full py-2 text-sm font-medium ${mode === "login" ? "bg-yellow text-[#08090A]" : "text-text-secondary"}`}>{t("Log in", "Logga in")}</button>
            <button type="button" onClick={() => setMode("register")} className={`flex-1 rounded-full py-2 text-sm font-medium ${mode === "register" ? "bg-yellow text-[#08090A]" : "text-text-secondary"}`}>{t("Create account", "Skapa konto")}</button>
          </div>
        )}

        {mode === "login" && <LoginForm onLogin={onLogin} onForgot={() => setMode("forgot")} />}
        {mode === "register" && <RegisterForm onRegister={onRegister} />}
        {mode === "forgot" && <ForgotForm onBack={() => setMode("login")} />}
      </div>
    </div>
  );
}

function LoginForm({ onLogin, onForgot }: { onLogin: (email: string, password: string, remember: boolean) => boolean; onForgot: () => void }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return setError(t("Fill in email and password.", "Fyll i e-post och lösenord."));
    const ok = onLogin(email, password, remember);
    if (!ok) setError(t("Incorrect email or password.", "Fel e-post eller lösenord."));
  }

  return (
    <form onSubmit={submit} className="space-y-3.5">
      {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">{error}</div>}
      <label className="block text-xs text-text-muted">{t("Email", "E-post")}
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none" placeholder={t("you@example.com", "du@exempel.se")} />
      </label>
      <label className="block text-xs text-text-muted">{t("Password", "Lösenord")}
        <div className="relative mt-1">
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 pr-10 text-sm text-text-primary focus:outline-none" placeholder="••••••••" />
          <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary" aria-label={t("Show password", "Visa lösenord")}>
            <Icon name={showPassword ? "eyeOff" : "eye"} className="h-4 w-4" />
          </button>
        </div>
      </label>
      <div className="flex items-center justify-between text-xs">
        <label className="flex items-center gap-2 text-text-secondary">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-yellow" />
          {t("Keep me signed in", "Håll mig inloggad")}
        </label>
        <button type="button" onClick={onForgot} className="font-medium text-yellow hover:underline">{t("Forgot password?", "Glömt lösenord?")}</button>
      </div>
      <button type="submit" className="w-full rounded-full bg-yellow py-3 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5">{t("Log in", "Logga in")}</button>
      <button type="button" onClick={() => onLogin("demo@movanta.se", "demo1234", true)} className="w-full rounded-full border border-ink/15 bg-ink/[0.03] py-3 text-sm font-medium text-text-primary hover:border-ink/25">
        {t("Log in as demo", "Logga in som demo")}
      </button>
    </form>
  );
}

function RegisterForm({ onRegister }: { onRegister: (payload: { firstName: string; lastName: string; email: string; phone: string; password: string; licenseYears: number }) => string | null }) {
  const { t } = useLanguage();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", phone: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputClass = "mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none";

  function nextFromAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError(t("Enter a valid email address.", "Ange en giltig e-postadress."));
    if (form.password.length < 6) return setError(t("The password must be at least 6 characters.", "Lösenordet måste vara minst 6 tecken."));
    setError(null);
    setStep(2);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) return setError(t("Fill in first and last name.", "Fyll i för- och efternamn."));
    if (!/^[\d+][\d\s-]{6,}$/.test(form.phone)) return setError(t("Enter a valid phone number.", "Ange ett giltigt telefonnummer."));
    // Licence details are collected in the driving-licence verification flow
    // (where they're actually needed), not at sign-up.
    const err = onRegister({ ...form, licenseYears: 0 });
    if (err) setError(err);
  }

  const steps = [t("Account", "Konto"), t("About you", "Om dig")];

  return (
    <div>
      <div className="mb-5 flex items-center justify-center gap-3">
        {steps.map((label, i) => {
          const n = (i + 1) as 1 | 2;
          return (
            <div key={label} className="flex items-center gap-3">
              {i > 0 && <span className="h-px w-8 bg-ink/15" />}
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                    step === n ? "bg-yellow text-[#08090A]" : step > n ? "bg-yellow/20 text-yellow" : "bg-ink/10 text-text-muted"
                  }`}
                >
                  {step > n ? "✓" : n}
                </span>
                <span className={`text-xs font-medium ${step === n ? "text-text-primary" : "text-text-muted"}`}>{label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {step === 1 ? (
        <form onSubmit={nextFromAccount} className="space-y-3.5">
          {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">{error}</div>}
          <label className="block text-xs text-text-muted">{t("Email", "E-post")}
            <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} placeholder={t("you@example.com", "du@exempel.se")} />
          </label>
          <label className="block text-xs text-text-muted">{t("Password", "Lösenord")}
            <div className="relative mt-1">
              <input type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 pr-10 text-sm text-text-primary focus:outline-none" placeholder={t("At least 6 characters", "Minst 6 tecken")} />
              <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary" aria-label={t("Show password", "Visa lösenord")}>
                <Icon name={showPassword ? "eyeOff" : "eye"} className="h-4 w-4" />
              </button>
            </div>
          </label>
          <button type="submit" className="w-full rounded-full bg-yellow py-3 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5">{t("Continue", "Fortsätt")}</button>
          <p className="text-center text-[11px] leading-relaxed text-text-muted">
            {t("Driving licence and payment details are only needed later, when you book or list a vehicle.", "Körkort och betalningsuppgifter behövs först senare, när du bokar eller lägger upp ett fordon.")}
          </p>
        </form>
      ) : (
        <form onSubmit={submit} className="space-y-3.5">
          {error && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">{error}</div>}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-text-muted">{t("First name", "Förnamn")}
              <input autoComplete="given-name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputClass} />
            </label>
            <label className="text-xs text-text-muted">{t("Last name", "Efternamn")}
              <input autoComplete="family-name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputClass} />
            </label>
          </div>
          <label className="block text-xs text-text-muted">{t("Phone number", "Telefonnummer")}
            <input type="tel" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} placeholder="070-123 45 67" />
            <span className="mt-1 block text-[11px] text-text-muted">{t("Used so owner and renter can reach each other around a booking.", "Används så att ägare och hyresgäst kan nå varandra kring en bokning.")}</span>
          </label>
          <button type="submit" className="w-full rounded-full bg-yellow py-3 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5">{t("Create account", "Skapa konto")}</button>
          <button type="button" onClick={() => { setError(null); setStep(1); }} className="w-full text-center text-xs font-medium text-text-secondary hover:text-text-primary">
            {t("Back to account details", "Tillbaka till kontouppgifter")}
          </button>
        </form>
      )}
    </div>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return sent ? (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow/15 text-yellow"><Icon name="check" className="h-6 w-6" /></div>
      <p className="mt-3 text-sm text-text-secondary">{t("If the account exists, we've sent recovery instructions to your email.", "Om kontot finns har vi skickat instruktioner för återställning till din e-post.")}</p>
      <button type="button" onClick={onBack} className="mt-4 text-sm font-medium text-yellow hover:underline">{t("Back to login", "Tillbaka till inloggning")}</button>
    </div>
  ) : (
    <form onSubmit={(e) => { e.preventDefault(); if (email) setSent(true); }} className="space-y-3.5">
      <p className="text-sm text-text-secondary">{t("Enter your email address and we'll send instructions to reset your password. (Prototype — no email is actually sent.)", "Ange din e-postadress så skickar vi instruktioner för att återställa lösenordet. (Prototyp — inget e-postmeddelande skickas.)")}</p>
      <label className="block text-xs text-text-muted">{t("Email", "E-post")}
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none" placeholder={t("you@example.com", "du@exempel.se")} />
      </label>
      <button type="submit" className="w-full rounded-full bg-yellow py-3 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5">{t("Send instructions", "Skicka instruktioner")}</button>
      <button type="button" onClick={onBack} className="w-full text-center text-sm font-medium text-text-secondary hover:text-text-primary">{t("Back to login", "Tillbaka till inloggning")}</button>
    </form>
  );
}

function ProfileView({
  user, bookingsCount, pendingRequestsCount, pendingVerificationsCount, pendingListingReviewsCount, latestVerificationStatus, onEdit, onBookings, onPayments, onSettings, onListings, onLicenseVerify, onAdminDashboard, onLogout,
}: {
  user: User;
  bookingsCount: number;
  pendingRequestsCount: number;
  pendingVerificationsCount: number;
  pendingListingReviewsCount: number;
  latestVerificationStatus?: VerificationRequestStatus;
  onEdit: () => void;
  onBookings: () => void;
  onPayments: () => void;
  onSettings: () => void;
  onListings: () => void;
  onLicenseVerify: () => void;
  onAdminDashboard: () => void;
  onLogout: () => void;
}) {
  const { lang, t } = useLanguage();
  const memberSince = new Date(user.createdAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB", { month: "long", year: "numeric" });
  return (
    <div className="mx-auto max-w-lg pb-10">
      <div className="rounded-2xl border border-ink/10 bg-card p-6 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-yellow text-lg font-bold text-[#08090A]">
          {user.firstName[0]}{user.lastName[0]}
        </span>
        <h1 className="mt-3 text-lg font-semibold text-text-primary">{user.firstName} {user.lastName}</h1>
        <p className="text-sm text-text-muted">{user.email}</p>
        <p className="text-sm text-text-muted">{user.phone}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${user.verified ? "bg-yellow/10 text-yellow" : "bg-ink/10 text-text-muted"}`}>
            <Icon name="shield" className="h-3 w-3" />{user.verified ? t("Verified user", "Verifierad användare") : t("Not verified", "Ej verifierad")}
          </span>
          <span className="rounded-full bg-ink/10 px-2.5 py-1 text-xs font-medium text-text-secondary">{t("Licence", "Körkort")}: {licenseLabel(user.licenseStatus, lang)}</span>
        </div>
        <p className="mt-3 text-xs text-text-muted">{t("Member since", "Medlem sedan")} {memberSince}</p>
        <button type="button" onClick={onEdit} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 bg-ink/[0.03] py-2.5 text-sm font-medium text-text-primary hover:border-ink/25">
          <Icon name="edit" className="h-4 w-4" />{t("Edit profile", "Redigera profil")}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {[
          {
            icon: "car" as IconName,
            label: t("List your vehicle", "Lista ditt fordon"),
            sub: pendingRequestsCount > 0
              ? t(`${pendingRequestsCount} booking request${pendingRequestsCount === 1 ? "" : "s"} awaiting you`, `${pendingRequestsCount} bokningsförfrågan${pendingRequestsCount === 1 ? "" : "r"} väntar`)
              : t("Create and manage your listings", "Skapa och hantera dina annonser"),
            onClick: onListings,
            badge: pendingRequestsCount,
          },
          { icon: "ticket" as IconName, label: t("My bookings", "Mina bokningar"), sub: `${bookingsCount} ${t("total", "totalt")}`, onClick: onBookings, badge: 0 },
          {
            icon: "shield" as IconName,
            label: t("Driving licence verification", "Körkortsverifiering"),
            sub: user.licenseStatus === "Verifierat"
              ? licenseLabel(user.licenseStatus, lang)
              : latestVerificationStatus === "rejected"
              ? t("Rejected — resubmission required", "Nekad — måste skickas in igen")
              : latestVerificationStatus === "pending"
              ? t("Pending review", "Väntar på granskning")
              : `${licenseLabel(user.licenseStatus, lang)} — ${t("required before booking or listing", "krävs innan bokning eller listning")}`,
            onClick: onLicenseVerify,
            badge: user.licenseStatus === "Verifierat" ? 0 : 1,
          },
          { icon: "card" as IconName, label: t("Payment methods", "Betalningsmetoder"), sub: t("Prototype only", "Endast prototyp"), onClick: onPayments, badge: 0 },
          { icon: "settings" as IconName, label: t("Settings", "Inställningar"), sub: t("Notifications and language", "Notiser och språk"), onClick: onSettings, badge: 0 },
          ...(user.role === "admin"
            ? [{
                icon: "shield" as IconName,
                label: t("Admin dashboard", "Adminpanel"),
                sub: pendingVerificationsCount + pendingListingReviewsCount > 0
                  ? t(`${pendingVerificationsCount + pendingListingReviewsCount} pending`, `${pendingVerificationsCount + pendingListingReviewsCount} väntar`)
                  : t("Nothing pending", "Inget väntar"),
                onClick: onAdminDashboard,
                badge: pendingVerificationsCount + pendingListingReviewsCount,
              }]
            : []),
        ].map((item) => (
          <button key={item.label} type="button" onClick={item.onClick} className="flex w-full items-center justify-between rounded-2xl border border-ink/10 bg-card px-4 py-3.5 text-left hover:border-ink/20">
            <span className="flex items-center gap-3">
              <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-ink/[0.06] text-yellow">
                <Icon name={item.icon} className="h-4 w-4" />
                {item.badge > 0 && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-orange-400" />}
              </span>
              <span>
                <span className="block text-sm font-medium text-text-primary">{item.label}</span>
                <span className={`block text-xs ${item.badge > 0 ? "text-orange-300" : "text-text-muted"}`}>{item.sub}</span>
              </span>
            </span>
            <Icon name="chevronRight" className="h-4 w-4 text-text-muted" />
          </button>
        ))}
        <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 rounded-2xl border border-ink/10 bg-card px-4 py-3.5 text-left text-red-300 hover:border-red-500/30">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10"><Icon name="logout" className="h-4 w-4" /></span>
          <span className="text-sm font-medium">{t("Log out", "Logga ut")}</span>
        </button>
      </div>
    </div>
  );
}

function ProfileEditView({ user, onSave, onCancel }: { user: User; onSave: (patch: Partial<User>) => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone, licenseYears: String(user.licenseYears ?? 0) });
  const [hasCompany, setHasCompany] = useState(!!user.company);
  const [company, setCompany] = useState<Company>(user.company ?? { name: "", orgNumber: "", description: "", verified: false });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      licenseYears: Math.max(0, Number(form.licenseYears) || 0),
      company: hasCompany ? company : undefined,
    });
  }

  return (
    <div className="mx-auto max-w-lg pb-10">
      <h1 className="mb-4 text-xl font-semibold text-text-primary">{t("Edit profile", "Redigera profil")}</h1>
      <form onSubmit={submit} className="space-y-3.5 rounded-2xl border border-ink/10 bg-card p-6">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-text-muted">{t("First name", "Förnamn")}
            <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none" />
          </label>
          <label className="text-xs text-text-muted">{t("Last name", "Efternamn")}
            <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none" />
          </label>
        </div>
        <label className="block text-xs text-text-muted">{t("Phone number", "Telefonnummer")}
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none" />
        </label>
        <label className="block text-xs text-text-muted">{t("Email", "E-post")}
          <input value={user.email} disabled className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.02] px-3.5 py-2.5 text-sm text-text-muted" />
        </label>
        <label className="block text-xs text-text-muted">{t("Years with driving licence", "Antal år med körkort")}
          <input type="number" min={0} value={form.licenseYears} onChange={(e) => setForm({ ...form, licenseYears: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none" />
        </label>

        <div className="border-t border-ink/10 pt-3.5">
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input type="checkbox" checked={hasCompany} onChange={(e) => setHasCompany(e.target.checked)} className="h-4 w-4 accent-yellow" />
            {t("I have a company profile for listing vehicles", "Jag har en företagsprofil för att lista fordon")}
          </label>
          {hasCompany && (
            <div className="mt-3 space-y-3">
              <label className="block text-xs text-text-muted">{t("Company name", "Företagsnamn")}
                <input value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none" />
              </label>
              <label className="block text-xs text-text-muted">{t("Organisation number", "Organisationsnummer")}
                <input value={company.orgNumber} onChange={(e) => setCompany({ ...company, orgNumber: e.target.value })} placeholder="559xxx-xxxx" className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none" />
              </label>
              <label className="block text-xs text-text-muted">{t("Public company description", "Publik företagsbeskrivning")}
                <textarea rows={2} value={company.description} onChange={(e) => setCompany({ ...company, description: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none" />
              </label>
              <p className="text-[11px] text-text-muted">
                {t(
                  "Company verification isn't automated in this prototype — verified status stays off until an administrator sets it.",
                  "Företagsverifiering är inte automatiserad i denna prototyp — verifierad status förblir av tills en administratör aktiverar den."
                )}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 rounded-full border border-ink/15 bg-ink/[0.03] py-3 text-sm font-medium text-text-primary hover:border-ink/25">{t("Cancel", "Avbryt")}</button>
          <button type="submit" className="flex-1 rounded-full bg-yellow py-3 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5">{t("Save", "Spara")}</button>
        </div>
      </form>
    </div>
  );
}

function LicensePhotoSlot({
  label, photo, processing, onPick, onRemove,
}: {
  label: string;
  photo: string | null;
  processing: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-text-secondary">{label}</p>
      {photo ? (
        <div className="relative h-32 w-full overflow-hidden rounded-lg border border-ink/10">
          {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL photo */}
          <img src={photo} alt="" className="h-full w-full object-cover" />
          <button type="button" onClick={onRemove} className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white">
            <Icon name="close" className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink/20 text-xs text-text-muted hover:border-ink/40">
          <Icon name="camera" className="h-5 w-5" />
          {processing ? t("Processing…", "Bearbetar…") : t("Add photo", "Lägg till foto")}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) onPick(file); e.target.value = ""; }}
            disabled={processing}
          />
        </label>
      )}
    </div>
  );
}

function LicenseVerificationView({
  user, requests, onSubmit, onBack,
}: {
  user: User;
  requests: VerificationRequest[];
  onSubmit: (photos: [string, string], licenseYears: number) => void;
  onBack: () => void;
}) {
  const { lang, t } = useLanguage();
  const [frontPhoto, setFrontPhoto] = useState<string | null>(null);
  const [backPhoto, setBackPhoto] = useState<string | null>(null);
  const [licenseYears, setLicenseYears] = useState(user.licenseYears ? String(user.licenseYears) : "");
  const [processingFront, setProcessingFront] = useState(false);
  const [processingBack, setProcessingBack] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const latest = requests[0];
  // Locked once a submission is pending or approved — resubmission is only
  // offered after a rejection (or before any submission has ever been made).
  const locked = !!latest && latest.status !== "rejected";

  function errorReason(e: unknown, t: (en: string, sv: string) => string) {
    return e instanceof Error && e.message === "not-an-image"
      ? t("not an image file", "inte en bildfil")
      : e instanceof Error && e.message === "too-large"
      ? t("file too large (max 10MB)", "filen är för stor (max 10MB)")
      : t("couldn't process this file", "kunde inte bearbeta filen");
  }

  async function handleFront(file: File) {
    setErrors([]);
    setProcessingFront(true);
    try {
      setFrontPhoto(await compressImage(file));
    } catch (e) {
      setErrors([`${file.name}: ${errorReason(e, t)}`]);
    } finally {
      setProcessingFront(false);
    }
  }

  async function handleBack(file: File) {
    setErrors([]);
    setProcessingBack(true);
    try {
      setBackPhoto(await compressImage(file));
    } catch (e) {
      setErrors([`${file.name}: ${errorReason(e, t)}`]);
    } finally {
      setProcessingBack(false);
    }
  }

  function submit() {
    if (!frontPhoto || !backPhoto) {
      setErrors([t("Add both a front and back photo of your driving licence.", "Lägg till foto på både fram- och baksidan av körkortet.")]);
      return;
    }
    const years = Number(licenseYears);
    if (licenseYears.trim() === "" || !Number.isFinite(years) || years < 0) {
      setErrors([t("Enter how many years you have held your licence.", "Ange hur många år du har haft körkort.")]);
      return;
    }
    onSubmit([frontPhoto, backPhoto], Math.floor(years));
    setFrontPhoto(null);
    setBackPhoto(null);
  }

  const licenseStatusTone =
    user.licenseStatus === "Verifierat" ? "bg-yellow/10 text-yellow" : user.licenseStatus === "Väntar" ? "bg-orange-500/10 text-orange-300" : "bg-ink/10 text-text-muted";

  return (
    <div className="mx-auto max-w-lg pb-10">
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <Icon name="chevronLeft" className="h-4 w-4" /> {t("Back", "Tillbaka")}
      </button>
      <h1 className="mb-1 text-xl font-semibold text-text-primary">{t("Driving licence verification", "Körkortsverifiering")}</h1>
      <p className="mb-4 text-sm text-text-secondary">
        {t(
          "You need a verified driving licence before you can book or list a vehicle. Upload a clear photo of the front and back — an administrator will review it.",
          "Du behöver ett verifierat körkort innan du kan boka eller lista ett fordon. Ladda upp ett tydligt foto på både fram- och baksidan — en administratör granskar det."
        )}
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${licenseStatusTone}`}>{licenseLabel(user.licenseStatus, lang)}</span>
      </div>

      {latest?.status === "rejected" && (
        <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {t(
            "Your previous submission was rejected. Please upload new photos of your driving licence to try again.",
            "Din tidigare inskickning nekades. Ladda upp nya foton av ditt körkort för att försöka igen."
          )}
        </div>
      )}

      {latest?.status === "pending" && (
        <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5 text-sm text-orange-200">
          {t(
            "Your submission is awaiting review. You'll see the result here once an administrator has checked it.",
            "Din inskickning väntar på granskning. Du ser resultatet här när en administratör har kontrollerat den."
          )}
        </div>
      )}

      {latest?.status === "approved" && (
        <div className="rounded-2xl border border-yellow/30 bg-yellow/10 p-5 text-sm text-yellow">
          {t("Your driving licence is verified. You're all set to book.", "Ditt körkort är verifierat. Du kan boka fordon.")}
        </div>
      )}

      {!locked && (
        <div className="rounded-2xl border border-ink/10 bg-card p-5">
          {errors.length > 0 && (
            <div className="mb-3 space-y-1 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              {errors.map((e, i) => <p key={i}>{e}</p>)}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <LicensePhotoSlot
              label={t("Front", "Framsida")}
              photo={frontPhoto}
              processing={processingFront}
              onPick={handleFront}
              onRemove={() => setFrontPhoto(null)}
            />
            <LicensePhotoSlot
              label={t("Back", "Baksida")}
              photo={backPhoto}
              processing={processingBack}
              onPick={handleBack}
              onRemove={() => setBackPhoto(null)}
            />
          </div>
          <p className="mt-3 text-xs text-text-muted">{t("JPG or PNG, max 10MB each", "JPG eller PNG, max 10MB per bild")}</p>
          <label className="mt-4 block text-xs text-text-muted">{t("Years with driving licence", "Antal år med körkort")}
            <input
              type="number"
              min={0}
              value={licenseYears}
              onChange={(e) => setLicenseYears(e.target.value)}
              className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
              placeholder={t("e.g. 5", "t.ex. 5")}
            />
            <span className="mt-1 block text-[11px] text-text-muted">{t("Some vehicles require a minimum number of licence years.", "Vissa fordon kräver ett minsta antal år med körkort.")}</span>
          </label>
          <button
            type="button"
            onClick={submit}
            disabled={processingFront || processingBack || !frontPhoto || !backPhoto}
            className="mt-4 w-full rounded-full bg-yellow py-2.5 text-sm font-semibold text-[#08090A] disabled:opacity-40"
          >
            {t("Submit for review", "Skicka för granskning")}
          </button>
        </div>
      )}

      {requests.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">{t("Submission history", "Tidigare inskick")}</h2>
          <div className="space-y-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-ink/10 bg-card px-4 py-3 text-sm">
                <span className="text-text-secondary">{new Date(r.submittedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB")}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    r.status === "approved" ? "bg-yellow/10 text-yellow" : r.status === "rejected" ? "bg-red-500/10 text-red-300" : "bg-orange-500/10 text-orange-300"
                  }`}
                >
                  {r.status === "approved" ? t("Approved", "Godkänt") : r.status === "rejected" ? t("Rejected", "Nekat") : t("Pending review", "Väntar på granskning")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function statusTone(status: Booking["status"]) {
  switch (status) {
    case "Väntar": return "bg-orange-500/10 text-orange-300";
    case "Kommande": return "bg-yellow/10 text-yellow";
    case "Aktiv": return "bg-emerald-500/10 text-emerald-300";
    case "Avslutad": return "bg-ink/10 text-text-muted";
    case "Avbokad": return "bg-red-500/10 text-red-300";
  }
}

function BookingsView({
  bookings, vehicles, tab, setTab, onCancel, onExplore, onOpenRoom,
}: {
  bookings: Booking[];
  vehicles: Vehicle[];
  tab: "Kommande" | "Aktiv" | "Tidigare";
  setTab: (t: "Kommande" | "Aktiv" | "Tidigare") => void;
  onCancel: (id: string) => void;
  onExplore: () => void;
  onOpenRoom: (id: string) => void;
}) {
  const { lang, t } = useLanguage();
  const [detail, setDetail] = useState<Booking | null>(null);
  const shown = bookings.filter((b) => {
    if (tab === "Kommande") return b.status === "Kommande" || b.status === "Väntar";
    if (tab === "Aktiv") return b.status === "Aktiv";
    return b.status === "Avslutad" || b.status === "Avbokad";
  });

  const tabLabel = (value: "Kommande" | "Aktiv" | "Tidigare") =>
    value === "Kommande" ? t("Upcoming", "Kommande") : value === "Aktiv" ? t("Active", "Aktiv") : t("Past", "Tidigare");

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <h1 className="mb-4 text-xl font-semibold text-text-primary">{t("My bookings", "Mina bokningar")}</h1>
      <div className="mb-5 flex rounded-full border border-ink/10 bg-ink/[0.03] p-1">
        {(["Kommande", "Aktiv", "Tidigare"] as const).map((tb) => (
          <button key={tb} type="button" onClick={() => setTab(tb)} className={`flex-1 rounded-full py-2 text-sm font-medium ${tab === tb ? "bg-yellow text-[#08090A]" : "text-text-secondary"}`}>{tabLabel(tb)}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-card p-10 text-center">
          <p className="text-sm text-text-secondary">{t("No bookings here yet.", "Inga bokningar här än.")}</p>
          <button type="button" onClick={onExplore} className="mt-3 text-sm font-medium text-yellow hover:underline">{t("Explore vehicles", "Utforska fordon")}</button>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((b) => {
            const v = vehicles.find((x) => x.id === b.vehicleId);
            if (!v) return null;
            const lv = localizeVehicle(v, lang);
            return (
              <div key={b.id} className="rounded-2xl border border-ink/10 bg-card p-4">
                <div className="flex items-center gap-3">
                  <VehicleThumb vehicle={lv} className="h-14 w-14 shrink-0" compact />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-text-primary">{lv.brand} {lv.model}</p>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusTone(b.status)}`}>{statusLabel(b.status, lang)}</span>
                    </div>
                    <p className="text-xs text-text-muted">{b.startDate} – {b.endDate} · {b.bookingNumber}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                  <span className="text-sm font-semibold text-text-primary">{formatSEK(b.totalPrice)}</span>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button type="button" onClick={() => setDetail(b)} className="rounded-full border border-ink/15 bg-ink/[0.03] px-3.5 py-1.5 text-xs font-medium text-text-primary hover:border-ink/25">{t("View details", "Visa detaljer")}</button>
                    {b.ownerId && (b.status === "Kommande" || b.status === "Aktiv") && (
                      <button type="button" onClick={() => onOpenRoom(b.id)} className="flex items-center gap-1.5 rounded-full border border-yellow/30 bg-yellow/10 px-3.5 py-1.5 text-xs font-medium text-yellow hover:border-yellow/50">
                        <Icon name="chat" className="h-3.5 w-3.5" />{t("Contract & chat", "Avtal & chatt")}
                      </button>
                    )}
                    {(b.status === "Kommande" || b.status === "Väntar") && (
                      <button type="button" onClick={() => onCancel(b.id)} className="rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-medium text-red-300 hover:border-red-500/50">
                        {b.status === "Väntar" ? t("Withdraw request", "Återkalla förfrågan") : t("Cancel", "Avboka")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4" onClick={() => setDetail(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-t-2xl border border-ink/10 bg-card p-6 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">{t("Booking details", "Bokningsdetaljer")}</h2>
              <button type="button" onClick={() => setDetail(null)} className="text-text-muted hover:text-text-primary"><Icon name="close" className="h-5 w-5" /></button>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-text-secondary"><span>{t("Booking number", "Bokningsnummer")}</span><span className="text-text-primary">{detail.bookingNumber}</span></div>
              <div className="flex justify-between text-text-secondary"><span>{t("Status", "Status")}</span><span className="text-text-primary">{statusLabel(detail.status, lang)}</span></div>
              <div className="flex justify-between text-text-secondary"><span>{t("Dates", "Datum")}</span><span className="text-text-primary">{detail.startDate} – {detail.endDate}</span></div>
              <div className="flex justify-between text-text-secondary"><span>{t("Times", "Tider")}</span><span className="text-text-primary">{detail.pickupTime} – {detail.returnTime}</span></div>
              <div className="flex justify-between border-t border-ink/10 pt-2 text-text-secondary"><span>{t("Rental price", "Hyrespris")}</span><span className="text-text-primary">{formatSEK(detail.rentalPrice)}</span></div>
              <div className="flex justify-between text-text-secondary"><span>{t("Service fee", "Serviceavgift")}</span><span className="text-text-primary">{formatSEK(detail.serviceFee)}</span></div>
              <div className="flex justify-between text-text-secondary"><span>{t("Protection fee", "Skyddsavgift")}</span><span className="text-text-primary">{formatSEK(detail.protectionFee)}</span></div>
              <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-semibold text-text-primary"><span>{t("Total", "Totalt")}</span><span>{formatSEK(detail.totalPrice)}</span></div>
            </div>
            {detail.contractPdf && (
              <a
                href={detail.contractPdf}
                download={`${detail.bookingNumber}.pdf`}
                className="mt-4 flex items-center justify-center gap-1.5 rounded-full border border-yellow/30 bg-yellow/10 px-4 py-2.5 text-xs font-medium text-yellow hover:border-yellow/50"
              >
                <Icon name="pdf" className="h-3.5 w-3.5" />
                {t("Download contract", "Ladda ner avtal")}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentsView({ onBack }: { onBack: () => void }) {
  const { t } = useLanguage();
  const [cards, setCards] = useState([
    { id: "c1", label: "Visa •••• 4242", exp: "08/27" },
    { id: "c2", label: "Mastercard •••• 1881", exp: "03/26" },
  ]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", number: "" });

  function addCard(e: React.FormEvent) {
    e.preventDefault();
    const digits = form.number.replace(/\D/g, "");
    if (digits.length < 4) return;
    setCards((c) => [...c, { id: uid("c"), label: `${t("Card", "Kort")} •••• ${digits.slice(-4)}`, exp: "—" }]);
    setForm({ name: "", number: "" });
    setAdding(false);
  }

  return (
    <div className="mx-auto max-w-lg pb-10">
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"><Icon name="chevronLeft" className="h-4 w-4" />{t("Back", "Tillbaka")}</button>
      <h1 className="mb-4 text-xl font-semibold text-text-primary">{t("Payment methods", "Betalningsmetoder")}</h1>
      <p className="mb-4 text-xs text-text-muted">{t("Prototype only — no real card details are stored.", "Endast prototyp — inga riktiga kortuppgifter lagras.")}</p>
      <div className="space-y-2">
        {cards.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-2xl border border-ink/10 bg-card px-4 py-3.5">
            <span className="flex items-center gap-3 text-sm text-text-primary"><Icon name="card" className="h-5 w-5 text-yellow" />{c.label} <span className="text-xs text-text-muted">exp {c.exp}</span></span>
            <button type="button" onClick={() => setCards((cs) => cs.filter((x) => x.id !== c.id))} className="text-text-muted hover:text-red-300"><Icon name="trash" className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      {adding ? (
        <form onSubmit={addCard} className="mt-4 space-y-3 rounded-2xl border border-ink/10 bg-card p-5">
          <label className="block text-xs text-text-muted">{t("Name on card", "Namn på kortet")}
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none" />
          </label>
          <label className="block text-xs text-text-muted">{t("Card number", "Kortnummer")}
            <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="1234 5678 9012 3456" className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none" />
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setAdding(false)} className="flex-1 rounded-full border border-ink/15 bg-ink/[0.03] py-2.5 text-sm font-medium text-text-primary">{t("Cancel", "Avbryt")}</button>
            <button type="submit" className="flex-1 rounded-full bg-yellow py-2.5 text-sm font-semibold text-[#08090A]">{t("Add", "Lägg till")}</button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="mt-4 w-full rounded-full border border-ink/15 bg-ink/[0.03] py-3 text-sm font-medium text-text-primary hover:border-ink/25">+ {t("Add payment method", "Lägg till betalningsmetod")}</button>
      )}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-yellow" : "bg-ink/15"}`}
      aria-pressed={checked}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[#08090A] transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

function SettingsView({ onBack }: { onBack: () => void }) {
  const { lang, setLang, t } = useLanguage();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [marketing, setMarketing] = useState(false);

  return (
    <div className="mx-auto max-w-lg pb-10">
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"><Icon name="chevronLeft" className="h-4 w-4" />{t("Back", "Tillbaka")}</button>
      <h1 className="mb-4 text-xl font-semibold text-text-primary">{t("Settings", "Inställningar")}</h1>
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-card px-4 py-3.5">
          <div><p className="text-sm text-text-primary">{t("Email notifications", "E-postnotiser")}</p><p className="text-xs text-text-muted">{t("Booking confirmations and updates", "Bokningsbekräftelser och uppdateringar")}</p></div>
          <Switch checked={emailNotif} onChange={setEmailNotif} />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-card px-4 py-3.5">
          <div><p className="text-sm text-text-primary">{t("Push notifications", "Push-notiser")}</p><p className="text-xs text-text-muted">{t("Reminders about pickup and return", "Påminnelser om upphämtning och återlämning")}</p></div>
          <Switch checked={pushNotif} onChange={setPushNotif} />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-card px-4 py-3.5">
          <div><p className="text-sm text-text-primary">{t("News and offers", "Nyheter och erbjudanden")}</p><p className="text-xs text-text-muted">{t("Marketing from Movanta", "Marknadsföring från Movanta")}</p></div>
          <Switch checked={marketing} onChange={setMarketing} />
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-ink/10 bg-card px-4 py-3.5">
          <div><p className="text-sm text-text-primary">{t("Language", "Språk")}</p><p className="text-xs text-text-muted">{t("Choose which language the app is shown in", "Välj vilket språk appen visas på")}</p></div>
          <div className="flex items-center rounded-full border border-ink/10 bg-ink/[0.03] p-0.5 text-xs font-semibold">
            {(["en", "sv"] as Lang[]).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={`rounded-full px-3 py-1.5 transition-colors ${lang === l ? "bg-yellow text-[#08090A]" : "text-text-secondary hover:text-text-primary"}`}
              >
                {l === "en" ? "English" : "Svenska"}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

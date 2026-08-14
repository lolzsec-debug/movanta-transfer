"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { Icon, vehicleIcon } from "./icons";
import { vehicles, localTodayISO, type VehicleType, type Transmission, type Fuel } from "./data";
import { typeLabel, transmissionLabel, fuelLabel } from "./i18nVehicle";
import { Listing, DateRange, compressImage, MAX_PHOTOS, getListings, listingToVehicle } from "./listings";
import { geocodeAddress, VAXJO_CENTER, type AddressSuggestion } from "./geo";
import { AddressAutocomplete } from "./AddressAutocomplete";
import { RangeInput } from "@/components/ui/RangeInput";
import {
  DEFAULT_ENERGY_PRICES,
  DEFAULT_INSURANCE_CONFIG,
  DEFAULT_PLATFORM_FEE_PERCENT,
  calculateProfitBreakdown,
  sevenDayEarningsBeforeFees,
  formatSEKRounded,
  formatSEKPrecise,
  type EnergyInputs,
} from "./pricing";
import { getMarketComparison, tierLabel, priceStanding } from "./market";

const RealMap = dynamic(() => import("./RealMap"), { ssr: false });

const STEP_COUNT = 7;

type PhotoField = "exteriorPhotos" | "interiorPhotos" | "conditionPhotos" | "damagePhotos" | "includedItemsPhotos" | "documentPhotos";
type PhotoFieldState = { processing: boolean; errors: string[] };
const PHOTO_FIELDS: PhotoField[] = ["exteriorPhotos", "interiorPhotos", "conditionPhotos", "damagePhotos", "includedItemsPhotos", "documentPhotos"];

const TYPE_OPTIONS: VehicleType[] = ["Bil", "Transportbil", "Motorcykel", "Moped", "Släpvagn", "Husbil", "Båt", "Annat"];
const FUEL_OPTIONS: Fuel[] = ["Bensin", "Diesel", "El", "Laddhybrid", "Hybrid"];
const TRANSMISSION_OPTIONS: Transmission[] = ["Automat", "Manuell"];

function energyInputsFromDraft(draft: Listing): EnergyInputs {
  return {
    fuel: draft.fuel,
    fuelConsumptionPer100Km: draft.fuelConsumptionPer100Km,
    electricConsumptionPer100Km: draft.electricConsumptionPer100Km,
    electricDrivingShare: draft.electricDrivingShare,
    combinedCostPer100Km: draft.combinedEnergyCostPer100Km,
    assumedFuelPrice: draft.assumedFuelPrice,
    assumedElectricityPrice: draft.assumedElectricityPrice,
  };
}

function marketMessage(t: (en: string, sv: string) => string, price: number, comparison: ReturnType<typeof getMarketComparison>): string {
  if (comparison.count === 0) return t("Not enough comparable listings yet.", "Inte tillräckligt med jämförbara annonser ännu.");
  const standing = priceStanding(price, comparison);
  if (standing === "within") return t("Your price is competitive for similar vehicles.", "Ditt pris är konkurrenskraftigt för liknande fordon.");
  const diffPct = Math.round((Math.abs(price - comparison.median) / comparison.median) * 100);
  if (standing === "above") {
    return t(`Your price is approximately ${diffPct}% above comparable listings.`, `Ditt pris är cirka ${diffPct}% högre än jämförbara annonser.`);
  }
  return t(`Your price is approximately ${diffPct}% below comparable listings.`, `Ditt pris är cirka ${diffPct}% lägre än jämförbara annonser.`);
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs text-text-muted">
      {label}
      {children}
      {hint && <span className="mt-1 block text-[11px] text-text-muted">{hint}</span>}
    </label>
  );
}

function PhotoUploadGrid({
  label, description, photos, processing, errors, maxPhotos, showCover = false, onFilesSelected, onMove, onRemove,
}: {
  label: string;
  description?: string;
  photos: string[];
  processing: boolean;
  errors: string[];
  maxPhotos: number;
  showCover?: boolean;
  onFilesSelected: (files: FileList | null) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  onRemove: (index: number) => void;
}) {
  const { t } = useLanguage();
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-text-primary">{label}</p>
        {description && <p className="text-xs text-text-muted">{description}</p>}
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); onFilesSelected(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed p-5 text-center transition-colors ${
          dragOver ? "border-yellow bg-yellow/5" : "border-ink/15 hover:border-ink/30"
        }`}
      >
        <Icon name="camera" className="h-6 w-6 text-text-muted" />
        <p className="text-xs text-text-secondary">{t("Drag photos here, or click to choose files", "Dra foton hit, eller klicka för att välja filer")}</p>
        <p className="text-[11px] text-text-muted">{t(`Up to ${maxPhotos} photos, max 10MB each`, `Upp till ${maxPhotos} foton, max 10MB per bild`)}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { onFilesSelected(e.target.files); e.target.value = ""; }}
        />
      </div>

      {processing && (
        <p className="flex items-center gap-1.5 text-xs text-text-secondary">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-yellow" />
          {t("Compressing and processing photos…", "Komprimerar och bearbetar foton…")}
        </p>
      )}
      {errors.length > 0 && (
        <ul className="space-y-1 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <div key={i} className="relative overflow-hidden rounded-xl border border-ink/10">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL photos */}
              <img src={p} alt="" className="h-28 w-full object-cover" />
              {showCover && i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-yellow px-2 py-0.5 text-[10px] font-semibold text-[#08090A]">{t("Cover", "Omslag")}</span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-1.5 py-1">
                <div className="flex gap-1">
                  <button type="button" disabled={i === 0} onClick={() => onMove(i, -1)} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white disabled:opacity-30">←</button>
                  <button type="button" disabled={i === photos.length - 1} onClick={() => onMove(i, 1)} className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white disabled:opacity-30">→</button>
                </div>
                <button type="button" onClick={() => onRemove(i)} aria-label={t("Delete photo", "Ta bort foto")} className="rounded bg-red-500/80 px-1.5 py-0.5 text-[10px] text-white">
                  <Icon name="trash" className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none";
const priceInputClass = `${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`;

export function ListingWizard({
  listing, onSave, onCancel,
}: {
  listing: Listing;
  onSave: (listing: Listing, publish: boolean) => void;
  onCancel: () => void;
}) {
  const { lang, t } = useLanguage();
  const [step, setStep] = useState(1);
  const activeStepRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    activeStepRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [step]);
  const [draft, setDraft] = useState<Listing>(listing);
  const [error, setError] = useState<string | null>(null);
  const [featureInput, setFeatureInput] = useState("");
  const [photoState, setPhotoState] = useState<Record<PhotoField, PhotoFieldState>>(() => {
    const initial = {} as Record<PhotoField, PhotoFieldState>;
    for (const f of PHOTO_FIELDS) initial[f] = { processing: false, errors: [] };
    return initial;
  });
  const [geoStatus, setGeoStatus] = useState<"idle" | "loading" | "done" | "failed">(listing.coord ? "done" : "idle");
  const [publishing, setPublishing] = useState(false);
  const [showAdvancedPricing, setShowAdvancedPricing] = useState(false);
  const [insuranceAck, setInsuranceAck] = useState(listing.insuranceOption === "Inget");
  const [reviewExpanded, setReviewExpanded] = useState(false);

  function patch(p: Partial<Listing>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  // Real comparables only: the curated fleet plus other owners' published,
  // non-paused listings. Never the listing being edited itself.
  const comparablePool = useMemo(() => {
    const publishedListings = getListings()
      .filter((l) => l.status === "Publicerad" && l.id !== draft.id)
      .map((l) => listingToVehicle(l, lang));
    return [...vehicles, ...publishedListings];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.id, lang, step]);

  const marketComparison = useMemo(
    () => getMarketComparison({ id: draft.id, type: draft.type, brand: draft.brand, model: draft.model, year: draft.year, location: draft.location || draft.pickupLocation }, comparablePool),
    [draft.id, draft.type, draft.brand, draft.model, draft.year, draft.location, draft.pickupLocation, comparablePool]
  );

  const profit = useMemo(
    () =>
      calculateProfitBreakdown({
        pricePerDay: draft.pricePerDay,
        pricePerWeek: draft.pricePerWeek,
        bookedDays: draft.expectedBookedDays,
        dailyDistanceKm: draft.expectedDailyDistance,
        fuelIncluded: draft.fuelIncluded,
        energy: energyInputsFromDraft(draft),
        insurance: { option: draft.insuranceOption, flatFee: DEFAULT_INSURANCE_CONFIG.flatFee },
        platformFeePercent: DEFAULT_PLATFORM_FEE_PERCENT,
        otherExpenses: draft.otherExpenses,
      }),
    [draft]
  );

  const stepLabels = [
    t("Type", "Fordonstyp"),
    t("Details", "Detaljer"),
    t("Photos", "Foton"),
    t("Documentation", "Dokumentation"),
    t("Price", "Pris"),
    t("Rules", "Regler"),
    t("Review", "Granska"),
  ];

  async function addPhotos(field: PhotoField, files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_PHOTOS - draft[field].length;
    if (remaining <= 0) {
      setPhotoState((s) => ({ ...s, [field]: { processing: false, errors: [t(`You can add up to ${MAX_PHOTOS} photos.`, `Du kan lägga till max ${MAX_PHOTOS} foton.`)] } }));
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    setPhotoState((s) => ({ ...s, [field]: { processing: true, errors: [] } }));
    const newPhotos: string[] = [];
    const errs: string[] = [];
    for (const file of list) {
      try {
        const dataUrl = await compressImage(file);
        newPhotos.push(dataUrl);
      } catch (e) {
        const reason =
          e instanceof Error && e.message === "not-an-image"
            ? t("not an image file", "inte en bildfil")
            : e instanceof Error && e.message === "too-large"
            ? t("file too large (max 10MB)", "filen är för stor (max 10MB)")
            : t("couldn't process this file", "kunde inte bearbeta filen");
        errs.push(`${file.name}: ${reason}`);
      }
    }
    setDraft((d) => ({ ...d, [field]: [...d[field], ...newPhotos] }));
    setPhotoState((s) => ({ ...s, [field]: { processing: false, errors: errs } }));
  }

  function movePhoto(field: PhotoField, index: number, dir: -1 | 1) {
    setDraft((d) => {
      const photos = [...d[field]];
      const target = index + dir;
      if (target < 0 || target >= photos.length) return d;
      [photos[index], photos[target]] = [photos[target], photos[index]];
      return { ...d, [field]: photos };
    });
  }

  function removePhoto(field: PhotoField, index: number) {
    setDraft((d) => ({ ...d, [field]: d[field].filter((_, i) => i !== index) }));
  }

  function addFeature() {
    const val = featureInput.trim();
    if (!val) return;
    patch({ features: [...draft.features, val] });
    setFeatureInput("");
  }

  function removeFeature(f: string) {
    patch({ features: draft.features.filter((x) => x !== f) });
  }

  async function locateOnMap() {
    const query = draft.pickupLocation.trim() || draft.location.trim();
    if (!query) {
      setGeoStatus("failed");
      return;
    }
    setGeoStatus("loading");
    const needsCountry = /sverige|sweden/i.test(query) ? query : `${query}, Sverige`;
    const coord = await geocodeAddress(needsCountry);
    if (coord) {
      patch({ coord });
      setGeoStatus("done");
    } else {
      setGeoStatus("failed");
    }
  }

  function addUnavailableRange() {
    const range: DateRange = { start: draft.availableFrom || localTodayISO(), end: draft.availableFrom || localTodayISO() };
    patch({ unavailableRanges: [...draft.unavailableRanges, range] });
  }

  function updateUnavailableRange(i: number, patchRange: Partial<DateRange>) {
    patch({ unavailableRanges: draft.unavailableRanges.map((r, idx) => (idx === i ? { ...r, ...patchRange } : r)) });
  }

  function removeUnavailableRange(i: number) {
    patch({ unavailableRanges: draft.unavailableRanges.filter((_, idx) => idx !== i) });
  }

  function validateStep(current: number): string | null {
    if (current === 2) {
      if (!draft.brand.trim() || !draft.model.trim()) return t("Fill in brand and model.", "Fyll i märke och modell.");
      if (!draft.year || draft.year < 1970) return t("Enter a valid year.", "Ange ett giltigt årtal.");
      if (!draft.location.trim()) return t("Enter a location.", "Ange en plats.");
    }
    if (current === 3) {
      if (draft.exteriorPhotos.length === 0) return t("Add at least one exterior photo.", "Lägg till minst ett foto på utsidan.");
      if (draft.interiorPhotos.length === 0) return t("Add at least one interior photo.", "Lägg till minst ett foto på insidan.");
    }
    if (current === 4) {
      if (draft.conditionPhotos.length === 0) return t("Add at least one photo of the mileage & vehicle condition.", "Lägg till minst ett foto på mätarställning & fordonets skick.");
      if (draft.documentPhotos.length === 0) return t("Add at least one photo of the vehicle's documents.", "Lägg till minst ett foto på fordonets dokument.");
    }
    if (current === 5) {
      if (!draft.pricePerDay || draft.pricePerDay <= 0) return t("Enter a price per day.", "Ange ett pris per dag.");
      if (!draft.availableFrom) return t("Choose when the vehicle becomes available.", "Välj när fordonet blir tillgängligt.");
      if (!draft.pickupLocation.trim()) return t("Enter a pickup location.", "Ange en upphämtningsplats.");
      if (draft.insuranceOption === "Inget" && !insuranceAck) {
        return t("Confirm that you understand no additional insurance protection is selected.", "Bekräfta att du förstår att inget ytterligare försäkringsskydd är valt.");
      }
    }
    return null;
  }

  function next() {
    const err = validateStep(step);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(STEP_COUNT, s + 1));
  }

  function back() {
    setError(null);
    if (step === 1) onCancel();
    else setStep((s) => s - 1);
  }

  async function handlePublish() {
    for (let s = 2; s <= 6; s++) {
      const err = validateStep(s);
      if (err) {
        setError(err);
        setStep(s);
        return;
      }
    }
    setError(null);

    let toPublish: Listing = {
      ...draft,
      minLicenseYears: Math.max(1, draft.minLicenseYears),
      recommendedDailyPrice: marketComparison.count > 0 ? marketComparison.recommendedDaily : null,
      recommendedHourlyPrice: marketComparison.count > 0 ? marketComparison.recommendedHourly : null,
      recommendedWeeklyPrice: marketComparison.count > 0 ? marketComparison.recommendedWeekly : null,
      comparableListingCount: marketComparison.count,
      pricingRecommendationDate: new Date().toISOString(),
    };
    if (!toPublish.coord) {
      const query = toPublish.pickupLocation.trim() || toPublish.location.trim();
      if (query) {
        setPublishing(true);
        const needsCountry = /sverige|sweden/i.test(query) ? query : `${query}, Sverige`;
        const coord = await geocodeAddress(needsCountry);
        setPublishing(false);
        if (coord) {
          toPublish = { ...toPublish, coord };
          setDraft(toPublish);
          setGeoStatus("done");
        }
      }
    }
    onSave(toPublish, true);
  }

  function handleSaveDraft() {
    setError(null);
    onSave(draft, false);
  }

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <button type="button" onClick={onCancel} className="mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <Icon name="chevronLeft" className="h-4 w-4" />{t("Back to my listings", "Tillbaka till mina annonser")}
      </button>

      <div className="themed-scrollbar mb-6 flex items-center gap-1.5 overflow-x-auto pb-1">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <button
              ref={i + 1 === step ? activeStepRef : null}
              type="button"
              onClick={() => setStep(i + 1)}
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                i + 1 === step ? "bg-yellow text-[#08090A]" : i + 1 < step ? "bg-yellow/20 text-yellow" : "bg-ink/10 text-text-muted"
              }`}
            >
              {i + 1}
            </button>
            <span className={`hidden text-xs sm:inline ${i + 1 === step ? "text-text-primary" : "text-text-muted"}`}>{label}</span>
            {i < stepLabels.length - 1 && <div className="h-px w-4 bg-ink/10 sm:w-6" />}
          </div>
        ))}
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      {step === 1 && (
        <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5">
          <h2 className="text-base font-semibold text-text-primary">{t("What kind of vehicle is it?", "Vilken typ av fordon är det?")}</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {TYPE_OPTIONS.map((ty) => (
              <button
                key={ty}
                type="button"
                onClick={() => patch({ type: ty })}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium transition-colors ${
                  draft.type === ty ? "border-yellow bg-yellow/10 text-yellow" : "border-ink/10 bg-ink/[0.03] text-text-secondary hover:border-ink/25"
                }`}
              >
                <Icon name={vehicleIcon(ty)} className="h-6 w-6" />
                {typeLabel(ty, lang)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5">
          <h2 className="text-base font-semibold text-text-primary">{t("Vehicle details", "Fordonsdetaljer")}</h2>

          <div>
            <p className="text-xs text-text-muted">{t("How are you listing this vehicle?", "Hur listar du detta fordon?")}</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => patch({ identityType: "Privat", companyId: null })}
                className={`rounded-xl border p-3 text-left text-sm font-medium transition-colors ${
                  draft.identityType === "Privat" ? "border-yellow bg-yellow/10 text-yellow" : "border-ink/10 bg-ink/[0.03] text-text-secondary hover:border-ink/25"
                }`}
              >
                {t("As a private individual", "Som privatperson")}
              </button>
              <button
                type="button"
                onClick={() => patch({ identityType: "Företag", companyId: draft.ownerId })}
                className={`rounded-xl border p-3 text-left text-sm font-medium transition-colors ${
                  draft.identityType === "Företag" ? "border-yellow bg-yellow/10 text-yellow" : "border-ink/10 bg-ink/[0.03] text-text-secondary hover:border-ink/25"
                }`}
              >
                {t("On behalf of a company", "Som företag")}
              </button>
            </div>
            {draft.identityType === "Företag" && (
              <p className="mt-2 text-[11px] text-text-muted">
                {t(
                  "Manage your company name, organisation number and description in Profile → Settings. This listing will publish under that company profile.",
                  "Hantera företagsnamn, organisationsnummer och beskrivning under Profil → Inställningar. Denna annons publiceras under den företagsprofilen."
                )}
              </p>
            )}
          </div>

          <Field label={t("Listing title", "Annonsrubrik")}>
            <input value={draft.title} onChange={(e) => patch({ title: e.target.value })} placeholder={t("e.g. Comfortable family SUV", "t.ex. Bekväm familje-SUV")} className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Brand", "Märke")}><input value={draft.brand} onChange={(e) => patch({ brand: e.target.value })} className={inputClass} /></Field>
            <Field label={t("Model", "Modell")}><input value={draft.model} onChange={(e) => patch({ model: e.target.value })} className={inputClass} /></Field>
            <Field label={t("Year", "Årsmodell")}><input type="number" value={draft.year} onChange={(e) => patch({ year: Number(e.target.value) })} className={inputClass} /></Field>
            <Field label={t("Registration number", "Registreringsnummer")}><input value={draft.regNumber} onChange={(e) => patch({ regNumber: e.target.value.toUpperCase() })} placeholder="ABC123" className={inputClass} /></Field>
            <Field label={t("Fuel / power type", "Bränsle / drivmedel")}>
              <select
                value={draft.fuel}
                onChange={(e) => {
                  const nextFuel = e.target.value as Fuel;
                  patch({
                    fuel: nextFuel,
                    assumedFuelPrice: nextFuel === "Diesel" ? DEFAULT_ENERGY_PRICES.dieselPerLitre : DEFAULT_ENERGY_PRICES.petrolPerLitre,
                    assumedElectricityPrice: DEFAULT_ENERGY_PRICES.electricityPerKwh,
                  });
                }}
                className={`${inputClass}`}
              >
                {FUEL_OPTIONS.map((f) => <option key={f} value={f}>{fuelLabel(f, lang)}</option>)}
              </select>
            </Field>
            <Field label={t("Transmission", "Växellåda")}>
              <select value={draft.transmission} onChange={(e) => patch({ transmission: e.target.value as Transmission })} className={`${inputClass}`}>
                {TRANSMISSION_OPTIONS.map((tr) => <option key={tr} value={tr}>{transmissionLabel(tr, lang)}</option>)}
              </select>
            </Field>
            <Field label={t("Number of seats", "Antal säten")}><input type="number" min={1} value={draft.seats} onChange={(e) => patch({ seats: Number(e.target.value) })} className={inputClass} /></Field>
            <Field label={t("Mileage (km)", "Mätarställning (km)")}><input type="number" min={0} value={draft.mileage} onChange={(e) => patch({ mileage: Number(e.target.value) })} className={inputClass} /></Field>
          </div>
          <Field label={t("Location", "Plats")}>
            <input
              value={draft.location}
              onChange={(e) => {
                patch({ location: e.target.value, ...(draft.pickupLocation.trim() ? {} : { coord: null }) });
                if (!draft.pickupLocation.trim()) setGeoStatus("idle");
              }}
              placeholder={t("e.g. Centrum, Växjö", "t.ex. Centrum, Växjö")}
              className={inputClass}
            />
          </Field>
          <Field label={t("Short description", "Kort beskrivning")}><input value={draft.shortDescription} onChange={(e) => patch({ shortDescription: e.target.value })} maxLength={120} className={inputClass} /></Field>
          <Field label={t("Full description", "Fullständig beskrivning")}>
            <textarea rows={4} value={draft.fullDescription} onChange={(e) => patch({ fullDescription: e.target.value })} className={inputClass} />
          </Field>
          <div>
            <p className="text-xs text-text-muted">{t("Features and equipment", "Utrustning och funktioner")}</p>
            <div className="mt-1.5 flex gap-2">
              <input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                placeholder={t("e.g. Tow bar — press Enter", "t.ex. Dragkrok — tryck Enter")}
                className={inputClass}
              />
              <button type="button" onClick={addFeature} className="mt-1 shrink-0 rounded-lg border border-ink/15 bg-ink/[0.03] px-3.5 text-sm text-text-primary hover:border-ink/25">
                <Icon name="plus" className="h-4 w-4" />
              </button>
            </div>
            {draft.features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {draft.features.map((f) => (
                  <span key={f} className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-ink/[0.03] px-3 py-1 text-xs text-text-secondary">
                    {f}
                    <button type="button" onClick={() => removeFeature(f)} aria-label={t("Remove", "Ta bort")}><Icon name="close" className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-6 rounded-2xl border border-ink/10 bg-card p-5">
          <div>
            <h2 className="text-base font-semibold text-text-primary">{t("Photos", "Foton")}</h2>
            <p className="text-xs text-text-muted">{t("Shown to renters browsing the Explore page, before they book. No file storage service is connected in this prototype — photos are compressed and kept on this device only.", "Visas för hyresgäster som bläddrar på Utforska-sidan, innan de bokar. Ingen fillagringstjänst är kopplad i denna prototyp — foton komprimeras och sparas endast på den här enheten.")}</p>
          </div>

          <PhotoUploadGrid
            label={t("Exterior photos", "Foton på utsidan")}
            description={t("The first exterior photo becomes the listing's cover image.", "Det första utsidefotot blir annonsens omslagsbild.")}
            photos={draft.exteriorPhotos}
            processing={photoState.exteriorPhotos.processing}
            errors={photoState.exteriorPhotos.errors}
            maxPhotos={MAX_PHOTOS}
            showCover
            onFilesSelected={(files) => addPhotos("exteriorPhotos", files)}
            onMove={(i, dir) => movePhoto("exteriorPhotos", i, dir)}
            onRemove={(i) => removePhoto("exteriorPhotos", i)}
          />

          <PhotoUploadGrid
            label={t("Interior photos", "Foton på insidan")}
            photos={draft.interiorPhotos}
            processing={photoState.interiorPhotos.processing}
            errors={photoState.interiorPhotos.errors}
            maxPhotos={MAX_PHOTOS}
            onFilesSelected={(files) => addPhotos("interiorPhotos", files)}
            onMove={(i, dir) => movePhoto("interiorPhotos", i, dir)}
            onRemove={(i) => removePhoto("interiorPhotos", i)}
          />
        </div>
      )}

      {step === 4 && (
        <div className="space-y-6 rounded-2xl border border-ink/10 bg-card p-5">
          <div>
            <h2 className="text-base font-semibold text-text-primary">{t("Documentation", "Dokumentation")}</h2>
            <p className="text-xs text-text-muted">
              {t(
                "Private documentation only shown to a renter after they send a booking request — it protects both of you if the vehicle's condition is ever disputed.",
                "Privat dokumentation som endast visas för en hyresgäst efter att de skickat en bokningsförfrågan — det skyddar er båda om fordonets skick någonsin ifrågasätts."
              )}
            </p>
          </div>

          <PhotoUploadGrid
            label={t("Mileage & vehicle condition", "Mätarställning & fordonets skick")}
            photos={draft.conditionPhotos}
            processing={photoState.conditionPhotos.processing}
            errors={photoState.conditionPhotos.errors}
            maxPhotos={MAX_PHOTOS}
            onFilesSelected={(files) => addPhotos("conditionPhotos", files)}
            onMove={(i, dir) => movePhoto("conditionPhotos", i, dir)}
            onRemove={(i) => removePhoto("conditionPhotos", i)}
          />

          <PhotoUploadGrid
            label={t("Existing damage (optional)", "Befintliga skador (valfritt)")}
            description={t("If there's no existing damage, add a photo showing that.", "Om det inte finns några skador, lägg till ett foto som visar det.")}
            photos={draft.damagePhotos}
            processing={photoState.damagePhotos.processing}
            errors={photoState.damagePhotos.errors}
            maxPhotos={MAX_PHOTOS}
            onFilesSelected={(files) => addPhotos("damagePhotos", files)}
            onMove={(i, dir) => movePhoto("damagePhotos", i, dir)}
            onRemove={(i) => removePhoto("damagePhotos", i)}
          />

          <PhotoUploadGrid
            label={t("Included items (optional)", "Inkluderade tillbehör (valfritt)")}
            description={t("E.g. charger, child seat, roof box.", "T.ex. laddkabel, bilbarnstol, takbox.")}
            photos={draft.includedItemsPhotos}
            processing={photoState.includedItemsPhotos.processing}
            errors={photoState.includedItemsPhotos.errors}
            maxPhotos={MAX_PHOTOS}
            onFilesSelected={(files) => addPhotos("includedItemsPhotos", files)}
            onMove={(i, dir) => movePhoto("includedItemsPhotos", i, dir)}
            onRemove={(i) => removePhoto("includedItemsPhotos", i)}
          />

          <PhotoUploadGrid
            label={t("Documents", "Dokument")}
            description={t("E.g. registration certificate, insurance.", "T.ex. registreringsbevis, försäkring.")}
            photos={draft.documentPhotos}
            processing={photoState.documentPhotos.processing}
            errors={photoState.documentPhotos.errors}
            maxPhotos={MAX_PHOTOS}
            onFilesSelected={(files) => addPhotos("documentPhotos", files)}
            onMove={(i, dir) => movePhoto("documentPhotos", i, dir)}
            onRemove={(i) => removePhoto("documentPhotos", i)}
          />
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5">
          <h2 className="text-base font-semibold text-text-primary">{t("Price and availability", "Pris och tillgänglighet")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Price per hour (optional)", "Pris per timme (valfritt)")}><input type="number" min={0} value={draft.pricePerHour ?? ""} onChange={(e) => patch({ pricePerHour: e.target.value ? Number(e.target.value) : null })} className={priceInputClass} /></Field>
            <div>
              <Field label={t("Price per day", "Pris per dag")}><input type="number" min={0} value={draft.pricePerDay} onChange={(e) => patch({ pricePerDay: Number(e.target.value) })} className={priceInputClass} /></Field>
              <p className="mt-1 text-[11px] text-text-muted">
                {marketComparison.count > 0
                  ? `${marketMessage(t, draft.pricePerDay, marketComparison)} (${tierLabel(marketComparison.tier, lang)}, ${marketComparison.count} ${t("listings", "annonser")})`
                  : t("Add brand, model and a vehicle type to see a price recommendation.", "Lägg till märke, modell och fordonstyp för en prisrekommendation.")}
              </p>
            </div>
            <Field label={t("Weekly price (optional)", "Veckopris (valfritt)")}><input type="number" min={0} value={draft.pricePerWeek ?? ""} onChange={(e) => patch({ pricePerWeek: e.target.value ? Number(e.target.value) : null })} className={priceInputClass} /></Field>
            <Field label={t("Security deposit", "Depositionsbelopp")}><input type="number" min={0} value={draft.deposit} onChange={(e) => patch({ deposit: Number(e.target.value) })} className={priceInputClass} /></Field>
            <Field label={t("Minimum rental duration (days)", "Minsta hyresperiod (dagar)")}><input type="number" min={1} value={draft.minDurationDays} onChange={(e) => patch({ minDurationDays: Number(e.target.value) })} className={inputClass} /></Field>
            <Field label={t("Maximum rental duration (days, optional)", "Längsta hyresperiod (dagar, valfritt)")}><input type="number" min={1} value={draft.maxDurationDays ?? ""} onChange={(e) => patch({ maxDurationDays: e.target.value ? Number(e.target.value) : null })} className={inputClass} /></Field>
            <Field label={t("Available from", "Tillgänglig från")}><input type="date" value={draft.availableFrom} onChange={(e) => patch({ availableFrom: e.target.value })} className={`${inputClass}`} /></Field>
            <Field label={t("Available to (optional)", "Tillgänglig till (valfritt)")}><input type="date" value={draft.availableTo} onChange={(e) => patch({ availableTo: e.target.value })} className={`${inputClass}`} /></Field>
          </div>

          {marketComparison.count > 0 && (
            <div className="rounded-xl border border-ink/10 bg-ink/[0.02] p-4">
              <p className="text-xs font-medium text-text-primary">{t("Market-based price recommendation", "Marknadsbaserad prisrekommendation")}</p>
              <p className="mt-1 text-[11px] text-text-muted">
                {t("Based on", "Baserat på")} {marketComparison.count} {t("comparable listings", "jämförbara annonser")} ({tierLabel(marketComparison.tier, lang)})
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div><p className="text-text-muted">{t("Lowest", "Lägsta")}</p><p className="font-semibold text-text-primary">{formatSEKRounded(marketComparison.low)}</p></div>
                <div><p className="text-text-muted">{t("Median", "Median")}</p><p className="font-semibold text-text-primary">{formatSEKRounded(marketComparison.median)}</p></div>
                <div><p className="text-text-muted">{t("Highest", "Högsta")}</p><p className="font-semibold text-text-primary">{formatSEKRounded(marketComparison.high)}</p></div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div><p className="text-text-muted">{t("Rec. hourly", "Rek. timme")}</p><p className="text-yellow">{formatSEKRounded(marketComparison.recommendedHourly)}</p></div>
                <div><p className="text-text-muted">{t("Rec. daily", "Rek. dag")}</p><p className="text-yellow">{formatSEKRounded(marketComparison.recommendedDaily)}</p></div>
                <div><p className="text-text-muted">{t("Rec. weekly", "Rek. vecka")}</p><p className="text-yellow">{formatSEKRounded(marketComparison.recommendedWeekly)}</p></div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-text-muted">{t("Unavailable dates", "Otillgängliga datum")}</p>
              <button type="button" onClick={addUnavailableRange} className="text-xs font-medium text-yellow hover:underline">+ {t("Add range", "Lägg till period")}</button>
            </div>
            <div className="mt-2 space-y-2">
              {draft.unavailableRanges.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="date" value={r.start} onChange={(e) => updateUnavailableRange(i, { start: e.target.value })} className={`${inputClass} mt-0`} />
                  <span className="text-xs text-text-muted">{t("to", "till")}</span>
                  <input type="date" value={r.end} onChange={(e) => updateUnavailableRange(i, { end: e.target.value })} className={`${inputClass} mt-0`} />
                  <button type="button" onClick={() => removeUnavailableRange(i)} aria-label={t("Remove", "Ta bort")} className="shrink-0 text-text-muted hover:text-red-300"><Icon name="close" className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-text-muted">{t("Pickup location", "Upphämtningsplats")}</p>
            <AddressAutocomplete
              value={draft.pickupLocation}
              onChange={(text) => { patch({ pickupLocation: text, coord: null }); setGeoStatus("idle"); }}
              onSelect={(s: AddressSuggestion) => {
                patch({ pickupLocation: s.street || s.label, coord: s.coord });
                setGeoStatus("done");
              }}
              placeholder={t("Start typing an address, e.g. Storgatan 12, Växjö", "Börja skriv en adress, t.ex. Storgatan 12, Växjö")}
            />
            <p className="mt-1 text-[11px] text-text-muted">
              {t("Pick a suggestion, or type the full address manually and use \"Locate on map\".", "Välj ett förslag, eller skriv adressen manuellt och använd \"Hitta på karta\".")}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={locateOnMap}
                disabled={geoStatus === "loading"}
                className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-ink/[0.03] px-3.5 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-yellow/40 hover:text-yellow disabled:opacity-60"
              >
                <Icon name="pin" className="h-3.5 w-3.5" />
                {t("Locate on map", "Hitta på karta")}
              </button>
              {geoStatus === "loading" && <span className="text-xs text-text-secondary">{t("Looking up address…", "Slår upp adressen…")}</span>}
              {geoStatus === "done" && <span className="text-xs text-yellow">{t("Found — pin placed on the map", "Hittad — pin placerad på kartan")}</span>}
              {geoStatus === "failed" && <span className="text-xs text-text-muted">{t("Couldn't find that address — try adding city or postcode", "Kunde inte hitta adressen — försök lägga till stad eller postnummer")}</span>}
            </div>
            {draft.coord && (
              <div className="mt-3">
                <RealMap
                  vehicles={[{ id: draft.id, brand: draft.brand || "Fordon", model: draft.model, pricePerDay: draft.pricePerDay, distanceKm: 0, type: draft.type, color: draft.color, coord: draft.coord }]}
                  center={draft.coord ?? VAXJO_CENTER}
                  userCoord={null}
                  selectedId={null}
                  onSelectVehicle={() => {}}
                  routeVehicleId={null}
                  onRouteResult={() => {}}
                  height="h-48"
                />
              </div>
            )}
          </div>
          <Field label={t("Pickup instructions", "Upphämtningsinstruktioner")}><textarea rows={3} value={draft.pickupInstructions} onChange={(e) => patch({ pickupInstructions: e.target.value })} className={inputClass} /></Field>

          <div className="rounded-xl border border-yellow/20 bg-yellow/[0.04] p-4">
            <h3 className="text-sm font-semibold text-text-primary">{t("Pricing and profit calculator", "Pris- och vinstkalkylator")}</h3>
            <p className="mt-1 text-[11px] text-text-muted">{t("Estimated earnings based on the information provided — not a guarantee.", "Uppskattade intäkter baserat på angiven information — ingen garanti.")}</p>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label={t("Expected booked days per week", "Förväntade bokade dagar per vecka")}>
                <RangeInput min={1} max={7} value={draft.expectedBookedDays} onChange={(e) => patch({ expectedBookedDays: Number(e.target.value) })} className="mt-2" />
                <p className="mt-1 text-xs text-text-secondary">{draft.expectedBookedDays} {t(draft.expectedBookedDays === 1 ? "day" : "days", "dagar")}/{t("week", "vecka")}</p>
              </Field>
              <Field label={t("Average km driven per rental day", "Genomsnittlig körsträcka per hyresdag")}>
                <input type="number" min={0} value={draft.expectedDailyDistance} onChange={(e) => patch({ expectedDailyDistance: Number(e.target.value) })} className={inputClass} />
              </Field>
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={draft.fuelIncluded} onChange={(e) => patch({ fuelIncluded: e.target.checked })} className="h-4 w-4 accent-yellow" />
              {t("Fuel/charging is included in the rental price", "Bränsle/laddning ingår i hyrespriset")}
            </label>

            <button type="button" onClick={() => setShowAdvancedPricing((v) => !v)} className="mt-3 flex items-center gap-1 text-xs font-medium text-yellow hover:underline">
              <Icon name={showAdvancedPricing ? "chevronLeft" : "chevronRight"} className="h-3 w-3 rotate-90" />
              {showAdvancedPricing ? t("Hide advanced calculation", "Dölj avancerad beräkning") : t("Show advanced calculation", "Visa avancerad beräkning")}
            </button>

            {showAdvancedPricing && (
              <div className="mt-3 space-y-3 border-t border-ink/10 pt-3">
                {(draft.fuel === "Bensin" || draft.fuel === "Diesel" || draft.fuel === "Hybrid" || draft.fuel === "Laddhybrid") && (
                  <Field label={t("Fuel consumption (L/100km)", "Bränsleförbrukning (L/100km)")}>
                    <input type="number" min={0} step={0.1} value={draft.fuelConsumptionPer100Km ?? ""} onChange={(e) => patch({ fuelConsumptionPer100Km: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
                  </Field>
                )}
                {(draft.fuel === "El" || draft.fuel === "Laddhybrid") && (
                  <Field label={t("Electricity consumption (kWh/100km)", "Elförbrukning (kWh/100km)")}>
                    <input type="number" min={0} step={0.1} value={draft.electricConsumptionPer100Km ?? ""} onChange={(e) => patch({ electricConsumptionPer100Km: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
                  </Field>
                )}
                {draft.fuel === "Laddhybrid" && (
                  <>
                    <Field label={t("Share of driving on electricity (%)", "Andel körning på el (%)")}>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draft.electricDrivingShare !== null ? Math.round(draft.electricDrivingShare * 100) : ""}
                        onChange={(e) => patch({ electricDrivingShare: e.target.value ? Number(e.target.value) / 100 : null, combinedEnergyCostPer100Km: null })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label={t("Or: combined estimated cost per 100km (kr, optional)", "Eller: kombinerad uppskattad kostnad per 100km (kr, valfritt)")}>
                      <input type="number" min={0} value={draft.combinedEnergyCostPer100Km ?? ""} onChange={(e) => patch({ combinedEnergyCostPer100Km: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
                    </Field>
                  </>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {draft.fuel !== "El" && (
                    <Field label={t("Fuel price (kr/L)", "Bränslepris (kr/L)")} hint={t(`Default set ${DEFAULT_ENERGY_PRICES.lastUpdated} — edit if outdated`, `Standard satt ${DEFAULT_ENERGY_PRICES.lastUpdated} — redigera om inaktuellt`)}>
                      <input type="number" min={0} step={0.1} value={draft.assumedFuelPrice} onChange={(e) => patch({ assumedFuelPrice: Number(e.target.value) })} className={inputClass} />
                    </Field>
                  )}
                  {(draft.fuel === "El" || draft.fuel === "Laddhybrid") && (
                    <Field label={t("Electricity price (kr/kWh)", "Elpris (kr/kWh)")} hint={t(`Default set ${DEFAULT_ENERGY_PRICES.lastUpdated} — edit if outdated`, `Standard satt ${DEFAULT_ENERGY_PRICES.lastUpdated} — redigera om inaktuellt`)}>
                      <input type="number" min={0} step={0.1} value={draft.assumedElectricityPrice} onChange={(e) => patch({ assumedElectricityPrice: Number(e.target.value) })} className={inputClass} />
                    </Field>
                  )}
                </div>
                <Field label={t("Other expenses (optional, per week)", "Övriga kostnader (valfritt, per vecka)")}>
                  <input type="number" min={0} value={draft.otherExpenses} onChange={(e) => patch({ otherExpenses: Number(e.target.value) })} className={inputClass} />
                </Field>
              </div>
            )}

            <div className="mt-4 border-t border-ink/10 pt-3">
              <p className="text-xs font-medium text-text-primary">{t("Insurance option", "Försäkringsalternativ")}</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => { patch({ insuranceOption: "Skydd" }); setInsuranceAck(false); }}
                  className={`rounded-xl border p-3 text-left text-sm font-medium transition-colors ${
                    draft.insuranceOption === "Skydd" ? "border-yellow bg-yellow/10 text-yellow" : "border-ink/10 bg-ink/[0.03] text-text-secondary hover:border-ink/25"
                  }`}
                >
                  {t("Insurance protection", "Försäkringsskydd")}
                </button>
                <button
                  type="button"
                  onClick={() => patch({ insuranceOption: "Inget" })}
                  className={`rounded-xl border p-3 text-left text-sm font-medium transition-colors ${
                    draft.insuranceOption === "Inget" ? "border-yellow bg-yellow/10 text-yellow" : "border-ink/10 bg-ink/[0.03] text-text-secondary hover:border-ink/25"
                  }`}
                >
                  {t("No additional protection", "Inget ytterligare skydd")}
                </button>
              </div>
              {draft.insuranceOption === "Skydd" ? (
                <p className="mt-2 text-xs text-text-secondary">
                  {t(
                    `Insurance protection selected. A fixed fee of ${DEFAULT_INSURANCE_CONFIG.flatFee} kr will be included and shown before publishing.`,
                    `Försäkringsskydd valt. En fast avgift på ${DEFAULT_INSURANCE_CONFIG.flatFee} kr inkluderas och visas innan publicering.`
                  )}
                </p>
              ) : (
                <label className="mt-2 flex items-start gap-2 text-xs text-text-secondary">
                  <input type="checkbox" checked={insuranceAck} onChange={(e) => setInsuranceAck(e.target.checked)} className="mt-0.5 h-4 w-4 accent-yellow" />
                  {t(
                    "I understand no additional Movanta insurance protection is selected, existing legal and vehicle-insurance requirements may still apply, and I'm responsible for ensuring this vehicle can legally be rented.",
                    "Jag förstår att inget ytterligare Movanta-försäkringsskydd är valt, att befintliga lagkrav och fordonsförsäkringskrav ändå kan gälla, och att jag ansvarar för att fordonet lagligt kan hyras ut."
                  )}
                </label>
              )}
            </div>

            <div className="mt-4 space-y-1.5 border-t border-ink/10 pt-3 text-sm">
              <div className="flex justify-between text-text-secondary"><span>{t("Gross revenue / day", "Bruttointäkt / dag")}</span><span className="text-text-primary">{formatSEKRounded(profit.grossRevenuePerDay)}</span></div>
              <div className="flex justify-between text-text-secondary"><span>{t("Gross revenue, 7 days", "Bruttointäkt, 7 dagar")}</span><span className="text-text-primary">{formatSEKRounded(profit.grossRevenueForPeriod)}</span></div>
              <div className="flex justify-between text-text-secondary"><span>{t("Energy cost / 100km", "Energikostnad / 100km")}</span><span className="text-text-primary">{formatSEKPrecise(profit.energyCostPer100Km)}</span></div>
              <div className="flex justify-between text-text-secondary"><span>{t("Energy cost, selected period", "Energikostnad, vald period")}</span><span className="text-text-primary">{formatSEKRounded(profit.energyCostForPeriod)}</span></div>
              <div className="flex justify-between text-text-secondary"><span>{t("Insurance fee", "Försäkringsavgift")}</span><span className="text-text-primary">{formatSEKRounded(profit.insuranceFee)}</span></div>
              <div className="flex justify-between text-text-secondary"><span>{t("Platform fee", "Plattformsavgift")} ({DEFAULT_PLATFORM_FEE_PERCENT}%)</span><span className="text-text-primary">{formatSEKRounded(profit.platformFee)}</span></div>
              <div className="flex justify-between text-text-secondary"><span>{t("Other expenses", "Övriga kostnader")}</span><span className="text-text-primary">{formatSEKRounded(profit.otherExpenses)}</span></div>
              <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-semibold text-text-primary">
                <span>{t("Estimated owner earnings", "Uppskattad intäkt för ägaren")}</span>
                <span>{formatSEKRounded(profit.ownerEarnings)}</span>
              </div>
              <p className="text-[11px] text-text-muted">{t("Estimated earnings based on the information provided — not guaranteed profit.", "Uppskattade intäkter baserat på angiven information — ingen garanterad vinst.")}</p>
            </div>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5">
          <h2 className="text-base font-semibold text-text-primary">{t("Rental rules", "Uthyrningsregler")}</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("Minimum renter age", "Lägsta ålder för hyresgäst")}><input type="number" min={18} value={draft.minRenterAge} onChange={(e) => patch({ minRenterAge: Number(e.target.value) })} className={inputClass} /></Field>
            <Field label={t("Minimum years with licence", "Minsta antal år med körkort")} hint={t("Platform-wide minimum is 1 year and cannot be lowered.", "Plattformens minimikrav är 1 år och kan inte sänkas.")}>
              <input type="number" min={1} value={draft.minLicenseYears} onChange={(e) => patch({ minLicenseYears: Math.max(1, Number(e.target.value)) })} className={inputClass} />
            </Field>
            <Field label={t("Max mileage per day (optional)", "Max körsträcka per dag (valfritt)")}><input type="number" min={0} value={draft.maxMileagePerDay ?? ""} onChange={(e) => patch({ maxMileagePerDay: e.target.value ? Number(e.target.value) : null })} className={inputClass} /></Field>
            <Field label={t("Extra mileage price (kr/km, optional)", "Pris extra körsträcka (kr/km, valfritt)")}><input type="number" min={0} value={draft.extraMileagePrice ?? ""} onChange={(e) => patch({ extraMileagePrice: e.target.value ? Number(e.target.value) : null })} className={inputClass} /></Field>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={draft.smokingAllowed} onChange={(e) => patch({ smokingAllowed: e.target.checked })} className="h-4 w-4 accent-yellow" />
              {t("Smoking allowed", "Rökning tillåten")}
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={draft.petsAllowed} onChange={(e) => patch({ petsAllowed: e.target.checked })} className="h-4 w-4 accent-yellow" />
              {t("Pets allowed", "Husdjur tillåtet")}
            </label>
            <label className="flex items-center gap-2 text-sm text-text-secondary">
              <input type="checkbox" checked={draft.travelOutsideSweden} onChange={(e) => patch({ travelOutsideSweden: e.target.checked })} className="h-4 w-4 accent-yellow" />
              {t("Travel outside Sweden allowed", "Resa utanför Sverige tillåten")}
            </label>
          </div>
          <Field label={t("Fuel / charging return policy", "Policy för tank/laddning vid återlämning")}><input value={draft.fuelReturnPolicy} onChange={(e) => patch({ fuelReturnPolicy: e.target.value })} className={inputClass} /></Field>
          <Field label={t("Cleaning rules", "Städregler")}><input value={draft.cleaningRules} onChange={(e) => patch({ cleaningRules: e.target.value })} className={inputClass} /></Field>
          <Field label={t("Late return rules", "Regler vid sen återlämning")}><input value={draft.lateReturnRules} onChange={(e) => patch({ lateReturnRules: e.target.value })} className={inputClass} /></Field>
          <Field label={t("Other custom rules", "Övriga egna regler")}><textarea rows={2} value={draft.customRules} onChange={(e) => patch({ customRules: e.target.value })} className={inputClass} /></Field>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-yellow/25 bg-yellow/[0.06] p-5 text-center">
            <p className="text-sm font-medium text-text-primary">{t("Estimated earnings in 7 days", "Uppskattad intäkt på 7 dagar")}</p>
            <p className="mt-1 text-3xl font-semibold text-yellow">
              {formatSEKRounded(sevenDayEarningsBeforeFees(draft.pricePerDay, draft.expectedBookedDays, draft.pricePerWeek))}
            </p>
            <p className="mt-1 text-xs text-text-muted">{t("Before platform fees, insurance fees, taxes, fuel costs and other expenses.", "Före plattformsavgifter, försäkringsavgifter, skatter, bränslekostnader och andra utgifter.")}</p>
            <div className="mx-auto mt-3 max-w-xs">
              <RangeInput min={1} max={7} value={draft.expectedBookedDays} onChange={(e) => patch({ expectedBookedDays: Number(e.target.value) })} />
              <p className="mt-1 text-xs text-text-secondary">{draft.expectedBookedDays} {t(draft.expectedBookedDays === 1 ? "booked day" : "booked days", "bokade dagar")}</p>
            </div>
            <button type="button" onClick={() => setReviewExpanded((v) => !v)} className="mt-3 text-xs font-medium text-yellow hover:underline">
              {reviewExpanded ? t("Hide detailed breakdown", "Dölj detaljerad uppdelning") : t("Show detailed breakdown", "Visa detaljerad uppdelning")}
            </button>
            {reviewExpanded && (
              <div className="mt-3 space-y-1.5 border-t border-ink/10 pt-3 text-left text-sm">
                <div className="flex justify-between text-text-secondary"><span>{t("Daily rental price", "Dagspris")}</span><span className="text-text-primary">{formatSEKRounded(draft.pricePerDay)}</span></div>
                <div className="flex justify-between text-text-secondary"><span>{t("Expected booked days", "Förväntade bokade dagar")}</span><span className="text-text-primary">{draft.expectedBookedDays}</span></div>
                <div className="flex justify-between text-text-secondary"><span>{t("Gross earnings", "Bruttointäkt")}</span><span className="text-text-primary">{formatSEKRounded(profit.grossRevenueForPeriod)}</span></div>
                <div className="flex justify-between text-text-secondary"><span>{t("Estimated fuel/charging costs", "Uppskattad bränsle/laddningskostnad")}</span><span className="text-text-primary">−{formatSEKRounded(profit.energyCostForPeriod)}</span></div>
                <div className="flex justify-between text-text-secondary"><span>{t("Insurance fees", "Försäkringsavgifter")}</span><span className="text-text-primary">−{formatSEKRounded(profit.insuranceFee)}</span></div>
                <div className="flex justify-between text-text-secondary"><span>{t("Platform fees", "Plattformsavgifter")}</span><span className="text-text-primary">−{formatSEKRounded(profit.platformFee)}</span></div>
                <div className="flex justify-between text-text-secondary"><span>{t("Other entered expenses", "Övriga angivna kostnader")}</span><span className="text-text-primary">−{formatSEKRounded(profit.otherExpenses)}</span></div>
                <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-semibold text-text-primary">
                  <span>{t("Estimated earnings after included expenses", "Uppskattad intäkt efter inkluderade kostnader")}</span>
                  <span>{formatSEKRounded(profit.ownerEarnings)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-2xl border border-ink/10 bg-card p-5">
            <h2 className="text-base font-semibold text-text-primary">{t("Review your listing", "Granska din annons")}</h2>

            {(draft.exteriorPhotos[0] ?? draft.interiorPhotos[0]) && (
              // eslint-disable-next-line @next/next/no-img-element -- local data: URL photo
              <img src={draft.exteriorPhotos[0] ?? draft.interiorPhotos[0]} alt="" className="h-40 w-full rounded-xl border border-ink/10 object-cover" />
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <p className="text-text-muted">{t("Title", "Rubrik")}</p><p className="text-text-primary">{draft.title || "—"}</p>
              <p className="text-text-muted">{t("Vehicle", "Fordon")}</p><p className="text-text-primary">{draft.brand} {draft.model} {draft.year}</p>
              <p className="text-text-muted">{t("Type", "Typ")}</p><p className="text-text-primary">{typeLabel(draft.type, lang)}</p>
              <p className="text-text-muted">{t("Listing identity", "Annonsidentitet")}</p><p className="text-text-primary">{draft.identityType === "Företag" ? t("Company", "Företag") : t("Private individual", "Privatperson")}</p>
              <p className="text-text-muted">{t("Pickup location", "Upphämtningsplats")}</p><p className="text-text-primary">{draft.pickupLocation || draft.location || "—"}</p>
              <p className="text-text-muted">{t("Driving licence requirement", "Körkortskrav")}</p><p className="text-text-primary">{Math.max(1, draft.minLicenseYears)} {t("year(s)", "år")}</p>
              <p className="text-text-muted">{t("Your price / day", "Ditt pris / dag")}</p><p className="text-text-primary">{formatSEKRounded(draft.pricePerDay)}</p>
              <p className="text-text-muted">{t("Market recommendation", "Marknadsrekommendation")}</p>
              <p className="text-text-primary">
                {marketComparison.count > 0
                  ? `${formatSEKRounded(marketComparison.recommendedDaily)} (${priceStanding(draft.pricePerDay, marketComparison) === "within" ? t("within range", "inom intervall") : priceStanding(draft.pricePerDay, marketComparison) === "above" ? t("you are above", "du är över") : t("you are below", "du är under")})`
                  : t("Not enough comparable listings", "Inte tillräckligt med jämförbara annonser")}
              </p>
              <p className="text-text-muted">{t("Insurance", "Försäkring")}</p><p className="text-text-primary">{draft.insuranceOption === "Skydd" ? t("Insurance protection", "Försäkringsskydd") : t("No additional protection", "Inget ytterligare skydd")}</p>
              <p className="text-text-muted">{t("Photos", "Foton")}</p><p className="text-text-primary">{draft.exteriorPhotos.length + draft.interiorPhotos.length}</p>
              <p className="text-text-muted">{t("Documentation photos", "Dokumentationsfoton")}</p><p className="text-text-primary">{draft.conditionPhotos.length + draft.damagePhotos.length + draft.includedItemsPhotos.length + draft.documentPhotos.length}</p>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-ink/10 pt-3">
              {[1, 2, 3, 4, 5, 6].map((s) => (
                <button key={s} type="button" onClick={() => setStep(s)} className="rounded-full border border-ink/15 bg-ink/[0.03] px-3 py-1.5 text-xs font-medium text-text-primary hover:border-ink/25">
                  {t("Edit", "Redigera")} {stepLabels[s - 1]}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-3 border-t border-ink/10 pt-4 sm:flex-row">
              <button type="button" onClick={handleSaveDraft} disabled={publishing} className="flex-1 rounded-full border border-ink/15 bg-ink/[0.03] py-3 text-sm font-medium text-text-primary hover:border-ink/25 disabled:opacity-60">
                {t("Save as draft", "Spara som utkast")}
              </button>
              <button type="button" onClick={handlePublish} disabled={publishing} className="flex-1 rounded-full bg-yellow py-3 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5 disabled:opacity-60">
                {publishing ? t("Locating on map…", "Söker plats på kartan…") : t("Submit for review", "Skicka för granskning")}
              </button>
            </div>
          </div>
        </div>
      )}

      {step < 7 && (
        <div className="mt-5 flex gap-3">
          <button type="button" onClick={back} className="flex items-center gap-1.5 rounded-full border border-ink/15 bg-ink/[0.03] px-5 py-3 text-sm font-medium text-text-primary hover:border-ink/25">
            <Icon name="chevronLeft" className="h-4 w-4" />{t("Back", "Tillbaka")}
          </button>
          <button type="button" onClick={handleSaveDraft} className="rounded-full border border-ink/15 bg-ink/[0.03] px-5 py-3 text-sm font-medium text-text-primary hover:border-ink/25">
            {t("Save as draft", "Spara utkast")}
          </button>
          <button type="button" onClick={next} className="flex-1 rounded-full bg-yellow py-3 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5">
            {t("Next", "Nästa")}
          </button>
        </div>
      )}
    </div>
  );
}


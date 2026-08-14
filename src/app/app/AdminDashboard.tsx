"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { formatSEK, type User, type VerificationRequest, type ListingReviewRequest, type ListingReviewRequestStatus } from "./data";
import type { Listing } from "./listings";
import { typeLabel, transmissionLabel, fuelLabel } from "./i18nVehicle";
import { Icon } from "./icons";

type Filter = "pending" | "all";
type Section = "licenses" | "listings";

function StatusBadge({ status }: { status: VerificationRequest["status"] | ListingReviewRequestStatus }) {
  const { t } = useLanguage();
  const tone =
    status === "approved" ? "bg-yellow/10 text-yellow" : status === "rejected" ? "bg-red-500/10 text-red-300" : "bg-orange-500/10 text-orange-300";
  const label = status === "approved" ? t("Approved", "Godkänt") : status === "rejected" ? t("Rejected", "Nekat") : t("Pending", "Väntar");
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${tone}`}>{label}</span>;
}

function LicenseReviewSection({
  requests, users, onApprove, onReject,
}: {
  requests: VerificationRequest[];
  users: User[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<Filter>("pending");

  const visible = filter === "pending" ? requests.filter((r) => r.status === "pending") : requests;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-text-primary">{t("Driving licence verifications", "Körkortsverifieringar")}</h1>
        <div className="flex gap-1.5 rounded-full border border-ink/10 bg-card p-1">
          {(["pending", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${filter === f ? "bg-yellow text-[#08090A]" : "text-text-secondary"}`}
            >
              {f === "pending" ? `${t("Pending", "Väntar")} (${pendingCount})` : `${t("All", "Alla")} (${requests.length})`}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && (
        <div className="rounded-2xl border border-ink/10 bg-card p-8 text-center text-sm text-text-muted">
          {filter === "pending" ? t("Nothing waiting for review.", "Inget väntar på granskning.") : t("No submissions yet.", "Inga inskick än.")}
        </div>
      )}

      <div className="space-y-3">
        {visible.map((r) => {
          const user = users.find((u) => u.id === r.userId);
          return (
            <div key={r.id} className="rounded-2xl border border-ink/10 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{user ? `${user.firstName} ${user.lastName}` : t("Unknown user", "Okänd användare")}</p>
                  <p className="text-xs text-text-muted">{user?.email}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-2 text-xs text-text-muted">
                {t("Submitted", "Inskickat")} {new Date(r.submittedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB")}
                {typeof r.licenseYears === "number" && ` · ${t("Self-reported", "Självrapporterat")}: ${r.licenseYears} ${t(r.licenseYears === 1 ? "year" : "years", "år")}`}
                {r.reviewedAt && ` · ${t("Reviewed", "Granskat")} ${new Date(r.reviewedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB")}`}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {r.photos.map((p, i) => (
                  <div key={i}>
                    <p className="mb-1 text-[11px] text-text-muted">{i === 0 ? t("Front", "Framsida") : t("Back", "Baksida")}</p>
                    {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL photos */}
                    <img src={p} alt="" className="h-28 w-44 rounded-lg border border-ink/10 object-cover" />
                  </div>
                ))}
              </div>
              {r.status === "pending" && (
                <div className="mt-3 flex justify-end gap-2 border-t border-ink/10 pt-3">
                  <button
                    type="button"
                    onClick={() => onReject(r.id)}
                    className="rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-medium text-red-300 hover:border-red-500/50"
                  >
                    {t("Reject", "Neka")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onApprove(r.id)}
                    className="rounded-full bg-yellow px-3.5 py-1.5 text-xs font-semibold text-[#08090A]"
                  >
                    {t("Approve", "Godkänn")}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PhotoGrid({ label, photos }: { label: string; photos: string[] }) {
  if (photos.length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-text-muted">{label} ({photos.length})</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {photos.map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element -- local data: URL photos
          <img key={i} src={p} alt="" className="h-24 w-full rounded-lg border border-ink/10 object-cover" />
        ))}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="shrink-0 text-text-muted">{label}</span>
      <span className="text-right text-text-primary">{value}</span>
    </div>
  );
}

function ListingDetailModal({
  listing, owner, request, onApprove, onReject, onClose,
}: {
  listing: Listing;
  owner: User | undefined;
  request: ListingReviewRequest;
  onApprove: () => void;
  onReject: () => void;
  onClose: () => void;
}) {
  const { lang, t } = useLanguage();
  const dateFmt = (iso: string) => new Date(iso).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  const days = (n: number) => `${n} ${t(n === 1 ? "day" : "days", n === 1 ? "dag" : "dagar")}`;
  const yesNo = (v: boolean) => (v ? t("Allowed", "Tillåtet") : t("Not allowed", "Ej tillåtet"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-ink/10 bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">
              {listing.title || `${listing.brand} ${listing.model}`.trim() || t("Untitled listing", "Namnlös annons")}
            </h2>
            <p className="text-sm text-text-muted">{listing.brand} {listing.model} · {listing.year} · {typeLabel(listing.type, lang)}</p>
            <div className="mt-1.5"><StatusBadge status={request.status} /></div>
          </div>
          <button type="button" onClick={onClose} className="shrink-0 text-text-muted hover:text-text-primary"><Icon name="close" className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 space-y-5">
          <PhotoGrid label={t("Exterior photos", "Exteriörfoton")} photos={listing.exteriorPhotos} />
          <PhotoGrid label={t("Interior photos", "Interiörfoton")} photos={listing.interiorPhotos} />
          <PhotoGrid label={t("Condition photos", "Skickfoton")} photos={listing.conditionPhotos} />
          <PhotoGrid label={t("Damage photos", "Skadefoton")} photos={listing.damagePhotos} />
          <PhotoGrid label={t("Included items", "Inkluderade tillbehör")} photos={listing.includedItemsPhotos} />
          <PhotoGrid label={t("Documents (registration, insurance, etc.)", "Dokument (registreringsbevis, försäkring, etc.)")} photos={listing.documentPhotos} />

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">{t("Description", "Beskrivning")}</h3>
            {listing.shortDescription && <p className="text-sm text-text-secondary">{listing.shortDescription}</p>}
            {listing.fullDescription && <p className="mt-1.5 whitespace-pre-wrap text-sm text-text-secondary">{listing.fullDescription}</p>}
            {!listing.shortDescription && !listing.fullDescription && <p className="text-sm text-text-muted">—</p>}
            {listing.features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {listing.features.map((f) => (
                  <span key={f} className="rounded-full bg-ink/[0.06] px-2.5 py-1 text-xs text-text-secondary">{f}</span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">{t("Vehicle", "Fordon")}</h3>
            <div className="space-y-1.5 rounded-xl border border-ink/10 bg-ink/[0.02] p-3.5">
              <DetailRow label={t("Registration number", "Registreringsnummer")} value={listing.regNumber || "—"} />
              <DetailRow label={t("Fuel", "Bränsle")} value={fuelLabel(listing.fuel, lang)} />
              <DetailRow label={t("Transmission", "Växellåda")} value={transmissionLabel(listing.transmission, lang)} />
              <DetailRow label={t("Seats", "Säten")} value={String(listing.seats)} />
              <DetailRow label={t("Mileage", "Mätarställning")} value={`${listing.mileage.toLocaleString(lang === "sv" ? "sv-SE" : "en-GB")} km`} />
              <DetailRow label={t("Colour", "Färg")} value={listing.color || "—"} />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">{t("Pricing", "Prissättning")}</h3>
            <div className="space-y-1.5 rounded-xl border border-ink/10 bg-ink/[0.02] p-3.5">
              <DetailRow label={t("Per hour", "Per timme")} value={listing.pricePerHour != null ? formatSEK(listing.pricePerHour) : "—"} />
              <DetailRow label={t("Per day", "Per dag")} value={formatSEK(listing.pricePerDay)} />
              <DetailRow label={t("Per week", "Per vecka")} value={listing.pricePerWeek != null ? formatSEK(listing.pricePerWeek) : "—"} />
              <DetailRow label={t("Security deposit", "Deposition")} value={formatSEK(listing.deposit)} />
              <DetailRow label={t("Minimum rental", "Minsta hyresperiod")} value={days(listing.minDurationDays)} />
              <DetailRow label={t("Maximum rental", "Längsta hyresperiod")} value={listing.maxDurationDays != null ? days(listing.maxDurationDays) : t("No limit", "Ingen gräns")} />
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">{t("Location & pickup", "Plats & upphämtning")}</h3>
            <div className="space-y-1.5 rounded-xl border border-ink/10 bg-ink/[0.02] p-3.5">
              <DetailRow label={t("Location", "Plats")} value={listing.location || "—"} />
              <DetailRow label={t("Pickup location", "Upphämtningsplats")} value={listing.pickupLocation || "—"} />
              <DetailRow label={t("Available from", "Tillgänglig från")} value={listing.availableFrom || "—"} />
              <DetailRow label={t("Available to", "Tillgänglig till")} value={listing.availableTo || t("No end date", "Inget slutdatum")} />
              {listing.pickupInstructions && <p className="pt-1 text-sm text-text-secondary">{listing.pickupInstructions}</p>}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">{t("Rules & requirements", "Regler & krav")}</h3>
            <div className="space-y-1.5 rounded-xl border border-ink/10 bg-ink/[0.02] p-3.5">
              <DetailRow label={t("Minimum renter age", "Lägsta ålder för hyresgäst")} value={`${listing.minRenterAge} ${t("years", "år")}`} />
              <DetailRow label={t("Minimum licence years", "Minsta antal år med körkort")} value={String(listing.minLicenseYears)} />
              <DetailRow label={t("Smoking", "Rökning")} value={yesNo(listing.smokingAllowed)} />
              <DetailRow label={t("Pets", "Husdjur")} value={yesNo(listing.petsAllowed)} />
              <DetailRow label={t("Travel outside Sweden", "Resa utanför Sverige")} value={yesNo(listing.travelOutsideSweden)} />
              <DetailRow label={t("Max mileage/day", "Max körsträcka/dag")} value={listing.maxMileagePerDay != null ? `${listing.maxMileagePerDay} km` : t("No limit", "Ingen gräns")} />
              <DetailRow label={t("Extra mileage price", "Pris extra körsträcka")} value={listing.extraMileagePrice != null ? `${listing.extraMileagePrice} kr/km` : "—"} />
              {listing.fuelReturnPolicy && <p className="pt-1 text-sm text-text-secondary">{listing.fuelReturnPolicy}</p>}
              {listing.cleaningRules && <p className="text-sm text-text-secondary">{listing.cleaningRules}</p>}
              {listing.lateReturnRules && <p className="text-sm text-text-secondary">{listing.lateReturnRules}</p>}
              {listing.customRules && <p className="text-sm text-text-secondary">{listing.customRules}</p>}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">{t("Insurance & listing identity", "Försäkring & annonsidentitet")}</h3>
            <div className="space-y-1.5 rounded-xl border border-ink/10 bg-ink/[0.02] p-3.5">
              <DetailRow label={t("Insurance option", "Försäkringsalternativ")} value={listing.insuranceOption} />
              <DetailRow label={t("Listing identity", "Annonsidentitet")} value={listing.identityType} />
              {listing.publicDisplayName && <DetailRow label={t("Public display name", "Publikt visningsnamn")} value={listing.publicDisplayName} />}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-text-primary">{t("Owner", "Ägare")}</h3>
            <div className="space-y-1.5 rounded-xl border border-ink/10 bg-ink/[0.02] p-3.5">
              <DetailRow label={t("Name", "Namn")} value={owner ? `${owner.firstName} ${owner.lastName}` : t("Unknown", "Okänd")} />
              <DetailRow label={t("Email", "E-post")} value={owner?.email ?? "—"} />
              <DetailRow label={t("Submitted", "Inskickat")} value={dateFmt(request.submittedAt)} />
              {request.reviewedAt && <DetailRow label={t("Reviewed", "Granskat")} value={dateFmt(request.reviewedAt)} />}
            </div>
          </div>
        </div>

        {request.status === "pending" && (
          <div className="mt-5 flex justify-end gap-2 border-t border-ink/10 pt-4">
            <button
              type="button"
              onClick={() => { onReject(); onClose(); }}
              className="rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 hover:border-red-500/50"
            >
              {t("Reject", "Neka")}
            </button>
            <button type="button" onClick={() => { onApprove(); onClose(); }} className="rounded-full bg-yellow px-4 py-2 text-sm font-semibold text-[#08090A]">
              {t("Approve", "Godkänn")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ListingReviewSection({
  requests, listings, users, onApprove, onReject,
}: {
  requests: ListingReviewRequest[];
  listings: Listing[];
  users: User[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<Filter>("pending");
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);

  const visible = filter === "pending" ? requests.filter((r) => r.status === "pending") : requests;
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold text-text-primary">{t("Listing reviews", "Annonsgranskningar")}</h1>
        <div className="flex gap-1.5 rounded-full border border-ink/10 bg-card p-1">
          {(["pending", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${filter === f ? "bg-yellow text-[#08090A]" : "text-text-secondary"}`}
            >
              {f === "pending" ? `${t("Pending", "Väntar")} (${pendingCount})` : `${t("All", "Alla")} (${requests.length})`}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && (
        <div className="rounded-2xl border border-ink/10 bg-card p-8 text-center text-sm text-text-muted">
          {filter === "pending" ? t("Nothing waiting for review.", "Inget väntar på granskning.") : t("No submissions yet.", "Inga inskick än.")}
        </div>
      )}

      <div className="space-y-3">
        {visible.map((r) => {
          const listing = listings.find((l) => l.id === r.listingId);
          const owner = users.find((u) => u.id === r.ownerId);
          const cover = listing?.exteriorPhotos[0] ?? listing?.interiorPhotos[0];
          return (
            <div key={r.id} className="rounded-2xl border border-ink/10 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-ink/10"
                    style={{ background: `linear-gradient(135deg, ${listing?.color ?? "#5B8DEF"}33, #101214 75%)` }}
                  >
                    {cover && (
                      // eslint-disable-next-line @next/next/no-img-element -- local data: URL photo
                      <img src={cover} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      {listing ? listing.title || `${listing.brand} ${listing.model}`.trim() || t("Untitled listing", "Namnlös annons") : t("Deleted listing", "Borttagen annons")}
                    </p>
                    <p className="text-xs text-text-muted">{owner ? `${owner.firstName} ${owner.lastName}` : t("Unknown owner", "Okänd ägare")}</p>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-2 text-xs text-text-muted">
                {t("Submitted", "Inskickat")} {new Date(r.submittedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB")}
                {r.reviewedAt && ` · ${t("Reviewed", "Granskat")} ${new Date(r.reviewedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB")}`}
              </p>
              <div className="mt-3 flex flex-wrap justify-end gap-2 border-t border-ink/10 pt-3">
                {listing && (
                  <button
                    type="button"
                    onClick={() => setDetailRequestId(r.id)}
                    className="rounded-full border border-ink/15 bg-ink/[0.03] px-3.5 py-1.5 text-xs font-medium text-text-primary hover:border-ink/25"
                  >
                    {t("View details", "Visa detaljer")}
                  </button>
                )}
                {r.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => onReject(r.id)}
                      className="rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-medium text-red-300 hover:border-red-500/50"
                    >
                      {t("Reject", "Neka")}
                    </button>
                    <button
                      type="button"
                      onClick={() => onApprove(r.id)}
                      className="rounded-full bg-yellow px-3.5 py-1.5 text-xs font-semibold text-[#08090A]"
                    >
                      {t("Approve", "Godkänn")}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {detailRequestId && (() => {
        const detailRequest = requests.find((r) => r.id === detailRequestId);
        const detailListing = detailRequest ? listings.find((l) => l.id === detailRequest.listingId) : undefined;
        if (!detailRequest || !detailListing) return null;
        return (
          <ListingDetailModal
            listing={detailListing}
            owner={users.find((u) => u.id === detailRequest.ownerId)}
            request={detailRequest}
            onApprove={() => onApprove(detailRequest.id)}
            onReject={() => onReject(detailRequest.id)}
            onClose={() => setDetailRequestId(null)}
          />
        );
      })()}
    </div>
  );
}

export function AdminDashboard({
  requests, users, onApprove, onReject,
  listingRequests, listings, onApproveListing, onRejectListing,
  onResetAllData,
  onBack,
}: {
  requests: VerificationRequest[];
  users: User[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  listingRequests: ListingReviewRequest[];
  listings: Listing[];
  onApproveListing: (id: string) => void;
  onRejectListing: (id: string) => void;
  onResetAllData: () => void;
  onBack: () => void;
}) {
  const { t } = useLanguage();
  const [section, setSection] = useState<Section>("licenses");
  const [confirmReset, setConfirmReset] = useState(false);
  const pendingLicenseCount = requests.filter((r) => r.status === "pending").length;
  const pendingListingCount = listingRequests.filter((r) => r.status === "pending").length;

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <div className="mb-4 flex items-center justify-between gap-2">
        <button type="button" onClick={onBack} className="flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
          <Icon name="chevronLeft" className="h-4 w-4" /> {t("Back", "Tillbaka")}
        </button>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-medium text-red-300 hover:border-red-500/50"
        >
          <Icon name="trash" className="h-3.5 w-3.5" />
          {t("Reset all data", "Återställ all data")}
        </button>
      </div>

      <div className="mb-6 flex gap-1.5 rounded-full border border-ink/10 bg-card p-1">
        {(["licenses", "listings"] as Section[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSection(s)}
            className={`flex-1 rounded-full px-3.5 py-2 text-xs font-medium ${section === s ? "bg-yellow text-[#08090A]" : "text-text-secondary"}`}
          >
            {s === "licenses"
              ? `${t("License verifications", "Körkortsverifieringar")} (${pendingLicenseCount})`
              : `${t("Listing reviews", "Annonsgranskningar")} (${pendingListingCount})`}
          </button>
        ))}
      </div>

      {section === "licenses" ? (
        <LicenseReviewSection requests={requests} users={users} onApprove={onApprove} onReject={onReject} />
      ) : (
        <ListingReviewSection requests={listingRequests} listings={listings} users={users} onApprove={onApproveListing} onReject={onRejectListing} />
      )}

      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmReset(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-ink/10 bg-card p-6">
            <h2 className="text-base font-semibold text-text-primary">{t("Reset all data?", "Återställ all data?")}</h2>
            <p className="mt-1.5 text-sm text-text-secondary">
              {t(
                "This deletes every account, listing, booking, message and review request, then reseeds the demo accounts. This can't be undone.",
                "Detta raderar alla konton, annonser, bokningar, meddelanden och granskningsförfrågningar, och återställer sedan demokontona. Detta kan inte ångras."
              )}
            </p>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setConfirmReset(false)} className="flex-1 rounded-full border border-ink/15 bg-ink/[0.03] py-2.5 text-sm font-medium text-text-primary">
                {t("Cancel", "Avbryt")}
              </button>
              <button
                type="button"
                onClick={onResetAllData}
                className="flex-1 rounded-full bg-red-500/90 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
              >
                {t("Reset everything", "Återställ allt")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

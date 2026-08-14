"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { formatSEK, getUsers, localTodayISO, type Booking, type ListingReviewRequest, type Vehicle } from "./data";
import { Listing, statusLabel, isAvailableToday } from "./listings";
import { statusLabel as bookingStatusLabel } from "./i18nVehicle";
import { Icon } from "./icons";

function StatusPill({ listing }: { listing: Listing }) {
  const { lang, t } = useLanguage();
  const today = localTodayISO();
  if (listing.status === "Publicerad" && listing.availableFrom && listing.availableFrom > today) {
    return (
      <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[11px] font-medium text-text-muted">
        {t("Available from", "Tillgänglig från")} {listing.availableFrom}
      </span>
    );
  }
  if (listing.status === "Publicerad" && !isAvailableToday(listing)) {
    return <span className="rounded-full bg-ink/10 px-2.5 py-1 text-[11px] font-medium text-text-muted">{t("Unavailable right now", "Otillgänglig just nu")}</span>;
  }
  const tone =
    listing.status === "Publicerad" ? "bg-yellow/10 text-yellow"
    : listing.status === "Granskning" ? "bg-orange-500/10 text-orange-300"
    : listing.status === "Pausad" ? "bg-ink/10 text-text-secondary"
    : "bg-ink/[0.06] text-text-muted";
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${tone}`}>{statusLabel(listing.status, lang)}</span>;
}

export function OwnerDashboard({
  listings, requests, confirmedBookings, vehicles, reviewRequests, onNew, onEdit, onPreview, onDelete, onSetStatus, onAcceptRequest, onDeclineRequest, onOpenRoom, onBack,
}: {
  listings: Listing[];
  requests: Booking[];
  confirmedBookings: Booking[];
  vehicles: Vehicle[];
  reviewRequests: ListingReviewRequest[];
  onNew: () => void;
  onEdit: (id: string) => void;
  onPreview: (id: string) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: Listing["status"]) => void;
  onAcceptRequest: (id: string) => void;
  onDeclineRequest: (id: string) => void;
  onOpenRoom: (id: string) => void;
  onBack: () => void;
}) {
  const { lang, t } = useLanguage();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <span aria-hidden>←</span> {t("Back", "Tillbaka")}
      </button>

      {requests.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">{t("Booking requests", "Bokningsförfrågningar")}</h2>
          <div className="space-y-3">
            {requests.map((r) => {
              const v = vehicles.find((x) => x.id === r.vehicleId);
              const renter = getUsers().find((u) => u.id === r.userId);
              return (
                <div key={r.id} className="rounded-2xl border border-yellow/30 bg-yellow/5 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary">{v ? `${v.brand} ${v.model}`.trim() : t("Vehicle", "Fordon")}</p>
                    <span className="shrink-0 rounded-full bg-orange-500/10 px-2.5 py-1 text-[11px] font-medium text-orange-300">
                      {t("Pending approval", "Väntar på godkännande")}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {renter ? `${renter.firstName} ${renter.lastName}` : t("A renter", "En hyresgäst")} · {r.startDate} – {r.endDate}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                    <span className="text-sm font-semibold text-text-primary">{formatSEK(r.totalPrice)}</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onDeclineRequest(r.id)}
                        className="rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-medium text-red-300 hover:border-red-500/50"
                      >
                        {t("Decline", "Neka")}
                      </button>
                      <button
                        type="button"
                        onClick={() => onAcceptRequest(r.id)}
                        className="rounded-full bg-yellow px-3.5 py-1.5 text-xs font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5"
                      >
                        {t("Accept", "Acceptera")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {confirmedBookings.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-text-primary">{t("Confirmed bookings", "Bekräftade bokningar")}</h2>
          <div className="space-y-3">
            {confirmedBookings.map((b) => {
              const v = vehicles.find((x) => x.id === b.vehicleId);
              const renter = getUsers().find((u) => u.id === b.userId);
              return (
                <div key={b.id} className="rounded-2xl border border-ink/10 bg-card p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary">{v ? `${v.brand} ${v.model}`.trim() : t("Vehicle", "Fordon")}</p>
                    <span className="shrink-0 rounded-full bg-yellow/10 px-2.5 py-1 text-[11px] font-medium text-yellow">{bookingStatusLabel(b.status, lang)}</span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {renter ? `${renter.firstName} ${renter.lastName}` : t("A renter", "En hyresgäst")} · {b.startDate} – {b.endDate}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-ink/10 pt-3">
                    <span className="text-sm font-semibold text-text-primary">{formatSEK(b.totalPrice)}</span>
                    <button
                      type="button"
                      onClick={() => onOpenRoom(b.id)}
                      className="flex items-center gap-1.5 rounded-full border border-yellow/30 bg-yellow/10 px-3.5 py-1.5 text-xs font-medium text-yellow hover:border-yellow/50"
                    >
                      <Icon name="chat" className="h-3.5 w-3.5" />{t("Contract & chat", "Avtal & chatt")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text-primary">{t("My listings", "Mina annonser")}</h1>
          <p className="text-sm text-text-muted">{t("Create and manage the vehicles you rent out.", "Skapa och hantera fordonen du hyr ut.")}</p>
        </div>
        <button type="button" onClick={onNew} className="flex items-center gap-1.5 rounded-full bg-yellow px-4 py-2.5 text-sm font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5">
          + {t("List your vehicle", "Lista ditt fordon")}
        </button>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl border border-ink/10 bg-card p-10 text-center">
          <p className="text-sm text-text-secondary">{t("You haven't listed any vehicles yet.", "Du har inte listat några fordon än.")}</p>
          <button type="button" onClick={onNew} className="mt-3 text-sm font-medium text-yellow hover:underline">{t("List your first vehicle", "Lista ditt första fordon")}</button>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => {
            const latestReview = reviewRequests.filter((r) => r.listingId === l.id)[0];
            return (
            <div key={l.id} className="rounded-2xl border border-ink/10 bg-card p-4">
              <div className="flex items-center gap-3">
                <div
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-ink/10"
                  style={{ background: `linear-gradient(135deg, ${l.color}33, #101214 75%)` }}
                >
                  {(l.exteriorPhotos[0] ?? l.interiorPhotos[0]) && (
                    // eslint-disable-next-line @next/next/no-img-element -- local data: URL photo
                    <img src={l.exteriorPhotos[0] ?? l.interiorPhotos[0]} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-text-primary">{l.title || `${l.brand} ${l.model}`.trim() || t("Untitled listing", "Namnlös annons")}</p>
                    <StatusPill listing={l} />
                  </div>
                  <p className="text-xs text-text-muted">
                    {l.brand} {l.model} {l.year || ""} · {l.pricePerDay ? formatSEK(l.pricePerDay) : "—"}/{t("day", "dag")}
                  </p>
                  {l.status === "Granskning" && (
                    <p className="mt-0.5 text-xs text-orange-300">{t("Waiting for admin approval", "Väntar på godkännande från admin")}</p>
                  )}
                  {l.status === "Utkast" && latestReview?.status === "rejected" && (
                    <p className="mt-0.5 text-xs text-red-300">{t("Rejected — edit and resubmit", "Nekad — redigera och skicka in igen")}</p>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink/10 pt-3">
                <button type="button" onClick={() => onEdit(l.id)} className="rounded-full border border-ink/15 bg-ink/[0.03] px-3.5 py-1.5 text-xs font-medium text-text-primary hover:border-ink/25">
                  {t("Edit", "Redigera")}
                </button>
                <button type="button" onClick={() => onPreview(l.id)} className="rounded-full border border-ink/15 bg-ink/[0.03] px-3.5 py-1.5 text-xs font-medium text-text-primary hover:border-ink/25">
                  {t("Preview", "Förhandsvisa")}
                </button>
                {l.status === "Publicerad" && (
                  <button type="button" onClick={() => onSetStatus(l.id, "Pausad")} className="rounded-full border border-ink/15 bg-ink/[0.03] px-3.5 py-1.5 text-xs font-medium text-text-primary hover:border-ink/25">
                    {t("Pause", "Pausa")}
                  </button>
                )}
                {(l.status === "Pausad" || l.status === "Utkast") && (
                  <button type="button" onClick={() => onSetStatus(l.id, "Publicerad")} className="rounded-full border border-yellow/30 bg-yellow/10 px-3.5 py-1.5 text-xs font-medium text-yellow hover:border-yellow/50">
                    {t("Publish", "Publicera")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(l.id)}
                  className="ml-auto rounded-full border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-medium text-red-300 hover:border-red-500/50"
                >
                  {t("Delete", "Ta bort")}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setConfirmDeleteId(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-ink/10 bg-card p-6">
            <h2 className="text-base font-semibold text-text-primary">{t("Delete this listing?", "Ta bort denna annons?")}</h2>
            <p className="mt-1.5 text-sm text-text-secondary">{t("This can't be undone.", "Detta kan inte ångras.")}</p>
            <div className="mt-4 flex gap-3">
              <button type="button" onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-full border border-ink/15 bg-ink/[0.03] py-2.5 text-sm font-medium text-text-primary">
                {t("Cancel", "Avbryt")}
              </button>
              <button
                type="button"
                onClick={() => { onDelete(confirmDeleteId); setConfirmDeleteId(null); }}
                className="flex-1 rounded-full bg-red-500/90 py-2.5 text-sm font-semibold text-white hover:bg-red-500"
              >
                {t("Delete", "Ta bort")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

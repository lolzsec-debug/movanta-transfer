"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { formatSEK, localTodayISO, type Booking, type ConditionReport, type Message, type User, type Vehicle } from "./data";
import { compressImage, MAX_PHOTOS } from "./listings";
import { Icon } from "./icons";

function SignatureRow({
  label, signedAt, isYou, onSign, disabled, disabledReason,
}: {
  label: string;
  signedAt: string | null | undefined;
  isYou: boolean;
  onSign: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const { lang, t } = useLanguage();
  const signed = !!signedAt;
  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border p-3.5 ${signed ? "border-emerald-500/30 bg-emerald-500/5" : "border-ink/10 bg-ink/[0.03]"}`}>
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ${signed ? "bg-emerald-500/15 text-emerald-300" : "bg-ink/[0.06] text-text-muted"}`}>
          <Icon name={signed ? "check" : "signature"} className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-text-primary">{label}</p>
          <p className="text-xs text-text-muted">
            {signed
              ? `${t("Signed", "Signerat")} ${new Date(signedAt).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}`
              : t("Not signed yet", "Inte signerat än")}
          </p>
        </div>
      </div>
      {!signed && isYou && (
        disabled ? (
          <span className="max-w-[55%] shrink-0 text-right text-[11px] text-text-muted">{disabledReason}</span>
        ) : (
          <button type="button" onClick={onSign} className="shrink-0 rounded-full bg-yellow px-4 py-2 text-xs font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5">
            {t("Sign", "Signera")}
          </button>
        )
      )}
    </div>
  );
}

function ConditionReportSection({
  report, isOwner, onSave,
}: {
  report: ConditionReport | undefined;
  isOwner: boolean;
  onSave: (report: ConditionReport) => void;
}) {
  const { lang, t } = useLanguage();
  const [editing, setEditing] = useState(!report && isOwner);
  const [photos, setPhotos] = useState<string[]>(report?.photos ?? []);
  const [mileage, setMileage] = useState<string>(report?.mileage != null ? String(report.mileage) : "");
  const [notes, setNotes] = useState(report?.notes ?? "");
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setErrors([]);
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) {
      setErrors([t(`You can add up to ${MAX_PHOTOS} photos.`, `Du kan lägga till max ${MAX_PHOTOS} foton.`)]);
      return;
    }
    const list = Array.from(files).slice(0, remaining);
    setProcessing(true);
    const newPhotos: string[] = [];
    const errs: string[] = [];
    for (const file of list) {
      try {
        newPhotos.push(await compressImage(file));
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
    setPhotos((p) => [...p, ...newPhotos]);
    setProcessing(false);
    setErrors(errs);
  }

  function removePhoto(index: number) {
    setPhotos((p) => p.filter((_, i) => i !== index));
  }

  function submit() {
    if (photos.length < 3) {
      setErrors([
        t(
          `Add at least 3 photos of the vehicle's current condition (currently ${photos.length}). Both parties can't sign the contract until this is submitted.`,
          `Lägg till minst 3 foton av fordonets nuvarande skick (för närvarande ${photos.length}). Ingen av parterna kan signera avtalet förrän detta är inskickat.`
        ),
      ]);
      return;
    }
    onSave({ photos, mileage: mileage.trim() ? Number(mileage) : null, notes: notes.trim(), submittedAt: new Date().toISOString() });
    setEditing(false);
    setErrors([]);
  }

  if (!editing) {
    if (!report) {
      return (
        <div className="mt-4 rounded-2xl border border-ink/10 bg-card p-5">
          <h2 className="text-sm font-semibold text-text-primary">{t("Vehicle condition before rental", "Fordonets skick före uthyrning")}</h2>
          <p className="mt-2 rounded-xl border border-yellow/20 bg-yellow/[0.04] p-3.5 text-xs text-text-secondary">
            {isOwner
              ? t(
                  "Please document the vehicle's current mileage, any existing damage and add at least 3 photos before handover — this protects you if something is disputed afterwards, and unlocks signing for both parties.",
                  "Dokumentera fordonets nuvarande mätarställning, eventuella befintliga skador och lägg till minst 3 foton innan överlämning — detta skyddar dig om något ifrågasätts efteråt, och låser upp signering för båda parter."
                )
              : t("The owner hasn't added pre-rental documentation yet — signing unlocks once they submit at least 3 photos.", "Ägaren har inte lagt till dokumentation inför uthyrningen än — signering låses upp när de skickar in minst 3 foton.")}
          </p>
          {isOwner && (
            <button type="button" onClick={() => setEditing(true)} className="mt-3 rounded-full bg-yellow px-4 py-2 text-xs font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5">
              {t("Add condition report", "Lägg till skicksrapport")}
            </button>
          )}
        </div>
      );
    }
    return (
      <div className="mt-4 rounded-2xl border border-ink/10 bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">{t("Vehicle condition before rental", "Fordonets skick före uthyrning")}</h2>
          {isOwner && (
            <button type="button" onClick={() => setEditing(true)} className="text-xs font-medium text-yellow hover:underline">
              {t("Edit", "Redigera")}
            </button>
          )}
        </div>
        <p className="mt-1 text-xs text-text-muted">
          {t("Submitted", "Inskickad")} {new Date(report.submittedAt).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        {report.photos.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {report.photos.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- local data: URL photos
              <img key={i} src={p} alt="" className="h-20 w-full rounded-lg border border-ink/10 object-cover" />
            ))}
          </div>
        )}
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <p className="text-text-muted">{t("Mileage", "Mätarställning")}</p>
          <p className="text-text-primary">{report.mileage != null ? `${report.mileage.toLocaleString(lang === "sv" ? "sv-SE" : "en-GB")} km` : "—"}</p>
        </div>
        {report.notes && (
          <div className="mt-2">
            <p className="text-xs text-text-muted">{t("Notes (existing damage, etc.)", "Anteckningar (befintliga skador etc.)")}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-sm text-text-primary">{report.notes}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-ink/10 bg-card p-5">
      <h2 className="text-sm font-semibold text-text-primary">{t("Vehicle condition before rental", "Fordonets skick före uthyrning")}</h2>
      <p className="mt-1 text-xs text-text-muted">
        {t(
          "Document existing damage, current mileage and anything the renter should know before pickup. At least 3 photos are required before either party can sign.",
          "Dokumentera befintliga skador, nuvarande mätarställning och allt hyrestagaren bör känna till innan hämtning. Minst 3 foton krävs innan någon av parterna kan signera."
        )}
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
        className={`mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-yellow bg-yellow/5" : "border-ink/15 hover:border-ink/30"
        }`}
      >
        <Icon name="camera" className="h-6 w-6 text-text-muted" />
        <p className="text-sm text-text-secondary">{t("Drag photos here, or click to choose files", "Dra foton hit, eller klicka för att välja filer")}</p>
        <p className="text-xs text-text-muted">{t(`JPG or PNG, up to ${MAX_PHOTOS} photos, max 10MB each`, `JPG eller PNG, upp till ${MAX_PHOTOS} foton, max 10MB per bild`)}</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
      </div>

      {processing && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-yellow" />
          {t("Compressing and processing photos…", "Komprimerar och bearbetar foton…")}
        </p>
      )}
      {errors.length > 0 && (
        <ul className="mt-2 space-y-1 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {errors.map((e) => <li key={e}>{e}</li>)}
        </ul>
      )}

      {photos.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((p, i) => (
            <div key={i} className="relative overflow-hidden rounded-lg border border-ink/10">
              {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL photos */}
              <img src={p} alt="" className="h-20 w-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label={t("Delete photo", "Ta bort foto")}
                className="absolute right-1 top-1 rounded bg-red-500/80 px-1 py-0.5 text-[10px] text-white"
              >
                <Icon name="trash" className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block text-xs text-text-muted">
          {t("Current mileage (km)", "Nuvarande mätarställning (km)")}
          <input
            type="number"
            min={0}
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
          />
        </label>
      </div>
      <label className="mt-3 block text-xs text-text-muted">
        {t("Notes — existing damage, wear, or anything worth flagging", "Anteckningar — befintliga skador, slitage eller annat värt att notera")}
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t("e.g. Small scratch on rear bumper, minor stone chip on windshield", "t.ex. Litet repa på bakre stötfångare, mindre stenskott i vindrutan")}
          className="mt-1 w-full rounded-lg border border-ink/10 bg-ink/[0.03] px-3.5 py-2.5 text-sm text-text-primary focus:outline-none"
        />
      </label>

      <div className="mt-4 flex gap-3">
        {report && (
          <button
            type="button"
            onClick={() => { setEditing(false); setErrors([]); setPhotos(report.photos); setMileage(report.mileage != null ? String(report.mileage) : ""); setNotes(report.notes); }}
            className="rounded-full border border-ink/15 bg-ink/[0.03] px-4 py-2 text-xs font-medium text-text-primary hover:border-ink/25"
          >
            {t("Cancel", "Avbryt")}
          </button>
        )}
        <button type="button" onClick={submit} disabled={processing} className="flex-1 rounded-full bg-yellow py-2.5 text-xs font-semibold text-[#08090A] transition-transform hover:-translate-y-0.5 disabled:opacity-60">
          {t("Save condition report", "Spara skicksrapport")}
        </button>
      </div>
    </div>
  );
}

export function BookingRoomView({
  booking, vehicle, currentUser, renter, owner, messages, onSign, onSendMessage, onSaveConditionReport, onComplete, onBack,
}: {
  booking: Booking;
  vehicle: Vehicle | null;
  currentUser: User;
  renter: User | undefined;
  owner: User | undefined;
  messages: Message[];
  onSign: () => void;
  onSendMessage: (text: string) => void;
  onSaveConditionReport: (report: ConditionReport) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const { lang, t } = useLanguage();
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isRenter = currentUser.id === booking.userId;
  const isOwner = currentUser.id === booking.ownerId;
  const bothSigned = !!booking.renterSignedAt && !!booking.ownerSignedAt;
  const conditionReportReady = !!booking.conditionReport && booking.conditionReport.photos.length >= 3;
  const canComplete = isOwner && bothSigned && booking.status !== "Avslutad" && localTodayISO() >= booking.endDate;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, bothSigned]);

  function submitMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    onSendMessage(draft);
    setDraft("");
  }

  const renterName = renter ? `${renter.firstName} ${renter.lastName}` : t("Renter", "Hyrestagare");
  const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : t("Owner", "Ägare");

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <button type="button" onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary">
        <Icon name="chevronLeft" className="h-4 w-4" /> {t("Back", "Tillbaka")}
      </button>

      <h1 className="text-xl font-semibold text-text-primary">{t("Rental agreement", "Hyresavtal")}</h1>
      <p className="mt-1 text-sm text-text-muted">{booking.bookingNumber}</p>

      <div className="mt-4 rounded-2xl border border-ink/10 bg-card p-5">
        <h2 className="text-sm font-semibold text-text-primary">
          {vehicle ? `${vehicle.brand} ${vehicle.model}` : t("Vehicle", "Fordon")}
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-text-muted">{t("Dates", "Datum")}</p><p className="text-text-primary">{booking.startDate} – {booking.endDate}</p></div>
          <div><p className="text-text-muted">{t("Pickup / return", "Hämtning / lämning")}</p><p className="text-text-primary">{booking.pickupTime} – {booking.returnTime}</p></div>
          <div><p className="text-text-muted">{t("Renter", "Hyrestagare")}</p><p className="text-text-primary">{renterName}</p></div>
          <div><p className="text-text-muted">{t("Owner", "Ägare")}</p><p className="text-text-primary">{ownerName}</p></div>
          <div><p className="text-text-muted">{t("Total price", "Totalpris")}</p><p className="text-text-primary">{formatSEK(booking.totalPrice)}</p></div>
          <div><p className="text-text-muted">{t("Pickup location", "Upphämtningsplats")}</p><p className="text-text-primary">{vehicle?.location ?? "—"}</p></div>
        </div>

        <div className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-xs leading-relaxed text-text-secondary">
          <p>
            {t(
              `This prototype agreement is between ${renterName} ("the renter") and ${ownerName} ("the owner") for the rental of the vehicle and dates above via Movanta.`,
              `Detta prototypavtal gäller mellan ${renterName} ("hyrestagaren") och ${ownerName} ("ägaren") för uthyrning av fordonet och datumen ovan via Movanta.`
            )}
          </p>
          {vehicle?.rules && vehicle.rules.length > 0 && (
            <ul className="list-disc space-y-1 pl-4">
              {vehicle.rules.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          )}
          {vehicle?.insurance && <p>{vehicle.insurance}</p>}
          <p className="italic text-text-muted">
            {t("Prototype only — not a legally binding document.", "Endast prototyp — inte ett juridiskt bindande dokument.")}
          </p>
        </div>

        <div className="mt-4 space-y-2.5 border-t border-ink/10 pt-4">
          {!conditionReportReady && !bothSigned && (
            <div className="rounded-xl border border-yellow/20 bg-yellow/[0.04] p-3 text-xs text-text-secondary">
              {t(
                "Signing unlocks once the owner has submitted a condition report with at least 3 photos.",
                "Signering låses upp när ägaren har lämnat en skicksrapport med minst 3 foton."
              )}
            </div>
          )}
          <SignatureRow
            label={t("Renter signature", "Hyrestagarens signatur")}
            signedAt={booking.renterSignedAt}
            isYou={isRenter}
            onSign={onSign}
            disabled={!conditionReportReady}
            disabledReason={t("Waiting for the owner's condition report (3+ photos)", "Väntar på ägarens skicksrapport (3+ foton)")}
          />
          <SignatureRow
            label={t("Owner signature", "Ägarens signatur")}
            signedAt={booking.ownerSignedAt}
            isYou={isOwner}
            onSign={onSign}
            disabled={!conditionReportReady}
            disabledReason={t("Waiting for the owner's condition report (3+ photos)", "Väntar på ägarens skicksrapport (3+ foton)")}
          />
          {booking.contractPdf && (
            <a
              href={booking.contractPdf}
              download={`${booking.bookingNumber}.pdf`}
              className="flex items-center justify-center gap-1.5 rounded-full border border-yellow/30 bg-yellow/10 px-4 py-2.5 text-xs font-medium text-yellow hover:border-yellow/50"
            >
              <Icon name="pdf" className="h-3.5 w-3.5" />
              {t("View / download contract", "Visa / ladda ner avtal")}
            </a>
          )}
          {canComplete && (
            <button
              type="button"
              onClick={onComplete}
              className="w-full rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-medium text-emerald-300 hover:border-emerald-500/50"
            >
              {t("Mark rental as completed", "Markera uthyrning som avslutad")}
            </button>
          )}
          {booking.status === "Avslutad" && (
            <p className="text-center text-xs text-text-muted">{t("This rental is completed.", "Denna uthyrning är avslutad.")}</p>
          )}
        </div>
      </div>

      {isOwner || isRenter ? (
        <ConditionReportSection report={booking.conditionReport} isOwner={isOwner} onSave={onSaveConditionReport} />
      ) : null}

      <div className="mt-4 rounded-2xl border border-ink/10 bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <Icon name="chat" className="h-4 w-4 text-yellow" />
          {t("Chat", "Chatt")}
        </h2>

        {!bothSigned ? (
          <div className="mt-3 rounded-xl border border-ink/10 bg-ink/[0.03] p-4 text-center text-sm text-text-muted">
            {t("Chat unlocks once both parties have signed the agreement above.", "Chatten låses upp när båda parter har signerat avtalet ovan.")}
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="mt-3 max-h-80 space-y-2.5 overflow-y-auto rounded-xl border border-ink/10 bg-ink/[0.02] p-3">
              {messages.length === 0 ? (
                <p className="p-4 text-center text-sm text-text-muted">{t("No messages yet — say hello.", "Inga meddelanden än — säg hej.")}</p>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === currentUser.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-yellow text-[#08090A]" : "bg-ink/[0.06] text-text-primary"}`}>
                        <p>{m.text}</p>
                        <p className={`mt-1 text-[10px] ${mine ? "text-[#08090A]/60" : "text-text-muted"}`}>
                          {new Date(m.createdAt).toLocaleTimeString(lang === "sv" ? "sv-SE" : "en-GB", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <form onSubmit={submitMessage} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("Write a message…", "Skriv ett meddelande…")}
                className="flex-1 rounded-full border border-ink/10 bg-ink/[0.03] px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow text-[#08090A] disabled:opacity-40"
                aria-label={t("Send", "Skicka")}
              >
                <Icon name="send" className="h-4 w-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

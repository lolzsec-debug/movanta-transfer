// Client-side rental-agreement PDF generation — no backend, runs entirely in
// the browser. Invoked exactly once, the moment the second signature lands
// (see AppShell.tsx signContract); the resulting data URL is frozen onto
// Booking.contractPdf forever after and never regenerated, so both parties
// (and later booking history) always see the identical document.
import jsPDF from "jspdf";
import type { Booking, User, Vehicle } from "./data";

const PAGE_WIDTH = 595; // A4 in pt
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LINE_HEIGHT = 15;
const PAGE_BOTTOM = 780;

export function generateContractPdfDataUrl(
  booking: Booking,
  vehicle: Vehicle | null,
  renter: User | undefined,
  owner: User | undefined
): string {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  let y = MARGIN;

  function addLine(text: string, opts?: { bold?: boolean; italic?: boolean; size?: number; gapAfter?: number }) {
    doc.setFont("helvetica", opts?.bold ? "bold" : opts?.italic ? "italic" : "normal");
    doc.setFontSize(opts?.size ?? 10.5);
    const wrapped = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
    for (const line of wrapped) {
      if (y > PAGE_BOTTOM) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(line, MARGIN, y);
      y += LINE_HEIGHT;
    }
    y += opts?.gapAfter ?? 4;
  }

  const renterName = renter ? `${renter.firstName} ${renter.lastName}` : "Renter";
  const ownerName = owner ? `${owner.firstName} ${owner.lastName}` : "Owner";
  const fmtDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—");

  addLine("Movanta Rental Agreement", { bold: true, size: 16, gapAfter: 2 });
  addLine(`Booking ${booking.bookingNumber}`, { size: 9, gapAfter: 12 });

  addLine("Parties", { bold: true });
  addLine(`Renter: ${renterName}`);
  addLine(`Owner: ${ownerName}`, { gapAfter: 10 });

  addLine("Vehicle", { bold: true });
  addLine(vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.year})`.trim() : "—", { gapAfter: 10 });

  addLine("Rental period", { bold: true });
  addLine(`${booking.startDate} ${booking.pickupTime} — ${booking.endDate} ${booking.returnTime}`);
  if (vehicle?.location) addLine(`Pickup location: ${vehicle.location}`);
  y += 6;

  addLine("Price", { bold: true });
  addLine(`Rental: ${booking.rentalPrice} kr`);
  addLine(`Service fee: ${booking.serviceFee} kr`);
  addLine(`Protection fee: ${booking.protectionFee} kr`);
  addLine(`Total: ${booking.totalPrice} kr`, { bold: true, gapAfter: 10 });

  if (vehicle?.rules && vehicle.rules.length > 0) {
    addLine("Rules", { bold: true });
    vehicle.rules.forEach((r) => addLine(`• ${r}`));
    y += 6;
  }

  if (vehicle?.insurance) {
    addLine("Insurance", { bold: true });
    addLine(vehicle.insurance, { gapAfter: 10 });
  }

  addLine("Vehicle condition report", { bold: true });
  if (booking.conditionReport) {
    addLine(`Mileage at handover: ${booking.conditionReport.mileage != null ? `${booking.conditionReport.mileage} km` : "—"}`);
    addLine(`Photos on file: ${booking.conditionReport.photos.length}`);
    if (booking.conditionReport.notes) addLine(`Notes: ${booking.conditionReport.notes}`);
  } else {
    addLine("—");
  }
  y += 10;

  addLine("Signatures", { bold: true });
  addLine(`Renter signed: ${fmtDate(booking.renterSignedAt)}`);
  addLine(`Owner signed: ${fmtDate(booking.ownerSignedAt)}`, { gapAfter: 14 });

  addLine("Prototype only — not a legally binding document.", { italic: true, size: 8.5 });

  return doc.output("datauristring");
}

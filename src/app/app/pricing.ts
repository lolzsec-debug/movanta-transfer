// Single source of truth for every pricing/profit number shown in the
// listing wizard and the final review page — both call these same functions
// so the numbers can never drift apart between the two screens.
//
// "Server-side validation" note: this prototype has no server. These are
// plain, dependency-free functions so the exact same code could run
// unchanged in an API route/serverless function if a backend is added later
// — but today nothing here is actually re-verified off the client.
import type { Fuel, InsuranceOption } from "./data";

export type EnergyPriceConfig = {
  petrolPerLitre: number;
  dieselPerLitre: number;
  electricityPerKwh: number;
  lastUpdated: string; // ISO date — shown to the owner so the assumption is never silently stale
};

// Not a live price feed — there is no connected price API in this prototype.
// Editable per-listing in the wizard; these are just the starting defaults.
export const DEFAULT_ENERGY_PRICES: EnergyPriceConfig = {
  petrolPerLitre: 16.5,
  dieselPerLitre: 17.2,
  electricityPerKwh: 2.5,
  lastUpdated: "2026-07-01",
};

export type InsuranceConfig = {
  option: InsuranceOption;
  flatFee: number; // fixed SEK charge per booking, independent of rental revenue
};

// No real underwriting exists behind this — it's a flat, disclosed fee,
// clearly labelled as an estimate everywhere it's shown. Mark this
// "TODO: administrator to configure a real policy" the day Movanta Skydd
// actually covers privately listed vehicles.
export const DEFAULT_INSURANCE_CONFIG: InsuranceConfig = {
  option: "Skydd",
  flatFee: 150,
};

export type EnergyInputs = {
  fuel: Fuel;
  fuelConsumptionPer100Km: number | null; // L/100km — petrol, diesel, hybrid, and the fuel portion of plug-in hybrid
  electricConsumptionPer100Km: number | null; // kWh/100km — electric, and the electric portion of plug-in hybrid
  electricDrivingShare: number | null; // 0–1, plug-in hybrid only: fraction of km driven on electricity
  combinedCostPer100Km: number | null; // plug-in hybrid alternative: owner enters one blended figure directly
  assumedFuelPrice: number; // SEK/L
  assumedElectricityPrice: number; // SEK/kWh
};

export function energyCostPer100Km(inputs: EnergyInputs): number {
  const { fuel, fuelConsumptionPer100Km, electricConsumptionPer100Km, electricDrivingShare, combinedCostPer100Km, assumedFuelPrice, assumedElectricityPrice } = inputs;

  if (fuel === "Laddhybrid" && combinedCostPer100Km !== null) {
    return combinedCostPer100Km;
  }
  if (fuel === "Laddhybrid") {
    const share = electricDrivingShare ?? 0.5;
    const fuelPart = (fuelConsumptionPer100Km ?? 0) * assumedFuelPrice * (1 - share);
    const electricPart = (electricConsumptionPer100Km ?? 0) * assumedElectricityPrice * share;
    return fuelPart + electricPart;
  }
  if (fuel === "El") {
    return (electricConsumptionPer100Km ?? 0) * assumedElectricityPrice;
  }
  // Bensin, Diesel, Hybrid (hybrid uses litres/100km per the brief, absent a richer model)
  return (fuelConsumptionPer100Km ?? 0) * assumedFuelPrice;
}

export function energyCostForDistance(inputs: EnergyInputs, totalKm: number): number {
  return (energyCostPer100Km(inputs) / 100) * totalKm;
}

export function insuranceFee(config: InsuranceConfig): number {
  if (config.option === "Inget") return 0;
  return config.flatFee;
}

export type ProfitBreakdown = {
  grossRevenuePerDay: number;
  grossRevenueForPeriod: number;
  energyCostPer100Km: number;
  energyCostForPeriod: number;
  insuranceFee: number;
  platformFee: number;
  otherExpenses: number;
  ownerEarnings: number;
  days: number;
};

export type ProfitInputs = {
  pricePerDay: number;
  pricePerWeek: number | null;
  bookedDays: number; // 1–7
  dailyDistanceKm: number;
  fuelIncluded: boolean;
  energy: EnergyInputs;
  insurance: InsuranceConfig;
  platformFeePercent: number;
  otherExpenses: number;
};

// Movanta's own cut — configurable, shown transparently, zero unless set.
export const DEFAULT_PLATFORM_FEE_PERCENT = 12;

// Single source of truth for "gross revenue over N booked days" — used by
// both the owner's profit calculator (bookedDays capped at 1–7) and the
// actual renter-facing booking flow (which can span any number of nights).
// Every full 7-day block is charged at the owner's weekly price (usually
// discounted vs. 7x the daily rate) when they've set one; any remaining
// partial week is charged at the daily rate.
export function grossRevenueForPeriod(pricePerDay: number, bookedDays: number, pricePerWeek: number | null): number {
  if (pricePerWeek !== null && pricePerWeek > 0 && bookedDays >= 7) {
    const weeks = Math.floor(bookedDays / 7);
    const remainderDays = bookedDays % 7;
    return weeks * pricePerWeek + remainderDays * pricePerDay;
  }
  return pricePerDay * bookedDays;
}

export function calculateProfitBreakdown(inputs: ProfitInputs): ProfitBreakdown {
  const grossRevenuePerDay = inputs.pricePerDay;
  const grossRevenueForPeriodValue = grossRevenueForPeriod(inputs.pricePerDay, inputs.bookedDays, inputs.pricePerWeek);

  const perKm = energyCostPer100Km(inputs.energy);
  const totalKm = inputs.dailyDistanceKm * inputs.bookedDays;
  const energyForPeriod = inputs.fuelIncluded ? energyCostForDistance(inputs.energy, totalKm) : 0;

  const insurance = insuranceFee(inputs.insurance);
  const platformFee = grossRevenueForPeriodValue * (inputs.platformFeePercent / 100);

  const ownerEarnings = grossRevenueForPeriodValue - energyForPeriod - insurance - platformFee - inputs.otherExpenses;

  return {
    grossRevenuePerDay,
    grossRevenueForPeriod: grossRevenueForPeriodValue,
    energyCostPer100Km: perKm,
    energyCostForPeriod: energyForPeriod,
    insuranceFee: insurance,
    platformFee,
    otherExpenses: inputs.otherExpenses,
    ownerEarnings,
    days: inputs.bookedDays,
  };
}

export function sevenDayEarningsBeforeFees(dailyPrice: number, expectedBookedDays: number, pricePerWeek: number | null = null): number {
  return grossRevenueForPeriod(dailyPrice, expectedBookedDays, pricePerWeek);
}

export function formatSEKPrecise(n: number): string {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 2 }).format(n) + " kr";
}

export function formatSEKRounded(n: number): string {
  return new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(Math.round(n)) + " kr";
}

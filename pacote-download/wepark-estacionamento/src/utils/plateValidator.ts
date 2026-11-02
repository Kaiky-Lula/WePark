/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PricingSettings, VehicleRate, VehicleType } from '../types';

/**
 * Normalizes and cleans plate string to uppercase letters and digits.
 */
export function cleanPlate(rawPlate: string): string {
  return rawPlate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
}

/**
 * Checks if a plate matches Brazilian Mercosul (ABC1D23) or Traditional (ABC1234) format.
 */
export function validatePlate(plate: string): {
  isValid: boolean;
  format: 'mercosul' | 'antiga' | 'invalida';
  formatted: string;
} {
  const cleaned = cleanPlate(plate);

  // Mercosul: 3 letters, 1 digit, 1 letter, 2 digits (e.g., BRA2E19)
  const mercosulRegex = /^[A-Z]{3}[0-9]{1}[A-Z]{1}[0-9]{2}$/;

  // Traditional: 3 letters, 4 digits (e.g., ABC1234)
  const antigaRegex = /^[A-Z]{3}[0-9]{4}$/;

  if (mercosulRegex.test(cleaned)) {
    return {
      isValid: true,
      format: 'mercosul',
      formatted: cleaned,
    };
  }

  if (antigaRegex.test(cleaned)) {
    const formatted = `${cleaned.substring(0, 3)}-${cleaned.substring(3)}`;
    return {
      isValid: true,
      format: 'antiga',
      formatted,
    };
  }

  return {
    isValid: false,
    format: 'invalida',
    formatted: cleaned,
  };
}

/**
 * Format currency to Brazilian Real (BRL)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

/**
 * Format timestamp to PT-BR string
 */
export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

export function formatTimeOnly(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateOnly(isoString: string): string {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

/**
 * Formats duration in minutes into a human-readable PT-BR string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 0) minutes = 0;
  const days = Math.floor(minutes / (24 * 60));
  const remainingHours = Math.floor((minutes % (24 * 60)) / 60);
  const remainingMins = minutes % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (remainingHours > 0 || days > 0) parts.push(`${remainingHours}h`);
  parts.push(`${remainingMins}min`);

  return parts.join(' ');
}

export interface TariffCalculationResult {
  durationMinutes: number;
  isWithinTolerance: boolean;
  isOvernight: boolean;
  regularPrice: number;
  administrativeFee: number;
  totalPrice: number;
  breakdown: {
    firstHourCost: number;
    fractionsCount: number;
    fractionsCost: number;
    dailyCapApplied: boolean;
    appliedRateType: 'tolerancia' | 'horas' | 'diaria' | 'pernoite';
  };
}

/**
 * Calculates tariff based on duration and pricing rules
 */
export function calculateTariff(
  entryTimeIso: string,
  exitTimeIso: string,
  vehicleType: VehicleType,
  pricing: PricingSettings,
  isLostTicketException = false,
  customAdminFee?: number
): TariffCalculationResult {
  const entry = new Date(entryTimeIso);
  const exit = new Date(exitTimeIso);
  const diffMs = Math.max(0, exit.getTime() - entry.getTime());
  const durationMinutes = Math.ceil(diffMs / (1000 * 60));

  const rates: VehicleRate = pricing.rates[vehicleType];
  const adminFee = isLostTicketException
    ? customAdminFee !== undefined
      ? customAdminFee
      : pricing.lostTicketFee
    : 0;

  // Check tolerance (15 min)
  if (durationMinutes <= pricing.toleranceMinutes && !isLostTicketException) {
    return {
      durationMinutes,
      isWithinTolerance: true,
      isOvernight: false,
      regularPrice: 0,
      administrativeFee: 0,
      totalPrice: 0,
      breakdown: {
        firstHourCost: 0,
        fractionsCount: 0,
        fractionsCost: 0,
        dailyCapApplied: false,
        appliedRateType: 'tolerancia',
      },
    };
  }

  // Check if overnight (pernoite): crosses midnight or duration >= 12h, or entry on previous day
  const isDifferentDay = entry.toDateString() !== exit.toDateString();
  const entryHour = entry.getHours();
  const exitHour = exit.getHours();
  const isNightHours = (entryHour >= 21 || entryHour < 6) && isDifferentDay;
  const isOvernight = (isDifferentDay && durationMinutes >= 360) || isNightHours || durationMinutes >= 720;

  let regularPrice = 0;
  let firstHourCost = 0;
  let fractionsCount = 0;
  let fractionsCost = 0;
  let dailyCapApplied = false;
  let appliedRateType: 'tolerancia' | 'horas' | 'diaria' | 'pernoite' = 'horas';

  if (isOvernight) {
    // Pernoite rate
    appliedRateType = 'pernoite';
    // If multiple days
    const days = Math.max(1, Math.ceil(durationMinutes / (24 * 60)));
    regularPrice = rates.overnight * days;
  } else {
    // Normal hourly calculation with 15 min fractions
    firstHourCost = rates.firstHour;

    if (durationMinutes <= 60) {
      regularPrice = firstHourCost;
    } else {
      const extraMinutes = durationMinutes - 60;
      fractionsCount = Math.ceil(extraMinutes / 15);
      fractionsCost = fractionsCount * rates.fraction15m;
      regularPrice = firstHourCost + fractionsCost;

      // Check daily maximum cap
      if (regularPrice > rates.dailyMax) {
        regularPrice = rates.dailyMax;
        dailyCapApplied = true;
        appliedRateType = 'diaria';
      }
    }
  }

  const totalPrice = regularPrice + adminFee;

  return {
    durationMinutes,
    isWithinTolerance: false,
    isOvernight,
    regularPrice,
    administrativeFee: adminFee,
    totalPrice,
    breakdown: {
      firstHourCost,
      fractionsCount,
      fractionsCost,
      dailyCapApplied,
      appliedRateType,
    },
  };
}

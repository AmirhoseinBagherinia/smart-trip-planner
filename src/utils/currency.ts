import { TravelPersonality } from '../types.ts';

const PREFIX_CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  TRY: '₺',
  JPY: '¥',
  CHF: 'CHF ',
  CAD: 'CA$',
  AUD: 'A$',
  AED: 'AED ',
};

const SUFFIX_CURRENCY_LABELS: Record<string, string> = {
  IRR: ' Rials',
  IRT: ' Tomans',
  TOMAN: ' Tomans',
  TOMANS: ' Tomans',
  RIAL: ' Rials',
  RIALS: ' Rials',
};

/**
 * Realistic Currency Multiplier / Exchange Rate Matrix (anchored to USD = 1.0):
 * - USD: 1.0
 * - EUR: 0.92
 * - GBP: 0.78
 * - IRT (Tomans): 1 USD ~ 90,000 Tomans
 * - IRR (Rials): 1 USD ~ 900,000 Rials
 */
export const USD_EXCHANGE_MULTIPLIERS: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  IRT: 90000,
  TOMAN: 90000,
  TOMANS: 90000,
  IRR: 900000,
  RIAL: 900000,
  RIALS: 900000,
  TRY: 34.5,
  JPY: 154,
  CHF: 0.88,
  CAD: 1.38,
  AUD: 1.52,
  AED: 3.67,
};

export function getCurrencyRateFromUsd(currencyCode = 'USD'): number {
  const code = String(currencyCode || 'USD').toUpperCase().trim();
  return USD_EXCHANGE_MULTIPLIERS[code] ?? 1.0;
}

export function roundCurrencyAmount(
  amount: number,
  currencyCode = 'USD'
): number {
  const code = String(currencyCode || 'USD').toUpperCase().trim();
  if (!Number.isFinite(amount) || amount <= 0) return 0;

  if (code === 'IRT' || code === 'TOMAN' || code === 'TOMANS') {
    if (amount >= 1_000_000) return Math.round(amount / 50_000) * 50_000;
    if (amount >= 100_000) return Math.round(amount / 10_000) * 10_000;
    return Math.max(5_000, Math.round(amount / 5_000) * 5_000);
  }
  if (code === 'IRR' || code === 'RIAL' || code === 'RIALS') {
    if (amount >= 10_000_000) return Math.round(amount / 500_000) * 500_000;
    if (amount >= 1_000_000) return Math.round(amount / 100_000) * 100_000;
    return Math.max(50_000, Math.round(amount / 50_000) * 50_000);
  }
  if (code === 'JPY') {
    return Math.max(100, Math.round(amount / 100) * 100);
  }
  return Math.max(1, Math.round(amount));
}

export function convertUsdToCurrency(
  usdAmount: number,
  currencyCode = 'USD'
): number {
  if (!Number.isFinite(usdAmount) || usdAmount <= 0) return 0;
  const mult = getCurrencyRateFromUsd(currencyCode);
  return roundCurrencyAmount(usdAmount * mult, currencyCode);
}

export function convertBetweenCurrencies(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const fromCode = String(fromCurrency || 'USD').toUpperCase().trim();
  const toCode = String(toCurrency || 'USD').toUpperCase().trim();
  if (fromCode === toCode) return Math.round(amount);
  const fromRate = getCurrencyRateFromUsd(fromCode);
  const usdValue = amount / fromRate;
  return convertUsdToCurrency(usdValue, toCode);
}

/**
 * Computes realistic daily and total trip budgets scaled by TravelPersonality,
 * destination purchasing power, and the Currency Exchange Rate Matrix.
 * - USD: $40–$120/day (up to $260/day for 5-star European Luxury)
 * - EUR: €35–€110/day
 * - GBP: £31–£94/day
 * - IRT (Tomans): 1,500,000 to 4,500,000 Tomans/day (1 USD ~ 90,000 Tomans)
 */
export function getSuggestedTripBudget(params: {
  personality: TravelPersonality;
  currency?: string;
  daysCount?: number;
  destination?: string;
}): { dailyBudget: number; totalBudget: number } {
  const code = String(params.currency || 'EUR').toUpperCase().trim();
  const days = Math.max(1, Math.min(14, params.daysCount || 4));
  const destLower = String(params.destination || '').toLowerCase();

  const isIranContext =
    code === 'IRT' ||
    code === 'IRR' ||
    code === 'TOMAN' ||
    code === 'TOMANS' ||
    [
      'iran',
      'dehdasht',
      'shiraz',
      'yasuj',
      'kashan',
      'isfahan',
      'yazd',
      'tehran',
      'tabriz',
    ].some((k) => destLower.includes(k));

  // Daily USD baseline anchored to realistic purchasing power:
  // In Iran / IRT mode: $17–$50/day -> 1,500,000 to 4,500,000 Tomans/day at 1 USD = 90,000 Tomans
  // In standard international mode: $40–$120/day (EUR €37–€110/day) and $260/day for 5-star Luxury
  const dailyUsdByPersonality: Record<TravelPersonality, number> = isIranContext
    ? {
        Backpacker: 17, // ~1,500,000 Tomans/day | ~€16/day
        'Slow Traveler': 25, // ~2,250,000 Tomans/day | ~€23/day
        Adventurer: 31, // ~2,800,000 Tomans/day | ~€29/day
        Foodie: 36, // ~3,250,000 Tomans/day | ~€33/day
        Luxury: 50, // ~4,500,000 Tomans/day | ~€46/day
      }
    : {
        Backpacker: 42, // $42/day | €39/day | £33/day
        'Slow Traveler': 78, // $78/day | €72/day | £61/day
        Adventurer: 95, // $95/day | €87/day | £74/day
        Foodie: 115, // $115/day | €106/day | £90/day
        Luxury: 260, // $260/day | €239/day | £203/day
      };

  const dailyUsd = dailyUsdByPersonality[params.personality] ?? 95;
  const dailyBudget = convertUsdToCurrency(dailyUsd, code);
  const totalBudget = roundCurrencyAmount(dailyBudget * days, code);

  return { dailyBudget, totalBudget };
}

export function getCurrencySymbol(currencyCode = 'USD'): string {
  const code = String(currencyCode || 'USD').toUpperCase().trim();
  if (code === 'IRR' || code === 'RIAL' || code === 'RIALS') return 'Rials';
  if (code === 'IRT' || code === 'TOMAN' || code === 'TOMANS') return 'Tomans';
  return PREFIX_CURRENCY_SYMBOLS[code] ?? `${code} `;
}

export function formatCurrency(
  amount: number | undefined | null,
  currencyCode = 'USD',
  options?: { showDecimals?: boolean; signed?: boolean }
): string {
  const numeric = Number(amount ?? 0);
  const safeVal = Number.isNaN(numeric) ? 0 : numeric;
  const code = String(currencyCode || 'USD').toUpperCase().trim();
  const absVal = Math.abs(safeVal);

  const isSuffix = Boolean(SUFFIX_CURRENCY_LABELS[code]);
  const formattedNumber =
    options?.showDecimals && !isSuffix
      ? absVal.toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : Math.round(absVal).toLocaleString();

  const signPrefix =
    safeVal < 0 ? '-' : options?.signed && safeVal > 0 ? '+' : '';

  if (isSuffix) {
    return `${signPrefix}${formattedNumber}${SUFFIX_CURRENCY_LABELS[code]}`;
  }

  const symbol = PREFIX_CURRENCY_SYMBOLS[code] ?? `${code} `;
  return `${signPrefix}${symbol}${formattedNumber}`;
}

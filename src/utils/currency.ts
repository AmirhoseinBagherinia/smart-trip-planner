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

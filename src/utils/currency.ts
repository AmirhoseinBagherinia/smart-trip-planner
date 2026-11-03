const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  TRY: '₺',
  JPY: '¥',
  CHF: 'CHF ',
  CAD: 'CA$',
  AUD: 'A$',
  AED: 'AED ',
  IRR: 'IRR ',
};

export function getCurrencySymbol(currencyCode = 'USD'): string {
  const code = String(currencyCode || 'USD').toUpperCase().trim();
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}

export function formatCurrency(
  amount: number | undefined | null,
  currencyCode = 'USD',
  options?: { showDecimals?: boolean; signed?: boolean }
): string {
  const numeric = Number(amount ?? 0);
  const safeVal = Number.isNaN(numeric) ? 0 : numeric;
  const symbol = getCurrencySymbol(currencyCode);
  const absVal = Math.abs(safeVal);

  const formattedNumber = options?.showDecimals
    ? absVal.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : Math.round(absVal).toLocaleString();

  if (safeVal < 0) {
    return `-${symbol}${formattedNumber}`;
  }
  if (options?.signed && safeVal > 0) {
    return `+${symbol}${formattedNumber}`;
  }
  return `${symbol}${formattedNumber}`;
}

export type Currency = 'EUR' | 'USD' | 'FCFA';

// Indicative fixed rates, updated manually from time to time — never a
// live exchange-rate API call (spec 7.3). FCFA is the real EUR peg rate
// (1 EUR = 655.957 FCFA by treaty); USD is an illustrative fixed rate.
const FIXED_RATES: Record<Currency, number> = {
  EUR: 1,
  USD: 1.08,
  FCFA: 655.957,
};

const SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  FCFA: 'FCFA',
};

export function convertFromEur(amountEur: number, currency: Currency): number {
  return amountEur * FIXED_RATES[currency];
}

export function formatPrice(amountEur: number, currency: Currency): string {
  const converted = convertFromEur(amountEur, currency);
  if (currency === 'FCFA') {
    return `${Math.round(converted).toLocaleString('fr-FR').replace(/\s/g, ' ')} ${SYMBOLS[currency]}`;
  }
  return `${converted.toFixed(2)} ${SYMBOLS[currency]}`;
}

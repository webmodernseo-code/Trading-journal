import { describe, it, expect } from 'vitest';
import { convertFromEur, formatPrice } from '../currency';

describe('convertFromEur', () => {
  it('returns the same amount for EUR', () => {
    expect(convertFromEur(5, 'EUR')).toBe(5);
  });

  it('converts to USD at the fixed rate', () => {
    expect(convertFromEur(5, 'USD')).toBeCloseTo(5.4, 5);
  });

  it('converts to FCFA at the fixed peg rate', () => {
    expect(convertFromEur(5, 'FCFA')).toBeCloseTo(3279.785, 3);
  });
});

describe('formatPrice', () => {
  it('formats EUR with two decimals and the euro sign', () => {
    expect(formatPrice(5, 'EUR')).toBe('5.00 €');
  });

  it('formats USD with two decimals and the dollar sign', () => {
    expect(formatPrice(5, 'USD')).toBe('5.40 $');
  });

  it('formats FCFA as a rounded integer with thousands separators', () => {
    expect(formatPrice(99, 'FCFA')).toBe('64 940 FCFA');
  });
});

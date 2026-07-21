import { describe, it, expect } from 'vitest';
import { calculatePnl, calculateRisk, calculateRMultiple } from '../calculations';

describe('calculatePnl', () => {
  it('computes a positive result for a winning long trade', () => {
    const result = calculatePnl({
      entryPrice: 1.085,
      exitPrice: 1.087,
      quantity: 1,
      direction: 'long',
      pointValue: 10000,
    });
    expect(result).toBeCloseTo(20, 5);
  });

  it('inverts the sign for a short trade', () => {
    const result = calculatePnl({
      entryPrice: 1.087,
      exitPrice: 1.085,
      quantity: 1,
      direction: 'short',
      pointValue: 10000,
    });
    expect(result).toBeCloseTo(20, 5);
  });

  it('computes a negative result for a losing long trade', () => {
    const result = calculatePnl({
      entryPrice: 1.087,
      exitPrice: 1.085,
      quantity: 1,
      direction: 'long',
      pointValue: 10000,
    });
    expect(result).toBeCloseTo(-20, 5);
  });
});

describe('calculateRisk', () => {
  it('computes risk as absolute distance to stop', () => {
    const result = calculateRisk({
      entryPrice: 1.085,
      stopLossPrice: 1.08,
      quantity: 1,
      pointValue: 10000,
    });
    expect(result).toBeCloseTo(50, 5);
  });

  it('returns null when there is no stop loss', () => {
    const result = calculateRisk({
      entryPrice: 1.085,
      stopLossPrice: null,
      quantity: 1,
      pointValue: 10000,
    });
    expect(result).toBeNull();
  });
});

describe('calculateRMultiple', () => {
  it('divides pnl by risk', () => {
    expect(calculateRMultiple(100, 50)).toBe(2);
  });

  it('returns null when risk is null', () => {
    expect(calculateRMultiple(100, null)).toBeNull();
  });

  it('returns null when risk is zero', () => {
    expect(calculateRMultiple(100, 0)).toBeNull();
  });
});

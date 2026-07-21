import { describe, it, expect } from 'vitest';
import {
  calculateWinRate,
  calculateProfitFactor,
  calculateExpectancy,
  calculateEquityCurve,
  type ClosedTradeStat,
} from '../stats';

const sample: ClosedTradeStat[] = [
  { id: '1', pnlAmount: 100, rMultiple: 2, exitedAt: new Date('2026-01-01') },
  { id: '2', pnlAmount: -50, rMultiple: -1, exitedAt: new Date('2026-01-02') },
  { id: '3', pnlAmount: 200, rMultiple: 3, exitedAt: new Date('2026-01-03') },
  { id: '4', pnlAmount: -50, rMultiple: -1, exitedAt: new Date('2026-01-04') },
];

describe('calculateWinRate', () => {
  it('returns the percentage of trades with positive pnl', () => {
    expect(calculateWinRate(sample)).toBe(50);
  });

  it('returns 0 for an empty list', () => {
    expect(calculateWinRate([])).toBe(0);
  });
});

describe('calculateProfitFactor', () => {
  it('divides gross profit by gross loss', () => {
    // gains: 100+200=300, losses: 50+50=100 -> 3
    expect(calculateProfitFactor(sample)).toBe(3);
  });

  it('returns null when there are no losing trades', () => {
    const onlyWins: ClosedTradeStat[] = [
      { id: '1', pnlAmount: 100, rMultiple: 2, exitedAt: new Date() },
    ];
    expect(calculateProfitFactor(onlyWins)).toBeNull();
  });
});

describe('calculateExpectancy', () => {
  it('averages the r-multiple across trades that have one', () => {
    // (2 + -1 + 3 + -1) / 4 = 0.75
    expect(calculateExpectancy(sample)).toBeCloseTo(0.75, 5);
  });

  it('returns null when no trade has an r-multiple', () => {
    const noR: ClosedTradeStat[] = [
      { id: '1', pnlAmount: 100, rMultiple: null, exitedAt: new Date() },
    ];
    expect(calculateExpectancy(noR)).toBeNull();
  });
});

describe('calculateEquityCurve', () => {
  it('returns cumulative pnl ordered by exit date', () => {
    const curve = calculateEquityCurve(sample);
    expect(curve).toEqual([
      { date: new Date('2026-01-01'), cumulativePnl: 100 },
      { date: new Date('2026-01-02'), cumulativePnl: 50 },
      { date: new Date('2026-01-03'), cumulativePnl: 250 },
      { date: new Date('2026-01-04'), cumulativePnl: 200 },
    ]);
  });
});

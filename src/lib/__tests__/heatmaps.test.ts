import { describe, it, expect } from 'vitest';
import {
  heatmapBySymbolAndDay,
  heatmapBySymbolAndMonth,
  heatmapBySymbolAndDuration,
  type HeatmapTrade,
} from '../heatmaps';

// 2026-01-05 is a Monday, 2026-01-06 is a Tuesday
const trades: HeatmapTrade[] = [
  {
    instrumentName: 'EURUSD',
    pnlAmount: 10,
    enteredAt: new Date('2026-01-05T09:00:00Z'),
    exitedAt: new Date('2026-01-05T09:30:00Z'),
  },
  {
    instrumentName: 'EURUSD',
    pnlAmount: -5,
    enteredAt: new Date('2026-01-06T09:00:00Z'),
    exitedAt: new Date('2026-01-06T11:00:00Z'),
  },
  {
    instrumentName: 'XAUUSD',
    pnlAmount: 20,
    enteredAt: new Date('2026-02-05T09:00:00Z'),
    exitedAt: new Date('2026-02-05T09:15:00Z'),
  },
];

describe('heatmapBySymbolAndDay', () => {
  it('sums pnl by instrument and day of week (0=Sunday)', () => {
    const result = heatmapBySymbolAndDay(trades);
    expect(result.EURUSD[1]).toBe(10); // Monday
    expect(result.EURUSD[2]).toBe(-5); // Tuesday
    expect(result.XAUUSD[4]).toBe(20); // Thursday
  });
});

describe('heatmapBySymbolAndMonth', () => {
  it('sums pnl by instrument and month (1-12)', () => {
    const result = heatmapBySymbolAndMonth(trades);
    expect(result.EURUSD[1]).toBe(5); // January: 10 + -5
    expect(result.XAUUSD[2]).toBe(20); // February
  });
});

describe('heatmapBySymbolAndDuration', () => {
  it('buckets trades by duration and sums pnl', () => {
    const result = heatmapBySymbolAndDuration(trades);
    // EURUSD trade 1: 30 minutes -> inclusive up to 30, so "<30m"
    expect(result.EURUSD['<30m']).toBe(10);
    // EURUSD trade 2: 2 hours -> "1h-4h"
    expect(result.EURUSD['1h-4h']).toBe(-5);
    // XAUUSD trade: 15 minutes -> "<30m" (this bucket has no lower floor,
    // so any short trade — even a 2-minute scalp — lands here too)
    expect(result.XAUUSD['<30m']).toBe(20);
  });
});

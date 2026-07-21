import { describe, it, expect } from 'vitest';
import {
  calculateDailyLossStatus,
  calculateWeeklyLossStatus,
  calculateMonthlyLossStatus,
} from '../loss-limits';

const trades = [
  { pnlAmount: -30, exitedAt: new Date('2026-01-06T10:00:00Z') }, // Tuesday, in week of Jan 5-11
  { pnlAmount: -20, exitedAt: new Date('2026-01-06T14:00:00Z') },
  { pnlAmount: 50, exitedAt: new Date('2026-01-06T16:00:00Z') },
  { pnlAmount: -10, exitedAt: new Date('2026-01-08T10:00:00Z') }, // different day, same week/month
];

const referenceDate = new Date('2026-01-06T23:00:00Z');

describe('calculateDailyLossStatus', () => {
  it('sums only the losing trades for the reference day', () => {
    const status = calculateDailyLossStatus(trades, 100, referenceDate);
    expect(status.currentLoss).toBe(50); // 30 + 20, the +50 win is excluded
    expect(status.limit).toBe(100);
    expect(status.percentUsed).toBe(50);
  });

  it('returns null percentUsed when no limit is set', () => {
    const status = calculateDailyLossStatus(trades, null, referenceDate);
    expect(status.limit).toBeNull();
    expect(status.percentUsed).toBeNull();
  });
});

describe('calculateWeeklyLossStatus', () => {
  it('sums losses across the whole week (Mon-Sun)', () => {
    const status = calculateWeeklyLossStatus(trades, 200, referenceDate);
    expect(status.currentLoss).toBe(60); // 30 + 20 + 10
    expect(status.percentUsed).toBe(30);
  });
});

describe('calculateMonthlyLossStatus', () => {
  it('sums losses across the whole calendar month', () => {
    const status = calculateMonthlyLossStatus(trades, 1000, referenceDate);
    expect(status.currentLoss).toBe(60);
    expect(status.percentUsed).toBe(6);
  });
});

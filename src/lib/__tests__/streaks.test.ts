import { describe, it, expect } from 'vitest';
import { calculateStreaks } from '../streaks';

describe('calculateStreaks', () => {
  it('computes current streak, max streaks, and average streak lengths', () => {
    // order matters: sorted by exitedAt ascending
    const trades = [
      { pnlAmount: 10, exitedAt: new Date('2026-01-01') }, // win streak 1
      { pnlAmount: 10, exitedAt: new Date('2026-01-02') }, // win streak 2
      { pnlAmount: 10, exitedAt: new Date('2026-01-03') }, // win streak 3
      { pnlAmount: -10, exitedAt: new Date('2026-01-04') }, // loss streak 1
      { pnlAmount: -10, exitedAt: new Date('2026-01-05') }, // loss streak 2
      { pnlAmount: 10, exitedAt: new Date('2026-01-06') }, // win streak 1 (current)
    ];
    const result = calculateStreaks(trades);
    expect(result.maxWinStreak).toBe(3);
    expect(result.maxLossStreak).toBe(2);
    expect(result.currentStreak).toBe(1); // 1 win in progress
    expect(result.avgWinStreak).toBeCloseTo(2, 5); // streaks of 3 and 1 -> avg 2
    expect(result.avgLossStreak).toBe(2); // one streak of 2
  });

  it('returns zeroed stats for an empty list', () => {
    const result = calculateStreaks([]);
    expect(result).toEqual({
      currentStreak: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
      avgWinStreak: 0,
      avgLossStreak: 0,
    });
  });
});

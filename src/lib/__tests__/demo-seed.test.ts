import { describe, it, expect } from 'vitest';
import { DEMO_TRADE_TEMPLATES } from '../demo-seed';

describe('DEMO_TRADE_TEMPLATES', () => {
  it('contains between 15 and 20 trades', () => {
    expect(DEMO_TRADE_TEMPLATES.length).toBeGreaterThanOrEqual(15);
    expect(DEMO_TRADE_TEMPLATES.length).toBeLessThanOrEqual(20);
  });

  it('produces a win rate between 50% and 70%', () => {
    const wins = DEMO_TRADE_TEMPLATES.filter((t) => {
      const rawDelta = t.exitPrice - t.entryPrice;
      const signedDelta = t.direction === 'long' ? rawDelta : -rawDelta;
      return signedDelta > 0;
    }).length;
    const winRate = (wins / DEMO_TRADE_TEMPLATES.length) * 100;
    expect(winRate).toBeGreaterThanOrEqual(50);
    expect(winRate).toBeLessThanOrEqual(70);
  });

  it('references only instrument indexes 0, 1, or 2, and strategy indexes 0 or 1', () => {
    for (const template of DEMO_TRADE_TEMPLATES) {
      expect([0, 1, 2]).toContain(template.instrumentIndex);
      expect([0, 1]).toContain(template.strategyIndex);
    }
  });

  it('has at least 3 trades with a checklist error, and all indexes are 0-3', () => {
    const withError = DEMO_TRADE_TEMPLATES.filter((t) => t.checklistErrorIndex !== null);
    expect(withError.length).toBeGreaterThanOrEqual(3);
    for (const template of withError) {
      expect(template.checklistErrorIndex).toBeGreaterThanOrEqual(0);
      expect(template.checklistErrorIndex).toBeLessThanOrEqual(3);
    }
  });
});

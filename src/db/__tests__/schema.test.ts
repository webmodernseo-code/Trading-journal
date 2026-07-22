import { describe, it, expect } from 'vitest';
import { users, instruments, strategies, checklistRules, trades, tradeChecklistResponses, tradeScreenshots } from '../schema';

describe('schema', () => {
  it('exports all four tables', () => {
    expect(users).toBeDefined();
    expect(instruments).toBeDefined();
    expect(strategies).toBeDefined();
    expect(checklistRules).toBeDefined();
  });

  it('exports the trade tables', () => {
    expect(trades).toBeDefined();
    expect(tradeChecklistResponses).toBeDefined();
    expect(tradeScreenshots).toBeDefined();
  });
});

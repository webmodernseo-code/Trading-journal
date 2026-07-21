import { describe, it, expect } from 'vitest';
import { calculateErrorsAnalytics, type ChecklistResponseRecord } from '../errors-analytics';

describe('calculateErrorsAnalytics', () => {
  it('aggregates totals, by-category counts, and by-phase counts', () => {
    const tradesWithResponses: { tradeId: string; responses: ChecklistResponseRecord[] }[] = [
      {
        tradeId: 't1',
        responses: [
          { ruleId: 'r1', ruleLabel: 'Revenge trading', checked: true, phase: 'entry' },
          { ruleId: 'r2', ruleLabel: 'Stop trop serré', checked: false, phase: null },
        ],
      },
      {
        tradeId: 't2',
        responses: [
          { ruleId: 'r1', ruleLabel: 'Revenge trading', checked: true, phase: 'management' },
          { ruleId: 'r2', ruleLabel: 'Stop trop serré', checked: true, phase: 'entry' },
        ],
      },
      {
        tradeId: 't3',
        responses: [
          { ruleId: 'r1', ruleLabel: 'Revenge trading', checked: false, phase: null },
          { ruleId: 'r2', ruleLabel: 'Stop trop serré', checked: false, phase: null },
        ],
      },
    ];

    const result = calculateErrorsAnalytics(tradesWithResponses);

    expect(result.totalTrades).toBe(3);
    expect(result.totalErrors).toBe(3); // 2 revenge trading + 1 stop trop serré
    expect(result.totalTradesWithErrors).toBe(2); // t1 and t2

    const revengeCategory = result.byCategory.find((c) => c.label === 'Revenge trading');
    expect(revengeCategory?.count).toBe(2);
    const stopCategory = result.byCategory.find((c) => c.label === 'Stop trop serré');
    expect(stopCategory?.count).toBe(1);

    expect(result.byPhase['Revenge trading'].entry).toBe(1);
    expect(result.byPhase['Revenge trading'].management).toBe(1);
    expect(result.byPhase['Stop trop serré'].entry).toBe(1);
  });

  it('returns zeroed analytics for no trades', () => {
    const result = calculateErrorsAnalytics([]);
    expect(result.totalTrades).toBe(0);
    expect(result.totalErrors).toBe(0);
    expect(result.totalTradesWithErrors).toBe(0);
    expect(result.byCategory).toEqual([]);
  });
});

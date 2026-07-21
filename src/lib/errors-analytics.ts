export type ChecklistPhase = 'pre_entry' | 'entry' | 'management' | 'exit';

export interface ChecklistResponseRecord {
  ruleId: string;
  ruleLabel: string;
  checked: boolean;
  phase: ChecklistPhase | null;
}

export interface ErrorsAnalytics {
  totalTrades: number;
  totalErrors: number;
  totalTradesWithErrors: number;
  byCategory: { label: string; count: number }[];
  byPhase: Record<string, Record<ChecklistPhase, number>>;
}

function emptyPhaseCounts(): Record<ChecklistPhase, number> {
  return { pre_entry: 0, entry: 0, management: 0, exit: 0 };
}

export function calculateErrorsAnalytics(
  tradesWithResponses: { tradeId: string; responses: ChecklistResponseRecord[] }[]
): ErrorsAnalytics {
  let totalErrors = 0;
  let totalTradesWithErrors = 0;
  const categoryCounts = new Map<string, number>();
  const phaseCounts = new Map<string, Record<ChecklistPhase, number>>();

  for (const trade of tradesWithResponses) {
    let tradeHasError = false;
    for (const response of trade.responses) {
      if (!response.checked) continue;
      tradeHasError = true;
      totalErrors += 1;
      categoryCounts.set(response.ruleLabel, (categoryCounts.get(response.ruleLabel) ?? 0) + 1);
      if (response.phase) {
        if (!phaseCounts.has(response.ruleLabel)) {
          phaseCounts.set(response.ruleLabel, emptyPhaseCounts());
        }
        const counts = phaseCounts.get(response.ruleLabel)!;
        counts[response.phase] += 1;
      }
    }
    if (tradeHasError) totalTradesWithErrors += 1;
  }

  return {
    totalTrades: tradesWithResponses.length,
    totalErrors,
    totalTradesWithErrors,
    byCategory: Array.from(categoryCounts.entries()).map(([label, count]) => ({ label, count })),
    byPhase: Object.fromEntries(phaseCounts.entries()),
  };
}

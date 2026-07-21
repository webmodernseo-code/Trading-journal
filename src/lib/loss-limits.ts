import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface LossLimitStatus {
  currentLoss: number;
  limit: number | null;
  percentUsed: number | null;
}

interface PnlRecord {
  pnlAmount: number;
  exitedAt: Date;
}

function sumLossesBetween(trades: PnlRecord[], start: Date, end: Date): number {
  return trades
    .filter((t) => t.exitedAt >= start && t.exitedAt <= end && t.pnlAmount < 0)
    .reduce((sum, t) => sum + Math.abs(t.pnlAmount), 0);
}

function buildStatus(currentLoss: number, limit: number | null): LossLimitStatus {
  return {
    currentLoss,
    limit,
    percentUsed: limit === null || limit === 0 ? null : (currentLoss / limit) * 100,
  };
}

export function calculateDailyLossStatus(
  trades: PnlRecord[],
  limit: number | null,
  referenceDate: Date
): LossLimitStatus {
  const loss = sumLossesBetween(trades, startOfDay(referenceDate), endOfDay(referenceDate));
  return buildStatus(loss, limit);
}

export function calculateWeeklyLossStatus(
  trades: PnlRecord[],
  limit: number | null,
  referenceDate: Date
): LossLimitStatus {
  const loss = sumLossesBetween(
    trades,
    startOfWeek(referenceDate, { weekStartsOn: 1 }),
    endOfWeek(referenceDate, { weekStartsOn: 1 })
  );
  return buildStatus(loss, limit);
}

export function calculateMonthlyLossStatus(
  trades: PnlRecord[],
  limit: number | null,
  referenceDate: Date
): LossLimitStatus {
  const loss = sumLossesBetween(trades, startOfMonth(referenceDate), endOfMonth(referenceDate));
  return buildStatus(loss, limit);
}

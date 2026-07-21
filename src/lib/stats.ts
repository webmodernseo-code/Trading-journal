export interface ClosedTradeStat {
  id: string;
  pnlAmount: number;
  rMultiple: number | null;
  exitedAt: Date;
}

export function calculateWinRate(trades: ClosedTradeStat[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter((t) => t.pnlAmount > 0).length;
  return (wins / trades.length) * 100;
}

export function calculateProfitFactor(trades: ClosedTradeStat[]): number | null {
  const grossProfit = trades.filter((t) => t.pnlAmount > 0).reduce((sum, t) => sum + t.pnlAmount, 0);
  const grossLoss = Math.abs(
    trades.filter((t) => t.pnlAmount < 0).reduce((sum, t) => sum + t.pnlAmount, 0)
  );
  if (grossLoss === 0) return null;
  return grossProfit / grossLoss;
}

export function calculateExpectancy(trades: ClosedTradeStat[]): number | null {
  const withR = trades.filter((t) => t.rMultiple !== null) as (ClosedTradeStat & { rMultiple: number })[];
  if (withR.length === 0) return null;
  return withR.reduce((sum, t) => sum + t.rMultiple, 0) / withR.length;
}

export function calculateEquityCurve(
  trades: ClosedTradeStat[]
): { date: Date; cumulativePnl: number }[] {
  const sorted = [...trades].sort((a, b) => a.exitedAt.getTime() - b.exitedAt.getTime());
  let running = 0;
  return sorted.map((t) => {
    running += t.pnlAmount;
    return { date: t.exitedAt, cumulativePnl: running };
  });
}

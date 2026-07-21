export type Direction = 'long' | 'short';

export function calculatePnl(params: {
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  direction: Direction;
  pointValue: number;
}): number {
  const { entryPrice, exitPrice, quantity, direction, pointValue } = params;
  const rawDelta = exitPrice - entryPrice;
  const signedDelta = direction === 'long' ? rawDelta : -rawDelta;
  return signedDelta * quantity * pointValue;
}

export function calculateRisk(params: {
  entryPrice: number;
  stopLossPrice: number | null;
  quantity: number;
  pointValue: number;
}): number | null {
  const { entryPrice, stopLossPrice, quantity, pointValue } = params;
  if (stopLossPrice === null) return null;
  return Math.abs(entryPrice - stopLossPrice) * quantity * pointValue;
}

export function calculateRMultiple(pnlAmount: number, riskAmount: number | null): number | null {
  if (riskAmount === null || riskAmount === 0) return null;
  return pnlAmount / riskAmount;
}

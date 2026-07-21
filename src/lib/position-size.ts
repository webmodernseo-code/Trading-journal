export function calculatePositionSize(params: {
  riskAmount: number;
  stopDistance: number;
  pointValue: number;
}): number {
  const { riskAmount, stopDistance, pointValue } = params;
  if (stopDistance <= 0) {
    throw new Error('stopDistance must be greater than zero');
  }
  return riskAmount / (stopDistance * pointValue);
}

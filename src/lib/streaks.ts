export interface StreakStats {
  currentStreak: number; // positive = current winning streak, negative = current losing streak
  maxWinStreak: number;
  maxLossStreak: number;
  avgWinStreak: number;
  avgLossStreak: number;
}

interface PnlRecord {
  pnlAmount: number;
  exitedAt: Date;
}

export function calculateStreaks(trades: PnlRecord[]): StreakStats {
  if (trades.length === 0) {
    return { currentStreak: 0, maxWinStreak: 0, maxLossStreak: 0, avgWinStreak: 0, avgLossStreak: 0 };
  }

  const sorted = [...trades].sort((a, b) => a.exitedAt.getTime() - b.exitedAt.getTime());

  const winStreaks: number[] = [];
  const lossStreaks: number[] = [];
  let currentType: 'win' | 'loss' | null = null;
  let currentLength = 0;

  for (const t of sorted) {
    const type: 'win' | 'loss' = t.pnlAmount >= 0 ? 'win' : 'loss';
    if (type === currentType) {
      currentLength += 1;
    } else {
      if (currentType === 'win') winStreaks.push(currentLength);
      if (currentType === 'loss') lossStreaks.push(currentLength);
      currentType = type;
      currentLength = 1;
    }
  }
  if (currentType === 'win') winStreaks.push(currentLength);
  if (currentType === 'loss') lossStreaks.push(currentLength);

  const avg = (arr: number[]) => (arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length);

  return {
    currentStreak: currentType === 'win' ? currentLength : -currentLength,
    maxWinStreak: winStreaks.length > 0 ? Math.max(...winStreaks) : 0,
    maxLossStreak: lossStreaks.length > 0 ? Math.max(...lossStreaks) : 0,
    avgWinStreak: avg(winStreaks),
    avgLossStreak: avg(lossStreaks),
  };
}

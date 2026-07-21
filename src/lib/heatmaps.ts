export interface HeatmapTrade {
  instrumentName: string;
  pnlAmount: number;
  enteredAt: Date;
  exitedAt: Date;
}

type SymbolBuckets = Record<string, Record<string, number>>;

function addToBucket(buckets: SymbolBuckets, instrument: string, key: string, pnl: number): void {
  if (!buckets[instrument]) buckets[instrument] = {};
  buckets[instrument][key] = (buckets[instrument][key] ?? 0) + pnl;
}

export function heatmapBySymbolAndDay(trades: HeatmapTrade[]): SymbolBuckets {
  const buckets: SymbolBuckets = {};
  for (const t of trades) {
    const day = t.exitedAt.getUTCDay(); // 0=Sunday .. 6=Saturday
    addToBucket(buckets, t.instrumentName, String(day), t.pnlAmount);
  }
  return buckets;
}

export function heatmapBySymbolAndMonth(trades: HeatmapTrade[]): SymbolBuckets {
  const buckets: SymbolBuckets = {};
  for (const t of trades) {
    const month = t.exitedAt.getUTCMonth() + 1; // 1-12
    addToBucket(buckets, t.instrumentName, String(month), t.pnlAmount);
  }
  return buckets;
}

const DURATION_BUCKETS: { label: string; maxMinutes: number }[] = [
  { label: '<30m', maxMinutes: 30 },
  { label: '30m-1h', maxMinutes: 60 },
  { label: '1h-4h', maxMinutes: 240 },
  { label: '4h-1d', maxMinutes: 1440 },
  { label: '>1d', maxMinutes: Infinity },
];

function durationBucketLabel(enteredAt: Date, exitedAt: Date): string {
  const minutes = (exitedAt.getTime() - enteredAt.getTime()) / 60000;
  const bucket = DURATION_BUCKETS.find((b) => minutes <= b.maxMinutes);
  return bucket ? bucket.label : '>1d';
}

export function heatmapBySymbolAndDuration(trades: HeatmapTrade[]): SymbolBuckets {
  const buckets: SymbolBuckets = {};
  for (const t of trades) {
    const label = durationBucketLabel(t.enteredAt, t.exitedAt);
    addToBucket(buckets, t.instrumentName, label, t.pnlAmount);
  }
  return buckets;
}

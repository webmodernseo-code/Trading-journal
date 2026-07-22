import { eq, and, isNotNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { trades, instruments } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { heatmapBySymbolAndDay, heatmapBySymbolAndDuration, heatmapBySymbolAndMonth } from '@/lib/heatmaps';
import { HeatmapGrid } from './HeatmapGrid';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const DURATION_LABELS = ['<30m', '30m-1h', '1h-4h', '4h-1d', '>1d'];

export default async function HeatmapsPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      instrumentName: instruments.name,
      pnlAmount: trades.pnlAmount,
      enteredAt: trades.enteredAt,
      exitedAt: trades.exitedAt,
    })
    .from(trades)
    .innerJoin(instruments, eq(instruments.id, trades.instrumentId))
    .where(and(eq(trades.userId, user.id), eq(trades.status, 'closed'), isNotNull(trades.exitedAt)));

  const heatmapTrades = rows.map((r) => ({
    instrumentName: r.instrumentName,
    pnlAmount: r.pnlAmount ?? 0,
    enteredAt: r.enteredAt,
    exitedAt: r.exitedAt!,
  }));

  const byDay = heatmapBySymbolAndDay(heatmapTrades);
  const byMonth = heatmapBySymbolAndMonth(heatmapTrades);
  const byDuration = heatmapBySymbolAndDuration(heatmapTrades);

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-8">
      <h1 className="text-xl font-bold text-text-primary">Heatmaps de performance</h1>
      <HeatmapGrid title="Symbole × Jour" columns={DAY_LABELS.map((_, i) => String(i))} data={byDay} />
      <HeatmapGrid title="Symbole × Durée" columns={DURATION_LABELS} data={byDuration} />
      <HeatmapGrid title="Symbole × Mois" columns={MONTH_LABELS.map((_, i) => String(i + 1))} data={byMonth} />
    </main>
  );
}

import Link from 'next/link';
import { eq, and, desc } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { trades, instruments, strategies } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { TradeFilters } from './TradeFilters';

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ instrumentId?: string; strategyId?: string; q?: string }>;
}) {
  const user = await requireUser();
  const { instrumentId, strategyId, q } = await searchParams;

  const [instrumentRows, strategyRows] = await Promise.all([
    db.select().from(instruments).where(eq(instruments.userId, user.id)),
    db.select().from(strategies).where(eq(strategies.userId, user.id)),
  ]);

  const conditions = [eq(trades.userId, user.id)];
  if (instrumentId) conditions.push(eq(trades.instrumentId, instrumentId));
  if (strategyId) conditions.push(eq(trades.strategyId, strategyId));

  let rows = await db
    .select()
    .from(trades)
    .where(and(...conditions))
    .orderBy(desc(trades.enteredAt));

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((t) => (t.notes ?? '').toLowerCase().includes(needle));
  }

  const instrumentById = new Map(instrumentRows.map((i) => [i.id, i.name]));
  const t = await getTranslations('trades');

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t('listTitle')}</h1>
        <Link href="/trades/new" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
          + {t('newTitle')}
        </Link>
      </div>
      <TradeFilters instruments={instrumentRows} strategies={strategyRows} />
      <table className="w-full text-left text-text-primary">
        <thead className="text-text-muted">
          <tr>
            <th className="p-2">{t('date')}</th>
            <th className="p-2">{t('instrument')}</th>
            <th className="p-2">{t('direction')}</th>
            <th className="p-2">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((trade) => (
            <tr key={trade.id} className="border-t border-border-subtle">
              <td className="p-2">
                <Link href={`/trades/${trade.id}`}>{trade.enteredAt.toLocaleDateString()}</Link>
              </td>
              <td className="p-2">{instrumentById.get(trade.instrumentId)}</td>
              <td className="p-2">{trade.direction}</td>
              <td className={`p-2 ${trade.pnlAmount && trade.pnlAmount >= 0 ? 'text-gain' : 'text-loss'}`}>
                {trade.pnlAmount ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="mt-4 text-text-muted">{t('empty')}</p>}
    </main>
  );
}

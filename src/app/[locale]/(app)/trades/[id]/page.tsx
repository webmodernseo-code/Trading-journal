import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { trades, instruments, strategies, tradeScreenshots, tradeChecklistResponses, checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { calculateRMultiple } from '@/lib/calculations';
import { ScreenshotUpload } from './ScreenshotUpload';

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const [trade] = await db.select().from(trades).where(eq(trades.id, id)).limit(1);
  if (!trade || trade.userId !== user.id) notFound();

  const [instrument] = await db.select().from(instruments).where(eq(instruments.id, trade.instrumentId)).limit(1);
  const strategy = trade.strategyId
    ? (await db.select().from(strategies).where(eq(strategies.id, trade.strategyId)).limit(1))[0]
    : null;
  const screenshots = await db.select().from(tradeScreenshots).where(eq(tradeScreenshots.tradeId, trade.id));
  const responses = await db
    .select({ label: checklistRules.label, checked: tradeChecklistResponses.checked, phase: tradeChecklistResponses.phase })
    .from(tradeChecklistResponses)
    .innerJoin(checklistRules, eq(checklistRules.id, tradeChecklistResponses.checklistRuleId))
    .where(eq(tradeChecklistResponses.tradeId, trade.id));

  const rMultiple = calculateRMultiple(trade.pnlAmount ?? 0, trade.riskAmount);
  const t = await getTranslations('trades');

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-xl font-bold text-text-primary">
        {instrument?.name} — {trade.direction} — {trade.status}
      </h1>
      <div className="rounded-xl border border-border-subtle bg-surface p-4 text-text-primary">
        <p>{t('entryPrice')}: {trade.entryPrice} — {t('exitPrice')}: {trade.exitPrice ?? '—'}</p>
        <p>{t('quantity')}: {trade.quantity} — {t('strategy')}: {strategy?.name ?? '—'}</p>
        <p className={trade.pnlAmount && trade.pnlAmount >= 0 ? 'text-gain' : 'text-loss'}>
          {t('pnl')}: {trade.pnlAmount ?? '—'} {trade.pnlOverride ? t('pnlOverridden') : ''}
        </p>
        <p>{t('risk')}: {trade.riskAmount ?? '—'} — {t('rMultiple')}: {rMultiple !== null ? rMultiple.toFixed(2) : '—'}</p>
        {trade.notes && <p className="text-text-muted">{trade.notes}</p>}
      </div>

      <div>
        <h2 className="mb-2 font-bold text-text-primary">{t('checklistTitle')}</h2>
        <ul className="space-y-1">
          {responses.map((r, i) => (
            <li key={i} className="text-text-primary">
              {r.checked ? '✓' : '—'} {r.label} {r.checked && r.phase ? `(${r.phase})` : ''}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-bold text-text-primary">{t('screenshotsTitle')}</h2>
        <div className="mb-3 flex flex-wrap gap-3">
          {screenshots.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s.id} src={s.url} alt={s.caption ?? ''} className="h-32 rounded-md border border-border-subtle" />
          ))}
        </div>
        <ScreenshotUpload tradeId={trade.id} />
      </div>
    </main>
  );
}

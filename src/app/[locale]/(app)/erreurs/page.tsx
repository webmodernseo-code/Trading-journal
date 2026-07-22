import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { trades, tradeChecklistResponses, checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { calculateErrorsAnalytics, type ChecklistResponseRecord, type ChecklistPhase } from '@/lib/errors-analytics';

export default async function ErreursPage() {
  const user = await requireUser();

  const userTrades = await db.select({ id: trades.id }).from(trades).where(eq(trades.userId, user.id));

  const tradesWithResponses = await Promise.all(
    userTrades.map(async (trade) => {
      const responses = await db
        .select({
          ruleId: checklistRules.id,
          ruleLabel: checklistRules.label,
          checked: tradeChecklistResponses.checked,
          phase: tradeChecklistResponses.phase,
        })
        .from(tradeChecklistResponses)
        .innerJoin(checklistRules, eq(checklistRules.id, tradeChecklistResponses.checklistRuleId))
        .where(eq(tradeChecklistResponses.tradeId, trade.id));
      return { tradeId: trade.id, responses: responses as ChecklistResponseRecord[] };
    })
  );

  const analytics = calculateErrorsAnalytics(tradesWithResponses);
  const t = await getTranslations('erreurs');
  const tPhase = await getTranslations('trades');
  const phaseLabels: Record<ChecklistPhase, string> = {
    pre_entry: tPhase('phasePreEntry'),
    entry: tPhase('phaseEntry'),
    management: tPhase('phaseManagement'),
    exit: tPhase('phaseExit'),
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-xl font-bold text-text-primary">{t('title')}</h1>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label={t('totalErrors')} value={String(analytics.totalErrors)} />
        <StatCard label={t('categories')} value={String(analytics.byCategory.length)} />
        <StatCard
          label={t('tradesWithErrors')}
          value={
            analytics.totalTrades > 0
              ? `${((analytics.totalTradesWithErrors / analytics.totalTrades) * 100).toFixed(0)}%`
              : '—'
          }
        />
        <StatCard label={t('totalTrades')} value={String(analytics.totalTrades)} />
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface p-4">
        <h2 className="mb-3 font-bold text-text-primary">{t('byCategory')}</h2>
        <ul className="space-y-1">
          {analytics.byCategory
            .sort((a, b) => b.count - a.count)
            .map((c) => (
              <li key={c.label} className="flex justify-between text-text-primary">
                <span>{c.label}</span>
                <span>{c.count}</span>
              </li>
            ))}
          {analytics.byCategory.length === 0 && <p className="text-text-muted">{t('empty')}</p>}
        </ul>
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface p-4">
        <h2 className="mb-3 font-bold text-text-primary">{t('byPhase')}</h2>
        <table className="w-full text-sm text-text-primary">
          <thead className="text-text-muted">
            <tr>
              <th className="p-1 text-left">{t('category')}</th>
              {(['pre_entry', 'entry', 'management', 'exit'] as ChecklistPhase[]).map((phase) => (
                <th key={phase} className="p-1">{phaseLabels[phase]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(analytics.byPhase).map(([label, counts]) => (
              <tr key={label}>
                <td className="p-1">{label}</td>
                {(['pre_entry', 'entry', 'management', 'exit'] as ChecklistPhase[]).map((phase) => (
                  <td key={phase} className="p-1 text-center">{counts[phase]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-text-primary">{value}</p>
    </div>
  );
}

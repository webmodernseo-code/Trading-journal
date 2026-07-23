import { eq, and, isNotNull } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { TrendingUp, Scale, Target, Flame, type LucideIcon } from 'lucide-react';
import { db } from '@/db/client';
import { trades } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { calculateWinRate, calculateProfitFactor, calculateExpectancy, calculateEquityCurve } from '@/lib/stats';
import { calculateDailyLossStatus, calculateWeeklyLossStatus, calculateMonthlyLossStatus } from '@/lib/loss-limits';
import { calculateStreaks } from '@/lib/streaks';
import { calculateRMultiple } from '@/lib/calculations';
import { EquityCurveChart } from './EquityCurveChart';

export default async function DashboardPage() {
  const user = await requireUser();

  const closedTrades = await db
    .select()
    .from(trades)
    .where(and(eq(trades.userId, user.id), eq(trades.status, 'closed'), isNotNull(trades.exitedAt)));

  const statTrades = closedTrades.map((t) => ({
    id: t.id,
    pnlAmount: t.pnlAmount ?? 0,
    rMultiple: calculateRMultiple(t.pnlAmount ?? 0, t.riskAmount),
    exitedAt: t.exitedAt!,
  }));

  const winRate = calculateWinRate(statTrades);
  const profitFactor = calculateProfitFactor(statTrades);
  const expectancy = calculateExpectancy(statTrades);
  const equityCurve = calculateEquityCurve(statTrades);
  const now = new Date();
  const dailyStatus = calculateDailyLossStatus(statTrades, user.dailyLossLimit, now);
  const weeklyStatus = calculateWeeklyLossStatus(statTrades, user.weeklyLossLimit, now);
  const monthlyStatus = calculateMonthlyLossStatus(statTrades, user.monthlyLossLimit, now);
  const streaks = calculateStreaks(statTrades);
  const t = await getTranslations('dashboard');

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <h1 className="text-xl font-bold text-text-primary">{t('title')}</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard Icon={TrendingUp} colorClass="gain" label={t('winRate')} value={`${winRate.toFixed(0)}%`} />
        <StatCard
          Icon={Target}
          colorClass="info"
          label={t('profitFactor')}
          value={profitFactor !== null ? profitFactor.toFixed(2) : '—'}
        />
        <StatCard
          Icon={Scale}
          colorClass="info"
          label={t('expectancy')}
          value={expectancy !== null ? expectancy.toFixed(2) : '—'}
        />
        <StatCard
          Icon={Flame}
          colorClass={streaks.currentStreak >= 0 ? 'gain' : 'loss'}
          label={t('currentStreak')}
          value={String(streaks.currentStreak)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <LossLimitBar label={t('dailyLoss')} status={dailyStatus} />
        <LossLimitBar label={t('weeklyLoss')} status={weeklyStatus} />
        <LossLimitBar label={t('monthlyLoss')} status={monthlyStatus} />
      </div>

      <EquityCurveChart
        data={equityCurve.map((p) => ({ date: p.date.toLocaleDateString(), cumulativePnl: p.cumulativePnl }))}
      />
    </main>
  );
}

// Tailwind safelist (dynamic class names built above must appear literally somewhere):
// bg-gain/15 bg-loss/15 bg-info/15 text-gain text-loss text-info
function StatCard({
  Icon,
  colorClass,
  label,
  value,
}: {
  Icon: LucideIcon;
  colorClass: 'gain' | 'loss' | 'info';
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-${colorClass}/15`}>
        <Icon size={14} className={`text-${colorClass}`} />
      </div>
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-1 text-lg font-bold text-${colorClass}`}>{value}</p>
    </div>
  );
}

function LossLimitBar({
  label,
  status,
}: {
  label: string;
  status: { currentLoss: number; limit: number | null; percentUsed: number | null };
}) {
  const percent = status.percentUsed !== null ? Math.min(status.percentUsed, 100) : 0;
  const barColorClass = percent >= 100 ? 'bg-loss' : percent >= 70 ? 'bg-warning' : 'bg-accent';
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <div className="mb-2 flex justify-between text-sm text-text-primary">
        <span>{label}</span>
        <span>
          {status.currentLoss.toFixed(2)} / {status.limit !== null ? status.limit.toFixed(2) : '—'}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg">
        <div className={`h-full ${barColorClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

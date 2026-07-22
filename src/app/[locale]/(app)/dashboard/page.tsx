import { eq, and, isNotNull } from 'drizzle-orm';
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

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Win rate" value={`${winRate.toFixed(0)}%`} />
        <StatCard label="Profit factor" value={profitFactor !== null ? profitFactor.toFixed(2) : '—'} />
        <StatCard label="Espérance (R)" value={expectancy !== null ? expectancy.toFixed(2) : '—'} />
        <StatCard
          label="Streak actuelle"
          value={String(streaks.currentStreak)}
          valueClassName={streaks.currentStreak >= 0 ? 'text-gain' : 'text-loss'}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <LossLimitBar label="Perte journalière" status={dailyStatus} />
        <LossLimitBar label="Perte hebdomadaire" status={weeklyStatus} />
        <LossLimitBar label="Perte mensuelle" status={monthlyStatus} />
      </div>

      <EquityCurveChart
        data={equityCurve.map((p) => ({ date: p.date.toLocaleDateString(), cumulativePnl: p.cumulativePnl }))}
      />
    </main>
  );
}

function StatCard({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-1 text-lg font-bold ${valueClassName ?? 'text-text-primary'}`}>{value}</p>
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
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <div className="mb-2 flex justify-between text-sm text-text-primary">
        <span>{label}</span>
        <span>
          {status.currentLoss.toFixed(2)} / {status.limit !== null ? status.limit.toFixed(2) : '—'}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg">
        <div
          className={`h-full ${percent >= 100 ? 'bg-loss' : 'bg-accent'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

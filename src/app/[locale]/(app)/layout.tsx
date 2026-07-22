import { eq, and, isNotNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { trades } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { calculateDailyLossStatus } from '@/lib/loss-limits';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const closedTrades = await db
    .select({ pnlAmount: trades.pnlAmount, exitedAt: trades.exitedAt })
    .from(trades)
    .where(and(eq(trades.userId, user.id), eq(trades.status, 'closed'), isNotNull(trades.exitedAt)));

  const records = closedTrades.map((t) => ({ pnlAmount: t.pnlAmount ?? 0, exitedAt: t.exitedAt! }));
  const now = new Date();
  const todayStatus = calculateDailyLossStatus(records, user.dailyLossLimit, now);
  const todayPnl = records
    .filter((t) => t.exitedAt.toDateString() === now.toDateString())
    .reduce((sum, t) => sum + t.pnlAmount, 0);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar todayPnl={todayPnl} todayStatus={todayStatus} />
      <div className="min-w-0 flex-1">
        <TopBar />
        {children}
      </div>
    </div>
  );
}

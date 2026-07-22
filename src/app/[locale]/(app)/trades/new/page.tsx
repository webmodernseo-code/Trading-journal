import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { instruments, strategies, checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { TradeForm } from '../TradeForm';

export default async function NewTradePage() {
  const user = await requireUser();
  const [instrumentRows, strategyRows, checklistRows] = await Promise.all([
    db.select().from(instruments).where(eq(instruments.userId, user.id)),
    db.select().from(strategies).where(eq(strategies.userId, user.id)),
    db.select().from(checklistRules).where(eq(checklistRules.userId, user.id)),
  ]);
  const t = await getTranslations('trades');

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t('newTitle')}</h1>
      <TradeForm instruments={instrumentRows} strategies={strategyRows} checklistRules={checklistRows} />
    </main>
  );
}

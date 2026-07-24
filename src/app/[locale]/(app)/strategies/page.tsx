import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { Trash2 } from 'lucide-react';
import { db } from '@/db/client';
import { strategies } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { StrategyForm } from './StrategyForm';
import { deleteStrategy } from './actions';

export default async function StrategiesPage() {
  const user = await requireUser();
  const rows = await db.select().from(strategies).where(eq(strategies.userId, user.id));
  const t = await getTranslations('strategies');

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t('title')}</h1>
      <StrategyForm />
      <ul className="mt-4 space-y-2">
        {rows.map((strategy) => (
          <li key={strategy.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface p-3">
            <span className="min-w-0 break-words text-text-primary">{strategy.name}{strategy.description ? ` — ${strategy.description}` : ''}</span>
            <form action={async () => { 'use server'; await deleteStrategy(strategy.id); }}>
              <button type="submit" className="flex items-center gap-1 text-sm text-loss">
                <Trash2 size={13} />
                {t('delete')}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}

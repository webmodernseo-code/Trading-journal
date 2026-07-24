import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { Trash2 } from 'lucide-react';
import { db } from '@/db/client';
import { instruments } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { InstrumentForm } from './InstrumentForm';
import { AssetClassBadge } from './AssetClassBadge';
import { deleteInstrument } from './actions';

export default async function InstrumentsPage() {
  const user = await requireUser();
  const rows = await db.select().from(instruments).where(eq(instruments.userId, user.id));
  const t = await getTranslations('instruments');

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t('title')}</h1>
      <InstrumentForm />
      <ul className="mt-4 space-y-2">
        {rows.map((instrument) => (
          <li key={instrument.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface p-3">
            <span className="flex flex-wrap items-center gap-2 break-words text-text-primary">
              {instrument.name}
              <AssetClassBadge assetClass={instrument.assetClass} />
              — {t('pointValue').toLowerCase()}: {instrument.pointValue}
            </span>
            <form action={async () => { 'use server'; await deleteInstrument(instrument.id); }}>
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

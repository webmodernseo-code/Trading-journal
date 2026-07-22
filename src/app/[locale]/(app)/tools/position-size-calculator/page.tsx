import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { instruments } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { Calculator } from './Calculator';

export default async function PositionSizeCalculatorPage() {
  const user = await requireUser();
  const instrumentRows = await db.select().from(instruments).where(eq(instruments.userId, user.id));
  const t = await getTranslations('calculator');

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t('pageTitle')}</h1>
      <Calculator instruments={instrumentRows} defaultAccountBalance={user.accountBalance} />
    </main>
  );
}

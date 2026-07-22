import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { instruments } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { InstrumentForm } from './InstrumentForm';
import { deleteInstrument } from './actions';

export default async function InstrumentsPage() {
  const user = await requireUser();
  const rows = await db.select().from(instruments).where(eq(instruments.userId, user.id));

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">Instruments</h1>
      <InstrumentForm />
      <ul className="mt-4 space-y-2">
        {rows.map((instrument) => (
          <li key={instrument.id} className="flex items-center justify-between rounded-md border border-border-subtle bg-surface p-3">
            <span className="text-text-primary">
              {instrument.name} — {instrument.assetClass} — point value: {instrument.pointValue}
            </span>
            <form action={async () => { 'use server'; await deleteInstrument(instrument.id); }}>
              <button type="submit" className="text-sm text-loss">Supprimer</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}

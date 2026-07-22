'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { instruments, trades } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

export async function createInstrument(formData: FormData) {
  const user = await requireUser();
  await db.insert(instruments).values({
    userId: user.id,
    name: String(formData.get('name')),
    assetClass: String(formData.get('assetClass')) as 'forex' | 'commodity' | 'crypto' | 'index' | 'other',
    pointValue: Number(formData.get('pointValue')),
  });
  revalidatePath('/[locale]/instruments', 'page');
}

export async function deleteInstrument(instrumentId: string) {
  const user = await requireUser();
  const [inUse] = await db.select().from(trades).where(eq(trades.instrumentId, instrumentId)).limit(1);
  if (inUse) {
    throw new Error('Cet instrument est utilisé par au moins un trade et ne peut pas être supprimé.');
  }
  await db
    .delete(instruments)
    .where(and(eq(instruments.id, instrumentId), eq(instruments.userId, user.id)));
  revalidatePath('/[locale]/instruments', 'page');
}

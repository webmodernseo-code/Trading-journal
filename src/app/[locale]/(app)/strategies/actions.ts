'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { strategies, trades } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

export async function createStrategy(formData: FormData) {
  const user = await requireUser();
  await db.insert(strategies).values({
    userId: user.id,
    name: String(formData.get('name')),
    description: formData.get('description') ? String(formData.get('description')) : null,
  });
  revalidatePath('/[locale]/strategies', 'page');
}

export async function deleteStrategy(strategyId: string) {
  const user = await requireUser();
  const [inUse] = await db.select().from(trades).where(eq(trades.strategyId, strategyId)).limit(1);
  if (inUse) {
    throw new Error('Cette stratégie est utilisée par au moins un trade et ne peut pas être supprimée.');
  }
  await db.delete(strategies).where(and(eq(strategies.id, strategyId), eq(strategies.userId, user.id)));
  revalidatePath('/[locale]/strategies', 'page');
}

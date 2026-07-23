'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trades, instruments, strategies } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

export async function clearDemoData() {
  const user = await requireUser();
  // Trades first: instruments/strategies have no cascade on the trades that
  // reference them, so deleting them first would fail with a foreign key error.
  await db.delete(trades).where(and(eq(trades.userId, user.id), eq(trades.isDemo, true)));
  await db.delete(instruments).where(and(eq(instruments.userId, user.id), eq(instruments.isDemo, true)));
  await db.delete(strategies).where(and(eq(strategies.userId, user.id), eq(strategies.isDemo, true)));
  revalidatePath('/[locale]/dashboard', 'page');
}

'use server';

import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trades, tradeScreenshots } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

async function requireOwnedTrade(tradeId: string, userId: string) {
  const [trade] = await db
    .select({ id: trades.id })
    .from(trades)
    .where(and(eq(trades.id, tradeId), eq(trades.userId, userId)))
    .limit(1);
  if (!trade) throw new Error('Trade introuvable');
}

export async function uploadScreenshot(tradeId: string, formData: FormData) {
  const user = await requireUser();
  await requireOwnedTrade(tradeId, user.id);
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) throw new Error('Aucun fichier sélectionné');
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format non supporté — utilise un fichier JPG ou PNG');
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    throw new Error('Fichier trop volumineux (5 Mo maximum)');
  }

  const blob = await put(`trades/${tradeId}/${Date.now()}-${file.name}`, file, { access: 'public' });

  await db.insert(tradeScreenshots).values({
    tradeId,
    url: blob.url,
    caption: String(formData.get('caption') ?? '') || null,
  });

  revalidatePath('/[locale]/trades/[id]', 'page');
}

export async function updateTradePnlOverride(tradeId: string, pnlAmount: number) {
  const user = await requireUser();
  await db
    .update(trades)
    .set({ pnlAmount, pnlOverride: true, updatedAt: new Date() })
    .where(and(eq(trades.id, tradeId), eq(trades.userId, user.id)));
  revalidatePath('/[locale]/trades/[id]', 'page');
}

'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (!value || String(value) === '') return null;
  return Number(value);
}

export async function updateSettings(formData: FormData) {
  const user = await requireUser();

  await db
    .update(users)
    .set({
      accountBalance: Number(formData.get('accountBalance') ?? 0),
      defaultRiskPercent: numberOrNull(formData.get('defaultRiskPercent')),
      dailyLossLimit: numberOrNull(formData.get('dailyLossLimit')),
      weeklyLossLimit: numberOrNull(formData.get('weeklyLossLimit')),
      monthlyLossLimit: numberOrNull(formData.get('monthlyLossLimit')),
      locale: String(formData.get('locale')) === 'en' ? 'en' : 'fr',
    })
    .where(eq(users.id, user.id));

  revalidatePath('/[locale]/settings', 'page');
}

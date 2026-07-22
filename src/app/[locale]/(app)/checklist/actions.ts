'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, max } from 'drizzle-orm';
import { db } from '@/db/client';
import { checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

export async function createChecklistRule(formData: FormData) {
  const user = await requireUser();
  const [{ value: maxOrder }] = await db
    .select({ value: max(checklistRules.displayOrder) })
    .from(checklistRules)
    .where(eq(checklistRules.userId, user.id));

  await db.insert(checklistRules).values({
    userId: user.id,
    label: String(formData.get('label')),
    displayOrder: (maxOrder ?? -1) + 1,
  });
  revalidatePath('/[locale]/checklist', 'page');
}

export async function toggleChecklistRuleActive(ruleId: string, active: boolean) {
  const user = await requireUser();
  await db
    .update(checklistRules)
    .set({ active })
    .where(and(eq(checklistRules.id, ruleId), eq(checklistRules.userId, user.id)));
  revalidatePath('/[locale]/checklist', 'page');
}

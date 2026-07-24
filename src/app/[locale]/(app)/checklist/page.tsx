import { eq, asc } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { ChecklistForm } from './ChecklistForm';
import { toggleChecklistRuleActive } from './actions';

export default async function ChecklistPage() {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(checklistRules)
    .where(eq(checklistRules.userId, user.id))
    .orderBy(asc(checklistRules.displayOrder));
  const t = await getTranslations('checklist');

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t('title')}</h1>
      <ChecklistForm />
      <ul className="mt-4 space-y-2">
        {rows.map((rule) => (
          <li key={rule.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border-subtle bg-surface p-3">
            <span className={`min-w-0 ${rule.active ? 'text-text-primary' : 'text-text-muted line-through'}`}>{rule.label}</span>
            <form action={async () => { 'use server'; await toggleChecklistRuleActive(rule.id, !rule.active); }}>
              <button type="submit" className="text-sm text-accent">
                {rule.active ? t('deactivate') : t('activate')}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}

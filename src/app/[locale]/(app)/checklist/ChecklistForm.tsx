'use client';

import { useTranslations } from 'next-intl';
import { createChecklistRule } from './actions';

export function ChecklistForm() {
  const t = useTranslations('checklist');
  return (
    <form action={createChecklistRule} className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-surface p-4">
      <label className="text-sm text-text-muted">
        {t('label')}
        <input name="label" required className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('add')}
      </button>
    </form>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import { createStrategy } from './actions';

export function StrategyForm() {
  const t = useTranslations('strategies');
  return (
    <form action={createStrategy} className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-surface p-4">
      <label className="text-sm text-text-muted">
        {t('name')}
        <input name="name" required className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <label className="text-sm text-text-muted">
        {t('description')}
        <input name="description" className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('add')}
      </button>
    </form>
  );
}

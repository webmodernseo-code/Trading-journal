'use client';

import { useTranslations } from 'next-intl';
import { createInstrument } from './actions';

export function InstrumentForm() {
  const t = useTranslations('instruments');
  return (
    <form action={createInstrument} className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-surface p-4">
      <label className="text-sm text-text-muted">
        {t('name')}
        <input name="name" required className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <label className="text-sm text-text-muted">
        {t('assetClass')}
        <select name="assetClass" required className="mt-1 block rounded-md bg-bg p-2 text-text-primary">
          <option value="forex">Forex</option>
          <option value="commodity">Commodity</option>
          <option value="crypto">Crypto</option>
          <option value="index">Index</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="text-sm text-text-muted">
        {t('pointValue')}
        <input name="pointValue" type="number" step="any" required className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('add')}
      </button>
    </form>
  );
}

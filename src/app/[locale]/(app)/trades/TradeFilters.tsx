'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Instrument, Strategy } from '@/db/schema';

export function TradeFilters({ instruments, strategies }: { instruments: Instrument[]; strategies: Strategy[] }) {
  const t = useTranslations('trades');
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <select
        defaultValue={searchParams.get('instrumentId') ?? ''}
        onChange={(e) => updateParam('instrumentId', e.target.value)}
        className="rounded-md bg-surface p-2 text-text-primary"
      >
        <option value="">{t('allInstruments')}</option>
        {instruments.map((i) => (
          <option key={i.id} value={i.id}>{i.name}</option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get('strategyId') ?? ''}
        onChange={(e) => updateParam('strategyId', e.target.value)}
        className="rounded-md bg-surface p-2 text-text-primary"
      >
        <option value="">{t('allStrategies')}</option>
        {strategies.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input
        placeholder={t('search')}
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => updateParam('q', e.target.value)}
        className="rounded-md bg-surface p-2 text-text-primary"
      />
    </div>
  );
}

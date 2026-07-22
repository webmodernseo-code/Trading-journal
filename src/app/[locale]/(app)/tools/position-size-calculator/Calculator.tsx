'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Instrument } from '@/db/schema';
import { calculatePositionSize } from '@/lib/position-size';

export function Calculator({
  instruments,
  defaultAccountBalance,
  onCalculated,
}: {
  instruments: Instrument[];
  defaultAccountBalance: number;
  onCalculated?: (quantity: number) => void;
}) {
  const t = useTranslations('calculator');
  const [accountBalance, setAccountBalance] = useState(defaultAccountBalance);
  const [riskPercent, setRiskPercent] = useState(1);
  const [instrumentId, setInstrumentId] = useState(instruments[0]?.id ?? '');
  const [stopDistance, setStopDistance] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCalculate() {
    setError(null);
    const instrument = instruments.find((i) => i.id === instrumentId);
    if (!instrument) {
      setError(t('noInstrument'));
      return;
    }
    const riskAmount = (accountBalance * riskPercent) / 100;
    try {
      const quantity = calculatePositionSize({ riskAmount, stopDistance, pointValue: instrument.pointValue });
      setResult(quantity);
      onCalculated?.(quantity);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
      <label className="block text-sm text-text-muted">
        {t('accountBalance')}
        <input
          type="number"
          value={accountBalance}
          onChange={(e) => setAccountBalance(Number(e.target.value))}
          className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary"
        />
      </label>
      <label className="block text-sm text-text-muted">
        {t('riskPercent')}
        <input
          type="number"
          step="any"
          value={riskPercent}
          onChange={(e) => setRiskPercent(Number(e.target.value))}
          className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary"
        />
      </label>
      <label className="block text-sm text-text-muted">
        {t('instrument')}
        <select
          value={instrumentId}
          onChange={(e) => setInstrumentId(e.target.value)}
          className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary"
        >
          {instruments.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-text-muted">
        {t('stopDistance')}
        <input
          type="number"
          step="any"
          value={stopDistance}
          onChange={(e) => setStopDistance(Number(e.target.value))}
          className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary"
        />
      </label>
      <button type="button" onClick={handleCalculate} className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('calculate')}
      </button>
      {error && <p className="text-loss">{error}</p>}
      {result !== null && !error && (
        <p className="text-accent">{t('result')}: {result.toFixed(4)}</p>
      )}
    </div>
  );
}

'use client';

import { useTranslations } from 'next-intl';
import type { Instrument, Strategy, ChecklistRule } from '@/db/schema';
import { createTrade } from './actions';

export function TradeForm({
  instruments,
  strategies,
  checklistRules,
}: {
  instruments: Instrument[];
  strategies: Strategy[];
  checklistRules: ChecklistRule[];
}) {
  const t = useTranslations('trades');

  return (
    <form action={createTrade} className="space-y-4 rounded-xl border border-border-subtle bg-surface p-6">
      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm text-text-muted">
          {t('instrument')}
          <select name="instrumentId" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary">
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-text-muted">
          {t('strategy')}
          <select name="strategyId" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary">
            <option value="">—</option>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-text-muted">
          {t('direction')}
          <select name="direction" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary">
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </label>
        <label className="text-sm text-text-muted">
          {t('quantity')}
          <input name="quantity" type="number" step="any" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('entryPrice')}
          <input name="entryPrice" type="number" step="any" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('exitPrice')}
          <input name="exitPrice" type="number" step="any" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('stopLoss')}
          <input name="stopLossPrice" type="number" step="any" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('takeProfit')}
          <input name="takeProfitPrice" type="number" step="any" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('enteredAt')}
          <input name="enteredAt" type="datetime-local" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('exitedAt')}
          <input name="exitedAt" type="datetime-local" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
      </div>

      <fieldset className="rounded-md border border-border-subtle p-3">
        <legend className="text-sm text-text-muted">{t('checklistTitle')}</legend>
        {checklistRules.filter((r) => r.active).map((rule) => (
          <div key={rule.id} className="flex items-center gap-3 py-1">
            <label className="flex items-center gap-2 text-text-primary">
              <input type="checkbox" name={`checklist_${rule.id}_checked`} />
              {rule.label}
            </label>
            <select name={`checklist_${rule.id}_phase`} className="rounded-md bg-bg p-1 text-sm text-text-primary">
              <option value="pre_entry">{t('phasePreEntry')}</option>
              <option value="entry">{t('phaseEntry')}</option>
              <option value="management">{t('phaseManagement')}</option>
              <option value="exit">{t('phaseExit')}</option>
            </select>
          </div>
        ))}
      </fieldset>

      <label className="block text-sm text-text-muted">
        {t('notes')}
        <textarea name="notes" rows={3} className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
      </label>

      <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('save')}
      </button>
    </form>
  );
}

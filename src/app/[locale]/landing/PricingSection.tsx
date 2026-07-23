'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatPrice, type Currency } from '@/lib/currency';

const CURRENCIES: Currency[] = ['EUR', 'USD', 'FCFA'];

export function PricingSection() {
  const t = useTranslations('landing.pricing');
  const [currency, setCurrency] = useState<Currency>('EUR');

  return (
    <section id="pricing" className="px-6 py-16 md:py-20">
      <div className="mb-3 text-center">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffa361]">
          {t('eyebrow')}
        </div>
        <h2 className="text-2xl font-extrabold text-[#f9fafb]">{t('title')}</h2>
        <p className="mx-auto mt-2 max-w-sm text-[12.5px] text-[#9ca3af]">{t('subtitle')}</p>
      </div>

      <div className="mb-8 flex justify-center gap-2">
        {CURRENCIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] ${
              currency === c
                ? 'border-[#ffa361] bg-[#ffa361]/15 font-bold text-[#ffa361]'
                : 'border-[rgba(255,255,255,0.08)] text-[#9ca3af]'
            }`}
          >
            {c === 'EUR' ? 'EUR €' : c === 'USD' ? 'USD $' : 'FCFA'}
          </button>
        ))}
      </div>

      <div className="mx-auto flex max-w-lg flex-col gap-4 sm:flex-row">
        <div className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12151a] p-6">
          <p className="mb-1.5 text-[14px] font-bold text-[#f9fafb]">{t('monthly.name')}</p>
          <span className="mb-3 inline-block rounded-full bg-[#ffa361]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#ffa361]">
            {t('trialTag')}
          </span>
          <p className="mb-1 text-[26px] font-extrabold text-[#f9fafb]">
            {formatPrice(5, currency)} <small className="text-[12px] font-medium text-[#9ca3af]">{t('monthly.period')}</small>
          </p>
          <p className="mb-5 text-[11px] text-[#9ca3af]">{t('monthly.note')}</p>
          <Link href="/register" className="block rounded-md bg-[#ffa361] py-2.5 text-center text-[12.5px] font-bold text-[#1a0e05]">
            {t('cta')}
          </Link>
        </div>
        <div className="relative flex-1 rounded-xl border border-[#ffa361] bg-[#12151a] p-6">
          <span className="absolute -top-3 right-4 rounded-full bg-[#ffa361] px-2.5 py-0.5 text-[9px] font-extrabold text-[#1a0e05]">
            {t('bestValue')}
          </span>
          <p className="mb-1.5 text-[14px] font-bold text-[#f9fafb]">{t('lifetime.name')}</p>
          <span className="mb-3 inline-block rounded-full bg-[#ffa361]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#ffa361]">
            {t('trialTag')}
          </span>
          <p className="mb-1 text-[26px] font-extrabold text-[#f9fafb]">
            {formatPrice(99, currency)} <small className="text-[12px] font-medium text-[#9ca3af]">{t('lifetime.period')}</small>
          </p>
          <p className="mb-5 text-[11px] text-[#9ca3af]">{t('lifetime.note')}</p>
          <Link href="/register" className="block rounded-md bg-[#ffa361] py-2.5 text-center text-[12.5px] font-bold text-[#1a0e05]">
            {t('cta')}
          </Link>
        </div>
      </div>
      <p className="mt-6 text-center text-[11px] text-[#6f7480]">{t('noCard')}</p>
    </section>
  );
}

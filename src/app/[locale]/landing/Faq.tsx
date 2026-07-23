'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

export function Faq() {
  const t = useTranslations('landing.faq');
  const questions = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <section id="faq" className="px-6 py-16 md:py-20">
      <div className="mb-8 text-center">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffa361]">
          {t('eyebrow')}
        </div>
        <h2 className="text-2xl font-extrabold text-[#f9fafb]">{t('title')}</h2>
      </div>
      <div className="mx-auto max-w-2xl space-y-3">
        {questions.map((key) => {
          const isOpen = openKey === key;
          return (
            <div key={key} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12151a]">
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : key)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-[13px] font-semibold text-[#f9fafb]">{t(`${key}.question`)}</span>
                <ChevronDown
                  size={16}
                  color="#9ca3af"
                  className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="px-5 pb-4 text-[12.5px] leading-relaxed text-[#9ca3af]">{t(`${key}.answer`)}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

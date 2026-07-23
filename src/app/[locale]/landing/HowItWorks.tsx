import { getTranslations } from 'next-intl/server';
import { playfairItalic } from '../fonts';

export async function HowItWorks() {
  const t = await getTranslations('landing.howItWorks');
  const steps = ['step1', 'step2', 'step3', 'step4'] as const;

  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mb-10 text-center">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffa361]">
          {t('eyebrow')}
        </div>
        <h2 className="text-2xl font-extrabold text-[#f9fafb]">{t('title')}</h2>
        <p className={`${playfairItalic.className} mt-1 text-lg text-[#ffa361]`}>{t('tagline')}</p>
      </div>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {steps.map((key, i) => (
          <div key={key} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#12151a] p-5">
            <div className={`${playfairItalic.className} mb-2 text-2xl font-bold text-[#ffa361]/40`}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <h3 className="mb-1 text-[13.5px] font-bold text-[#f9fafb]">{t(`${key}.title`)}</h3>
            <p className="text-[12px] leading-relaxed text-[#9ca3af]">{t(`${key}.description`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

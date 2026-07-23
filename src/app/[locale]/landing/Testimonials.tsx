import { getTranslations } from 'next-intl/server';
import { Star } from 'lucide-react';

export async function Testimonials() {
  const t = await getTranslations('landing.testimonials');
  const items = ['t1', 't2', 't3'] as const;

  return (
    <section id="avis" className="px-6 py-16 md:py-20">
      <div className="mb-3 text-center">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffa361]">
          {t('eyebrow')}
        </div>
        <h2 className="text-2xl font-extrabold text-[#f9fafb]">{t('title')}</h2>
      </div>
      <p className="mx-auto mb-8 max-w-lg text-center text-[12px] text-[#9ca3af]">
        {t('disclaimer')}
      </p>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((key) => (
          <div key={key} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12151a] p-5">
            <span className="mb-2 inline-block rounded-full bg-[#ffa361]/10 px-2 py-0.5 text-[10px] font-bold text-[#ffa361]">
              {t('exampleTag')}
            </span>
            <div className="mb-2 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={12} fill="#ffa361" color="#ffa361" />
              ))}
            </div>
            <p className="mb-3 text-[12.5px] italic leading-relaxed text-[#c9c7d1]">
              &ldquo;{t(`${key}.quote`)}&rdquo;
            </p>
            <p className="text-[12px] font-bold text-[#f9fafb]">{t(`${key}.name`)}</p>
            <p className="text-[11px] text-[#6f7480]">{t(`${key}.role`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

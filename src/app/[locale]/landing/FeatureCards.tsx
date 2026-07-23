import { getTranslations } from 'next-intl/server';
import { LayoutDashboard, AlertTriangle, LayoutGrid, Calculator } from 'lucide-react';

export async function FeatureCards() {
  const t = await getTranslations('landing.features');

  const items = [
    { Icon: LayoutDashboard, key: 'dashboard' },
    { Icon: AlertTriangle, key: 'errors' },
    { Icon: LayoutGrid, key: 'heatmaps' },
    { Icon: Calculator, key: 'calculator' },
  ] as const;

  return (
    <section id="fonctionnalites" className="px-6 py-16 md:py-20">
      <div className="mb-10 text-center">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffa361]">
          {t('eyebrow')}
        </div>
        <h2 className="text-2xl font-extrabold text-[#f9fafb]">{t('title')}</h2>
      </div>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map(({ Icon, key }) => (
          <div key={key} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12151a] p-5">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffa361]/10">
              <Icon size={18} color="#ffa361" />
            </div>
            <h3 className="mb-1 text-[13.5px] font-bold text-[#f9fafb]">{t(`${key}.title`)}</h3>
            <p className="text-[12px] leading-relaxed text-[#9ca3af]">{t(`${key}.description`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

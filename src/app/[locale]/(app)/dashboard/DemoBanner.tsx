import { getTranslations } from 'next-intl/server';
import { clearDemoData } from './actions';

export async function DemoBanner() {
  const t = await getTranslations('dashboard.demoBanner');
  return (
    <div className="flex flex-col items-start justify-between gap-2 rounded-xl border border-accent-dim bg-accent-dim p-3 text-sm sm:flex-row sm:items-center">
      <span className="text-text-primary">{t('text')}</span>
      <form action={clearDemoData}>
        <button type="submit" className="whitespace-nowrap rounded-md border border-accent px-3 py-1.5 text-xs font-bold text-accent">
          {t('clearButton')}
        </button>
      </form>
    </div>
  );
}

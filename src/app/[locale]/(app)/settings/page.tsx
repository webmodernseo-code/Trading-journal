import { requireUser } from '@/lib/auth-helpers';
import { updateSettings } from './actions';

export default async function SettingsPage() {
  const user = await requireUser();
  const t = await getT();

  return (
    <main className="mx-auto max-w-lg p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t('title')}</h1>
      <form action={updateSettings} className="space-y-4 rounded-xl border border-border-subtle bg-surface p-6">
        <label className="block text-sm text-text-muted">
          {t('accountBalance')}
          <input name="accountBalance" type="number" step="any" defaultValue={user.accountBalance} className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="block text-sm text-text-muted">
          {t('defaultRiskPercent')}
          <input name="defaultRiskPercent" type="number" step="any" defaultValue={user.defaultRiskPercent ?? ''} className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="block text-sm text-text-muted">
          {t('dailyLossLimit')}
          <input name="dailyLossLimit" type="number" step="any" defaultValue={user.dailyLossLimit ?? ''} className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="block text-sm text-text-muted">
          {t('weeklyLossLimit')}
          <input name="weeklyLossLimit" type="number" step="any" defaultValue={user.weeklyLossLimit ?? ''} className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="block text-sm text-text-muted">
          {t('monthlyLossLimit')}
          <input name="monthlyLossLimit" type="number" step="any" defaultValue={user.monthlyLossLimit ?? ''} className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="block text-sm text-text-muted">
          {t('locale')}
          <select name="locale" defaultValue={user.locale} className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary">
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </label>
        <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
          {t('save')}
        </button>
      </form>
    </main>
  );
}

async function getT() {
  const { getTranslations } = await import('next-intl/server');
  return getTranslations('settings');
}

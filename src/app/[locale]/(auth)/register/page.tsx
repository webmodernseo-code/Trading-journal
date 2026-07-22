import { getTranslations } from 'next-intl/server';
import { registerAction } from './actions';

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  const { error } = await searchParams;
  const t = await getTranslations('auth');
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <form action={registerAction} className="w-full max-w-sm rounded-xl border border-border-subtle bg-surface p-6">
        <input type="hidden" name="locale" value={locale} />
        <h1 className="mb-4 text-lg font-bold text-text-primary">{t('registerTitle')}</h1>
        {error === 'CredentialsSignin' && (
          <p className="mb-4 text-sm text-loss">{t('invalidCredentials')}</p>
        )}
        {error === 'EmailInUse' && <p className="mb-4 text-sm text-loss">{t('emailInUse')}</p>}
        <label className="mb-2 block text-sm text-text-muted">
          {t('email')}
          <input name="email" type="email" required className="mt-1 w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="mb-4 block text-sm text-text-muted">
          {t('password')}
          <input name="password" type="password" required minLength={8} className="mt-1 w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <button type="submit" className="w-full rounded-md bg-cta py-2 font-bold text-bg">
          {t('registerSubmit')}
        </button>
      </form>
    </main>
  );
}

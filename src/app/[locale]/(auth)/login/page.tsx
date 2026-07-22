import { getTranslations } from 'next-intl/server';
import { signIn } from '@/auth';

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('auth');

  async function loginAction(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    await signIn('credentials', { email, password, redirectTo: `/${locale}/dashboard` });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <form action={loginAction} className="w-full max-w-sm rounded-xl border border-border-subtle bg-surface p-6">
        <h1 className="mb-4 text-lg font-bold text-text-primary">{t('loginTitle')}</h1>
        <label className="mb-2 block text-sm text-text-muted">
          {t('email')}
          <input name="email" type="email" required className="mt-1 w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="mb-4 block text-sm text-text-muted">
          {t('password')}
          <input name="password" type="password" required className="mt-1 w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <button type="submit" className="w-full rounded-md bg-cta py-2 font-bold text-bg">
          {t('loginSubmit')}
        </button>
      </form>
    </main>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { UserCircle } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function TopBar() {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const withoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/';
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'fr';

  return (
    <div className="flex items-center justify-end gap-2 px-6 pt-4">
      <ThemeToggle />
      <div className="flex overflow-hidden rounded-md border border-border-subtle text-xs">
        <Link
          href={`/fr${withoutLocale}`}
          className={`px-2 py-1 ${currentLocale === 'fr' ? 'bg-accent-dim font-bold text-accent' : 'text-text-muted'}`}
        >
          FR
        </Link>
        <Link
          href={`/en${withoutLocale}`}
          className={`px-2 py-1 ${currentLocale === 'en' ? 'bg-accent-dim font-bold text-accent' : 'text-text-muted'}`}
        >
          EN
        </Link>
      </div>
      <Link
        href="/settings"
        className="flex h-7 w-7 items-center justify-center rounded-full border border-border-subtle bg-surface-2 text-text-muted"
        title={t('account')}
      >
        <UserCircle size={15} />
      </Link>
    </div>
  );
}

'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import type { LossLimitStatus } from '@/lib/loss-limits';

const NAV_GROUPS = [
  {
    labelKey: 'overview',
    links: [
      { href: '/dashboard', labelKey: 'dashboard' },
      { href: '/dashboard/heatmaps', labelKey: 'heatmaps' },
      { href: '/erreurs', labelKey: 'erreurs' },
    ],
  },
  {
    labelKey: 'journal',
    links: [{ href: '/trades', labelKey: 'trades' }],
  },
  {
    labelKey: 'configuration',
    links: [
      { href: '/strategies', labelKey: 'strategies' },
      { href: '/instruments', labelKey: 'instruments' },
      { href: '/checklist', labelKey: 'checklist' },
    ],
  },
  {
    labelKey: 'tools',
    links: [{ href: '/tools/position-size-calculator', labelKey: 'calculator' }],
  },
];

export function Sidebar({ todayPnl, todayStatus }: { todayPnl: number; todayStatus: LossLimitStatus }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  function isActive(href: string) {
    const withoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/';
    return withoutLocale === href;
  }

  return (
    <nav className="flex w-56 flex-shrink-0 flex-col border-r border-border-subtle bg-sidebar p-3">
      <div className="mb-4 flex items-center gap-2 px-2 py-1 text-base font-bold text-text-primary">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="16" height="18" rx="3" stroke="currentColor" className="text-accent" strokeWidth="1.8" />
          <path
            d="M7.5 14L10 11.5L12.5 15L16.5 9.5"
            stroke="currentColor"
            className="text-accent"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Journal
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey} className="mb-4">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-text-faint">
            {t(group.labelKey)}
          </div>
          {group.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-2 py-1.5 text-sm ${
                isActive(link.href)
                  ? 'bg-surface font-semibold text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t(link.labelKey)}
            </Link>
          ))}
        </div>
      ))}

      <div className="mt-auto border-t border-border-subtle pt-3">
        <div className="rounded-lg border border-border-subtle bg-surface p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-text-faint">{t('today')}</span>
            <span className={`text-sm font-bold ${todayPnl >= 0 ? 'text-gain' : 'text-loss'}`}>
              {todayPnl >= 0 ? '+' : ''}
              {todayPnl.toFixed(0)} €
            </span>
          </div>
          {todayStatus.limit !== null && (
            <>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${Math.min(todayStatus.percentUsed ?? 0, 100)}%` }}
                />
              </div>
              <div className="mt-1.5 text-[10.5px] text-text-muted">
                {(todayStatus.percentUsed ?? 0).toFixed(0)}% {t('ofDailyLimit')}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

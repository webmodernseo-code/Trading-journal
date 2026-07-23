'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  LayoutDashboard,
  LayoutGrid,
  AlertTriangle,
  BookOpen,
  BarChart3,
  Coins,
  ClipboardCheck,
  Calculator,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { LossLimitStatus } from '@/lib/loss-limits';

const NAV_GROUPS: { labelKey: string; links: { href: string; labelKey: string; Icon: LucideIcon }[] }[] = [
  {
    labelKey: 'overview',
    links: [
      { href: '/dashboard', labelKey: 'dashboard', Icon: LayoutDashboard },
      { href: '/dashboard/heatmaps', labelKey: 'heatmaps', Icon: LayoutGrid },
      { href: '/erreurs', labelKey: 'erreurs', Icon: AlertTriangle },
    ],
  },
  {
    labelKey: 'journal',
    links: [{ href: '/trades', labelKey: 'trades', Icon: BookOpen }],
  },
  {
    labelKey: 'configuration',
    links: [
      { href: '/strategies', labelKey: 'strategies', Icon: BarChart3 },
      { href: '/instruments', labelKey: 'instruments', Icon: Coins },
      { href: '/checklist', labelKey: 'checklist', Icon: ClipboardCheck },
    ],
  },
  {
    labelKey: 'tools',
    links: [{ href: '/tools/position-size-calculator', labelKey: 'calculator', Icon: Calculator }],
  },
];

export function Sidebar({ todayPnl, todayStatus }: { todayPnl: number; todayStatus: LossLimitStatus }) {
  const pathname = usePathname();
  const t = useTranslations('nav');
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    const withoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/';
    return withoutLocale === href;
  }

  const navContent = (
    <>
      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey} className="mb-4">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-text-faint">
            {t(group.labelKey)}
          </div>
          {group.links.map(({ href, labelKey, Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                isActive(href)
                  ? 'bg-surface font-semibold text-text-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Icon size={15} />
              {t(labelKey)}
            </Link>
          ))}
        </div>
      ))}
    </>
  );

  return (
    <>
      {/* Mobile top strip */}
      <div className="flex items-center justify-between border-b border-border-subtle bg-sidebar px-3 py-2 md:hidden">
        <div className="flex items-center gap-2 text-sm font-bold text-text-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
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
        <button type="button" aria-label={t('menuToggle')} onClick={() => setMobileOpen((open) => !open)} className="text-text-primary">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {mobileOpen && (
        <div className="border-b border-border-subtle bg-sidebar p-3 md:hidden">{navContent}</div>
      )}

      {/* Desktop sidebar */}
      <nav className="hidden w-56 flex-shrink-0 flex-col border-r border-border-subtle bg-sidebar p-3 md:flex">
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

        {navContent}

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
    </>
  );
}

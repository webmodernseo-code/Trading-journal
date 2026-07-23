# App Premium Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the gap between the shipped app and the original "Emerald Terminal" design direction — add a real icon set, a two-token color extension (info/warning) plus asset-class categorical badges, a gradient equity curve, responsive behavior down to mobile (currently absent everywhere), and an auto-seeded, clearly-labeled demo dataset so a new account isn't blank.

**Architecture:** Pure CSS-custom-property additions for the new color tokens (same mechanism as the existing dark/light theme), `lucide-react` (already a dependency from the landing page plan) for every icon, Tailwind responsive prefixes (`md:`, `sm:`) for layout changes, and one new pure-ish seeding module (`src/lib/demo-seed.ts`) wired into the existing `registerAction`, using the app's own already-tested `calculatePnl`/`calculateRisk` functions rather than hand-computed constants.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, `lucide-react`, Drizzle ORM (one new migration), `date-fns` (already a dependency), Vitest.

## Global Constraints

- Reference spec: `docs/superpowers/specs/2026-07-23-app-premium-polish-design.md` — every task below implements a section of it.
- **New color tokens** (added to `src/app/globals.css`'s existing `:root` / `:root[data-theme='light']` blocks, mapped in `tailwind.config.ts` exactly like the existing tokens):
  - `info` — dark `#60a5fa` / light `#2563eb`; `info-dim` — dark `rgba(96,165,250,0.14)` / light `rgba(37,99,235,0.10)`.
  - `warning` — dark `#fbbf24` / light `#d97706`; `warning-dim` — dark `rgba(251,191,36,0.14)` / light `rgba(217,119,6,0.10)`.
  - `asset-commodity` — dark `#c4b5fd` / light `#7c3aed`.
  - `asset-index` — dark `#5eead4` / light `#0d9488`.
  - `info`/`warning` are semantic (fixed meaning: neutral-informative / caution-before-limit) and are reused for the forex/crypto asset-class badges; `asset-commodity`/`asset-index` exist only for the two remaining asset-class badges. Never a hardcoded hex outside these tokens — always the Tailwind class name (`text-info`, `bg-warning-dim`, etc.), consistent with every existing color in this app.
- Responsive target: desktop → ~375px mobile, using Tailwind's default `sm` (640px) and `md` (768px) breakpoints only — no custom breakpoints.
- Every new/changed user-facing string goes through next-intl, with an entry in both `messages/fr.json` and `messages/en.json`.
- Async Server Components use `getTranslations` from `next-intl/server` (awaited); Client Components (`'use client'`) use `useTranslations` from `next-intl`. This exact mistake has broken multiple earlier tasks in this project — double-check on every task that touches a component.
- Demo data must be traceable and reversibly deletable per-user via an `is_demo` boolean column (default `false`) on `instruments`, `strategies`, and `trades` — never guessed at by name-matching.
- This plan touches only the app itself (`src/app/[locale]/(app)/...` and the auth/registration flow) — never the landing page (`src/app/[locale]/landing/...`, `src/app/[locale]/page.tsx`), which keeps its own separate coral/navy identity from the previous plan.

---

## File Structure Overview

```
src/app/globals.css                                        — new color tokens (Task 1)
tailwind.config.ts                                          — new token mappings (Task 1)
src/app/[locale]/(app)/ThemeToggle.tsx                       — Sun/Moon icons (Task 2)
src/app/[locale]/(app)/Sidebar.tsx                           — nav icons + mobile hamburger (Tasks 3, 8)
src/app/[locale]/(app)/TopBar.tsx                            — account icon (Task 3)
src/app/[locale]/(app)/layout.tsx                            — mobile-stacking layout (Task 8)
src/app/[locale]/(app)/dashboard/page.tsx                    — stat icons/colors, demo banner (Tasks 4, 13)
src/app/[locale]/(app)/dashboard/EquityCurveChart.tsx        — gradient fill (Task 5)
src/app/[locale]/(app)/instruments/page.tsx                  — delete icon, asset-class badge (Tasks 6, 7)
src/app/[locale]/(app)/instruments/AssetClassBadge.tsx       — new, shared badge component (Task 7)
src/app/[locale]/(app)/strategies/page.tsx                   — delete icon (Task 6)
src/app/[locale]/(app)/trades/page.tsx                       — responsive card view (Task 9)
src/app/[locale]/(app)/trades/TradeFilters.tsx               — responsive stacking (Task 9)
src/app/[locale]/(app)/dashboard/heatmaps/HeatmapGrid.tsx    — horizontal scroll + sticky column (Task 10)
src/db/schema.ts                                             — is_demo columns (Task 11)
src/lib/demo-seed.ts                                         — new, demo data generator (Task 12)
src/lib/__tests__/demo-seed.test.ts                          — new (Task 12)
src/app/[locale]/(auth)/register/actions.ts                  — call seedDemoData (Task 12)
src/app/[locale]/(app)/dashboard/actions.ts                  — new, clearDemoData action (Task 13)
src/app/[locale]/(app)/dashboard/DemoBanner.tsx              — new (Task 13)
src/app/[locale]/(app)/trades/[id]/ScreenshotUpload.tsx      — upload icon (Task 14)
messages/fr.json, messages/en.json                          — new keys, added per task
```

---

### Task 1: New color tokens

**Files:**
- Modify: `src/app/globals.css`
- Modify: `tailwind.config.ts`

**Interfaces:**
- Consumes: none.
- Produces: Tailwind classes `text-info`/`bg-info`/`border-info`, `bg-info-dim`, `text-warning`/`bg-warning`, `bg-warning-dim`, `text-asset-commodity`/`bg-asset-commodity`, `text-asset-index`/`bg-asset-index` — used by Tasks 4, 7.

- [ ] **Step 1: Add the new CSS custom properties**

In `src/app/globals.css`, add these four lines to the `:root { ... }` block (after `--color-cta: #ffffff;`):

```css
  --color-info: #60a5fa;
  --color-info-dim: rgba(96, 165, 250, 0.14);
  --color-warning: #fbbf24;
  --color-warning-dim: rgba(251, 191, 36, 0.14);
  --color-asset-commodity: #c4b5fd;
  --color-asset-index: #5eead4;
```

And these six lines to the `:root[data-theme='light'] { ... }` block (after `--color-cta: #10171a;`):

```css
  --color-info: #2563eb;
  --color-info-dim: rgba(37, 99, 235, 0.1);
  --color-warning: #d97706;
  --color-warning-dim: rgba(217, 119, 6, 0.1);
  --color-asset-commodity: #7c3aed;
  --color-asset-index: #0d9488;
```

- [ ] **Step 2: Map the tokens in Tailwind**

In `tailwind.config.ts`, add these lines to `theme.extend.colors` (after `cta: 'var(--color-cta)',`):

```typescript
        info: 'var(--color-info)',
        'info-dim': 'var(--color-info-dim)',
        warning: 'var(--color-warning)',
        'warning-dim': 'var(--color-warning-dim)',
        'asset-commodity': 'var(--color-asset-commodity)',
        'asset-index': 'var(--color-asset-index)',
```

- [ ] **Step 3: Verify the app still builds**

Run: `npx tsc --noEmit`
Expected: no errors (CSS/Tailwind config changes don't affect `tsc`, but this confirms nothing else broke).

Run: `npm test`
Expected: all existing tests still pass (this task touches no logic).

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css tailwind.config.ts
git commit -m "feat: add info/warning/asset-class color tokens"
```

---

### Task 2: Theme toggle icons

**Files:**
- Modify: `src/app/[locale]/(app)/ThemeToggle.tsx`

**Interfaces:**
- Consumes: none.
- Produces: none (leaf component, no other task depends on its internals).

- [ ] **Step 1: Replace the unicode glyphs with lucide icons**

Replace the full contents of `src/app/[locale]/(app)/ThemeToggle.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export function ThemeToggle() {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    setThemeState(current);
  }, []);

  function apply(mode: 'dark' | 'light') {
    if (mode === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', mode);
    setThemeState(mode);
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border-subtle p-0.5">
      <button
        type="button"
        onClick={() => apply('dark')}
        aria-label="Dark theme"
        className={`flex h-6 w-7 items-center justify-center rounded-full ${
          theme === 'dark' ? 'bg-accent-dim text-accent' : 'text-text-muted'
        }`}
      >
        <Moon size={13} />
      </button>
      <button
        type="button"
        onClick={() => apply('light')}
        aria-label="Light theme"
        className={`flex h-6 w-7 items-center justify-center rounded-full ${
          theme === 'light' ? 'bg-accent-dim text-accent' : 'text-text-muted'
        }`}
      >
        <Sun size={13} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/ThemeToggle.tsx"
git commit -m "feat: replace theme toggle unicode glyphs with lucide icons"
```

---

### Task 3: Sidebar and TopBar icons

**Files:**
- Modify: `src/app/[locale]/(app)/Sidebar.tsx`
- Modify: `src/app/[locale]/(app)/TopBar.tsx`

**Interfaces:**
- Consumes: none.
- Produces: none.

- [ ] **Step 1: Add an icon per nav item to Sidebar**

In `src/app/[locale]/(app)/Sidebar.tsx`, add the lucide import and an `Icon` field to every entry in `NAV_GROUPS`, then render it before the label. Replace the file's contents from the top through the closing of the component (keep the `mt-auto` today-summary block at the end unchanged):

```tsx
'use client';

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

  function isActive(href: string) {
    const withoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/';
    return withoutLocale === href;
  }

  return (
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

      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey} className="mb-4">
          <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-text-faint">
            {t(group.labelKey)}
          </div>
          {group.links.map(({ href, labelKey, Icon }) => (
            <Link
              key={href}
              href={href}
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
```

Note: `hidden ... md:flex` on the root `<nav>` is new in this step (previously always `flex`) — this is intentional groundwork for Task 8's mobile nav, which adds the mobile-only replacement. Without Task 8, the sidebar would simply disappear below 768px; Task 8 (later in this same plan) fixes that. Do not skip ahead — implement this step exactly as shown, Task 8 depends on this exact starting point.

- [ ] **Step 2: Replace TopBar's account bullet with a lucide icon**

In `src/app/[locale]/(app)/TopBar.tsx`, add the import and replace the account `<Link>`'s content:

```tsx
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
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/Sidebar.tsx" "src/app/[locale]/(app)/TopBar.tsx"
git commit -m "feat: add lucide icons to sidebar nav and account link"
```

---

### Task 4: Dashboard stat icons and semantic colors

**Files:**
- Modify: `src/app/[locale]/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `info`/`warning` tokens (Task 1).
- Produces: none.

- [ ] **Step 1: Add icons and reassign colors on the stat cards, add the 3-tier loss-limit color**

Replace `src/app/[locale]/(app)/dashboard/page.tsx`'s imports and the `StatCard`/`LossLimitBar` usage plus their function definitions:

```tsx
import { eq, and, isNotNull } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { TrendingUp, Scale, Target, Flame, type LucideIcon } from 'lucide-react';
import { db } from '@/db/client';
import { trades } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { calculateWinRate, calculateProfitFactor, calculateExpectancy, calculateEquityCurve } from '@/lib/stats';
import { calculateDailyLossStatus, calculateWeeklyLossStatus, calculateMonthlyLossStatus } from '@/lib/loss-limits';
import { calculateStreaks } from '@/lib/streaks';
import { calculateRMultiple } from '@/lib/calculations';
import { EquityCurveChart } from './EquityCurveChart';

export default async function DashboardPage() {
  const user = await requireUser();

  const closedTrades = await db
    .select()
    .from(trades)
    .where(and(eq(trades.userId, user.id), eq(trades.status, 'closed'), isNotNull(trades.exitedAt)));

  const statTrades = closedTrades.map((t) => ({
    id: t.id,
    pnlAmount: t.pnlAmount ?? 0,
    rMultiple: calculateRMultiple(t.pnlAmount ?? 0, t.riskAmount),
    exitedAt: t.exitedAt!,
  }));

  const winRate = calculateWinRate(statTrades);
  const profitFactor = calculateProfitFactor(statTrades);
  const expectancy = calculateExpectancy(statTrades);
  const equityCurve = calculateEquityCurve(statTrades);
  const now = new Date();
  const dailyStatus = calculateDailyLossStatus(statTrades, user.dailyLossLimit, now);
  const weeklyStatus = calculateWeeklyLossStatus(statTrades, user.weeklyLossLimit, now);
  const monthlyStatus = calculateMonthlyLossStatus(statTrades, user.monthlyLossLimit, now);
  const streaks = calculateStreaks(statTrades);
  const t = await getTranslations('dashboard');

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
      <h1 className="text-xl font-bold text-text-primary">{t('title')}</h1>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard Icon={TrendingUp} colorClass="gain" label={t('winRate')} value={`${winRate.toFixed(0)}%`} />
        <StatCard
          Icon={Target}
          colorClass="info"
          label={t('profitFactor')}
          value={profitFactor !== null ? profitFactor.toFixed(2) : '—'}
        />
        <StatCard
          Icon={Scale}
          colorClass="info"
          label={t('expectancy')}
          value={expectancy !== null ? expectancy.toFixed(2) : '—'}
        />
        <StatCard
          Icon={Flame}
          colorClass={streaks.currentStreak >= 0 ? 'gain' : 'loss'}
          label={t('currentStreak')}
          value={String(streaks.currentStreak)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <LossLimitBar label={t('dailyLoss')} status={dailyStatus} />
        <LossLimitBar label={t('weeklyLoss')} status={weeklyStatus} />
        <LossLimitBar label={t('monthlyLoss')} status={monthlyStatus} />
      </div>

      <EquityCurveChart
        data={equityCurve.map((p) => ({ date: p.date.toLocaleDateString(), cumulativePnl: p.cumulativePnl }))}
      />
    </main>
  );
}

function StatCard({
  Icon,
  colorClass,
  label,
  value,
}: {
  Icon: LucideIcon;
  colorClass: 'gain' | 'loss' | 'info';
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <div className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-${colorClass}-dim`}>
        <Icon size={14} className={`text-${colorClass}`} />
      </div>
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-1 text-lg font-bold text-${colorClass}`}>{value}</p>
    </div>
  );
}

function LossLimitBar({
  label,
  status,
}: {
  label: string;
  status: { currentLoss: number; limit: number | null; percentUsed: number | null };
}) {
  const percent = status.percentUsed !== null ? Math.min(status.percentUsed, 100) : 0;
  const barColorClass = percent >= 100 ? 'bg-loss' : percent >= 70 ? 'bg-warning' : 'bg-accent';
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <div className="mb-2 flex justify-between text-sm text-text-primary">
        <span>{label}</span>
        <span>
          {status.currentLoss.toFixed(2)} / {status.limit !== null ? status.limit.toFixed(2) : '—'}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg">
        <div className={`h-full ${barColorClass}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
```

Note on `bg-${colorClass}-dim` / `text-${colorClass}`: Tailwind's JIT compiler needs to see full class name strings in source to generate them — dynamic template-literal class names normally risk being purged. This works here because `gain`, `loss`, and `info` (the only three values `colorClass` ever takes) already appear as complete literal class names elsewhere in this same file (`text-gain`/`text-loss` in the streak/PnL logic, `text-info`/`bg-info-dim` nowhere else yet) and across the app (`bg-gain/20`, `text-loss`, etc. in `HeatmapGrid.tsx`) — Tailwind's scanner covers the whole `src/**/*.{ts,tsx}` glob (see `tailwind.config.ts`'s `content` field), so as long as the literal strings `bg-gain-dim`, `bg-loss-dim`, `bg-info-dim`, `text-gain`, `text-loss`, `text-info` each appear verbatim *somewhere* in the codebase, they'll be generated. They do not all currently exist as literal strings — add this safelist comment directly above the `StatCard` function so the literal strings are physically present in the file for Tailwind's scanner:

```tsx
// Tailwind safelist (dynamic class names built above must appear literally somewhere):
// bg-gain-dim bg-loss-dim bg-info-dim text-gain text-loss text-info
```

- [ ] **Step 2: Run the type check and test suite**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm test`
Expected: all existing tests pass unchanged (this task is presentation-only, no calculation logic touched).

- [ ] **Step 3: Manually verify**

Run: `npm run dev`, log in, visit `/fr/dashboard`.
Expected: each stat card shows an icon in a tinted pastille; win rate and streak are green/red (gain/loss), profit factor and expectancy are blue (info); loss-limit bars turn amber once a limit exceeds 70% usage (test by temporarily setting a low `dailyLossLimit` in Settings if no trade currently crosses 70%) and red at 100%+.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/dashboard/page.tsx"
git commit -m "feat: add stat icons and info/warning colors to dashboard"
```

---

### Task 5: Equity curve gradient fill

**Files:**
- Modify: `src/app/[locale]/(app)/dashboard/EquityCurveChart.tsx`

**Interfaces:**
- Consumes: none.
- Produces: none.

- [ ] **Step 1: Add a gradient area fill under the line**

Replace `src/app/[locale]/(app)/dashboard/EquityCurveChart.tsx`:

```tsx
'use client';

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function EquityCurveChart({ data }: { data: { date: string; cumulativePnl: number }[] }) {
  return (
    <div className="h-40 rounded-xl border border-border-subtle bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" stroke="var(--color-muted)" fontSize={11} />
          <YAxis stroke="var(--color-muted)" fontSize={11} />
          <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
          <Area
            type="monotone"
            dataKey="cumulativePnl"
            stroke="var(--color-accent)"
            strokeWidth={2}
            fill="url(#equityFill)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
```

(`recharts`' `AreaChart`/`Area` is a drop-in replacement for `LineChart`/`Line` for this purpose — same props, adds the `fill` prop for the gradient.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify**

Run: `npm run dev`, visit `/fr/dashboard` with at least one closed trade.
Expected: the equity curve chart shows a soft gradient fill under the line, fading to transparent, matching the landing page's chart treatment.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/dashboard/EquityCurveChart.tsx"
git commit -m "feat: add gradient fill to the equity curve chart"
```

---

### Task 6: Delete button icons

**Files:**
- Modify: `src/app/[locale]/(app)/instruments/page.tsx`
- Modify: `src/app/[locale]/(app)/strategies/page.tsx`

**Interfaces:**
- Consumes: none.
- Produces: none.

- [ ] **Step 1: Add a Trash2 icon to the instruments delete button**

In `src/app/[locale]/(app)/instruments/page.tsx`, add the import and update the delete button:

```tsx
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { Trash2 } from 'lucide-react';
import { db } from '@/db/client';
import { instruments } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { InstrumentForm } from './InstrumentForm';
import { deleteInstrument } from './actions';
```

And the button itself:

```tsx
            <form action={async () => { 'use server'; await deleteInstrument(instrument.id); }}>
              <button type="submit" className="flex items-center gap-1 text-sm text-loss">
                <Trash2 size={13} />
                {t('delete')}
              </button>
            </form>
```

- [ ] **Step 2: Same for strategies**

In `src/app/[locale]/(app)/strategies/page.tsx`, add the import and update the delete button identically:

```tsx
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { Trash2 } from 'lucide-react';
import { db } from '@/db/client';
import { strategies } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { StrategyForm } from './StrategyForm';
import { deleteStrategy } from './actions';
```

```tsx
            <form action={async () => { 'use server'; await deleteStrategy(strategy.id); }}>
              <button type="submit" className="flex items-center gap-1 text-sm text-loss">
                <Trash2 size={13} />
                {t('delete')}
              </button>
            </form>
```

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/instruments/page.tsx" "src/app/[locale]/(app)/strategies/page.tsx"
git commit -m "feat: add trash icon to instrument/strategy delete buttons"
```

---

### Task 7: Asset-class badges

**Files:**
- Create: `src/app/[locale]/(app)/instruments/AssetClassBadge.tsx`
- Modify: `src/app/[locale]/(app)/instruments/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `asset-commodity`/`asset-index`/`info`/`warning` tokens (Task 1).
- Produces: `AssetClassBadge` component (`{ assetClass: Instrument['assetClass'] }` prop) — reusable if a later task needs it elsewhere (e.g. the trade form/list), not used outside this task for now.

- [ ] **Step 1: Create the badge component**

`src/app/[locale]/(app)/instruments/AssetClassBadge.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import type { Instrument } from '@/db/schema';

const CLASS_STYLES: Record<Instrument['assetClass'], string> = {
  forex: 'bg-info-dim text-info',
  crypto: 'bg-warning-dim text-warning',
  commodity: 'bg-asset-commodity/15 text-asset-commodity',
  index: 'bg-asset-index/15 text-asset-index',
  other: 'bg-surface-2 text-text-muted',
};

export function AssetClassBadge({ assetClass }: { assetClass: Instrument['assetClass'] }) {
  const t = useTranslations('instruments');
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${CLASS_STYLES[assetClass]}`}>
      {t(`assetClassLabels.${assetClass}`)}
    </span>
  );
}
```

Note: this is a Client Component pattern (`useTranslations`) even though it has no `'use client'` directive of its own — it will be used from `page.tsx`, an async Server Component, which cannot call `useTranslations`. Add `'use client'` as the first line of this file.

- [ ] **Step 2: Use the badge in the instruments list**

In `src/app/[locale]/(app)/instruments/page.tsx`, add the import and replace the instrument row's text:

```tsx
import { AssetClassBadge } from './AssetClassBadge';
```

```tsx
            <span className="flex items-center gap-2 text-text-primary">
              {instrument.name}
              <AssetClassBadge assetClass={instrument.assetClass} />
              — {t('pointValue').toLowerCase()}: {instrument.pointValue}
            </span>
```

(This replaces the previous `{instrument.name} — {instrument.assetClass} — ...` line, which rendered the raw untranslated enum value — a pre-existing i18n gap this task also fixes.)

- [ ] **Step 3: Add translation keys**

Add to `messages/fr.json` inside `instruments` (alongside the existing keys):

```json
"assetClassLabels": {
  "forex": "Forex",
  "commodity": "Matière première",
  "crypto": "Crypto",
  "index": "Indice",
  "other": "Autre"
}
```

Add to `messages/en.json` inside `instruments`:

```json
"assetClassLabels": {
  "forex": "Forex",
  "commodity": "Commodity",
  "crypto": "Crypto",
  "index": "Index",
  "other": "Other"
}
```

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manually verify**

Run: `npm run dev`, visit `/fr/instruments` with at least a forex and a crypto instrument (create one of each if needed).
Expected: each instrument shows a colored pill badge with its translated asset class (blue "Forex", amber "Crypto", etc.), not the raw English enum value.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(app)/instruments/AssetClassBadge.tsx" "src/app/[locale]/(app)/instruments/page.tsx" messages/
git commit -m "feat: add colored asset-class badges to the instruments list"
```

---

### Task 8: Responsive sidebar (mobile hamburger nav)

**Files:**
- Modify: `src/app/[locale]/(app)/Sidebar.tsx`
- Modify: `src/app/[locale]/(app)/layout.tsx`

**Interfaces:**
- Consumes: Task 3's icon-per-nav-item `NAV_GROUPS` and the `hidden md:flex` desktop `<nav>` from Task 3 (this task adds the mobile counterpart, does not change the desktop rendering).
- Produces: none.

- [ ] **Step 1: Add a mobile top strip + slide-down panel to Sidebar**

In `src/app/[locale]/(app)/Sidebar.tsx`, add `useState` and the `Menu`/`X` icons to the imports, and wrap the existing desktop `<nav>` with a `<>...</>` fragment containing a new mobile-only header:

```tsx
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
```

- [ ] **Step 2: Make the app layout stack vertically on mobile**

In `src/app/[locale]/(app)/layout.tsx`, change the root `<div>`'s className:

```tsx
    <div className="flex min-h-screen flex-col bg-bg md:flex-row">
```

(was `"flex min-h-screen bg-bg"` — the rest of the file is unchanged. `flex-col` stacks the mobile nav strip above the content on narrow screens; `md:flex-row` restores the side-by-side desktop layout.)

- [ ] **Step 3: Add the `menuToggle` translation key**

Add to `messages/fr.json` inside `nav`: `"menuToggle": "Menu"`.
Add to `messages/en.json` inside `nav`: `"menuToggle": "Menu"`.

- [ ] **Step 4: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manually verify**

Run: `npm run dev`, visit any app page (e.g. `/fr/dashboard`) at a desktop width — sidebar unchanged. Resize to below 768px (or use devtools device toolbar): the desktop sidebar disappears, a top strip with the logo and a hamburger icon appears; tapping it opens a dropdown with the same nav links; tapping a link closes the dropdown and navigates.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(app)/Sidebar.tsx" "src/app/[locale]/(app)/layout.tsx" messages/
git commit -m "feat: add mobile hamburger navigation for the app sidebar"
```

---

### Task 9: Responsive trades table

**Files:**
- Modify: `src/app/[locale]/(app)/trades/page.tsx`
- Modify: `src/app/[locale]/(app)/trades/TradeFilters.tsx`

**Interfaces:**
- Consumes: none.
- Produces: none.

- [ ] **Step 1: Stack the trade list as cards below `sm`, keep the table at `sm` and above**

Replace the return block of `src/app/[locale]/(app)/trades/page.tsx` (imports and data-fetching logic above it are unchanged):

```tsx
  return (
    <main className="mx-auto max-w-4xl p-4 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t('listTitle')}</h1>
        <Link href="/trades/new" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
          + {t('newTitle')}
        </Link>
      </div>
      <TradeFilters instruments={instrumentRows} strategies={strategyRows} />

      {/* Mobile: stacked cards */}
      <div className="space-y-2 sm:hidden">
        {rows.map((trade) => (
          <Link
            key={trade.id}
            href={`/trades/${trade.id}`}
            className="block rounded-md border border-border-subtle bg-surface p-3"
          >
            <div className="flex items-center justify-between text-sm text-text-primary">
              <span>{trade.enteredAt.toLocaleDateString()}</span>
              <span>{instrumentById.get(trade.instrumentId)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-text-muted">{trade.direction}</span>
              <span className={trade.pnlAmount && trade.pnlAmount >= 0 ? 'text-gain' : 'text-loss'}>
                {trade.pnlAmount ?? '—'}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop: table */}
      <table className="hidden w-full text-left text-text-primary sm:table">
        <thead className="text-text-muted">
          <tr>
            <th className="p-2">{t('date')}</th>
            <th className="p-2">{t('instrument')}</th>
            <th className="p-2">{t('direction')}</th>
            <th className="p-2">P&amp;L</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((trade) => (
            <tr key={trade.id} className="border-t border-border-subtle">
              <td className="p-2">
                <Link href={`/trades/${trade.id}`}>{trade.enteredAt.toLocaleDateString()}</Link>
              </td>
              <td className="p-2">{instrumentById.get(trade.instrumentId)}</td>
              <td className="p-2">{trade.direction}</td>
              <td className={`p-2 ${trade.pnlAmount && trade.pnlAmount >= 0 ? 'text-gain' : 'text-loss'}`}>
                {trade.pnlAmount ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && <p className="mt-4 text-text-muted">{t('empty')}</p>}
    </main>
  );
}
```

- [ ] **Step 2: Stack the filters on mobile**

In `src/app/[locale]/(app)/trades/TradeFilters.tsx`, change the root `<div>`'s className from `"mb-4 flex flex-wrap gap-3"` to `"mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap"`.

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify**

Run: `npm run dev`, visit `/fr/trades` with at least one trade, at a desktop width — table unchanged. Resize below 640px: the table disappears, each trade renders as a tappable card (date/instrument on top, direction/P&L below); the three filter controls stack vertically instead of wrapping in a row.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(app)/trades/page.tsx" "src/app/[locale]/(app)/trades/TradeFilters.tsx"
git commit -m "feat: add responsive card view for the trades list on mobile"
```

---

### Task 10: Responsive heatmaps

**Files:**
- Modify: `src/app/[locale]/(app)/dashboard/heatmaps/HeatmapGrid.tsx`

**Interfaces:**
- Consumes: none.
- Produces: none.

- [ ] **Step 1: Make the grid horizontally scrollable with a sticky first column**

Replace `src/app/[locale]/(app)/dashboard/heatmaps/HeatmapGrid.tsx`:

```tsx
export function HeatmapGrid({
  title,
  columns,
  data,
}: {
  title: string;
  columns: { key: string; label: string }[];
  data: Record<string, Record<string, number>>;
}) {
  const instrumentNames = Object.keys(data);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <h3 className="mb-3 font-bold text-text-primary">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-text-primary">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-surface p-1 text-left text-text-muted"></th>
              {columns.map((c) => (
                <th key={c.key} className="p-1 text-text-muted">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instrumentNames.map((name) => (
              <tr key={name}>
                <td className="sticky left-0 z-10 bg-surface p-1 text-text-muted">{name}</td>
                {columns.map((c) => {
                  const value = data[name][c.key];
                  return (
                    <td
                      key={c.key}
                      className={`p-1 text-center ${value === undefined ? '' : value >= 0 ? 'bg-gain/20 text-gain' : 'bg-loss/20 text-loss'}`}
                    >
                      {value !== undefined ? value.toFixed(1) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

(`overflow-x-auto` on the wrapping `<div>` lets the table scroll horizontally without breaking the page layout; `sticky left-0 z-10 bg-surface` on the first column's `<th>`/`<td>` keeps the instrument name visible during that scroll — it needs an explicit background color, since `sticky` elements are otherwise transparent over the scrolling content behind them.)

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manually verify**

Run: `npm run dev`, visit `/fr/dashboard/heatmaps` with at least one closed trade, at a narrow width (< 768px, e.g. devtools device toolbar).
Expected: each grid (day/duration/month) scrolls horizontally without widening the page; the instrument-name column stays visible/fixed while scrolling.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/dashboard/heatmaps/HeatmapGrid.tsx"
git commit -m "feat: make heatmap grids horizontally scrollable with a sticky instrument column"
```

---

### Task 11: `is_demo` schema columns

**Files:**
- Modify: `src/db/schema.ts`
- Test: `src/db/__tests__/schema.test.ts`

**Interfaces:**
- Consumes: none.
- Produces: `instruments.isDemo`, `strategies.isDemo`, `trades.isDemo` (all `boolean`, `not null`, default `false`) — used by Task 12 (seeding) and Task 13 (clearing).

- [ ] **Step 1: Add the columns**

In `src/db/schema.ts`, add `isDemo: boolean('is_demo').notNull().default(false),` to each of the three table definitions — immediately after `pointValue` in `instruments`, after `description` in `strategies`, and after `notes` in `trades`:

```typescript
export const instruments = pgTable('instruments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  assetClass: text('asset_class', { enum: ['forex', 'commodity', 'crypto', 'index', 'other'] }).notNull(),
  pointValue: doublePrecision('point_value').notNull(),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const strategies = pgTable('strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

And in `trades`, add it right after `notes: text('notes'),`:

```typescript
  notes: text('notes'),
  isDemo: boolean('is_demo').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
```

(`boolean` is already imported at the top of this file from a prior task — no import changes needed.)

- [ ] **Step 2: Generate and apply the migration**

Run: `npm run db:generate`
Expected: creates a new file under `drizzle/` with `ALTER TABLE` statements adding `is_demo` to all three tables.

Run: `npm run db:migrate`
Expected: confirms migration applied to the real Neon database, no errors.

- [ ] **Step 3: Update the schema smoke test**

`src/db/__tests__/schema.test.ts` already asserts the tables are defined (from earlier tasks) — no new assertions are needed for a single added column on already-tested tables. Just run the existing suite to confirm nothing broke:

Run: `npm test`
Expected: all existing tests pass, including `schema.test.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts drizzle/
git commit -m "feat: add is_demo column to instruments, strategies, and trades"
```

---

### Task 12: Demo data seeding

**Files:**
- Create: `src/lib/demo-seed.ts`
- Test: `src/lib/__tests__/demo-seed.test.ts`
- Modify: `src/app/[locale]/(auth)/register/actions.ts`

**Interfaces:**
- Consumes: `calculatePnl`, `calculateRisk` (`src/lib/calculations.ts`), `instruments`/`strategies`/`trades`/`checklistRules`/`tradeChecklistResponses` (`src/db/schema.ts`), `db` (`src/db/client.ts`).
- Produces: `seedDemoData(userId: string): Promise<void>` — called from `registerAction` (Task 12), no other consumers.

- [ ] **Step 1: Write the failing test for the trade template data (pure function, no DB)**

`src/lib/__tests__/demo-seed.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { DEMO_TRADE_TEMPLATES } from '../demo-seed';

describe('DEMO_TRADE_TEMPLATES', () => {
  it('contains between 15 and 20 trades', () => {
    expect(DEMO_TRADE_TEMPLATES.length).toBeGreaterThanOrEqual(15);
    expect(DEMO_TRADE_TEMPLATES.length).toBeLessThanOrEqual(20);
  });

  it('produces a win rate between 50% and 70%', () => {
    const wins = DEMO_TRADE_TEMPLATES.filter((t) => {
      const rawDelta = t.exitPrice - t.entryPrice;
      const signedDelta = t.direction === 'long' ? rawDelta : -rawDelta;
      return signedDelta > 0;
    }).length;
    const winRate = (wins / DEMO_TRADE_TEMPLATES.length) * 100;
    expect(winRate).toBeGreaterThanOrEqual(50);
    expect(winRate).toBeLessThanOrEqual(70);
  });

  it('references only instrument indexes 0, 1, or 2, and strategy indexes 0 or 1', () => {
    for (const template of DEMO_TRADE_TEMPLATES) {
      expect([0, 1, 2]).toContain(template.instrumentIndex);
      expect([0, 1]).toContain(template.strategyIndex);
    }
  });

  it('has at least 3 trades with a checklist error, and all indexes are 0-3', () => {
    const withError = DEMO_TRADE_TEMPLATES.filter((t) => t.checklistErrorIndex !== null);
    expect(withError.length).toBeGreaterThanOrEqual(3);
    for (const template of withError) {
      expect(template.checklistErrorIndex).toBeGreaterThanOrEqual(0);
      expect(template.checklistErrorIndex).toBeLessThanOrEqual(3);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/demo-seed.test.ts`
Expected: FAIL — `Cannot find module '../demo-seed'`.

- [ ] **Step 3: Implement `src/lib/demo-seed.ts`**

```typescript
import { asc, eq } from 'drizzle-orm';
import { subDays, addHours } from 'date-fns';
import { db } from '@/db/client';
import { instruments, strategies, trades, checklistRules, tradeChecklistResponses } from '@/db/schema';
import { calculatePnl, calculateRisk, type Direction } from '@/lib/calculations';

export interface DemoTradeTemplate {
  daysAgo: number;
  instrumentIndex: 0 | 1 | 2;
  strategyIndex: 0 | 1;
  direction: Direction;
  entryPrice: number;
  exitPrice: number;
  stopLossPrice: number;
  quantity: number;
  durationHours: number;
  checklistErrorIndex: number | null;
}

// Hand-authored, deterministic (never randomly generated) — 16 trades, ~62.5%
// win rate, spread across all 3 demo instruments, both demo strategies, both
// directions, and all 4 duration-heatmap buckets (4 trades each at 0.4h/0.75h/
// 2h/8h). 4 trades carry a checklist error, one per rule (indexes 0-3).
export const DEMO_TRADE_TEMPLATES: DemoTradeTemplate[] = [
  { daysAgo: 28, instrumentIndex: 0, strategyIndex: 0, direction: 'long', entryPrice: 1.082, exitPrice: 1.0855, stopLossPrice: 1.08, quantity: 1, durationHours: 0.4, checklistErrorIndex: null },
  { daysAgo: 27, instrumentIndex: 1, strategyIndex: 1, direction: 'short', entryPrice: 43500, exitPrice: 43100, stopLossPrice: 44000, quantity: 0.05, durationHours: 0.75, checklistErrorIndex: null },
  { daysAgo: 25, instrumentIndex: 2, strategyIndex: 0, direction: 'long', entryPrice: 2015, exitPrice: 2005, stopLossPrice: 2000, quantity: 0.3, durationHours: 2, checklistErrorIndex: 0 },
  { daysAgo: 24, instrumentIndex: 0, strategyIndex: 1, direction: 'short', entryPrice: 1.0865, exitPrice: 1.084, stopLossPrice: 1.089, quantity: 1, durationHours: 8, checklistErrorIndex: null },
  { daysAgo: 22, instrumentIndex: 1, strategyIndex: 0, direction: 'long', entryPrice: 42800, exitPrice: 43400, stopLossPrice: 42300, quantity: 0.05, durationHours: 0.4, checklistErrorIndex: null },
  { daysAgo: 21, instrumentIndex: 2, strategyIndex: 1, direction: 'long', entryPrice: 2008, exitPrice: 2022, stopLossPrice: 1998, quantity: 0.3, durationHours: 0.75, checklistErrorIndex: null },
  { daysAgo: 19, instrumentIndex: 0, strategyIndex: 0, direction: 'long', entryPrice: 1.079, exitPrice: 1.0765, stopLossPrice: 1.077, quantity: 1, durationHours: 2, checklistErrorIndex: 1 },
  { daysAgo: 18, instrumentIndex: 1, strategyIndex: 1, direction: 'short', entryPrice: 43000, exitPrice: 43600, stopLossPrice: 43500, quantity: 0.05, durationHours: 8, checklistErrorIndex: null },
  { daysAgo: 16, instrumentIndex: 2, strategyIndex: 0, direction: 'short', entryPrice: 2020, exitPrice: 2005, stopLossPrice: 2030, quantity: 0.3, durationHours: 0.4, checklistErrorIndex: null },
  { daysAgo: 15, instrumentIndex: 0, strategyIndex: 1, direction: 'long', entryPrice: 1.08, exitPrice: 1.083, stopLossPrice: 1.078, quantity: 1, durationHours: 0.75, checklistErrorIndex: null },
  { daysAgo: 13, instrumentIndex: 1, strategyIndex: 0, direction: 'long', entryPrice: 43200, exitPrice: 42900, stopLossPrice: 42700, quantity: 0.05, durationHours: 2, checklistErrorIndex: 2 },
  { daysAgo: 12, instrumentIndex: 2, strategyIndex: 1, direction: 'long', entryPrice: 2012, exitPrice: 2028, stopLossPrice: 2002, quantity: 0.3, durationHours: 8, checklistErrorIndex: null },
  { daysAgo: 10, instrumentIndex: 0, strategyIndex: 0, direction: 'short', entryPrice: 1.0855, exitPrice: 1.0825, stopLossPrice: 1.088, quantity: 1, durationHours: 0.4, checklistErrorIndex: null },
  { daysAgo: 8, instrumentIndex: 1, strategyIndex: 1, direction: 'long', entryPrice: 42600, exitPrice: 42200, stopLossPrice: 42100, quantity: 0.05, durationHours: 0.75, checklistErrorIndex: 3 },
  { daysAgo: 5, instrumentIndex: 2, strategyIndex: 0, direction: 'long', entryPrice: 2018, exitPrice: 2032, stopLossPrice: 2008, quantity: 0.3, durationHours: 2, checklistErrorIndex: null },
  { daysAgo: 2, instrumentIndex: 0, strategyIndex: 1, direction: 'short', entryPrice: 1.087, exitPrice: 1.0895, stopLossPrice: 1.0895, quantity: 1, durationHours: 8, checklistErrorIndex: null },
];

export async function seedDemoData(userId: string): Promise<void> {
  const [eurusd, btcusd, xauusd] = await db
    .insert(instruments)
    .values([
      { userId, name: 'EUR/USD', assetClass: 'forex', pointValue: 10000, isDemo: true },
      { userId, name: 'BTC/USD', assetClass: 'crypto', pointValue: 1, isDemo: true },
      { userId, name: 'XAU/USD', assetClass: 'commodity', pointValue: 10, isDemo: true },
    ])
    .returning();
  const instrumentsByIndex = [eurusd, btcusd, xauusd];

  const [breakout, pullback] = await db
    .insert(strategies)
    .values([
      { userId, name: 'Breakout', isDemo: true },
      { userId, name: 'Pullback', isDemo: true },
    ])
    .returning();
  const strategiesByIndex = [breakout, pullback];

  const rules = await db
    .select()
    .from(checklistRules)
    .where(eq(checklistRules.userId, userId))
    .orderBy(asc(checklistRules.displayOrder));

  const now = new Date();

  for (const template of DEMO_TRADE_TEMPLATES) {
    const instrument = instrumentsByIndex[template.instrumentIndex];
    const enteredAt = subDays(now, template.daysAgo);
    const exitedAt = addHours(enteredAt, template.durationHours);

    const pnlAmount = calculatePnl({
      entryPrice: template.entryPrice,
      exitPrice: template.exitPrice,
      quantity: template.quantity,
      direction: template.direction,
      pointValue: instrument.pointValue,
    });
    const riskAmount = calculateRisk({
      entryPrice: template.entryPrice,
      stopLossPrice: template.stopLossPrice,
      quantity: template.quantity,
      pointValue: instrument.pointValue,
    });

    const [trade] = await db
      .insert(trades)
      .values({
        userId,
        instrumentId: instrument.id,
        strategyId: strategiesByIndex[template.strategyIndex].id,
        direction: template.direction,
        entryPrice: template.entryPrice,
        exitPrice: template.exitPrice,
        quantity: template.quantity,
        stopLossPrice: template.stopLossPrice,
        enteredAt,
        exitedAt,
        status: 'closed',
        pnlAmount,
        riskAmount,
        isDemo: true,
      })
      .returning();

    if (template.checklistErrorIndex !== null) {
      const rule = rules[template.checklistErrorIndex];
      if (rule) {
        await db.insert(tradeChecklistResponses).values({
          tradeId: trade.id,
          checklistRuleId: rule.id,
          checked: true,
          phase: 'entry',
        });
      }
    }
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/demo-seed.test.ts`
Expected: all 4 tests PASS.

- [ ] **Step 5: Wire the seed into registration**

In `src/app/[locale]/(auth)/register/actions.ts`, add the import and call `seedDemoData` right after the checklist rules are seeded (before the `signIn` call):

```typescript
import { DEFAULT_CHECKLIST_RULES } from '@/lib/checklist-seed';
import { seedDemoData } from '@/lib/demo-seed';
import { signIn } from '@/auth';
```

```typescript
  await db.insert(checklistRules).values(
    DEFAULT_CHECKLIST_RULES.map((label, index) => ({
      userId: newUser.id,
      label,
      displayOrder: index,
    }))
  );

  await seedDemoData(newUser.id);

  try {
    await signIn('credentials', { email, password, redirect: false });
```

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the 4 new `demo-seed.test.ts` tests.

- [ ] **Step 7: Manually verify**

Run: `npm run dev`, register a brand-new test account, then check the database directly (or visit `/fr/instruments`, `/fr/strategies`, `/fr/trades`) — confirm 3 instruments, 2 strategies, and 16 trades exist for that user, all with `is_demo = true`. Confirm the win rate on `/fr/dashboard` is roughly 60%. Clean up the test account afterward (delete the `trades` rows first, then `instruments`/`strategies`/`checklist_rules`/the `users` row, per the FK ordering already documented in this project's progress ledger).

- [ ] **Step 8: Commit**

```bash
git add src/lib/demo-seed.ts src/lib/__tests__/demo-seed.test.ts "src/app/[locale]/(auth)/register/actions.ts"
git commit -m "feat: auto-seed demo trades, instruments, and strategies on registration"
```

---

### Task 13: Demo data banner and clear action

**Files:**
- Create: `src/app/[locale]/(app)/dashboard/actions.ts`
- Create: `src/app/[locale]/(app)/dashboard/DemoBanner.tsx`
- Modify: `src/app/[locale]/(app)/dashboard/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `is_demo` columns (Task 11).
- Produces: `clearDemoData` server action — no consumers outside `DemoBanner`.

- [ ] **Step 1: Create the clear-demo-data server action**

`src/app/[locale]/(app)/dashboard/actions.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trades, instruments, strategies } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

export async function clearDemoData() {
  const user = await requireUser();
  // Trades first: instruments/strategies have no cascade on the trades that
  // reference them, so deleting them first would fail with a foreign key error.
  await db.delete(trades).where(and(eq(trades.userId, user.id), eq(trades.isDemo, true)));
  await db.delete(instruments).where(and(eq(instruments.userId, user.id), eq(instruments.isDemo, true)));
  await db.delete(strategies).where(and(eq(strategies.userId, user.id), eq(strategies.isDemo, true)));
  revalidatePath('/[locale]/dashboard', 'page');
}
```

- [ ] **Step 2: Create the banner component**

`src/app/[locale]/(app)/dashboard/DemoBanner.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { clearDemoData } from './actions';

export async function DemoBanner() {
  const t = await getTranslations('dashboard.demoBanner');
  return (
    <div className="flex flex-col items-start justify-between gap-2 rounded-xl border border-accent-dim bg-accent-dim/40 p-3 text-sm sm:flex-row sm:items-center">
      <span className="text-text-primary">{t('text')}</span>
      <form action={clearDemoData}>
        <button type="submit" className="whitespace-nowrap rounded-md border border-accent px-3 py-1.5 text-xs font-bold text-accent">
          {t('clearButton')}
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 3: Show the banner on the dashboard when demo data exists**

In `src/app/[locale]/(app)/dashboard/page.tsx`, add the import and a query for demo-data presence, and render the banner conditionally above the stat cards:

```tsx
import { DemoBanner } from './DemoBanner';
```

```tsx
  const [demoTrade] = await db
    .select({ id: trades.id })
    .from(trades)
    .where(and(eq(trades.userId, user.id), eq(trades.isDemo, true)))
    .limit(1);
```

(Add this right after the `closedTrades` query, using the same `and`/`eq` already imported.)

```tsx
      <h1 className="text-xl font-bold text-text-primary">{t('title')}</h1>

      {demoTrade && <DemoBanner />}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
```

- [ ] **Step 4: Add translation keys**

Add to `messages/fr.json` inside `dashboard`:

```json
"demoBanner": {
  "text": "Ce sont des données d'exemple — explore librement l'app.",
  "clearButton": "Tout effacer et repartir de zéro"
}
```

Add to `messages/en.json` inside `dashboard`:

```json
"demoBanner": {
  "text": "These are sample data — explore the app freely.",
  "clearButton": "Clear everything and start fresh"
}
```

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm test`
Expected: all tests pass (this task is UI + a DB-only action, no new pure-function logic).

- [ ] **Step 6: Manually verify**

Run: `npm run dev`, register a fresh test account (so demo data seeds — Task 12), visit `/fr/dashboard`.
Expected: the banner is visible above the stat cards. Click "Tout effacer et repartir de zéro" — confirm via a direct DB query (or by revisiting the instruments/strategies/trades pages) that all demo rows are gone and the banner no longer appears; confirm any non-demo data the user may have added in between (create one manually before clearing, if time allows) survives untouched. Clean up the test account afterward.

- [ ] **Step 7: Commit**

```bash
git add "src/app/[locale]/(app)/dashboard/actions.ts" "src/app/[locale]/(app)/dashboard/DemoBanner.tsx" "src/app/[locale]/(app)/dashboard/page.tsx" messages/
git commit -m "feat: add demo-data banner with a clear-and-start-fresh action"
```

---

### Task 14: Upload icon on the screenshot form

**Files:**
- Modify: `src/app/[locale]/(app)/trades/[id]/ScreenshotUpload.tsx`

**Interfaces:**
- Consumes: none.
- Produces: none.

- [ ] **Step 1: Add an `Upload` icon to the submit button**

Replace the full contents of `src/app/[locale]/(app)/trades/[id]/ScreenshotUpload.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { uploadScreenshot } from './actions';

export function ScreenshotUpload({ tradeId }: { tradeId: string }) {
  const t = useTranslations('trades');
  return (
    <form
      action={(formData) => uploadScreenshot(tradeId, formData)}
      className="flex items-end gap-3 rounded-md border border-border-subtle p-3"
    >
      <label className="text-sm text-text-muted">
        {t('screenshot')}
        <input name="file" type="file" accept="image/png,image/jpeg" required className="mt-1 block text-text-primary" />
      </label>
      <label className="text-sm text-text-muted">
        {t('caption')}
        <input name="caption" className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <button type="submit" className="flex items-center gap-1.5 rounded-md bg-cta px-4 py-2 font-bold text-bg">
        <Upload size={14} />
        {t('upload')}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/trades/[id]/ScreenshotUpload.tsx"
git commit -m "feat: add upload icon to the screenshot upload button"
```

---

### Task 15: Responsive audit of the remaining CRUD/settings/tools pages

**Files:**
- None expected to change (verification task per spec §3.4 — fix inline only if a real overflow is found).

**Interfaces:**
- Consumes: none.
- Produces: none.

- [ ] **Step 1: Manually audit each simple form/list page at 375px width**

Run: `npm run dev`. Using devtools' device toolbar (or a real narrow window) at 375px width, visit each of the following, logged in:
- `/fr/instruments`
- `/fr/strategies`
- `/fr/checklist`
- `/fr/settings`
- `/fr/tools/position-size-calculator`

Expected: each page's form/list stays within the viewport — no horizontal scrollbar on the page body, no element (input, button, label) forcing a width beyond 375px. These pages already use `max-w-lg`/`max-w-2xl` single-column layouts (per the spec, no structural change is expected here).

- [ ] **Step 2: Fix only if a real overflow is found**

If any element does overflow (e.g. a `<input>` with a hardcoded `w-*` wider than the viewport, or a long untruncated string), fix that specific element only — e.g. add `w-full` or `min-w-0` to the offending element, or `truncate` to the offending text. Do not restructure a page that already fits; this step exists only to catch a real regression, not to invent work.

- [ ] **Step 3: Commit (only if Step 2 made a change)**

```bash
git add <changed files>
git commit -m "fix: prevent horizontal overflow on <page> at 375px"
```

If no overflow was found, skip this commit — there is nothing to record.

---

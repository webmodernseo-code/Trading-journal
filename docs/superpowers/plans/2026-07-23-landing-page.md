# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the public marketing landing page at `/[locale]` (currently a placeholder scaffold page), replacing it with the 8-section design defined in `docs/superpowers/specs/2026-07-23-landing-page-design.md`, fully bilingual (fr/en) and responsive down to mobile.

**Architecture:** One page (`src/app/[locale]/page.tsx`) composed of independent, single-purpose section components living alongside it (`src/app/[locale]/landing/`). Static sections are plain async Server Components (no interactivity, no data fetching); the nav, pricing currency switcher, and FAQ accordion are Client Components for their local UI state. The only real logic (indicative EUR→USD/FCFA conversion at a fixed rate) is a pure, unit-tested function, consistent with this project's convention of keeping calculation logic separate from UI.

**Tech Stack:** Next.js 15 (App Router) + React 19 + TypeScript (already in the project), `lucide-react` (new dependency, icons), `next/font/google` (Playfair Display, for the italic accent typography — no new package, built into Next.js), next-intl (already in the project, new `landing` message namespace), Vitest (already in the project).

## Global Constraints

- Reference spec: `docs/superpowers/specs/2026-07-23-landing-page-design.md` — every task below implements a section of it. The main product spec (`docs/superpowers/specs/2026-07-21-journal-trading-design.md`, section 7) defines the functional structure; this plan's spec defines the visual direction.
- **The landing page has its own color identity, deliberately separate from the app's `--color-*` CSS custom properties and dark/light toggle.** It is dark-only in v1 (no light theme). Use these exact literal Tailwind arbitrary-value classes everywhere on the landing page — never the app's `bg-bg`/`text-accent`/etc. tokens, and never a different hex than these:
  - Background: `bg-[#0a0c14]`
  - Card/surface: `bg-[#12151a]`
  - Border: `border-[rgba(255,255,255,0.06)]` (nav/hero dividers) or `border-[rgba(255,255,255,0.08)]` (cards)
  - Accent (buttons, active nav, tagline text, step numbers): `text-[#ffa361]` / `bg-[#ffa361]` / `border-[#ffa361]`
  - Accent dim (badge/pill backgrounds, active-language-switch background): `bg-[#ffa361]/10` (Tailwind opacity shorthand for `rgba(255,163,97,0.10)`) — use `/15` where the spec calls for the stronger `rgba(255,163,97,0.15)` (active pill states)
  - Text on a solid accent background (buttons): `text-[#1a0e05]`
  - Primary text: `text-[#f9fafb]`
  - Muted text: `text-[#9ca3af]`
  - Faint text (nav links, fine print): `text-[#6f7480]`
  - `gain`/`loss` (the app's green/red tokens) are never used on the landing page.
- **Two type families, never mixed:** the existing system sans-serif stack (default — no class needed, it's the Tailwind/browser default already used everywhere else) for all normal text, and Playfair Display italic (Task 1 sets this up as `playfairItalic.className`) **only** for short tagline/accent phrases (never a full heading, never body copy).
- Every section is bilingual: every user-facing string goes through next-intl, with an entry in both `messages/fr.json` and `messages/en.json` under the `landing` namespace (nested per section, e.g. `landing.hero.title`).
- Async Server Components use `getTranslations` from `next-intl/server` (awaited); Client Components (marked `'use client'`) use `useTranslations` from `next-intl`. Never the wrong one for the component type — this exact mistake has caused runtime errors in every prior task of this project that got it backwards.
- Responsive: this page must work down to ~375px mobile width, not just tablet. 2-column grids (features, how-it-works) collapse to 1 column below Tailwind's `sm` breakpoint (640px); the nav's inline links collapse behind a hamburger toggle below `md` (768px).
- No real payment integration, no real testimonials, no team/blog/contact-form-with-map/fake-stats-bar sections — see the design spec's "Hors scope" section. Testimonials must carry a visible "Exemple" / "Demo" label — never presented as genuine.
- Currency conversion on the pricing section is an indicative, hardcoded fixed rate — never a live exchange-rate API call.

---

## File Structure Overview

```
src/app/[locale]/fonts.ts                    — Playfair Display font loader (Task 1)
src/lib/currency.ts                          — EUR→USD/FCFA fixed-rate conversion (Task 2)
src/app/[locale]/landing/LandingNav.tsx       — Task 3
src/app/[locale]/landing/LandingHero.tsx      — Task 4
src/app/[locale]/landing/FeatureCards.tsx     — Task 5
src/app/[locale]/landing/HowItWorks.tsx       — Task 6
src/app/[locale]/landing/Testimonials.tsx     — Task 7
src/app/[locale]/landing/PricingSection.tsx   — Task 8
src/app/[locale]/landing/Faq.tsx              — Task 9
src/app/[locale]/landing/LandingFooter.tsx    — Task 10
src/app/[locale]/page.tsx                     — Modified in Task 11 to compose all sections
messages/fr.json, messages/en.json           — `landing` namespace, added incrementally per task
```

---

### Task 1: Dependencies and Playfair Display font setup

**Files:**
- Modify: `package.json`
- Create: `src/app/[locale]/fonts.ts`

**Interfaces:**
- Produces: `playfairItalic` (a Next.js font object; consumers use `playfairItalic.className` on the element that needs the italic accent style) — used by Tasks 4, 6, 8.

- [ ] **Step 1: Install `lucide-react`**

Run: `npm install lucide-react`
Expected: adds `lucide-react` to `package.json` dependencies and `package-lock.json`, installs without errors.

- [ ] **Step 2: Create the font loader**

`src/app/[locale]/fonts.ts`:

```typescript
import { Playfair_Display } from 'next/font/google';

export const playfairItalic = Playfair_Display({
  subsets: ['latin'],
  weight: '400',
  style: 'italic',
  display: 'swap',
});
```

- [ ] **Step 3: Verify the project still builds**

Run: `npx tsc --noEmit`
Expected: no errors (this file isn't imported by anything yet, but must type-check standalone).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json "src/app/[locale]/fonts.ts"
git commit -m "chore: add lucide-react and Playfair Display font for the landing page"
```

---

### Task 2: Currency conversion — pure function

**Files:**
- Create: `src/lib/currency.ts`
- Test: `src/lib/__tests__/currency.test.ts`

**Interfaces:**
- Produces: `Currency` type (`'EUR' | 'USD' | 'FCFA'`), `convertFromEur(amountEur: number, currency: Currency): number`, `formatPrice(amountEur: number, currency: Currency): string` — used by Task 8's pricing section.

- [ ] **Step 1: Write failing tests**

`src/lib/__tests__/currency.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { convertFromEur, formatPrice } from '../currency';

describe('convertFromEur', () => {
  it('returns the same amount for EUR', () => {
    expect(convertFromEur(5, 'EUR')).toBe(5);
  });

  it('converts to USD at the fixed rate', () => {
    expect(convertFromEur(5, 'USD')).toBeCloseTo(5.4, 5);
  });

  it('converts to FCFA at the fixed peg rate', () => {
    expect(convertFromEur(5, 'FCFA')).toBeCloseTo(3279.785, 3);
  });
});

describe('formatPrice', () => {
  it('formats EUR with two decimals and the euro sign', () => {
    expect(formatPrice(5, 'EUR')).toBe('5.00 €');
  });

  it('formats USD with two decimals and the dollar sign', () => {
    expect(formatPrice(5, 'USD')).toBe('5.40 $');
  });

  it('formats FCFA as a rounded integer with thousands separators', () => {
    expect(formatPrice(99, 'FCFA')).toBe('64 940 FCFA');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/currency.test.ts`
Expected: FAIL — `Cannot find module '../currency'`.

- [ ] **Step 3: Implement `src/lib/currency.ts`**

```typescript
export type Currency = 'EUR' | 'USD' | 'FCFA';

// Indicative fixed rates, updated manually from time to time — never a
// live exchange-rate API call (spec 7.3). FCFA is the real EUR peg rate
// (1 EUR = 655.957 FCFA by treaty); USD is an illustrative fixed rate.
const FIXED_RATES: Record<Currency, number> = {
  EUR: 1,
  USD: 1.08,
  FCFA: 655.957,
};

const SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  FCFA: 'FCFA',
};

export function convertFromEur(amountEur: number, currency: Currency): number {
  return amountEur * FIXED_RATES[currency];
}

export function formatPrice(amountEur: number, currency: Currency): string {
  const converted = convertFromEur(amountEur, currency);
  if (currency === 'FCFA') {
    return `${Math.round(converted).toLocaleString('fr-FR')} ${SYMBOLS[currency]}`;
  }
  return `${converted.toFixed(2)} ${SYMBOLS[currency]}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/currency.test.ts`
Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/currency.ts src/lib/__tests__/currency.test.ts
git commit -m "feat: add indicative EUR to USD/FCFA fixed-rate currency conversion"
```

---

### Task 3: Nav

**Files:**
- Create: `src/app/[locale]/landing/LandingNav.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: none.
- Produces: `LandingNav` component (no props) — used by Task 11's page composition.

- [ ] **Step 1: Create the component**

`src/app/[locale]/landing/LandingNav.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';

export function LandingNav() {
  const t = useTranslations('landing.nav');
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const withoutLocale = pathname.replace(/^\/(fr|en)/, '') || '/';
  const currentLocale = pathname.startsWith('/en') ? 'en' : 'fr';

  return (
    <nav className="flex items-center border-b border-[rgba(255,255,255,0.06)] px-6 py-4 md:px-8">
      <div className="flex items-center gap-2 text-[15px] font-bold text-[#f9fafb]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 17L9 11L13 15L21 6" stroke="#ffa361" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15 6H21V12" stroke="#ffa361" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t('brand')}
      </div>

      <div className="ml-11 hidden gap-6 text-[13px] text-[#6f7480] md:flex">
        <a href="#fonctionnalites" className="hover:text-[#f9fafb]">{t('features')}</a>
        <a href="#pricing" className="hover:text-[#f9fafb]">{t('pricing')}</a>
        <a href="#avis" className="hover:text-[#f9fafb]">{t('reviews')}</a>
        <a href="#faq" className="hover:text-[#f9fafb]">{t('faq')}</a>
      </div>

      <div className="ml-auto hidden items-center gap-3 md:flex">
        <div className="flex overflow-hidden rounded-md border border-[rgba(255,255,255,0.08)] text-[11px]">
          <Link href={`/fr${withoutLocale}`} className={`px-2 py-1 ${currentLocale === 'fr' ? 'bg-[#ffa361]/15 font-bold text-[#ffa361]' : 'text-[#6f7480]'}`}>FR</Link>
          <Link href={`/en${withoutLocale}`} className={`px-2 py-1 ${currentLocale === 'en' ? 'bg-[#ffa361]/15 font-bold text-[#ffa361]' : 'text-[#6f7480]'}`}>EN</Link>
        </div>
        <Link href="/login" className="text-[13px] text-[#c9c7d1]">{t('login')}</Link>
        <Link href="/register" className="rounded-md bg-[#ffa361] px-4 py-2 text-[12.5px] font-bold text-[#1a0e05]">{t('cta')}</Link>
      </div>

      <button
        type="button"
        aria-label={t('menuToggle')}
        onClick={() => setMobileOpen((open) => !open)}
        className="ml-auto text-[#f9fafb] md:hidden"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-[57px] z-10 flex flex-col gap-4 border-b border-[rgba(255,255,255,0.06)] bg-[#0a0c14] px-6 py-5 md:hidden">
          <a href="#fonctionnalites" className="text-sm text-[#c9c7d1]" onClick={() => setMobileOpen(false)}>{t('features')}</a>
          <a href="#pricing" className="text-sm text-[#c9c7d1]" onClick={() => setMobileOpen(false)}>{t('pricing')}</a>
          <a href="#avis" className="text-sm text-[#c9c7d1]" onClick={() => setMobileOpen(false)}>{t('reviews')}</a>
          <a href="#faq" className="text-sm text-[#c9c7d1]" onClick={() => setMobileOpen(false)}>{t('faq')}</a>
          <div className="flex gap-3 pt-2">
            <Link href={`/fr${withoutLocale}`} className={`text-sm ${currentLocale === 'fr' ? 'font-bold text-[#ffa361]' : 'text-[#6f7480]'}`}>FR</Link>
            <Link href={`/en${withoutLocale}`} className={`text-sm ${currentLocale === 'en' ? 'font-bold text-[#ffa361]' : 'text-[#6f7480]'}`}>EN</Link>
          </div>
          <Link href="/login" className="text-sm text-[#c9c7d1]">{t('login')}</Link>
          <Link href="/register" className="rounded-md bg-[#ffa361] px-4 py-2 text-center text-sm font-bold text-[#1a0e05]">{t('cta')}</Link>
        </div>
      )}
    </nav>
  );
}
```

- [ ] **Step 2: Add translation keys**

Add to `messages/fr.json` (top level, alongside `common`, `home`, etc.):

```json
"landing": {
  "nav": {
    "brand": "Journal",
    "features": "Fonctionnalités",
    "pricing": "Pricing",
    "reviews": "Avis",
    "faq": "FAQ",
    "login": "Se connecter",
    "cta": "Essai gratuit 14 jours",
    "menuToggle": "Menu"
  }
}
```

Add to `messages/en.json`:

```json
"landing": {
  "nav": {
    "brand": "Journal",
    "features": "Features",
    "pricing": "Pricing",
    "reviews": "Reviews",
    "faq": "FAQ",
    "login": "Log in",
    "cta": "14-day free trial",
    "menuToggle": "Menu"
  }
}
```

- [ ] **Step 3: Manually verify**

This component isn't wired into a page yet (Task 11 does that). Verify it compiles and has no unused-import/type errors:

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/landing/LandingNav.tsx" messages/
git commit -m "feat: add landing page nav with mobile menu and language switch"
```

---

### Task 4: Hero

**Files:**
- Create: `src/app/[locale]/landing/LandingHero.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `playfairItalic` from `../fonts` (Task 1).
- Produces: `LandingHero` component (no props) — used by Task 11.

- [ ] **Step 1: Create the component**

`src/app/[locale]/landing/LandingHero.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { playfairItalic } from '../fonts';

export async function LandingHero() {
  const t = await getTranslations('landing.hero');

  return (
    <section className="bg-[radial-gradient(circle_at_25%_0%,rgba(255,163,97,0.10),transparent_45%)] px-6 py-16 text-center md:py-24">
      <div className="mb-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffa361]">
        {t('eyebrow')}
      </div>
      <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-[#f9fafb] md:text-4xl">
        {t('titleLine1')}
      </h1>
      <p className={`${playfairItalic.className} mt-1 text-2xl text-[#ffa361] md:text-3xl`}>
        {t('titleLine2')}
      </p>
      <p className="mx-auto mt-6 max-w-md text-[13.5px] leading-relaxed text-[#9ca3af]">
        {t('subtitle')}
      </p>
      <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link href="/register" className="rounded-md bg-[#ffa361] px-6 py-3 text-[13px] font-bold text-[#1a0e05]">
          {t('ctaPrimary')}
        </Link>
        <a href="#fonctionnalites" className="rounded-md border border-[rgba(255,255,255,0.15)] px-6 py-3 text-[13px] font-semibold text-[#f9fafb]">
          {t('ctaSecondary')}
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add translation keys**

Add to `messages/fr.json` inside `landing`:

```json
"hero": {
  "eyebrow": "Discipline · Statistiques · Progression",
  "titleLine1": "Trade avec discipline.",
  "titleLine2": "Progresse avec des données.",
  "subtitle": "Le journal de trading qui relie chaque trade à tes stats, tes erreurs et ta stratégie — pour de vrai.",
  "ctaPrimary": "Essai gratuit 14 jours",
  "ctaSecondary": "Voir un aperçu"
}
```

Add to `messages/en.json` inside `landing`:

```json
"hero": {
  "eyebrow": "Discipline · Statistics · Progress",
  "titleLine1": "Trade with discipline.",
  "titleLine2": "Improve with real data.",
  "subtitle": "The trading journal that connects every trade to your stats, your mistakes, and your strategy — for real.",
  "ctaPrimary": "14-day free trial",
  "ctaSecondary": "See a preview"
}
```

- [ ] **Step 3: Manually verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/landing/LandingHero.tsx" messages/
git commit -m "feat: add landing page hero section"
```

---

### Task 5: Feature cards

**Files:**
- Create: `src/app/[locale]/landing/FeatureCards.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: none.
- Produces: `FeatureCards` component (no props) — used by Task 11.

- [ ] **Step 1: Create the component**

`src/app/[locale]/landing/FeatureCards.tsx`:

```tsx
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
```

- [ ] **Step 2: Add translation keys**

Add to `messages/fr.json` inside `landing`:

```json
"features": {
  "eyebrow": "Fonctionnalités",
  "title": "Tout ce qu'il te faut pour progresser",
  "dashboard": {
    "title": "Dashboard complet",
    "description": "Win rate, profit factor, espérance, courbe d'équité et limites de perte en un coup d'œil."
  },
  "errors": {
    "title": "Suivi des erreurs",
    "description": "Identifie tes erreurs récurrentes — revenge trading, taille de position, stop loss oublié."
  },
  "heatmaps": {
    "title": "Heatmaps de performance",
    "description": "Repère tes meilleurs jours, durées et mois de trading grâce aux heatmaps croisées par instrument."
  },
  "calculator": {
    "title": "Calculateur de taille de position",
    "description": "Calcule ta taille de position idéale à partir de ton risque et de la distance de ton stop."
  }
}
```

Add to `messages/en.json` inside `landing`:

```json
"features": {
  "eyebrow": "Features",
  "title": "Everything you need to improve",
  "dashboard": {
    "title": "Complete dashboard",
    "description": "Win rate, profit factor, expectancy, equity curve, and loss limits at a glance."
  },
  "errors": {
    "title": "Error tracking",
    "description": "Spot your recurring mistakes — revenge trading, wrong position size, a forgotten stop loss."
  },
  "heatmaps": {
    "title": "Performance heatmaps",
    "description": "Find your best trading days, durations, and months with heatmaps broken down by instrument."
  },
  "calculator": {
    "title": "Position size calculator",
    "description": "Calculate your ideal position size from your risk and your stop distance."
  }
}
```

- [ ] **Step 3: Manually verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/landing/FeatureCards.tsx" messages/
git commit -m "feat: add landing page feature cards section"
```

---

### Task 6: How it works

**Files:**
- Create: `src/app/[locale]/landing/HowItWorks.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `playfairItalic` from `../fonts` (Task 1).
- Produces: `HowItWorks` component (no props) — used by Task 11.

- [ ] **Step 1: Create the component**

`src/app/[locale]/landing/HowItWorks.tsx`:

```tsx
import { getTranslations } from 'next-intl/server';
import { playfairItalic } from '../fonts';

export async function HowItWorks() {
  const t = await getTranslations('landing.howItWorks');
  const steps = ['step1', 'step2', 'step3', 'step4'] as const;

  return (
    <section className="px-6 py-16 md:py-20">
      <div className="mb-10 text-center">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffa361]">
          {t('eyebrow')}
        </div>
        <h2 className="text-2xl font-extrabold text-[#f9fafb]">{t('title')}</h2>
        <p className={`${playfairItalic.className} mt-1 text-lg text-[#ffa361]`}>{t('tagline')}</p>
      </div>
      <div className="mx-auto grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
        {steps.map((key, i) => (
          <div key={key} className="rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#12151a] p-5">
            <div className={`${playfairItalic.className} mb-2 text-2xl font-bold text-[#ffa361]/40`}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <h3 className="mb-1 text-[13.5px] font-bold text-[#f9fafb]">{t(`${key}.title`)}</h3>
            <p className="text-[12px] leading-relaxed text-[#9ca3af]">{t(`${key}.description`)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add translation keys**

Add to `messages/fr.json` inside `landing`:

```json
"howItWorks": {
  "eyebrow": "Le parcours",
  "title": "Comment ça marche",
  "tagline": "Quatre étapes, zéro friction",
  "step1": {
    "title": "Crée ton compte",
    "description": "Inscription en 30 secondes, essai gratuit de 14 jours sans carte bancaire."
  },
  "step2": {
    "title": "Enregistre tes trades",
    "description": "P&L, risque et R-multiple calculés automatiquement à partir de tes prix."
  },
  "step3": {
    "title": "Suis tes stats & erreurs",
    "description": "Dashboard complet, heatmaps de performance, suivi de discipline."
  },
  "step4": {
    "title": "Progresse",
    "description": "Identifie tes erreurs récurrentes et resserre ta discipline trade après trade."
  }
}
```

Add to `messages/en.json` inside `landing`:

```json
"howItWorks": {
  "eyebrow": "The journey",
  "title": "How it works",
  "tagline": "Four steps, zero friction",
  "step1": {
    "title": "Create your account",
    "description": "Sign up in 30 seconds, 14-day free trial, no credit card required."
  },
  "step2": {
    "title": "Log your trades",
    "description": "P&L, risk, and R-multiple calculated automatically from your prices."
  },
  "step3": {
    "title": "Track your stats & mistakes",
    "description": "Complete dashboard, performance heatmaps, discipline tracking."
  },
  "step4": {
    "title": "Improve",
    "description": "Spot your recurring mistakes and tighten your discipline trade after trade."
  }
}
```

- [ ] **Step 3: Manually verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/landing/HowItWorks.tsx" messages/
git commit -m "feat: add landing page how-it-works numbered steps section"
```

---

### Task 7: Testimonials

**Files:**
- Create: `src/app/[locale]/landing/Testimonials.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: none.
- Produces: `Testimonials` component (no props) — used by Task 11.

- [ ] **Step 1: Create the component**

`src/app/[locale]/landing/Testimonials.tsx`:

```tsx
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
```

- [ ] **Step 2: Add translation keys**

Add to `messages/fr.json` inside `landing`:

```json
"testimonials": {
  "eyebrow": "Avis clients",
  "title": "Ce qu'en pensent les traders",
  "disclaimer": "Le produit est encore jeune : ces avis sont des exemples de format, pas de vrais retours. Ils seront remplacés par de vrais témoignages dès qu'ils seront disponibles.",
  "exampleTag": "Exemple",
  "t1": {
    "quote": "Enfin un journal qui calcule tout automatiquement. Je vois mes erreurs récurrentes en un coup d'œil.",
    "name": "Léa M.",
    "role": "Trading forex, 3 ans d'expérience"
  },
  "t2": {
    "quote": "Les heatmaps m'ont fait réaliser que je perdais systématiquement le vendredi après-midi.",
    "name": "Karim B.",
    "role": "Day trader indices"
  },
  "t3": {
    "quote": "Le suivi de discipline a changé ma façon de trader. Moins de revenge trading, plus de constance.",
    "name": "Thomas R.",
    "role": "Trading crypto"
  }
}
```

Add to `messages/en.json` inside `landing`:

```json
"testimonials": {
  "eyebrow": "Customer reviews",
  "title": "What traders are saying",
  "disclaimer": "The product is still young: these reviews are format examples, not real feedback. They'll be replaced with real testimonials as soon as they're available.",
  "exampleTag": "Example",
  "t1": {
    "quote": "Finally a journal that calculates everything automatically. I spot my recurring mistakes at a glance.",
    "name": "Lea M.",
    "role": "Forex trader, 3 years experience"
  },
  "t2": {
    "quote": "The heatmaps made me realize I was systematically losing on Friday afternoons.",
    "name": "Karim B.",
    "role": "Index day trader"
  },
  "t3": {
    "quote": "Discipline tracking changed how I trade. Less revenge trading, more consistency.",
    "name": "Thomas R.",
    "role": "Crypto trading"
  }
}
```

- [ ] **Step 3: Manually verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/landing/Testimonials.tsx" messages/
git commit -m "feat: add landing page testimonials section (labeled as examples)"
```

---

### Task 8: Pricing

**Files:**
- Create: `src/app/[locale]/landing/PricingSection.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `Currency`, `formatPrice` from `@/lib/currency` (Task 2).
- Produces: `PricingSection` component (no props) — used by Task 11.

- [ ] **Step 1: Create the component**

`src/app/[locale]/landing/PricingSection.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { formatPrice, type Currency } from '@/lib/currency';

const CURRENCIES: Currency[] = ['EUR', 'USD', 'FCFA'];

export function PricingSection() {
  const t = useTranslations('landing.pricing');
  const [currency, setCurrency] = useState<Currency>('EUR');

  return (
    <section id="pricing" className="px-6 py-16 md:py-20">
      <div className="mb-3 text-center">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffa361]">
          {t('eyebrow')}
        </div>
        <h2 className="text-2xl font-extrabold text-[#f9fafb]">{t('title')}</h2>
        <p className="mx-auto mt-2 max-w-sm text-[12.5px] text-[#9ca3af]">{t('subtitle')}</p>
      </div>

      <div className="mb-8 flex justify-center gap-2">
        {CURRENCIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCurrency(c)}
            className={`rounded-full border px-3.5 py-1.5 text-[12px] ${
              currency === c
                ? 'border-[#ffa361] bg-[#ffa361]/15 font-bold text-[#ffa361]'
                : 'border-[rgba(255,255,255,0.08)] text-[#9ca3af]'
            }`}
          >
            {c === 'EUR' ? 'EUR €' : c === 'USD' ? 'USD $' : 'FCFA'}
          </button>
        ))}
      </div>

      <div className="mx-auto flex max-w-lg flex-col gap-4 sm:flex-row">
        <div className="flex-1 rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12151a] p-6">
          <p className="mb-1.5 text-[14px] font-bold text-[#f9fafb]">{t('monthly.name')}</p>
          <span className="mb-3 inline-block rounded-full bg-[#ffa361]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#ffa361]">
            {t('trialTag')}
          </span>
          <p className="mb-1 text-[26px] font-extrabold text-[#f9fafb]">
            {formatPrice(5, currency)} <small className="text-[12px] font-medium text-[#9ca3af]">{t('monthly.period')}</small>
          </p>
          <p className="mb-5 text-[11px] text-[#9ca3af]">{t('monthly.note')}</p>
          <Link href="/register" className="block rounded-md bg-[#ffa361] py-2.5 text-center text-[12.5px] font-bold text-[#1a0e05]">
            {t('cta')}
          </Link>
        </div>
        <div className="relative flex-1 rounded-xl border border-[#ffa361] bg-[#12151a] p-6">
          <span className="absolute -top-3 right-4 rounded-full bg-[#ffa361] px-2.5 py-0.5 text-[9px] font-extrabold text-[#1a0e05]">
            {t('bestValue')}
          </span>
          <p className="mb-1.5 text-[14px] font-bold text-[#f9fafb]">{t('lifetime.name')}</p>
          <span className="mb-3 inline-block rounded-full bg-[#ffa361]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#ffa361]">
            {t('trialTag')}
          </span>
          <p className="mb-1 text-[26px] font-extrabold text-[#f9fafb]">
            {formatPrice(99, currency)} <small className="text-[12px] font-medium text-[#9ca3af]">{t('lifetime.period')}</small>
          </p>
          <p className="mb-5 text-[11px] text-[#9ca3af]">{t('lifetime.note')}</p>
          <Link href="/register" className="block rounded-md bg-[#ffa361] py-2.5 text-center text-[12.5px] font-bold text-[#1a0e05]">
            {t('cta')}
          </Link>
        </div>
      </div>
      <p className="mt-6 text-center text-[11px] text-[#6f7480]">{t('noCard')}</p>
    </section>
  );
}
```

- [ ] **Step 2: Add translation keys**

Add to `messages/fr.json` inside `landing`:

```json
"pricing": {
  "eyebrow": "Pricing",
  "title": "Un essai gratuit de 14 jours, sans carte",
  "subtitle": "Ensuite, choisis la formule qui te convient.",
  "trialTag": "14 jours gratuits",
  "bestValue": "Meilleure valeur",
  "monthly": {
    "name": "Mensuel",
    "period": "/ mois",
    "note": "Sans engagement, annulable à tout moment."
  },
  "lifetime": {
    "name": "À vie",
    "period": "paiement unique",
    "note": "Payé une fois, accès à vie."
  },
  "cta": "Démarrer l'essai gratuit",
  "noCard": "Aucune carte bancaire requise pour l'essai."
}
```

Add to `messages/en.json` inside `landing`:

```json
"pricing": {
  "eyebrow": "Pricing",
  "title": "A 14-day free trial, no card required",
  "subtitle": "Then pick the plan that suits you.",
  "trialTag": "14 days free",
  "bestValue": "Best value",
  "monthly": {
    "name": "Monthly",
    "period": "/ month",
    "note": "No commitment, cancel anytime."
  },
  "lifetime": {
    "name": "Lifetime",
    "period": "one-time payment",
    "note": "Pay once, lifetime access."
  },
  "cta": "Start the free trial",
  "noCard": "No credit card required for the trial."
}
```

- [ ] **Step 3: Manually verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/landing/PricingSection.tsx" messages/
git commit -m "feat: add landing page pricing section with currency switcher"
```

---

### Task 9: FAQ

**Files:**
- Create: `src/app/[locale]/landing/Faq.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: none.
- Produces: `Faq` component (no props) — used by Task 11.

- [ ] **Step 1: Create the component**

`src/app/[locale]/landing/Faq.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

export function Faq() {
  const t = useTranslations('landing.faq');
  const questions = ['q1', 'q2', 'q3', 'q4', 'q5'] as const;
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <section id="faq" className="px-6 py-16 md:py-20">
      <div className="mb-8 text-center">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-[#ffa361]">
          {t('eyebrow')}
        </div>
        <h2 className="text-2xl font-extrabold text-[#f9fafb]">{t('title')}</h2>
      </div>
      <div className="mx-auto max-w-2xl space-y-3">
        {questions.map((key) => {
          const isOpen = openKey === key;
          return (
            <div key={key} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#12151a]">
              <button
                type="button"
                onClick={() => setOpenKey(isOpen ? null : key)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="text-[13px] font-semibold text-[#f9fafb]">{t(`${key}.question`)}</span>
                <ChevronDown
                  size={16}
                  color="#9ca3af"
                  className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {isOpen && (
                <p className="px-5 pb-4 text-[12.5px] leading-relaxed text-[#9ca3af]">{t(`${key}.answer`)}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add translation keys**

Add to `messages/fr.json` inside `landing`:

```json
"faq": {
  "eyebrow": "Questions fréquentes",
  "title": "Tout ce que tu te demandes",
  "q1": {
    "question": "Puis-je annuler à tout moment ?",
    "answer": "Oui. L'essai gratuit de 14 jours ne demande pas de carte bancaire, et les formules mensuelles sont sans engagement."
  },
  "q2": {
    "question": "Mes données sont-elles en sécurité ?",
    "answer": "Tes données sont stockées de façon sécurisée et ne sont jamais partagées ni revendues à des tiers."
  },
  "q3": {
    "question": "Puis-je utiliser l'app sur mobile ?",
    "answer": "Oui, l'app fonctionne directement dans le navigateur de ton téléphone, aucune installation nécessaire."
  },
  "q4": {
    "question": "Le calcul du P&L est-il automatique ?",
    "answer": "Oui, à partir de tes prix d'entrée/sortie et de la valeur du point de ton instrument. Tu peux toujours corriger manuellement si besoin."
  },
  "q5": {
    "question": "Puis-je changer la devise de mon compte de trading ?",
    "answer": "Pas pour l'instant : l'app gère un compte de trading en euros uniquement. Le sélecteur de devise ci-dessus ne concerne que l'affichage du prix de l'abonnement."
  }
}
```

Add to `messages/en.json` inside `landing`:

```json
"faq": {
  "eyebrow": "Frequently asked questions",
  "title": "Everything you're wondering about",
  "q1": {
    "question": "Can I cancel anytime?",
    "answer": "Yes. The 14-day free trial requires no credit card, and monthly plans have no commitment."
  },
  "q2": {
    "question": "Is my data secure?",
    "answer": "Your data is stored securely and is never shared or sold to third parties."
  },
  "q3": {
    "question": "Can I use the app on mobile?",
    "answer": "Yes, the app works directly in your phone's browser, no installation required."
  },
  "q4": {
    "question": "Is P&L calculated automatically?",
    "answer": "Yes, from your entry/exit prices and your instrument's point value. You can always correct it manually if needed."
  },
  "q5": {
    "question": "Can I change my trading account's currency?",
    "answer": "Not yet: the app manages a euro-only trading account. The currency switcher above only affects how the subscription price is displayed."
  }
}
```

- [ ] **Step 3: Manually verify**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/landing/Faq.tsx" messages/
git commit -m "feat: add landing page FAQ accordion"
```

---

### Task 10: Footer and final CTA band

**Files:**
- Create: `src/app/[locale]/landing/LandingFooter.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: none.
- Produces: `LandingFooter` component (no props) — used by Task 11.

- [ ] **Step 1: Create the component**

`src/app/[locale]/landing/LandingFooter.tsx`:

```tsx
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function LandingFooter() {
  const t = await getTranslations('landing.footer');

  return (
    <>
      <section className="bg-[radial-gradient(circle_at_75%_100%,rgba(255,163,97,0.10),transparent_45%)] px-6 py-16 text-center">
        <h2 className="mb-5 text-xl font-extrabold text-[#f9fafb] md:text-2xl">{t('ctaTitle')}</h2>
        <Link href="/register" className="inline-block rounded-md bg-[#ffa361] px-7 py-3 text-[13px] font-bold text-[#1a0e05]">
          {t('ctaButton')}
        </Link>
      </section>

      <footer className="border-t border-[rgba(255,255,255,0.06)] px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 text-[12px] text-[#6f7480] sm:flex-row">
          <p>{t('copyright')}</p>
          <div className="flex gap-5">
            <span>{t('legalNotice')}</span>
            <span>{t('privacy')}</span>
            <a href="mailto:contact@journal-trading.app">{t('contact')}</a>
          </div>
        </div>
      </footer>
    </>
  );
}
```

- [ ] **Step 2: Add translation keys**

Add to `messages/fr.json` inside `landing`:

```json
"footer": {
  "ctaTitle": "Prêt à trader avec discipline ?",
  "ctaButton": "Essai gratuit 14 jours",
  "copyright": "© 2026 Journal. Tous droits réservés.",
  "legalNotice": "Mentions légales",
  "privacy": "Confidentialité",
  "contact": "Contact"
}
```

Add to `messages/en.json` inside `landing`:

```json
"footer": {
  "ctaTitle": "Ready to trade with discipline?",
  "ctaButton": "14-day free trial",
  "copyright": "© 2026 Journal. All rights reserved.",
  "legalNotice": "Legal notice",
  "privacy": "Privacy",
  "contact": "Contact"
}
```

- [ ] **Step 3: Manually verify**

Run: `npx tsc --noEmit`
Expected: no errors.

Note: `legalNotice` and `privacy` are plain text, not links, in this task — the actual legal pages are out of scope for this plan (design spec section 6). A future task can turn them into real links once those pages exist.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/landing/LandingFooter.tsx" messages/
git commit -m "feat: add landing page final CTA band and footer"
```

---

### Task 11: Assemble the landing page

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `LandingNav` (Task 3), `LandingHero` (Task 4), `FeatureCards` (Task 5), `HowItWorks` (Task 6), `Testimonials` (Task 7), `PricingSection` (Task 8), `Faq` (Task 9), `LandingFooter` (Task 10).
- Produces: none (this is the page itself).

- [ ] **Step 1: Replace the placeholder page**

`src/app/[locale]/page.tsx`:

```tsx
import { LandingNav } from './landing/LandingNav';
import { LandingHero } from './landing/LandingHero';
import { FeatureCards } from './landing/FeatureCards';
import { HowItWorks } from './landing/HowItWorks';
import { Testimonials } from './landing/Testimonials';
import { PricingSection } from './landing/PricingSection';
import { Faq } from './landing/Faq';
import { LandingFooter } from './landing/LandingFooter';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0c14]">
      <LandingNav />
      <LandingHero />
      <FeatureCards />
      <HowItWorks />
      <Testimonials />
      <PricingSection />
      <Faq />
      <LandingFooter />
    </main>
  );
}
```

- [ ] **Step 2: Remove the now-dead scaffolding translation key**

Remove the `home` key entirely from `messages/fr.json` and `messages/en.json` (it held only `"scaffolding": "..."`, which was the placeholder page's text — nothing references it anymore after Step 1).

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass, including the new `currency.test.ts` from Task 2.

- [ ] **Step 4: Run the type check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Manually verify in the browser, including mobile width**

Run: `npm run dev`, visit `http://localhost:3000/fr` (or whichever port is free).
Expected:
- All 8 sections render in order, dark navy background, coral (`#ffa361`) accents, no visual trace of the app's emerald theme.
- The hero and "how it works" tagline render in italic Playfair Display, visibly different from the rest of the sans-serif text.
- Clicking a nav link (`#fonctionnalites`, `#pricing`, `#avis`, `#faq`) scrolls to the matching section.
- The FR/EN switch in the nav changes the page language without a full reload feel (still a real navigation, but content updates correctly) — spot check a few strings changed correctly (e.g. hero title, pricing labels).
- The pricing currency switch (EUR/USD/FCFA) updates both price cards' displayed amounts, matching `formatPrice`'s output (5.00 €, 5.40 $, or 3 280 FCFA-ish for the monthly card).
- Clicking a FAQ question expands its answer and rotates the chevron; clicking again collapses it.
- Resize the browser window (or use devtools device toolbar) down to ~375px: the nav collapses to a hamburger menu that opens/closes correctly, the feature/step/testimonial grids stack to a single column, no horizontal scrollbar appears at any width between 375px and desktop.
- "Se connecter" links to `/login`, "Essai gratuit 14 jours" / equivalent CTAs link to `/register` (both already-working pages from earlier in the project).
- No React hydration warnings in the browser console.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/page.tsx" messages/
git commit -m "feat: assemble the full landing page, replacing the scaffolding placeholder"
```

---

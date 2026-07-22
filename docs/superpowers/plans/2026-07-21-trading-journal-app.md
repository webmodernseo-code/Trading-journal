# Trading Journal App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the core trading journal web app (auth, data model, trade entry, calculations, dashboard, and discipline/error analytics) as a working, deployable Next.js product — the landing page is a separate follow-up plan.

**Architecture:** Next.js (App Router, TypeScript) with Neon Postgres via Drizzle ORM, Auth.js (Credentials + JWT sessions, no OAuth), Vercel Blob for screenshot storage, next-intl for French/English routing, Tailwind CSS for styling using the dark "Emerald Terminal" design tokens locked during brainstorming. All calculation logic (P&L, risk, R-multiple, dashboard aggregations) lives in pure, unit-tested functions separate from UI/DB code.

**Tech Stack:** Next.js 15+ (App Router), React 19+, TypeScript 5+, Tailwind CSS 3.4+, Drizzle ORM + drizzle-kit, @neondatabase/serverless, next-auth 5 (beta), next-intl 3+, Vitest, bcryptjs, Zod, recharts, date-fns, @vercel/blob.

## Global Constraints

- Reference spec: `docs/superpowers/specs/2026-07-21-journal-trading-design.md` — every task below implements a section of it.
- **All date/calendar-boundary logic is UTC, always.** The test environment forces `TZ=UTC` (Task 1's `vitest.config.ts`) to match Vercel's serverless runtime. Never use local-timezone-implicit date operations in test fixtures or application code — use explicit UTC accessors (`getUTCDay`, `getUTCMonth`, etc., as Task 8 does) or rely on the forced-UTC environment (as Task 9's `date-fns` calls do) consistently, not a mix of both assumptions.
- **Dark theme (default) and light theme, with a manual toggle** (spec §6 — supersedes the earlier "dark only" decision). All color usage MUST go through the Tailwind tokens below (which resolve to CSS custom properties), never hardcoded hex/`white`/`black`, so the toggle works everywhere without per-page changes.
  - Dark tokens: `bg` `#0b0d10`, `sidebar` `#0d0f13`, `surface` `#12151a`, `surface-2` `#171b21`, `border-subtle` `rgba(255,255,255,0.07)`, `accent` `#10b981`, `accent-dim` `rgba(16,185,129,0.14)`, `gain` `#34d399`, `loss` `#fb7185`, `text-primary` `#f3f4f6`, `text-muted` `#8b93a1`, `text-faint` `#565d6b`, `cta` (primary button bg) `#ffffff`.
  - Light tokens (independently tuned, not an inversion): `bg` `#eef1f0`, `sidebar` `#e6eae8`, `surface` `#ffffff`, `surface-2` `#f2f5f4`, `border-subtle` `rgba(13,23,20,0.09)`, `accent` `#059669`, `accent-dim` `rgba(5,150,105,0.10)`, `gain` `#15803d`, `loss` `#dc2626`, `text-primary` `#10171a`, `text-muted` `#5b6b66`, `text-faint` `#93a29c`, `cta` `#10171a`.
  - Primary CTA buttons use `bg-cta text-bg` (the `text-bg` reuse is intentional: it always equals that theme's page-background color, giving the correct inverted-contrast text in both themes without a separate token).
- App currency is EUR only — no multi-currency accounts in the app (spec §8, §10).
- French + English from v1, on every page (spec §2, §7.4) — every user-facing string goes through next-intl, with an entry in both `messages/fr.json` and `messages/en.json`.
- Manual trade entry only — no broker auto-sync or CSV import in this plan (spec §10).
- Pricing/billing is entirely out of scope for this plan (it belongs to the landing page, and is display-only there per spec §7.3) — this plan never touches Stripe or trial/plan gating.
- P&L, risk, and R-multiple are semi-automatic: calculated from prices via a configurable per-instrument `pointValue`, always overridable by the user (spec §4).
- Every calculation/aggregation function (P&L, risk, R-multiple, position size, dashboard stats, heatmaps, loss limits, streaks, errors analytics) must be a pure function with unit tests — this is the highest-value test surface per spec §9.
- Optimisation module and economic calendar are explicitly out of scope (spec §5.7, §10).

---

## File Structure Overview

```
package.json, tsconfig.json, next.config.ts, tailwind.config.ts, postcss.config.js, drizzle.config.ts
src/middleware.ts                          — next-intl locale routing
src/i18n/request.ts                        — next-intl server config
messages/fr.json, messages/en.json         — translation strings
src/db/schema.ts                           — Drizzle table definitions
src/db/client.ts                           — Drizzle + Neon client
src/auth.ts                                — Auth.js config (Credentials + JWT)
src/lib/auth-helpers.ts                    — requireUser() server helper
src/lib/calculations.ts                    — pnl / risk / r-multiple / position size
src/lib/stats.ts                           — win rate / profit factor / expectancy / equity curve
src/lib/heatmaps.ts                        — symbol×day / symbol×duration / symbol×month
src/lib/loss-limits.ts                     — daily/weekly/monthly loss status
src/lib/streaks.ts                         — win/loss streak stats
src/lib/errors-analytics.ts                — checklist error aggregations
src/app/globals.css                        — Tailwind entry + design tokens
src/app/[locale]/layout.tsx                — root layout (locale provider)
src/app/[locale]/(auth)/register/          — registration page + action
src/app/[locale]/(auth)/login/             — login page
src/app/[locale]/(app)/layout.tsx          — shared sidebar shell (Task 25)
src/app/[locale]/(app)/Sidebar.tsx, TopBar.tsx, ThemeToggle.tsx
src/app/[locale]/(app)/instruments/        — instruments CRUD
src/app/[locale]/(app)/strategies/         — strategies CRUD
src/app/[locale]/(app)/checklist/          — checklist rules CRUD
src/app/[locale]/(app)/trades/             — trade list, create, detail/edit
src/app/[locale]/(app)/tools/position-size-calculator/
src/app/[locale]/(app)/dashboard/
src/app/[locale]/(app)/erreurs/
src/app/[locale]/(app)/settings/
```

---

### Task 1: Project scaffolding, Tailwind design tokens, Vitest

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.js`
- Create: `vitest.config.ts`
- Create: `src/app/globals.css`
- Create: `src/app/layout.tsx` (temporary root layout, replaced in Task 6 by `[locale]` routing)
- Create: `src/app/page.tsx` (placeholder home page)
- Create: `.env.local.example`
- Test: `src/lib/__tests__/sanity.test.ts`

**Interfaces:**
- Produces: Tailwind theme colors `bg`, `sidebar`, `surface`, `surface-2`, `border-subtle`, `accent`, `accent-dim`, `gain`, `loss`, `text-primary`, `text-muted`, `text-faint`, `cta` — usable as `bg-bg`, `bg-surface`, `text-accent`, `bg-cta`, etc. in every later UI task. These resolve to CSS custom properties (not literal hex), so Task 25's theme toggle changes them everywhere for free.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "trading-journal",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "next-auth": "5.0.0-beta.25",
    "drizzle-orm": "^0.38.3",
    "@neondatabase/serverless": "^0.10.4",
    "bcryptjs": "^2.4.3",
    "zod": "^3.24.1",
    "next-intl": "^3.26.3",
    "recharts": "^2.15.0",
    "date-fns": "^4.1.0",
    "@vercel/blob": "^0.27.0"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^22.10.2",
    "@types/react": "^19.0.2",
    "@types/react-dom": "^19.0.2",
    "@types/bcryptjs": "^2.4.6",
    "tailwindcss": "^3.4.17",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.30.1",
    "vitest": "^2.1.8",
    "dotenv": "^16.4.7"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: installs without errors, creates `package-lock.json` and `node_modules/`.

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "ES2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Create `next.config.ts`**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

(Task 6 will wrap this with `createNextIntlPlugin` once next-intl is wired in.)

- [ ] **Step 5: Create `tailwind.config.ts` mapping tokens to CSS custom properties**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        sidebar: 'var(--color-sidebar)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        'border-subtle': 'var(--color-border)',
        accent: 'var(--color-accent)',
        'accent-dim': 'var(--color-accent-dim)',
        gain: 'var(--color-gain)',
        loss: 'var(--color-loss)',
        'text-primary': 'var(--color-text)',
        'text-muted': 'var(--color-muted)',
        'text-faint': 'var(--color-faint)',
        cta: 'var(--color-cta)',
      },
    },
  },
  plugins: [],
};

export default config;
```

Every color is a CSS variable, not a literal hex — this is what lets Task 25's dark/light toggle repaint the whole app by flipping one attribute, with zero changes to any component that already uses these Tailwind classes.

- [ ] **Step 6: Create `postcss.config.js`**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 7: Create `src/app/globals.css` with dark (default) and light theme tokens**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg: #0b0d10;
  --color-sidebar: #0d0f13;
  --color-surface: #12151a;
  --color-surface-2: #171b21;
  --color-border: rgba(255, 255, 255, 0.07);
  --color-accent: #10b981;
  --color-accent-dim: rgba(16, 185, 129, 0.14);
  --color-gain: #34d399;
  --color-loss: #fb7185;
  --color-text: #f3f4f6;
  --color-muted: #8b93a1;
  --color-faint: #565d6b;
  --color-cta: #ffffff;
}

:root[data-theme='light'] {
  --color-bg: #eef1f0;
  --color-sidebar: #e6eae8;
  --color-surface: #ffffff;
  --color-surface-2: #f2f5f4;
  --color-border: rgba(13, 23, 20, 0.09);
  --color-accent: #059669;
  --color-accent-dim: rgba(5, 150, 105, 0.1);
  --color-gain: #15803d;
  --color-loss: #dc2626;
  --color-text: #10171a;
  --color-muted: #5b6b66;
  --color-faint: #93a29c;
  --color-cta: #10171a;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
}
```

Dark is the default (no `data-theme` attribute needed); `data-theme="light"` on `<html>` switches every token. Task 25 adds the toggle button and the `localStorage` persistence; Task 12's root layout adds the blocking init script that applies the saved preference before first paint (avoiding a flash of the wrong theme).

- [ ] **Step 8: Create temporary root layout and home page**

`src/app/layout.tsx`:

```tsx
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
```

`src/app/page.tsx`:

```tsx
export default function Home() {
  return <main className="p-8">Trading Journal — scaffolding OK</main>;
}
```

- [ ] **Step 9: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    // Forces UTC regardless of the host machine's local timezone, so
    // date-fns calendar-boundary functions (startOfDay/startOfWeek/etc.,
    // used from Task 9 onward) are deterministic in dev, CI, and prod
    // (Vercel's serverless runtime is UTC) alike.
    env: { TZ: 'UTC' },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

- [ ] **Step 10: Write a sanity test**

`src/lib/__tests__/sanity.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 11: Run the test suite**

Run: `npm test`
Expected: `1 passed` (sanity test).

- [ ] **Step 12: Create `.env.local.example`**

```
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
AUTH_SECRET="generate-with-npx-auth-secret"
BLOB_READ_WRITE_TOKEN="vercel-blob-token"
```

- [ ] **Step 13: Verify the dev server boots**

Run: `npm run dev`
Expected: server starts on `http://localhost:3000`, visiting it shows "Trading Journal — scaffolding OK". Stop the server after confirming.

- [ ] **Step 14: Commit**

```bash
git add package.json package-lock.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.js vitest.config.ts src/app/globals.css src/app/layout.tsx src/app/page.tsx src/lib/__tests__/sanity.test.ts .env.local.example .gitignore
git commit -m "chore: scaffold Next.js project with Tailwind design tokens and Vitest"
```

(Add `node_modules/`, `.next/`, `.env.local` to `.gitignore` if not already covered — check first with `git status`.)

---

### Task 2: Neon + Drizzle connection

**Files:**
- Create: `drizzle.config.ts`
- Create: `src/db/client.ts`
- Test: `src/db/__tests__/client.test.ts`

**Interfaces:**
- Consumes: `DATABASE_URL` env var (Task 1 `.env.local.example`).
- Produces: `export const db` (Drizzle instance) from `src/db/client.ts`, used by every later data-access task.

- [ ] **Step 1: Create a free Neon project and set `DATABASE_URL`**

Manual step (no code): create a project at neon.tech, copy the pooled connection string into `.env.local` as `DATABASE_URL`.

- [ ] **Step 2: Create `drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'path';

// Explicit path: the project's env vars live in .env.local (Next.js
// convention, per Task 1's .env.local.example), and dotenv's bare
// 'dotenv/config' import only auto-loads a plain .env file, which this
// project never creates — so DATABASE_URL would silently be undefined here.
dotenv.config({ path: path.resolve('.env.local') });

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 3: Create `src/db/client.ts`**

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
```

(This imports `./schema`, which does not exist yet — Task 3 creates it. This task will not compile standalone; that's expected and resolved by Task 3's commit.)

- [ ] **Step 4: Commit**

```bash
git add drizzle.config.ts src/db/client.ts
git commit -m "chore: add Neon/Drizzle client configuration"
```

---

### Task 3: Drizzle schema — users, instruments, strategies, checklist_rules

**Files:**
- Create: `src/db/schema.ts`
- Test: `src/db/__tests__/schema.test.ts`

**Interfaces:**
- Produces: Drizzle table objects `users`, `instruments`, `strategies`, `checklistRules`, and TypeScript types `User`, `Instrument`, `Strategy`, `ChecklistRule` (via `typeof table.$inferSelect`), used by every later task touching these entities.

- [ ] **Step 1: Write `src/db/schema.ts` (first four tables)**

```typescript
import { pgTable, uuid, text, doublePrecision, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  locale: text('locale', { enum: ['fr', 'en'] }).notNull().default('fr'),
  accountBalance: doublePrecision('account_balance').notNull().default(0),
  defaultRiskPercent: doublePrecision('default_risk_percent'),
  dailyLossLimit: doublePrecision('daily_loss_limit'),
  weeklyLossLimit: doublePrecision('weekly_loss_limit'),
  monthlyLossLimit: doublePrecision('monthly_loss_limit'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const instruments = pgTable('instruments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  assetClass: text('asset_class', { enum: ['forex', 'commodity', 'crypto', 'index', 'other'] }).notNull(),
  pointValue: doublePrecision('point_value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const strategies = pgTable('strategies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const checklistRules = pgTable('checklist_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  active: boolean('active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Instrument = typeof instruments.$inferSelect;
export type Strategy = typeof strategies.$inferSelect;
export type ChecklistRule = typeof checklistRules.$inferSelect;
```

- [ ] **Step 2: Generate the migration**

Run: `npm run db:generate`
Expected: creates a new file under `drizzle/` (e.g. `drizzle/0000_xxx.sql`) with `CREATE TABLE` statements for the four tables.

- [ ] **Step 3: Apply the migration to Neon**

Run: `npm run db:migrate`
Expected: output confirms migration applied, no errors.

- [ ] **Step 4: Write a schema smoke test**

`src/db/__tests__/schema.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { users, instruments, strategies, checklistRules } from '../schema';

describe('schema', () => {
  it('exports all four tables', () => {
    expect(users).toBeDefined();
    expect(instruments).toBeDefined();
    expect(strategies).toBeDefined();
    expect(checklistRules).toBeDefined();
  });
});
```

- [ ] **Step 5: Run the test**

Run: `npm test`
Expected: schema test passes alongside the Task 1 sanity test.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/db/__tests__/schema.test.ts drizzle/
git commit -m "feat: add users, instruments, strategies, checklist_rules tables"
```

---

### Task 4: Drizzle schema — trades, trade_checklist_responses, trade_screenshots

**Files:**
- Modify: `src/db/schema.ts`
- Test: `src/db/__tests__/schema.test.ts`

**Interfaces:**
- Consumes: `users`, `instruments`, `strategies`, `checklistRules` from Task 3.
- Produces: `trades`, `tradeChecklistResponses`, `tradeScreenshots` tables and types `Trade`, `TradeChecklistResponse`, `TradeScreenshot`, used by every later trade-related task.

- [ ] **Step 1: Append to `src/db/schema.ts`**

```typescript
export const trades = pgTable('trades', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  instrumentId: uuid('instrument_id').notNull().references(() => instruments.id),
  strategyId: uuid('strategy_id').references(() => strategies.id),
  direction: text('direction', { enum: ['long', 'short'] }).notNull(),
  entryPrice: doublePrecision('entry_price').notNull(),
  exitPrice: doublePrecision('exit_price'),
  quantity: doublePrecision('quantity').notNull(),
  stopLossPrice: doublePrecision('stop_loss_price'),
  takeProfitPrice: doublePrecision('take_profit_price'),
  enteredAt: timestamp('entered_at', { withTimezone: true }).notNull(),
  exitedAt: timestamp('exited_at', { withTimezone: true }),
  status: text('status', { enum: ['open', 'closed'] }).notNull().default('open'),
  pnlAmount: doublePrecision('pnl_amount'),
  pnlOverride: boolean('pnl_override').notNull().default(false),
  riskAmount: doublePrecision('risk_amount'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const tradeChecklistResponses = pgTable('trade_checklist_responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  tradeId: uuid('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  checklistRuleId: uuid('checklist_rule_id').notNull().references(() => checklistRules.id),
  checked: boolean('checked').notNull().default(false),
  phase: text('phase', { enum: ['pre_entry', 'entry', 'management', 'exit'] }),
});

export const tradeScreenshots = pgTable('trade_screenshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  tradeId: uuid('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Trade = typeof trades.$inferSelect;
export type TradeChecklistResponse = typeof tradeChecklistResponses.$inferSelect;
export type TradeScreenshot = typeof tradeScreenshots.$inferSelect;
```

- [ ] **Step 2: Update the schema test**

Add to `src/db/__tests__/schema.test.ts`:

```typescript
import { trades, tradeChecklistResponses, tradeScreenshots } from '../schema';

// inside the existing describe block, add:
it('exports the trade tables', () => {
  expect(trades).toBeDefined();
  expect(tradeChecklistResponses).toBeDefined();
  expect(tradeScreenshots).toBeDefined();
});
```

- [ ] **Step 3: Generate and apply the migration**

Run: `npm run db:generate`
Expected: new file under `drizzle/` with `CREATE TABLE` for the three new tables and foreign keys.

Run: `npm run db:migrate`
Expected: confirms migration applied.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts src/db/__tests__/schema.test.ts drizzle/
git commit -m "feat: add trades, trade_checklist_responses, trade_screenshots tables"
```

---

### Task 5: Calculation lib — P&L, risk, R-multiple

**Files:**
- Create: `src/lib/calculations.ts`
- Test: `src/lib/__tests__/calculations.test.ts`

**Interfaces:**
- Produces: `calculatePnl`, `calculateRisk`, `calculateRMultiple` — pure functions consumed by the trade form (Task 15) and trade server actions.

- [ ] **Step 1: Write failing tests**

`src/lib/__tests__/calculations.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculatePnl, calculateRisk, calculateRMultiple } from '../calculations';

describe('calculatePnl', () => {
  it('computes a positive result for a winning long trade', () => {
    const result = calculatePnl({
      entryPrice: 1.085,
      exitPrice: 1.087,
      quantity: 1,
      direction: 'long',
      pointValue: 10000,
    });
    expect(result).toBeCloseTo(20, 5);
  });

  it('inverts the sign for a short trade', () => {
    const result = calculatePnl({
      entryPrice: 1.087,
      exitPrice: 1.085,
      quantity: 1,
      direction: 'short',
      pointValue: 10000,
    });
    expect(result).toBeCloseTo(20, 5);
  });

  it('computes a negative result for a losing long trade', () => {
    const result = calculatePnl({
      entryPrice: 1.087,
      exitPrice: 1.085,
      quantity: 1,
      direction: 'long',
      pointValue: 10000,
    });
    expect(result).toBeCloseTo(-20, 5);
  });
});

describe('calculateRisk', () => {
  it('computes risk as absolute distance to stop', () => {
    const result = calculateRisk({
      entryPrice: 1.085,
      stopLossPrice: 1.08,
      quantity: 1,
      pointValue: 10000,
    });
    expect(result).toBeCloseTo(50, 5);
  });

  it('returns null when there is no stop loss', () => {
    const result = calculateRisk({
      entryPrice: 1.085,
      stopLossPrice: null,
      quantity: 1,
      pointValue: 10000,
    });
    expect(result).toBeNull();
  });
});

describe('calculateRMultiple', () => {
  it('divides pnl by risk', () => {
    expect(calculateRMultiple(100, 50)).toBe(2);
  });

  it('returns null when risk is null', () => {
    expect(calculateRMultiple(100, null)).toBeNull();
  });

  it('returns null when risk is zero', () => {
    expect(calculateRMultiple(100, 0)).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/calculations.test.ts`
Expected: FAIL — `Cannot find module '../calculations'`.

- [ ] **Step 3: Implement `src/lib/calculations.ts`**

```typescript
export type Direction = 'long' | 'short';

export function calculatePnl(params: {
  entryPrice: number;
  exitPrice: number;
  quantity: number;
  direction: Direction;
  pointValue: number;
}): number {
  const { entryPrice, exitPrice, quantity, direction, pointValue } = params;
  const rawDelta = exitPrice - entryPrice;
  const signedDelta = direction === 'long' ? rawDelta : -rawDelta;
  return signedDelta * quantity * pointValue;
}

export function calculateRisk(params: {
  entryPrice: number;
  stopLossPrice: number | null;
  quantity: number;
  pointValue: number;
}): number | null {
  const { entryPrice, stopLossPrice, quantity, pointValue } = params;
  if (stopLossPrice === null) return null;
  return Math.abs(entryPrice - stopLossPrice) * quantity * pointValue;
}

export function calculateRMultiple(pnlAmount: number, riskAmount: number | null): number | null {
  if (riskAmount === null || riskAmount === 0) return null;
  return pnlAmount / riskAmount;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/calculations.test.ts`
Expected: all 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculations.ts src/lib/__tests__/calculations.test.ts
git commit -m "feat: add pnl, risk, and r-multiple calculation functions"
```

---

### Task 6: Calculation lib — position size calculator

**Files:**
- Create: `src/lib/position-size.ts`
- Test: `src/lib/__tests__/position-size.test.ts`

**Interfaces:**
- Produces: `calculatePositionSize` — used by the position size calculator page (Task 17) and embedded in the trade form (Task 15).

- [ ] **Step 1: Write failing tests**

`src/lib/__tests__/position-size.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculatePositionSize } from '../position-size';

describe('calculatePositionSize', () => {
  it('computes quantity from risk amount, stop distance, and point value', () => {
    // risk 50, stop distance 0.005, point value 10 per unit per point
    // quantity = 50 / (0.005 * 10) = 1000
    const result = calculatePositionSize({
      riskAmount: 50,
      stopDistance: 0.005,
      pointValue: 10,
    });
    expect(result).toBeCloseTo(1000, 5);
  });

  it('throws when stop distance is zero', () => {
    expect(() =>
      calculatePositionSize({ riskAmount: 50, stopDistance: 0, pointValue: 10 })
    ).toThrow('stopDistance must be greater than zero');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/position-size.test.ts`
Expected: FAIL — `Cannot find module '../position-size'`.

- [ ] **Step 3: Implement `src/lib/position-size.ts`**

```typescript
export function calculatePositionSize(params: {
  riskAmount: number;
  stopDistance: number;
  pointValue: number;
}): number {
  const { riskAmount, stopDistance, pointValue } = params;
  if (stopDistance <= 0) {
    throw new Error('stopDistance must be greater than zero');
  }
  return riskAmount / (stopDistance * pointValue);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/position-size.test.ts`
Expected: both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/position-size.ts src/lib/__tests__/position-size.test.ts
git commit -m "feat: add position size calculator function"
```

---

### Task 7: Calculation lib — core dashboard stats

**Files:**
- Create: `src/lib/stats.ts`
- Test: `src/lib/__tests__/stats.test.ts`

**Interfaces:**
- Consumes: none (works on a plain array of closed-trade summaries).
- Produces: `ClosedTradeStat` type, `calculateWinRate`, `calculateProfitFactor`, `calculateExpectancy`, `calculateEquityCurve` — used by the dashboard page (Task 21).

- [ ] **Step 1: Write failing tests**

`src/lib/__tests__/stats.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateWinRate,
  calculateProfitFactor,
  calculateExpectancy,
  calculateEquityCurve,
  type ClosedTradeStat,
} from '../stats';

const sample: ClosedTradeStat[] = [
  { id: '1', pnlAmount: 100, rMultiple: 2, exitedAt: new Date('2026-01-01') },
  { id: '2', pnlAmount: -50, rMultiple: -1, exitedAt: new Date('2026-01-02') },
  { id: '3', pnlAmount: 200, rMultiple: 3, exitedAt: new Date('2026-01-03') },
  { id: '4', pnlAmount: -50, rMultiple: -1, exitedAt: new Date('2026-01-04') },
];

describe('calculateWinRate', () => {
  it('returns the percentage of trades with positive pnl', () => {
    expect(calculateWinRate(sample)).toBe(50);
  });

  it('returns 0 for an empty list', () => {
    expect(calculateWinRate([])).toBe(0);
  });
});

describe('calculateProfitFactor', () => {
  it('divides gross profit by gross loss', () => {
    // gains: 100+200=300, losses: 50+50=100 -> 3
    expect(calculateProfitFactor(sample)).toBe(3);
  });

  it('returns null when there are no losing trades', () => {
    const onlyWins: ClosedTradeStat[] = [
      { id: '1', pnlAmount: 100, rMultiple: 2, exitedAt: new Date() },
    ];
    expect(calculateProfitFactor(onlyWins)).toBeNull();
  });
});

describe('calculateExpectancy', () => {
  it('averages the r-multiple across trades that have one', () => {
    // (2 + -1 + 3 + -1) / 4 = 0.75
    expect(calculateExpectancy(sample)).toBeCloseTo(0.75, 5);
  });

  it('returns null when no trade has an r-multiple', () => {
    const noR: ClosedTradeStat[] = [
      { id: '1', pnlAmount: 100, rMultiple: null, exitedAt: new Date() },
    ];
    expect(calculateExpectancy(noR)).toBeNull();
  });
});

describe('calculateEquityCurve', () => {
  it('returns cumulative pnl ordered by exit date', () => {
    const curve = calculateEquityCurve(sample);
    expect(curve).toEqual([
      { date: new Date('2026-01-01'), cumulativePnl: 100 },
      { date: new Date('2026-01-02'), cumulativePnl: 50 },
      { date: new Date('2026-01-03'), cumulativePnl: 250 },
      { date: new Date('2026-01-04'), cumulativePnl: 200 },
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/stats.test.ts`
Expected: FAIL — `Cannot find module '../stats'`.

- [ ] **Step 3: Implement `src/lib/stats.ts`**

```typescript
export interface ClosedTradeStat {
  id: string;
  pnlAmount: number;
  rMultiple: number | null;
  exitedAt: Date;
}

export function calculateWinRate(trades: ClosedTradeStat[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter((t) => t.pnlAmount > 0).length;
  return (wins / trades.length) * 100;
}

export function calculateProfitFactor(trades: ClosedTradeStat[]): number | null {
  const grossProfit = trades.filter((t) => t.pnlAmount > 0).reduce((sum, t) => sum + t.pnlAmount, 0);
  const grossLoss = Math.abs(
    trades.filter((t) => t.pnlAmount < 0).reduce((sum, t) => sum + t.pnlAmount, 0)
  );
  if (grossLoss === 0) return null;
  return grossProfit / grossLoss;
}

export function calculateExpectancy(trades: ClosedTradeStat[]): number | null {
  const withR = trades.filter((t) => t.rMultiple !== null) as (ClosedTradeStat & { rMultiple: number })[];
  if (withR.length === 0) return null;
  return withR.reduce((sum, t) => sum + t.rMultiple, 0) / withR.length;
}

export function calculateEquityCurve(
  trades: ClosedTradeStat[]
): { date: Date; cumulativePnl: number }[] {
  const sorted = [...trades].sort((a, b) => a.exitedAt.getTime() - b.exitedAt.getTime());
  let running = 0;
  return sorted.map((t) => {
    running += t.pnlAmount;
    return { date: t.exitedAt, cumulativePnl: running };
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/stats.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/stats.ts src/lib/__tests__/stats.test.ts
git commit -m "feat: add core dashboard stats (win rate, profit factor, expectancy, equity curve)"
```

---

### Task 8: Calculation lib — heatmaps

**Files:**
- Create: `src/lib/heatmaps.ts`
- Test: `src/lib/__tests__/heatmaps.test.ts`

**Interfaces:**
- Produces: `HeatmapTrade` type, `heatmapBySymbolAndDay`, `heatmapBySymbolAndDuration`, `heatmapBySymbolAndMonth` — used by the heatmaps page (Task 22).

- [ ] **Step 1: Write failing tests**

`src/lib/__tests__/heatmaps.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  heatmapBySymbolAndDay,
  heatmapBySymbolAndMonth,
  heatmapBySymbolAndDuration,
  type HeatmapTrade,
} from '../heatmaps';

// 2026-01-05 is a Monday, 2026-01-06 is a Tuesday
const trades: HeatmapTrade[] = [
  {
    instrumentName: 'EURUSD',
    pnlAmount: 10,
    enteredAt: new Date('2026-01-05T09:00:00Z'),
    exitedAt: new Date('2026-01-05T09:30:00Z'),
  },
  {
    instrumentName: 'EURUSD',
    pnlAmount: -5,
    enteredAt: new Date('2026-01-06T09:00:00Z'),
    exitedAt: new Date('2026-01-06T11:00:00Z'),
  },
  {
    instrumentName: 'XAUUSD',
    pnlAmount: 20,
    enteredAt: new Date('2026-02-05T09:00:00Z'),
    exitedAt: new Date('2026-02-05T09:15:00Z'),
  },
];

describe('heatmapBySymbolAndDay', () => {
  it('sums pnl by instrument and day of week (0=Sunday)', () => {
    const result = heatmapBySymbolAndDay(trades);
    expect(result.EURUSD[1]).toBe(10); // Monday
    expect(result.EURUSD[2]).toBe(-5); // Tuesday
    expect(result.XAUUSD[4]).toBe(20); // Thursday
  });
});

describe('heatmapBySymbolAndMonth', () => {
  it('sums pnl by instrument and month (1-12)', () => {
    const result = heatmapBySymbolAndMonth(trades);
    expect(result.EURUSD[1]).toBe(5); // January: 10 + -5
    expect(result.XAUUSD[2]).toBe(20); // February
  });
});

describe('heatmapBySymbolAndDuration', () => {
  it('buckets trades by duration and sums pnl', () => {
    const result = heatmapBySymbolAndDuration(trades);
    // EURUSD trade 1: 30 minutes -> inclusive up to 30, so "<30m"
    expect(result.EURUSD['<30m']).toBe(10);
    // EURUSD trade 2: 2 hours -> "1h-4h"
    expect(result.EURUSD['1h-4h']).toBe(-5);
    // XAUUSD trade: 15 minutes -> "<30m" (this bucket has no lower floor,
    // so any short trade — even a 2-minute scalp — lands here too)
    expect(result.XAUUSD['<30m']).toBe(20);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/heatmaps.test.ts`
Expected: FAIL — `Cannot find module '../heatmaps'`.

- [ ] **Step 3: Implement `src/lib/heatmaps.ts`**

```typescript
export interface HeatmapTrade {
  instrumentName: string;
  pnlAmount: number;
  enteredAt: Date;
  exitedAt: Date;
}

type SymbolBuckets = Record<string, Record<string, number>>;

function addToBucket(buckets: SymbolBuckets, instrument: string, key: string, pnl: number): void {
  if (!buckets[instrument]) buckets[instrument] = {};
  buckets[instrument][key] = (buckets[instrument][key] ?? 0) + pnl;
}

export function heatmapBySymbolAndDay(trades: HeatmapTrade[]): SymbolBuckets {
  const buckets: SymbolBuckets = {};
  for (const t of trades) {
    const day = t.exitedAt.getUTCDay(); // 0=Sunday .. 6=Saturday
    addToBucket(buckets, t.instrumentName, String(day), t.pnlAmount);
  }
  return buckets;
}

export function heatmapBySymbolAndMonth(trades: HeatmapTrade[]): SymbolBuckets {
  const buckets: SymbolBuckets = {};
  for (const t of trades) {
    const month = t.exitedAt.getUTCMonth() + 1; // 1-12
    addToBucket(buckets, t.instrumentName, String(month), t.pnlAmount);
  }
  return buckets;
}

const DURATION_BUCKETS: { label: string; maxMinutes: number }[] = [
  { label: '<30m', maxMinutes: 30 },
  { label: '30m-1h', maxMinutes: 60 },
  { label: '1h-4h', maxMinutes: 240 },
  { label: '4h-1d', maxMinutes: 1440 },
  { label: '>1d', maxMinutes: Infinity },
];

function durationBucketLabel(enteredAt: Date, exitedAt: Date): string {
  const minutes = (exitedAt.getTime() - enteredAt.getTime()) / 60000;
  const bucket = DURATION_BUCKETS.find((b) => minutes <= b.maxMinutes);
  return bucket ? bucket.label : '>1d';
}

export function heatmapBySymbolAndDuration(trades: HeatmapTrade[]): SymbolBuckets {
  const buckets: SymbolBuckets = {};
  for (const t of trades) {
    const label = durationBucketLabel(t.enteredAt, t.exitedAt);
    addToBucket(buckets, t.instrumentName, label, t.pnlAmount);
  }
  return buckets;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/heatmaps.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/heatmaps.ts src/lib/__tests__/heatmaps.test.ts
git commit -m "feat: add symbol x day/duration/month heatmap aggregations"
```

---

### Task 9: Calculation lib — loss limit status

**Files:**
- Create: `src/lib/loss-limits.ts`
- Test: `src/lib/__tests__/loss-limits.test.ts`

**Interfaces:**
- Produces: `LossLimitStatus` type, `calculateDailyLossStatus`, `calculateWeeklyLossStatus`, `calculateMonthlyLossStatus` — used by the dashboard page (Task 21).

- [ ] **Step 1: Write failing tests**

`src/lib/__tests__/loss-limits.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  calculateDailyLossStatus,
  calculateWeeklyLossStatus,
  calculateMonthlyLossStatus,
} from '../loss-limits';

const trades = [
  { pnlAmount: -30, exitedAt: new Date('2026-01-06T10:00:00Z') }, // Tuesday, in week of Jan 5-11
  { pnlAmount: -20, exitedAt: new Date('2026-01-06T14:00:00Z') },
  { pnlAmount: 50, exitedAt: new Date('2026-01-06T16:00:00Z') },
  { pnlAmount: -10, exitedAt: new Date('2026-01-08T10:00:00Z') }, // different day, same week/month
];

const referenceDate = new Date('2026-01-06T23:00:00Z');

describe('calculateDailyLossStatus', () => {
  it('sums only the losing trades for the reference day', () => {
    const status = calculateDailyLossStatus(trades, 100, referenceDate);
    expect(status.currentLoss).toBe(50); // 30 + 20, the +50 win is excluded
    expect(status.limit).toBe(100);
    expect(status.percentUsed).toBe(50);
  });

  it('returns null percentUsed when no limit is set', () => {
    const status = calculateDailyLossStatus(trades, null, referenceDate);
    expect(status.limit).toBeNull();
    expect(status.percentUsed).toBeNull();
  });
});

describe('calculateWeeklyLossStatus', () => {
  it('sums losses across the whole week (Mon-Sun)', () => {
    const status = calculateWeeklyLossStatus(trades, 200, referenceDate);
    expect(status.currentLoss).toBe(60); // 30 + 20 + 10
    expect(status.percentUsed).toBe(30);
  });
});

describe('calculateMonthlyLossStatus', () => {
  it('sums losses across the whole calendar month', () => {
    const status = calculateMonthlyLossStatus(trades, 1000, referenceDate);
    expect(status.currentLoss).toBe(60);
    expect(status.percentUsed).toBe(6);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/loss-limits.test.ts`
Expected: FAIL — `Cannot find module '../loss-limits'`.

- [ ] **Step 3: Implement `src/lib/loss-limits.ts`**

```typescript
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

export interface LossLimitStatus {
  currentLoss: number;
  limit: number | null;
  percentUsed: number | null;
}

interface PnlRecord {
  pnlAmount: number;
  exitedAt: Date;
}

function sumLossesBetween(trades: PnlRecord[], start: Date, end: Date): number {
  return trades
    .filter((t) => t.exitedAt >= start && t.exitedAt <= end && t.pnlAmount < 0)
    .reduce((sum, t) => sum + Math.abs(t.pnlAmount), 0);
}

function buildStatus(currentLoss: number, limit: number | null): LossLimitStatus {
  return {
    currentLoss,
    limit,
    percentUsed: limit === null || limit === 0 ? null : (currentLoss / limit) * 100,
  };
}

export function calculateDailyLossStatus(
  trades: PnlRecord[],
  limit: number | null,
  referenceDate: Date
): LossLimitStatus {
  const loss = sumLossesBetween(trades, startOfDay(referenceDate), endOfDay(referenceDate));
  return buildStatus(loss, limit);
}

export function calculateWeeklyLossStatus(
  trades: PnlRecord[],
  limit: number | null,
  referenceDate: Date
): LossLimitStatus {
  const loss = sumLossesBetween(
    trades,
    startOfWeek(referenceDate, { weekStartsOn: 1 }),
    endOfWeek(referenceDate, { weekStartsOn: 1 })
  );
  return buildStatus(loss, limit);
}

export function calculateMonthlyLossStatus(
  trades: PnlRecord[],
  limit: number | null,
  referenceDate: Date
): LossLimitStatus {
  const loss = sumLossesBetween(trades, startOfMonth(referenceDate), endOfMonth(referenceDate));
  return buildStatus(loss, limit);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/loss-limits.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/loss-limits.ts src/lib/__tests__/loss-limits.test.ts
git commit -m "feat: add daily/weekly/monthly loss limit status calculations"
```

---

### Task 10: Calculation lib — win/loss streaks

**Files:**
- Create: `src/lib/streaks.ts`
- Test: `src/lib/__tests__/streaks.test.ts`

**Interfaces:**
- Produces: `StreakStats` type, `calculateStreaks` — used by the dashboard page (Task 21).

- [ ] **Step 1: Write failing tests**

`src/lib/__tests__/streaks.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateStreaks } from '../streaks';

describe('calculateStreaks', () => {
  it('computes current streak, max streaks, and average streak lengths', () => {
    // order matters: sorted by exitedAt ascending
    const trades = [
      { pnlAmount: 10, exitedAt: new Date('2026-01-01') }, // win streak 1
      { pnlAmount: 10, exitedAt: new Date('2026-01-02') }, // win streak 2
      { pnlAmount: 10, exitedAt: new Date('2026-01-03') }, // win streak 3
      { pnlAmount: -10, exitedAt: new Date('2026-01-04') }, // loss streak 1
      { pnlAmount: -10, exitedAt: new Date('2026-01-05') }, // loss streak 2
      { pnlAmount: 10, exitedAt: new Date('2026-01-06') }, // win streak 1 (current)
    ];
    const result = calculateStreaks(trades);
    expect(result.maxWinStreak).toBe(3);
    expect(result.maxLossStreak).toBe(2);
    expect(result.currentStreak).toBe(1); // 1 win in progress
    expect(result.avgWinStreak).toBeCloseTo(2, 5); // streaks of 3 and 1 -> avg 2
    expect(result.avgLossStreak).toBe(2); // one streak of 2
  });

  it('returns zeroed stats for an empty list', () => {
    const result = calculateStreaks([]);
    expect(result).toEqual({
      currentStreak: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
      avgWinStreak: 0,
      avgLossStreak: 0,
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/streaks.test.ts`
Expected: FAIL — `Cannot find module '../streaks'`.

- [ ] **Step 3: Implement `src/lib/streaks.ts`**

```typescript
export interface StreakStats {
  currentStreak: number; // positive = current winning streak, negative = current losing streak
  maxWinStreak: number;
  maxLossStreak: number;
  avgWinStreak: number;
  avgLossStreak: number;
}

interface PnlRecord {
  pnlAmount: number;
  exitedAt: Date;
}

export function calculateStreaks(trades: PnlRecord[]): StreakStats {
  if (trades.length === 0) {
    return { currentStreak: 0, maxWinStreak: 0, maxLossStreak: 0, avgWinStreak: 0, avgLossStreak: 0 };
  }

  const sorted = [...trades].sort((a, b) => a.exitedAt.getTime() - b.exitedAt.getTime());

  const winStreaks: number[] = [];
  const lossStreaks: number[] = [];
  let currentType: 'win' | 'loss' | null = null;
  let currentLength = 0;

  for (const t of sorted) {
    const type: 'win' | 'loss' = t.pnlAmount >= 0 ? 'win' : 'loss';
    if (type === currentType) {
      currentLength += 1;
    } else {
      if (currentType === 'win') winStreaks.push(currentLength);
      if (currentType === 'loss') lossStreaks.push(currentLength);
      currentType = type;
      currentLength = 1;
    }
  }
  if (currentType === 'win') winStreaks.push(currentLength);
  if (currentType === 'loss') lossStreaks.push(currentLength);

  const avg = (arr: number[]) => (arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length);

  return {
    currentStreak: currentType === 'win' ? currentLength : -currentLength,
    maxWinStreak: winStreaks.length > 0 ? Math.max(...winStreaks) : 0,
    maxLossStreak: lossStreaks.length > 0 ? Math.max(...lossStreaks) : 0,
    avgWinStreak: avg(winStreaks),
    avgLossStreak: avg(lossStreaks),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/streaks.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/streaks.ts src/lib/__tests__/streaks.test.ts
git commit -m "feat: add win/loss streak calculations"
```

---

### Task 11: Calculation lib — errors analytics

**Files:**
- Create: `src/lib/errors-analytics.ts`
- Test: `src/lib/__tests__/errors-analytics.test.ts`

**Interfaces:**
- Produces: `ChecklistPhase` type, `ChecklistResponseRecord` type, `ErrorsAnalytics` type, `calculateErrorsAnalytics` — used by the Erreurs page (Task 23).

- [ ] **Step 1: Write failing tests**

`src/lib/__tests__/errors-analytics.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calculateErrorsAnalytics, type ChecklistResponseRecord } from '../errors-analytics';

describe('calculateErrorsAnalytics', () => {
  it('aggregates totals, by-category counts, and by-phase counts', () => {
    const tradesWithResponses: { tradeId: string; responses: ChecklistResponseRecord[] }[] = [
      {
        tradeId: 't1',
        responses: [
          { ruleId: 'r1', ruleLabel: 'Revenge trading', checked: true, phase: 'entry' },
          { ruleId: 'r2', ruleLabel: 'Stop trop serré', checked: false, phase: null },
        ],
      },
      {
        tradeId: 't2',
        responses: [
          { ruleId: 'r1', ruleLabel: 'Revenge trading', checked: true, phase: 'management' },
          { ruleId: 'r2', ruleLabel: 'Stop trop serré', checked: true, phase: 'entry' },
        ],
      },
      {
        tradeId: 't3',
        responses: [
          { ruleId: 'r1', ruleLabel: 'Revenge trading', checked: false, phase: null },
          { ruleId: 'r2', ruleLabel: 'Stop trop serré', checked: false, phase: null },
        ],
      },
    ];

    const result = calculateErrorsAnalytics(tradesWithResponses);

    expect(result.totalTrades).toBe(3);
    expect(result.totalErrors).toBe(3); // 2 revenge trading + 1 stop trop serré
    expect(result.totalTradesWithErrors).toBe(2); // t1 and t2

    const revengeCategory = result.byCategory.find((c) => c.label === 'Revenge trading');
    expect(revengeCategory?.count).toBe(2);
    const stopCategory = result.byCategory.find((c) => c.label === 'Stop trop serré');
    expect(stopCategory?.count).toBe(1);

    expect(result.byPhase['Revenge trading'].entry).toBe(1);
    expect(result.byPhase['Revenge trading'].management).toBe(1);
    expect(result.byPhase['Stop trop serré'].entry).toBe(1);
  });

  it('returns zeroed analytics for no trades', () => {
    const result = calculateErrorsAnalytics([]);
    expect(result.totalTrades).toBe(0);
    expect(result.totalErrors).toBe(0);
    expect(result.totalTradesWithErrors).toBe(0);
    expect(result.byCategory).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/__tests__/errors-analytics.test.ts`
Expected: FAIL — `Cannot find module '../errors-analytics'`.

- [ ] **Step 3: Implement `src/lib/errors-analytics.ts`**

```typescript
export type ChecklistPhase = 'pre_entry' | 'entry' | 'management' | 'exit';

export interface ChecklistResponseRecord {
  ruleId: string;
  ruleLabel: string;
  checked: boolean;
  phase: ChecklistPhase | null;
}

export interface ErrorsAnalytics {
  totalTrades: number;
  totalErrors: number;
  totalTradesWithErrors: number;
  byCategory: { label: string; count: number }[];
  byPhase: Record<string, Record<ChecklistPhase, number>>;
}

function emptyPhaseCounts(): Record<ChecklistPhase, number> {
  return { pre_entry: 0, entry: 0, management: 0, exit: 0 };
}

export function calculateErrorsAnalytics(
  tradesWithResponses: { tradeId: string; responses: ChecklistResponseRecord[] }[]
): ErrorsAnalytics {
  let totalErrors = 0;
  let totalTradesWithErrors = 0;
  const categoryCounts = new Map<string, number>();
  const phaseCounts = new Map<string, Record<ChecklistPhase, number>>();

  for (const trade of tradesWithResponses) {
    let tradeHasError = false;
    for (const response of trade.responses) {
      if (!response.checked) continue;
      tradeHasError = true;
      totalErrors += 1;
      categoryCounts.set(response.ruleLabel, (categoryCounts.get(response.ruleLabel) ?? 0) + 1);
      if (response.phase) {
        if (!phaseCounts.has(response.ruleLabel)) {
          phaseCounts.set(response.ruleLabel, emptyPhaseCounts());
        }
        const counts = phaseCounts.get(response.ruleLabel)!;
        counts[response.phase] += 1;
      }
    }
    if (tradeHasError) totalTradesWithErrors += 1;
  }

  return {
    totalTrades: tradesWithResponses.length,
    totalErrors,
    totalTradesWithErrors,
    byCategory: Array.from(categoryCounts.entries()).map(([label, count]) => ({ label, count })),
    byPhase: Object.fromEntries(phaseCounts.entries()),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/__tests__/errors-analytics.test.ts`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/errors-analytics.ts src/lib/__tests__/errors-analytics.test.ts
git commit -m "feat: add checklist errors analytics aggregation"
```

---

### Task 12: next-intl setup (fr/en routing)

**Files:**
- Create: `messages/fr.json`
- Create: `messages/en.json`
- Create: `src/i18n/routing.ts`
- Create: `src/i18n/request.ts`
- Create: `src/middleware.ts`
- Modify: `next.config.ts`
- Delete/replace: `src/app/layout.tsx`, `src/app/page.tsx` → moved under `src/app/[locale]/`

**Interfaces:**
- Produces: `routing` (locales `['fr', 'en']`, default `'fr'`) and the `useTranslations`/`getTranslations` pattern every later page task uses to render text.

- [ ] **Step 1: Create `messages/fr.json`**

```json
{
  "common": {
    "appName": "Journal"
  },
  "home": {
    "scaffolding": "Journal de trading — en construction"
  }
}
```

- [ ] **Step 2: Create `messages/en.json`**

```json
{
  "common": {
    "appName": "Journal"
  },
  "home": {
    "scaffolding": "Trading journal — under construction"
  }
}
```

- [ ] **Step 3: Create `src/i18n/routing.ts`**

```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
});
```

- [ ] **Step 4: Create `src/i18n/request.ts`**

```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as 'fr' | 'en')) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 5: Create `src/middleware.ts`**

Next.js requires `middleware.ts` inside `src/` (not at the repo root) whenever the project uses a `src/` directory — it silently fails to register otherwise (empty `middleware-manifest.json`, no locale redirect).

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

- [ ] **Step 6: Update `next.config.ts`**

```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
```

- [ ] **Step 7: Move the root layout and home page under `[locale]`**

Delete `src/app/layout.tsx` and `src/app/page.tsx`.

Create `src/app/[locale]/layout.tsx`:

```tsx
import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as 'fr' | 'en')) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        <script
          // Blocking (not `defer`/`async`) so the saved theme applies before first paint —
          // otherwise the page flashes dark before switching to a saved light preference.
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.setAttribute('data-theme','light');}catch(e){}`,
          }}
        />
      </head>
      <body className="bg-bg text-text-primary">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
```

Create `src/app/[locale]/page.tsx`:

```tsx
import { useTranslations } from 'next-intl';

export default function Home() {
  const t = useTranslations('home');
  return <main className="p-8">{t('scaffolding')}</main>;
}
```

- [ ] **Step 8: Verify the dev server serves both locales**

Run: `npm run dev`
Expected: visiting `http://localhost:3000` redirects to `/fr` and shows "Journal de trading — en construction"; visiting `http://localhost:3000/en` shows "Trading journal — under construction". Stop the server after confirming.

- [ ] **Step 9: Commit**

```bash
git add messages/ src/i18n/ src/middleware.ts next.config.ts src/app/
git commit -m "feat: add next-intl fr/en locale routing"
```

---

### Task 13: Auth.js — Credentials + JWT, register and login

**Files:**
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/lib/auth-helpers.ts`
- Create: `src/lib/checklist-seed.ts`
- Create: `src/app/[locale]/(auth)/register/actions.ts`
- Create: `src/app/[locale]/(auth)/register/page.tsx`
- Create: `src/app/[locale]/(auth)/login/page.tsx`
- Modify: `messages/fr.json`, `messages/en.json`
- Test: `src/lib/__tests__/checklist-seed.test.ts`

**Interfaces:**
- Consumes: `users`, `checklistRules` from `src/db/schema.ts` (Task 3), `db` from `src/db/client.ts` (Task 2).
- Produces: `auth()`, `signIn`, `signOut` from `src/auth.ts`; `requireUser()` from `src/lib/auth-helpers.ts` (returns the authenticated user's `id` and `locale`, redirects to `/login` if unauthenticated) — used by every protected page from Task 14 onward.

- [ ] **Step 1: Write the failing test for the default checklist seed**

`src/lib/__tests__/checklist-seed.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { DEFAULT_CHECKLIST_RULES } from '../checklist-seed';

describe('DEFAULT_CHECKLIST_RULES', () => {
  it('contains the four rules from the spec', () => {
    expect(DEFAULT_CHECKLIST_RULES).toEqual([
      'Plan respecté',
      'Pas de revenge trading',
      'Taille de position correcte',
      'Stop loss placé avant l\'entrée',
    ]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/__tests__/checklist-seed.test.ts`
Expected: FAIL — `Cannot find module '../checklist-seed'`.

- [ ] **Step 3: Implement `src/lib/checklist-seed.ts`**

```typescript
export const DEFAULT_CHECKLIST_RULES = [
  'Plan respecté',
  'Pas de revenge trading',
  'Taille de position correcte',
  "Stop loss placé avant l'entrée",
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/lib/__tests__/checklist-seed.test.ts`
Expected: PASS.

- [ ] **Step 5: Create `src/auth.ts`**

```typescript
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
});
```

- [ ] **Step 6: Create the Auth.js route handler**

`src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from '@/auth';

export const { GET, POST } = handlers;
```

- [ ] **Step 7: Create `src/lib/auth-helpers.ts`**

```typescript
import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db } from '@/db/client';
import { users } from '@/db/schema';

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }
  const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!user) {
    redirect('/login');
  }
  return user;
}
```

- [ ] **Step 8: Create the register server action**

`src/app/[locale]/(auth)/register/actions.ts`:

```typescript
'use server';

import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { db } from '@/db/client';
import { users, checklistRules } from '@/db/schema';
import { DEFAULT_CHECKLIST_RULES } from '@/lib/checklist-seed';
import { signIn } from '@/auth';

export async function registerAction(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const locale = String(formData.get('locale') ?? 'fr');

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [newUser] = await db
    .insert(users)
    .values({ email, passwordHash, locale: locale === 'en' ? 'en' : 'fr' })
    .returning();

  await db.insert(checklistRules).values(
    DEFAULT_CHECKLIST_RULES.map((label, index) => ({
      userId: newUser.id,
      label,
      displayOrder: index,
    }))
  );

  await signIn('credentials', { email, password, redirect: false });
  redirect(`/${locale}/dashboard`);
}
```

- [ ] **Step 9: Create the register page**

`src/app/[locale]/(auth)/register/page.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import { registerAction } from './actions';

export default function RegisterPage({ params }: { params: { locale: string } }) {
  const t = useTranslations('auth');
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg">
      <form action={registerAction} className="w-full max-w-sm rounded-xl border border-border-subtle bg-surface p-6">
        <input type="hidden" name="locale" value={params.locale} />
        <h1 className="mb-4 text-lg font-bold text-text-primary">{t('registerTitle')}</h1>
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
```

- [ ] **Step 10: Create the login page**

`src/app/[locale]/(auth)/login/page.tsx`:

```tsx
import { useTranslations } from 'next-intl';
import { signIn } from '@/auth';

export default function LoginPage({ params }: { params: { locale: string } }) {
  const t = useTranslations('auth');

  async function loginAction(formData: FormData) {
    'use server';
    const email = String(formData.get('email') ?? '');
    const password = String(formData.get('password') ?? '');
    await signIn('credentials', { email, password, redirectTo: `/${params.locale}/dashboard` });
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
```

- [ ] **Step 11: Add auth translation keys**

Add to `messages/fr.json` (top level, alongside `common` and `home`):

```json
"auth": {
  "registerTitle": "Créer un compte",
  "loginTitle": "Se connecter",
  "email": "Email",
  "password": "Mot de passe",
  "registerSubmit": "Créer mon compte",
  "loginSubmit": "Se connecter"
}
```

Add to `messages/en.json`:

```json
"auth": {
  "registerTitle": "Create an account",
  "loginTitle": "Log in",
  "email": "Email",
  "password": "Password",
  "registerSubmit": "Create my account",
  "loginSubmit": "Log in"
}
```

- [ ] **Step 12: Set `AUTH_SECRET`**

Run: `npx auth secret`
Expected: writes/prints a secret; add it to `.env.local` as `AUTH_SECRET=...` (it is already listed in `.env.local.example` from Task 1).

- [ ] **Step 13: Manually verify registration and login**

Run: `npm run dev`, visit `http://localhost:3000/fr/register`, submit a test account, confirm it redirects to `/fr/dashboard` (a 404 is expected here since Task 21 creates that page — confirm instead that no error was thrown and the session cookie was set, e.g. via browser devtools). Then visit `/fr/login` and log in with the same credentials.
Expected: no server errors in the terminal; a `authjs.session-token` cookie is present after login.

- [ ] **Step 14: Run the full test suite**

Run: `npm test`
Expected: all tests still PASS.

- [ ] **Step 15: Commit**

```bash
git add src/auth.ts src/app/api/auth src/lib/auth-helpers.ts src/lib/checklist-seed.ts src/lib/__tests__/checklist-seed.test.ts src/app/[locale]/\(auth\) messages/
git commit -m "feat: add Auth.js credentials login/register with default checklist seeding"
```

---

### Task 14: Instruments CRUD

**Files:**
- Create: `src/app/[locale]/(app)/instruments/page.tsx`
- Create: `src/app/[locale]/(app)/instruments/actions.ts`
- Create: `src/app/[locale]/(app)/instruments/InstrumentForm.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `requireUser()` (Task 13), `instruments` table (Task 3).
- Produces: no new shared interface — this is a leaf CRUD page. Later tasks (trades) query `instruments` directly via `db`.

- [ ] **Step 1: Create server actions**

`src/app/[locale]/(app)/instruments/actions.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { instruments, trades } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

export async function createInstrument(formData: FormData) {
  const user = await requireUser();
  await db.insert(instruments).values({
    userId: user.id,
    name: String(formData.get('name')),
    assetClass: String(formData.get('assetClass')) as 'forex' | 'commodity' | 'crypto' | 'index' | 'other',
    pointValue: Number(formData.get('pointValue')),
  });
  revalidatePath('/[locale]/instruments', 'page');
}

export async function deleteInstrument(instrumentId: string) {
  const user = await requireUser();
  const [inUse] = await db.select().from(trades).where(eq(trades.instrumentId, instrumentId)).limit(1);
  if (inUse) {
    throw new Error('Cet instrument est utilisé par au moins un trade et ne peut pas être supprimé.');
  }
  await db
    .delete(instruments)
    .where(and(eq(instruments.id, instrumentId), eq(instruments.userId, user.id)));
  revalidatePath('/[locale]/instruments', 'page');
}
```

- [ ] **Step 2: Create the form client component**

`src/app/[locale]/(app)/instruments/InstrumentForm.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { createInstrument } from './actions';

export function InstrumentForm() {
  const t = useTranslations('instruments');
  return (
    <form action={createInstrument} className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-surface p-4">
      <label className="text-sm text-text-muted">
        {t('name')}
        <input name="name" required className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <label className="text-sm text-text-muted">
        {t('assetClass')}
        <select name="assetClass" required className="mt-1 block rounded-md bg-bg p-2 text-text-primary">
          <option value="forex">Forex</option>
          <option value="commodity">Commodity</option>
          <option value="crypto">Crypto</option>
          <option value="index">Index</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className="text-sm text-text-muted">
        {t('pointValue')}
        <input name="pointValue" type="number" step="any" required className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('add')}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create the page**

`src/app/[locale]/(app)/instruments/page.tsx`:

```tsx
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { instruments } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { InstrumentForm } from './InstrumentForm';
import { deleteInstrument } from './actions';

export default async function InstrumentsPage() {
  const user = await requireUser();
  const rows = await db.select().from(instruments).where(eq(instruments.userId, user.id));
  const t = await getTranslations('instruments');

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">Instruments</h1>
      <InstrumentForm />
      <ul className="mt-4 space-y-2">
        {rows.map((instrument) => (
          <li key={instrument.id} className="flex items-center justify-between rounded-md border border-border-subtle bg-surface p-3">
            <span className="text-text-primary">
              {instrument.name} — {instrument.assetClass} — {t('pointValue').toLowerCase()}: {instrument.pointValue}
            </span>
            <form action={async () => { 'use server'; await deleteInstrument(instrument.id); }}>
              <button type="submit" className="text-sm text-loss">{t('delete')}</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

`InstrumentsPage` is an async Server Component, so it must use `getTranslations` from `next-intl/server` (awaited), never the sync `useTranslations` hook — same rule as Task 13's register/login pages. Every row/button string must go through `t(...)` (with a matching key in both message files below) rather than being hardcoded — a hardcoded string here would show the wrong language depending on locale, violating this plan's i18n constraint.

- [ ] **Step 4: Add translation keys**

Add to `messages/fr.json`:

```json
"instruments": {
  "name": "Nom",
  "assetClass": "Type d'actif",
  "pointValue": "Valeur du point",
  "add": "Ajouter",
  "delete": "Supprimer"
}
```

Add to `messages/en.json`:

```json
"instruments": {
  "name": "Name",
  "assetClass": "Asset class",
  "pointValue": "Point value",
  "add": "Add",
  "delete": "Delete"
}
```

- [ ] **Step 5: Manually verify**

Run: `npm run dev`, log in, visit `/fr/instruments`, add an instrument (e.g. EUR/USD, forex, point value 10), confirm it appears in the list.
Expected: instrument is created and listed without error.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(app)/instruments" messages/
git commit -m "feat: add instruments CRUD page"
```

---

### Task 15: Strategies CRUD

**Files:**
- Create: `src/app/[locale]/(app)/strategies/page.tsx`
- Create: `src/app/[locale]/(app)/strategies/actions.ts`
- Create: `src/app/[locale]/(app)/strategies/StrategyForm.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `requireUser()`, `strategies` table.
- Produces: no new shared interface (leaf CRUD page); later trade tasks query `strategies` directly via `db`.

- [ ] **Step 1: Create server actions**

`src/app/[locale]/(app)/strategies/actions.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db/client';
import { strategies, trades } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

export async function createStrategy(formData: FormData) {
  const user = await requireUser();
  await db.insert(strategies).values({
    userId: user.id,
    name: String(formData.get('name')),
    description: formData.get('description') ? String(formData.get('description')) : null,
  });
  revalidatePath('/[locale]/strategies', 'page');
}

export async function deleteStrategy(strategyId: string) {
  const user = await requireUser();
  const [inUse] = await db.select().from(trades).where(eq(trades.strategyId, strategyId)).limit(1);
  if (inUse) {
    throw new Error('Cette stratégie est utilisée par au moins un trade et ne peut pas être supprimée.');
  }
  await db.delete(strategies).where(and(eq(strategies.id, strategyId), eq(strategies.userId, user.id)));
  revalidatePath('/[locale]/strategies', 'page');
}
```

- [ ] **Step 2: Create the form client component**

`src/app/[locale]/(app)/strategies/StrategyForm.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { createStrategy } from './actions';

export function StrategyForm() {
  const t = useTranslations('strategies');
  return (
    <form action={createStrategy} className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-surface p-4">
      <label className="text-sm text-text-muted">
        {t('name')}
        <input name="name" required className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <label className="text-sm text-text-muted">
        {t('description')}
        <input name="description" className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('add')}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create the page**

`src/app/[locale]/(app)/strategies/page.tsx`:

```tsx
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { strategies } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { StrategyForm } from './StrategyForm';
import { deleteStrategy } from './actions';

export default async function StrategiesPage() {
  const user = await requireUser();
  const rows = await db.select().from(strategies).where(eq(strategies.userId, user.id));
  const t = await getTranslations('strategies');

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t('title')}</h1>
      <StrategyForm />
      <ul className="mt-4 space-y-2">
        {rows.map((strategy) => (
          <li key={strategy.id} className="flex items-center justify-between rounded-md border border-border-subtle bg-surface p-3">
            <span className="text-text-primary">{strategy.name}{strategy.description ? ` — ${strategy.description}` : ''}</span>
            <form action={async () => { 'use server'; await deleteStrategy(strategy.id); }}>
              <button type="submit" className="text-sm text-loss">{t('delete')}</button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

`StrategiesPage` is an async Server Component, so it must use `getTranslations` from `next-intl/server` (awaited), never the sync `useTranslations` hook (same rule as Task 13/14). The heading and delete-button text must go through `t(...)` rather than being hardcoded — "Stratégies" is not the same word as "Strategies", so hardcoding it would show French to English-locale users.

- [ ] **Step 4: Add translation keys**

Add to `messages/fr.json`:

```json
"strategies": {
  "title": "Stratégies",
  "name": "Nom",
  "description": "Description",
  "add": "Ajouter",
  "delete": "Supprimer"
}
```

Add to `messages/en.json`:

```json
"strategies": {
  "title": "Strategies",
  "name": "Name",
  "description": "Description",
  "add": "Add",
  "delete": "Delete"
}
```

- [ ] **Step 5: Manually verify**

Run: `npm run dev`, log in, visit `/fr/strategies`, add a strategy, confirm it appears in the list.
Expected: strategy is created and listed without error.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(app)/strategies" messages/
git commit -m "feat: add strategies CRUD page"
```

---

### Task 16: Checklist rules CRUD

**Files:**
- Create: `src/app/[locale]/(app)/checklist/page.tsx`
- Create: `src/app/[locale]/(app)/checklist/actions.ts`
- Create: `src/app/[locale]/(app)/checklist/ChecklistForm.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `requireUser()`, `checklistRules` table.
- Produces: no new shared interface; trade form (Task 17) and Erreurs page (Task 23) query `checklistRules` directly via `db`.

- [ ] **Step 1: Create server actions**

`src/app/[locale]/(app)/checklist/actions.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { eq, and, max } from 'drizzle-orm';
import { db } from '@/db/client';
import { checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

export async function createChecklistRule(formData: FormData) {
  const user = await requireUser();
  const [{ value: maxOrder }] = await db
    .select({ value: max(checklistRules.displayOrder) })
    .from(checklistRules)
    .where(eq(checklistRules.userId, user.id));

  await db.insert(checklistRules).values({
    userId: user.id,
    label: String(formData.get('label')),
    displayOrder: (maxOrder ?? -1) + 1,
  });
  revalidatePath('/[locale]/checklist', 'page');
}

export async function toggleChecklistRuleActive(ruleId: string, active: boolean) {
  const user = await requireUser();
  await db
    .update(checklistRules)
    .set({ active })
    .where(and(eq(checklistRules.id, ruleId), eq(checklistRules.userId, user.id)));
  revalidatePath('/[locale]/checklist', 'page');
}
```

- [ ] **Step 2: Create the form client component**

`src/app/[locale]/(app)/checklist/ChecklistForm.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { createChecklistRule } from './actions';

export function ChecklistForm() {
  const t = useTranslations('checklist');
  return (
    <form action={createChecklistRule} className="flex flex-wrap items-end gap-3 rounded-xl border border-border-subtle bg-surface p-4">
      <label className="text-sm text-text-muted">
        {t('label')}
        <input name="label" required className="mt-1 block rounded-md bg-bg p-2 text-text-primary" />
      </label>
      <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('add')}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create the page**

`src/app/[locale]/(app)/checklist/page.tsx`:

```tsx
import { eq, asc } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { ChecklistForm } from './ChecklistForm';
import { toggleChecklistRuleActive } from './actions';

export default async function ChecklistPage() {
  const user = await requireUser();
  const rows = await db
    .select()
    .from(checklistRules)
    .where(eq(checklistRules.userId, user.id))
    .orderBy(asc(checklistRules.displayOrder));
  const t = await getTranslations('checklist');

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t('title')}</h1>
      <ChecklistForm />
      <ul className="mt-4 space-y-2">
        {rows.map((rule) => (
          <li key={rule.id} className="flex items-center justify-between rounded-md border border-border-subtle bg-surface p-3">
            <span className={rule.active ? 'text-text-primary' : 'text-text-muted line-through'}>{rule.label}</span>
            <form action={async () => { 'use server'; await toggleChecklistRuleActive(rule.id, !rule.active); }}>
              <button type="submit" className="text-sm text-accent">
                {rule.active ? t('deactivate') : t('activate')}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

`ChecklistPage` is an async Server Component, so it must use `getTranslations` from `next-intl/server` (awaited), never the sync `useTranslations` hook (same rule as Task 13/14/15). The heading and toggle-button text must go through `t(...)` rather than being hardcoded French.

- [ ] **Step 4: Add translation keys**

Add to `messages/fr.json`:

```json
"checklist": {
  "title": "Checklist de discipline",
  "label": "Règle",
  "add": "Ajouter",
  "activate": "Activer",
  "deactivate": "Désactiver"
}
```

Add to `messages/en.json`:

```json
"checklist": {
  "title": "Discipline checklist",
  "label": "Rule",
  "add": "Add",
  "activate": "Activate",
  "deactivate": "Deactivate"
}
```

- [ ] **Step 5: Manually verify**

Run: `npm run dev`, log in, visit `/fr/checklist`, confirm the four default rules seeded at registration (Task 13) are listed, add a new one, toggle one inactive.
Expected: default rules visible, new rule added, toggle works and strikes through the label.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(app)/checklist" messages/
git commit -m "feat: add checklist rules CRUD page"
```

---

### Task 17: Trade creation form

**Files:**
- Create: `src/app/[locale]/(app)/trades/new/page.tsx`
- Create: `src/app/[locale]/(app)/trades/actions.ts`
- Create: `src/app/[locale]/(app)/trades/TradeForm.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `calculatePnl`, `calculateRisk` (Task 5), `calculatePositionSize` (Task 6), `instruments`/`strategies`/`checklistRules` tables, `requireUser()`.
- Produces: `createTrade` server action — reused by nothing else directly, but establishes the pattern Task 18 (edit) mirrors.

- [ ] **Step 1: Create the server action**

`src/app/[locale]/(app)/trades/actions.ts`:

```typescript
'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trades, instruments, tradeChecklistResponses, checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { calculatePnl, calculateRisk } from '@/lib/calculations';

export async function createTrade(formData: FormData) {
  const user = await requireUser();

  const instrumentId = String(formData.get('instrumentId'));
  const [instrument] = await db.select().from(instruments).where(eq(instruments.id, instrumentId)).limit(1);
  if (!instrument) throw new Error('Instrument introuvable');

  const direction = String(formData.get('direction')) as 'long' | 'short';
  const entryPrice = Number(formData.get('entryPrice'));
  const exitPriceRaw = formData.get('exitPrice');
  const exitPrice = exitPriceRaw ? Number(exitPriceRaw) : null;
  const quantity = Number(formData.get('quantity'));
  const stopLossRaw = formData.get('stopLossPrice');
  const stopLossPrice = stopLossRaw ? Number(stopLossRaw) : null;
  const takeProfitRaw = formData.get('takeProfitPrice');
  const takeProfitPrice = takeProfitRaw ? Number(takeProfitRaw) : null;
  const strategyIdRaw = formData.get('strategyId');
  const strategyId = strategyIdRaw ? String(strategyIdRaw) : null;
  const enteredAt = new Date(String(formData.get('enteredAt')));
  const exitedAtRaw = formData.get('exitedAt');
  const exitedAt = exitedAtRaw ? new Date(String(exitedAtRaw)) : null;
  const notes = formData.get('notes') ? String(formData.get('notes')) : null;

  const pnlAmount =
    exitPrice !== null
      ? calculatePnl({ entryPrice, exitPrice, quantity, direction, pointValue: instrument.pointValue })
      : null;
  const riskAmount = calculateRisk({ entryPrice, stopLossPrice, quantity, pointValue: instrument.pointValue });

  const [trade] = await db
    .insert(trades)
    .values({
      userId: user.id,
      instrumentId,
      strategyId,
      direction,
      entryPrice,
      exitPrice,
      quantity,
      stopLossPrice,
      takeProfitPrice,
      enteredAt,
      exitedAt,
      status: exitPrice !== null ? 'closed' : 'open',
      pnlAmount,
      riskAmount,
      notes,
    })
    .returning();

  const rules = await db.select().from(checklistRules).where(eq(checklistRules.userId, user.id));
  for (const rule of rules) {
    const checked = formData.get(`checklist_${rule.id}_checked`) === 'on';
    const phaseRaw = formData.get(`checklist_${rule.id}_phase`);
    await db.insert(tradeChecklistResponses).values({
      tradeId: trade.id,
      checklistRuleId: rule.id,
      checked,
      phase: checked && phaseRaw ? (String(phaseRaw) as 'pre_entry' | 'entry' | 'management' | 'exit') : null,
    });
  }

  redirect(`/trades/${trade.id}`);
}
```

- [ ] **Step 2: Create the form client component**

`src/app/[locale]/(app)/trades/TradeForm.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import type { Instrument, Strategy, ChecklistRule } from '@/db/schema';
import { createTrade } from './actions';

export function TradeForm({
  instruments,
  strategies,
  checklistRules,
}: {
  instruments: Instrument[];
  strategies: Strategy[];
  checklistRules: ChecklistRule[];
}) {
  const t = useTranslations('trades');

  return (
    <form action={createTrade} className="space-y-4 rounded-xl border border-border-subtle bg-surface p-6">
      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm text-text-muted">
          {t('instrument')}
          <select name="instrumentId" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary">
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-text-muted">
          {t('strategy')}
          <select name="strategyId" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary">
            <option value="">—</option>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-text-muted">
          {t('direction')}
          <select name="direction" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary">
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </label>
        <label className="text-sm text-text-muted">
          {t('quantity')}
          <input name="quantity" type="number" step="any" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('entryPrice')}
          <input name="entryPrice" type="number" step="any" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('exitPrice')}
          <input name="exitPrice" type="number" step="any" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('stopLoss')}
          <input name="stopLossPrice" type="number" step="any" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('takeProfit')}
          <input name="takeProfitPrice" type="number" step="any" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('enteredAt')}
          <input name="enteredAt" type="datetime-local" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('exitedAt')}
          <input name="exitedAt" type="datetime-local" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
      </div>

      <fieldset className="rounded-md border border-border-subtle p-3">
        <legend className="text-sm text-text-muted">{t('checklistTitle')}</legend>
        {checklistRules.filter((r) => r.active).map((rule) => (
          <div key={rule.id} className="flex items-center gap-3 py-1">
            <label className="flex items-center gap-2 text-text-primary">
              <input type="checkbox" name={`checklist_${rule.id}_checked`} />
              {rule.label}
            </label>
            <select name={`checklist_${rule.id}_phase`} className="rounded-md bg-bg p-1 text-sm text-text-primary">
              <option value="pre_entry">{t('phasePreEntry')}</option>
              <option value="entry">{t('phaseEntry')}</option>
              <option value="management">{t('phaseManagement')}</option>
              <option value="exit">{t('phaseExit')}</option>
            </select>
          </div>
        ))}
      </fieldset>

      <label className="block text-sm text-text-muted">
        {t('notes')}
        <textarea name="notes" rows={3} className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
      </label>

      <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('save')}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create the page**

`src/app/[locale]/(app)/trades/new/page.tsx`:

```tsx
import { eq } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { instruments, strategies, checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { TradeForm } from '../TradeForm';

export default async function NewTradePage() {
  const user = await requireUser();
  const [instrumentRows, strategyRows, checklistRows] = await Promise.all([
    db.select().from(instruments).where(eq(instruments.userId, user.id)),
    db.select().from(strategies).where(eq(strategies.userId, user.id)),
    db.select().from(checklistRules).where(eq(checklistRules.userId, user.id)),
  ]);
  const t = await getTranslations('trades');

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">{t('newTitle')}</h1>
      <TradeForm instruments={instrumentRows} strategies={strategyRows} checklistRules={checklistRows} />
    </main>
  );
}
```

`NewTradePage` is an async Server Component, so it must use `getTranslations` from `next-intl/server` (awaited), never the sync `useTranslations` hook — same rule as every async page from Task 13 onward. The heading must go through `t(...)` rather than being hardcoded French.

- [ ] **Step 4: Add translation keys**

Add to `messages/fr.json`:

```json
"trades": {
  "newTitle": "Nouveau trade",
  "instrument": "Instrument",
  "strategy": "Stratégie",
  "direction": "Sens",
  "quantity": "Quantité",
  "entryPrice": "Prix d'entrée",
  "exitPrice": "Prix de sortie",
  "stopLoss": "Stop loss",
  "takeProfit": "Take profit",
  "enteredAt": "Date d'entrée",
  "exitedAt": "Date de sortie",
  "checklistTitle": "Checklist de discipline",
  "phasePreEntry": "Pré-entrée",
  "phaseEntry": "Entrée",
  "phaseManagement": "Gestion",
  "phaseExit": "Sortie",
  "notes": "Notes",
  "save": "Enregistrer"
}
```

Add to `messages/en.json`:

```json
"trades": {
  "newTitle": "New trade",
  "instrument": "Instrument",
  "strategy": "Strategy",
  "direction": "Direction",
  "quantity": "Quantity",
  "entryPrice": "Entry price",
  "exitPrice": "Exit price",
  "stopLoss": "Stop loss",
  "takeProfit": "Take profit",
  "enteredAt": "Entry date",
  "exitedAt": "Exit date",
  "checklistTitle": "Discipline checklist",
  "phasePreEntry": "Pre-entry",
  "phaseEntry": "Entry",
  "phaseManagement": "Management",
  "phaseExit": "Exit",
  "notes": "Notes",
  "save": "Save"
}
```

- [ ] **Step 5: Manually verify**

Requires at least one instrument (Task 14) to exist. Run: `npm run dev`, log in, visit `/fr/trades/new`, fill and submit the form with an exit price set.
Expected: redirects to `/trades/{id}` (a 404 is expected until Task 18 — confirm instead, via a direct DB check or temporary log, that a row was inserted into `trades` with a non-null `pnlAmount`).

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(app)/trades" messages/
git commit -m "feat: add trade creation form with pnl/risk calculation and checklist"
```

---

### Task 18: Trade detail/edit page and screenshot upload

**Files:**
- Create: `src/app/[locale]/(app)/trades/[id]/page.tsx`
- Create: `src/app/[locale]/(app)/trades/[id]/actions.ts`
- Create: `src/app/[locale]/(app)/trades/[id]/ScreenshotUpload.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `trades`, `tradeScreenshots`, `tradeChecklistResponses` tables, `requireUser()`.
- Produces: `uploadScreenshot`, `updateTradePnl` server actions — no downstream consumers beyond this page.

- [ ] **Step 1: Create server actions**

`src/app/[locale]/(app)/trades/[id]/actions.ts`:

```typescript
'use server';

import { put } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trades, tradeScreenshots } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export async function uploadScreenshot(tradeId: string, formData: FormData) {
  await requireUser();
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) throw new Error('Aucun fichier sélectionné');
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('Format non supporté — utilise un fichier JPG ou PNG');
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    throw new Error('Fichier trop volumineux (5 Mo maximum)');
  }

  const blob = await put(`trades/${tradeId}/${Date.now()}-${file.name}`, file, { access: 'public' });

  await db.insert(tradeScreenshots).values({
    tradeId,
    url: blob.url,
    caption: String(formData.get('caption') ?? '') || null,
  });

  revalidatePath('/[locale]/trades/[id]', 'page');
}

export async function updateTradePnlOverride(tradeId: string, pnlAmount: number) {
  await requireUser();
  await db.update(trades).set({ pnlAmount, pnlOverride: true, updatedAt: new Date() }).where(eq(trades.id, tradeId));
  revalidatePath('/[locale]/trades/[id]', 'page');
}
```

- [ ] **Step 2: Create the screenshot upload client component**

`src/app/[locale]/(app)/trades/[id]/ScreenshotUpload.tsx`:

```tsx
'use client';

import { useTranslations } from 'next-intl';
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
      <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('upload')}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create the trade detail page**

`src/app/[locale]/(app)/trades/[id]/page.tsx`:

```tsx
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { trades, instruments, strategies, tradeScreenshots, tradeChecklistResponses, checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { calculateRMultiple } from '@/lib/calculations';
import { ScreenshotUpload } from './ScreenshotUpload';

export default async function TradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const [trade] = await db.select().from(trades).where(eq(trades.id, id)).limit(1);
  if (!trade || trade.userId !== user.id) notFound();

  const [instrument] = await db.select().from(instruments).where(eq(instruments.id, trade.instrumentId)).limit(1);
  const strategy = trade.strategyId
    ? (await db.select().from(strategies).where(eq(strategies.id, trade.strategyId)).limit(1))[0]
    : null;
  const screenshots = await db.select().from(tradeScreenshots).where(eq(tradeScreenshots.tradeId, trade.id));
  const responses = await db
    .select({ label: checklistRules.label, checked: tradeChecklistResponses.checked, phase: tradeChecklistResponses.phase })
    .from(tradeChecklistResponses)
    .innerJoin(checklistRules, eq(checklistRules.id, tradeChecklistResponses.checklistRuleId))
    .where(eq(tradeChecklistResponses.tradeId, trade.id));

  const rMultiple = calculateRMultiple(trade.pnlAmount ?? 0, trade.riskAmount);
  const t = await getTranslations('trades');

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-xl font-bold text-text-primary">
        {instrument?.name} — {trade.direction} — {trade.status}
      </h1>
      <div className="rounded-xl border border-border-subtle bg-surface p-4 text-text-primary">
        <p>{t('entryPrice')}: {trade.entryPrice} — {t('exitPrice')}: {trade.exitPrice ?? '—'}</p>
        <p>{t('quantity')}: {trade.quantity} — {t('strategy')}: {strategy?.name ?? '—'}</p>
        <p className={trade.pnlAmount && trade.pnlAmount >= 0 ? 'text-gain' : 'text-loss'}>
          {t('pnl')}: {trade.pnlAmount ?? '—'} {trade.pnlOverride ? t('pnlOverridden') : ''}
        </p>
        <p>{t('risk')}: {trade.riskAmount ?? '—'} — {t('rMultiple')}: {rMultiple !== null ? rMultiple.toFixed(2) : '—'}</p>
        {trade.notes && <p className="text-text-muted">{trade.notes}</p>}
      </div>

      <div>
        <h2 className="mb-2 font-bold text-text-primary">{t('checklistTitle')}</h2>
        <ul className="space-y-1">
          {responses.map((r, i) => (
            <li key={i} className="text-text-primary">
              {r.checked ? '✓' : '—'} {r.label} {r.checked && r.phase ? `(${r.phase})` : ''}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="mb-2 font-bold text-text-primary">{t('screenshotsTitle')}</h2>
        <div className="mb-3 flex flex-wrap gap-3">
          {screenshots.map((s) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={s.id} src={s.url} alt={s.caption ?? ''} className="h-32 rounded-md border border-border-subtle" />
          ))}
        </div>
        <ScreenshotUpload tradeId={trade.id} />
      </div>
    </main>
  );
}
```

`TradeDetailPage` is an async Server Component, so it must use `getTranslations` from `next-intl/server` (awaited), never the sync `useTranslations` hook — same rule as every async page from Task 13 onward. Every label in this page must go through `t(...)` rather than being hardcoded French — this page has more hardcoded strings than any prior task, so it is easy to miss one; check each `<p>`/`<h2>` line against the translation keys below.

- [ ] **Step 4: Add translation keys**

Add to `messages/fr.json` inside `trades`:

```json
"screenshot": "Capture d'écran",
"caption": "Légende",
"upload": "Uploader",
"pnl": "P&L",
"pnlOverridden": "(corrigé manuellement)",
"risk": "Risque",
"rMultiple": "R",
"checklistTitle": "Checklist",
"screenshotsTitle": "Captures d'écran"
```

Add to `messages/en.json` inside `trades`:

```json
"screenshot": "Screenshot",
"caption": "Caption",
"upload": "Upload",
"pnl": "P&L",
"pnlOverridden": "(manually adjusted)",
"risk": "Risk",
"rMultiple": "R",
"checklistTitle": "Checklist",
"screenshotsTitle": "Screenshots"
```

(`entryPrice`, `exitPrice`, `quantity`, `strategy` already exist in the `trades` namespace from Task 17.)

- [ ] **Step 5: Set up Vercel Blob token**

Manual step: create a Blob store in the Vercel dashboard, copy the `BLOB_READ_WRITE_TOKEN` into `.env.local` (already listed in `.env.local.example`).

- [ ] **Step 6: Manually verify**

Run: `npm run dev`, open a trade created in Task 17, upload a small JPG/PNG, confirm it appears; try uploading a `.gif` and confirm the error message from `ALLOWED_TYPES` is thrown.
Expected: valid image uploads and displays; invalid format throws the expected error.

- [ ] **Step 7: Commit**

```bash
git add "src/app/[locale]/(app)/trades/[id]" messages/
git commit -m "feat: add trade detail page with screenshot upload"
```

---

### Task 19: Trade list page (filter/sort/search)

**Files:**
- Create: `src/app/[locale]/(app)/trades/page.tsx`
- Create: `src/app/[locale]/(app)/trades/TradeFilters.tsx`

**Interfaces:**
- Consumes: `trades`, `instruments`, `strategies` tables, `requireUser()`.
- Produces: none consumed downstream.

- [ ] **Step 1: Create the filters client component**

`src/app/[locale]/(app)/trades/TradeFilters.tsx`:

```tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { Instrument, Strategy } from '@/db/schema';

export function TradeFilters({ instruments, strategies }: { instruments: Instrument[]; strategies: Strategy[] }) {
  const t = useTranslations('trades');
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="mb-4 flex flex-wrap gap-3">
      <select
        defaultValue={searchParams.get('instrumentId') ?? ''}
        onChange={(e) => updateParam('instrumentId', e.target.value)}
        className="rounded-md bg-surface p-2 text-text-primary"
      >
        <option value="">{t('allInstruments')}</option>
        {instruments.map((i) => (
          <option key={i.id} value={i.id}>{i.name}</option>
        ))}
      </select>
      <select
        defaultValue={searchParams.get('strategyId') ?? ''}
        onChange={(e) => updateParam('strategyId', e.target.value)}
        className="rounded-md bg-surface p-2 text-text-primary"
      >
        <option value="">{t('allStrategies')}</option>
        {strategies.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <input
        placeholder={t('search')}
        defaultValue={searchParams.get('q') ?? ''}
        onChange={(e) => updateParam('q', e.target.value)}
        className="rounded-md bg-surface p-2 text-text-primary"
      />
    </div>
  );
}
```

- [ ] **Step 2: Create the page**

`src/app/[locale]/(app)/trades/page.tsx`:

```tsx
import Link from 'next/link';
import { eq, and, desc } from 'drizzle-orm';
import { getTranslations } from 'next-intl/server';
import { db } from '@/db/client';
import { trades, instruments, strategies } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { TradeFilters } from './TradeFilters';

export default async function TradesPage({
  searchParams,
}: {
  searchParams: Promise<{ instrumentId?: string; strategyId?: string; q?: string }>;
}) {
  const user = await requireUser();
  const { instrumentId, strategyId, q } = await searchParams;

  const [instrumentRows, strategyRows] = await Promise.all([
    db.select().from(instruments).where(eq(instruments.userId, user.id)),
    db.select().from(strategies).where(eq(strategies.userId, user.id)),
  ]);

  const conditions = [eq(trades.userId, user.id)];
  if (instrumentId) conditions.push(eq(trades.instrumentId, instrumentId));
  if (strategyId) conditions.push(eq(trades.strategyId, strategyId));

  let rows = await db
    .select()
    .from(trades)
    .where(and(...conditions))
    .orderBy(desc(trades.enteredAt));

  if (q) {
    const needle = q.toLowerCase();
    rows = rows.filter((t) => (t.notes ?? '').toLowerCase().includes(needle));
  }

  const instrumentById = new Map(instrumentRows.map((i) => [i.id, i.name]));
  const t = await getTranslations('trades');

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">{t('listTitle')}</h1>
        <Link href="/trades/new" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
          + {t('newTitle')}
        </Link>
      </div>
      <TradeFilters instruments={instrumentRows} strategies={strategyRows} />
      <table className="w-full text-left text-text-primary">
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

`TradesPage` is an async Server Component, so it must use `getTranslations` from `next-intl/server` (awaited), never the sync `useTranslations` hook — same rule as every async page from Task 13 onward. The heading, "new trade" link text, table headers (Date/Instrument/Direction), and empty-state message must go through `t(...)` rather than being hardcoded French. (`newTitle` already exists in the `trades` namespace from Task 17; `date`/`instrument`/`direction`/`listTitle`/`empty` are new below.)

- [ ] **Step 3: Add translation keys**

Add to `messages/fr.json` inside `trades`:

```json
"allInstruments": "Tous les instruments",
"allStrategies": "Toutes les stratégies",
"search": "Rechercher dans les notes...",
"listTitle": "Journal",
"date": "Date",
"empty": "Aucun trade pour l'instant."
```

Add to `messages/en.json` inside `trades`:

```json
"allInstruments": "All instruments",
"allStrategies": "All strategies",
"search": "Search notes...",
"listTitle": "Journal",
"date": "Date",
"empty": "No trades yet."
```

(`instrument` and `direction` already exist in the `trades` namespace from Task 17.)

- [ ] **Step 4: Manually verify**

Run: `npm run dev`, visit `/fr/trades`, confirm the trade(s) created earlier are listed, and that filtering by instrument narrows the list.
Expected: list renders, filters update the URL and the results.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(app)/trades/page.tsx" "src/app/[locale]/(app)/trades/TradeFilters.tsx" messages/
git commit -m "feat: add trade list page with filtering and search"
```

---

### Task 20: Position size calculator (standalone page + embed in trade form)

**Files:**
- Create: `src/app/[locale]/(app)/tools/position-size-calculator/page.tsx`
- Create: `src/app/[locale]/(app)/tools/position-size-calculator/Calculator.tsx`
- Modify: `src/app/[locale]/(app)/trades/TradeForm.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `calculatePositionSize` (Task 6), `instruments` table.
- Produces: `Calculator` component reused both standalone and embedded.

- [ ] **Step 1: Create the reusable calculator client component**

`src/app/[locale]/(app)/tools/position-size-calculator/Calculator.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Instrument } from '@/db/schema';
import { calculatePositionSize } from '@/lib/position-size';

export function Calculator({
  instruments,
  defaultAccountBalance,
  onCalculated,
}: {
  instruments: Instrument[];
  defaultAccountBalance: number;
  onCalculated?: (quantity: number) => void;
}) {
  const t = useTranslations('calculator');
  const [accountBalance, setAccountBalance] = useState(defaultAccountBalance);
  const [riskPercent, setRiskPercent] = useState(1);
  const [instrumentId, setInstrumentId] = useState(instruments[0]?.id ?? '');
  const [stopDistance, setStopDistance] = useState(0);
  const [result, setResult] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCalculate() {
    setError(null);
    const instrument = instruments.find((i) => i.id === instrumentId);
    if (!instrument) {
      setError(t('noInstrument'));
      return;
    }
    const riskAmount = (accountBalance * riskPercent) / 100;
    try {
      const quantity = calculatePositionSize({ riskAmount, stopDistance, pointValue: instrument.pointValue });
      setResult(quantity);
      onCalculated?.(quantity);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-border-subtle bg-surface p-4">
      <label className="block text-sm text-text-muted">
        {t('accountBalance')}
        <input
          type="number"
          value={accountBalance}
          onChange={(e) => setAccountBalance(Number(e.target.value))}
          className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary"
        />
      </label>
      <label className="block text-sm text-text-muted">
        {t('riskPercent')}
        <input
          type="number"
          step="any"
          value={riskPercent}
          onChange={(e) => setRiskPercent(Number(e.target.value))}
          className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary"
        />
      </label>
      <label className="block text-sm text-text-muted">
        {t('instrument')}
        <select
          value={instrumentId}
          onChange={(e) => setInstrumentId(e.target.value)}
          className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary"
        >
          {instruments.map((i) => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm text-text-muted">
        {t('stopDistance')}
        <input
          type="number"
          step="any"
          value={stopDistance}
          onChange={(e) => setStopDistance(Number(e.target.value))}
          className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary"
        />
      </label>
      <button type="button" onClick={handleCalculate} className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('calculate')}
      </button>
      {error && <p className="text-loss">{error}</p>}
      {result !== null && !error && (
        <p className="text-accent">{t('result')}: {result.toFixed(4)}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create the standalone page**

`src/app/[locale]/(app)/tools/position-size-calculator/page.tsx`:

```tsx
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { instruments } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { Calculator } from './Calculator';

export default async function PositionSizeCalculatorPage() {
  const user = await requireUser();
  const instrumentRows = await db.select().from(instruments).where(eq(instruments.userId, user.id));

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-4 text-xl font-bold text-text-primary">Calculateur de taille de position</h1>
      <Calculator instruments={instrumentRows} defaultAccountBalance={user.accountBalance} />
    </main>
  );
}
```

- [ ] **Step 3: Embed the calculator in the trade form**

Modify `src/app/[locale]/(app)/trades/TradeForm.tsx`: add state for the quantity field so the calculator can fill it, and render the `Calculator` component above the quantity input.

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { Instrument, Strategy, ChecklistRule } from '@/db/schema';
import { createTrade } from './actions';
import { Calculator } from '../tools/position-size-calculator/Calculator';

export function TradeForm({
  instruments,
  strategies,
  checklistRules,
  defaultAccountBalance,
}: {
  instruments: Instrument[];
  strategies: Strategy[];
  checklistRules: ChecklistRule[];
  defaultAccountBalance: number;
}) {
  const t = useTranslations('trades');
  const [quantity, setQuantity] = useState<number | ''>('');

  return (
    <form action={createTrade} className="space-y-4 rounded-xl border border-border-subtle bg-surface p-6">
      <Calculator
        instruments={instruments}
        defaultAccountBalance={defaultAccountBalance}
        onCalculated={(q) => setQuantity(Number(q.toFixed(4)))}
      />

      <div className="grid grid-cols-2 gap-4">
        <label className="text-sm text-text-muted">
          {t('instrument')}
          <select name="instrumentId" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary">
            {instruments.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-text-muted">
          {t('strategy')}
          <select name="strategyId" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary">
            <option value="">—</option>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-text-muted">
          {t('direction')}
          <select name="direction" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary">
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </label>
        <label className="text-sm text-text-muted">
          {t('quantity')}
          <input
            name="quantity"
            type="number"
            step="any"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary"
          />
        </label>
        <label className="text-sm text-text-muted">
          {t('entryPrice')}
          <input name="entryPrice" type="number" step="any" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('exitPrice')}
          <input name="exitPrice" type="number" step="any" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('stopLoss')}
          <input name="stopLossPrice" type="number" step="any" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('takeProfit')}
          <input name="takeProfitPrice" type="number" step="any" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('enteredAt')}
          <input name="enteredAt" type="datetime-local" required className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
        <label className="text-sm text-text-muted">
          {t('exitedAt')}
          <input name="exitedAt" type="datetime-local" className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
        </label>
      </div>

      <fieldset className="rounded-md border border-border-subtle p-3">
        <legend className="text-sm text-text-muted">{t('checklistTitle')}</legend>
        {checklistRules.filter((r) => r.active).map((rule) => (
          <div key={rule.id} className="flex items-center gap-3 py-1">
            <label className="flex items-center gap-2 text-text-primary">
              <input type="checkbox" name={`checklist_${rule.id}_checked`} />
              {rule.label}
            </label>
            <select name={`checklist_${rule.id}_phase`} className="rounded-md bg-bg p-1 text-sm text-text-primary">
              <option value="pre_entry">{t('phasePreEntry')}</option>
              <option value="entry">{t('phaseEntry')}</option>
              <option value="management">{t('phaseManagement')}</option>
              <option value="exit">{t('phaseExit')}</option>
            </select>
          </div>
        ))}
      </fieldset>

      <label className="block text-sm text-text-muted">
        {t('notes')}
        <textarea name="notes" rows={3} className="mt-1 block w-full rounded-md bg-bg p-2 text-text-primary" />
      </label>

      <button type="submit" className="rounded-md bg-cta px-4 py-2 font-bold text-bg">
        {t('save')}
      </button>
    </form>
  );
}
```

Modify `src/app/[locale]/(app)/trades/new/page.tsx` to pass `defaultAccountBalance={user.accountBalance}` to `<TradeForm />`.

- [ ] **Step 4: Add translation keys**

Add to `messages/fr.json` under a new `calculator` key:

```json
"calculator": {
  "accountBalance": "Solde du compte",
  "riskPercent": "% de risque",
  "instrument": "Instrument",
  "stopDistance": "Distance du stop (en prix)",
  "calculate": "Calculer",
  "result": "Quantité suggérée",
  "noInstrument": "Sélectionne un instrument"
}
```

Add to `messages/en.json`:

```json
"calculator": {
  "accountBalance": "Account balance",
  "riskPercent": "Risk %",
  "instrument": "Instrument",
  "stopDistance": "Stop distance (in price)",
  "calculate": "Calculate",
  "result": "Suggested quantity",
  "noInstrument": "Select an instrument"
}
```

- [ ] **Step 5: Manually verify**

Run: `npm run dev`, visit `/fr/tools/position-size-calculator`, enter values, click Calculate, confirm a result renders; visit `/fr/trades/new`, use the embedded calculator, confirm the quantity field updates.
Expected: both the standalone and embedded calculator produce a result and the trade form's quantity field is pre-filled.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/(app)/tools" "src/app/[locale]/(app)/trades/TradeForm.tsx" "src/app/[locale]/(app)/trades/new/page.tsx" messages/
git commit -m "feat: add position size calculator, embedded in the trade form"
```

---

### Task 21: Dashboard page

**Files:**
- Create: `src/app/[locale]/(app)/dashboard/page.tsx`
- Create: `src/app/[locale]/(app)/dashboard/EquityCurveChart.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `calculateWinRate`, `calculateProfitFactor`, `calculateExpectancy`, `calculateEquityCurve` (Task 7), `calculateDailyLossStatus`/`Weekly`/`Monthly` (Task 9), `calculateStreaks` (Task 10), `trades` table.
- Produces: none consumed downstream.

- [ ] **Step 1: Create the equity curve chart client component**

`src/app/[locale]/(app)/dashboard/EquityCurveChart.tsx`:

```tsx
'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function EquityCurveChart({ data }: { data: { date: string; cumulativePnl: number }[] }) {
  return (
    <div className="h-40 rounded-xl border border-border-subtle bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} />
          <YAxis stroke="#9ca3af" fontSize={11} />
          <Tooltip contentStyle={{ background: '#12151a', border: '1px solid rgba(255,255,255,0.1)' }} />
          <Line type="monotone" dataKey="cumulativePnl" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Create the dashboard page**

`src/app/[locale]/(app)/dashboard/page.tsx`:

```tsx
import { eq, and, isNotNull } from 'drizzle-orm';
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

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-8">
      <h1 className="text-xl font-bold text-text-primary">Dashboard</h1>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Win rate" value={`${winRate.toFixed(0)}%`} />
        <StatCard label="Profit factor" value={profitFactor !== null ? profitFactor.toFixed(2) : '—'} />
        <StatCard label="Espérance (R)" value={expectancy !== null ? expectancy.toFixed(2) : '—'} />
        <StatCard
          label="Streak actuelle"
          value={String(streaks.currentStreak)}
          valueClassName={streaks.currentStreak >= 0 ? 'text-gain' : 'text-loss'}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <LossLimitBar label="Perte journalière" status={dailyStatus} />
        <LossLimitBar label="Perte hebdomadaire" status={weeklyStatus} />
        <LossLimitBar label="Perte mensuelle" status={monthlyStatus} />
      </div>

      <EquityCurveChart
        data={equityCurve.map((p) => ({ date: p.date.toLocaleDateString(), cumulativePnl: p.cumulativePnl }))}
      />
    </main>
  );
}

function StatCard({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-1 text-lg font-bold ${valueClassName ?? 'text-text-primary'}`}>{value}</p>
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
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <div className="mb-2 flex justify-between text-sm text-text-primary">
        <span>{label}</span>
        <span>
          {status.currentLoss.toFixed(2)} / {status.limit !== null ? status.limit.toFixed(2) : '—'}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg">
        <div
          className={`h-full ${percent >= 100 ? 'bg-loss' : 'bg-accent'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Manually verify**

Requires at least one closed trade (from Task 17/18). Run: `npm run dev`, visit `/fr/dashboard`, confirm stat cards, loss-limit bars, and the equity curve chart render without errors.
Expected: page renders with real numbers derived from the seeded trade(s); no limit set shows `—` in the loss bars.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/dashboard"
git commit -m "feat: add dashboard page with stats, loss limits, and equity curve"
```

---

### Task 22: Heatmaps page

**Files:**
- Create: `src/app/[locale]/(app)/dashboard/heatmaps/page.tsx`
- Create: `src/app/[locale]/(app)/dashboard/heatmaps/HeatmapGrid.tsx`

**Interfaces:**
- Consumes: `heatmapBySymbolAndDay`, `heatmapBySymbolAndDuration`, `heatmapBySymbolAndMonth` (Task 8), `trades`/`instruments` tables.
- Produces: none consumed downstream.

- [ ] **Step 1: Create the reusable grid renderer**

`src/app/[locale]/(app)/dashboard/heatmaps/HeatmapGrid.tsx`:

```tsx
export function HeatmapGrid({
  title,
  columns,
  data,
}: {
  title: string;
  columns: string[];
  data: Record<string, Record<string, number>>;
}) {
  const instrumentNames = Object.keys(data);

  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <h3 className="mb-3 font-bold text-text-primary">{title}</h3>
      <table className="w-full text-sm text-text-primary">
        <thead>
          <tr>
            <th className="p-1 text-left text-text-muted"></th>
            {columns.map((c) => (
              <th key={c} className="p-1 text-text-muted">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {instrumentNames.map((name) => (
            <tr key={name}>
              <td className="p-1 text-text-muted">{name}</td>
              {columns.map((_, colIndex) => {
                const value = data[name][String(colIndex)] ?? data[name][columns[colIndex]];
                return (
                  <td
                    key={colIndex}
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
  );
}
```

- [ ] **Step 2: Create the heatmaps page**

`src/app/[locale]/(app)/dashboard/heatmaps/page.tsx`:

```tsx
import { eq, and, isNotNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { trades, instruments } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { heatmapBySymbolAndDay, heatmapBySymbolAndDuration, heatmapBySymbolAndMonth } from '@/lib/heatmaps';
import { HeatmapGrid } from './HeatmapGrid';

const DAY_LABELS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTH_LABELS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
const DURATION_LABELS = ['<30m', '30m-1h', '1h-4h', '4h-1d', '>1d'];

export default async function HeatmapsPage() {
  const user = await requireUser();

  const rows = await db
    .select({
      instrumentName: instruments.name,
      pnlAmount: trades.pnlAmount,
      enteredAt: trades.enteredAt,
      exitedAt: trades.exitedAt,
    })
    .from(trades)
    .innerJoin(instruments, eq(instruments.id, trades.instrumentId))
    .where(and(eq(trades.userId, user.id), eq(trades.status, 'closed'), isNotNull(trades.exitedAt)));

  const heatmapTrades = rows.map((r) => ({
    instrumentName: r.instrumentName,
    pnlAmount: r.pnlAmount ?? 0,
    enteredAt: r.enteredAt,
    exitedAt: r.exitedAt!,
  }));

  const byDay = heatmapBySymbolAndDay(heatmapTrades);
  const byMonth = heatmapBySymbolAndMonth(heatmapTrades);
  const byDuration = heatmapBySymbolAndDuration(heatmapTrades);

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-8">
      <h1 className="text-xl font-bold text-text-primary">Heatmaps de performance</h1>
      <HeatmapGrid title="Symbole × Jour" columns={DAY_LABELS.map((_, i) => String(i))} data={byDay} />
      <HeatmapGrid title="Symbole × Durée" columns={DURATION_LABELS} data={byDuration} />
      <HeatmapGrid title="Symbole × Mois" columns={MONTH_LABELS.map((_, i) => String(i + 1))} data={byMonth} />
    </main>
  );
}
```

- [ ] **Step 3: Manually verify**

Run: `npm run dev`, visit `/fr/dashboard/heatmaps`, confirm the three grids render with the closed trade(s) data.
Expected: grids render without runtime errors; cells with data are colored green (gain) or red (loss).

- [ ] **Step 4: Commit**

```bash
git add "src/app/[locale]/(app)/dashboard/heatmaps"
git commit -m "feat: add symbol x day/duration/month heatmaps page"
```

---

### Task 23: Erreurs analytics page

**Files:**
- Create: `src/app/[locale]/(app)/erreurs/page.tsx`

**Interfaces:**
- Consumes: `calculateErrorsAnalytics` (Task 11), `trades`, `tradeChecklistResponses`, `checklistRules` tables.
- Produces: none consumed downstream.

- [ ] **Step 1: Create the page**

`src/app/[locale]/(app)/erreurs/page.tsx`:

```tsx
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trades, tradeChecklistResponses, checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { calculateErrorsAnalytics, type ChecklistResponseRecord, type ChecklistPhase } from '@/lib/errors-analytics';

export default async function ErreursPage() {
  const user = await requireUser();

  const userTrades = await db.select({ id: trades.id }).from(trades).where(eq(trades.userId, user.id));

  const tradesWithResponses = await Promise.all(
    userTrades.map(async (trade) => {
      const responses = await db
        .select({
          ruleId: checklistRules.id,
          ruleLabel: checklistRules.label,
          checked: tradeChecklistResponses.checked,
          phase: tradeChecklistResponses.phase,
        })
        .from(tradeChecklistResponses)
        .innerJoin(checklistRules, eq(checklistRules.id, tradeChecklistResponses.checklistRuleId))
        .where(eq(tradeChecklistResponses.tradeId, trade.id));
      return { tradeId: trade.id, responses: responses as ChecklistResponseRecord[] };
    })
  );

  const analytics = calculateErrorsAnalytics(tradesWithResponses);
  const phaseLabels: Record<ChecklistPhase, string> = {
    pre_entry: 'Pré-entrée',
    entry: 'Entrée',
    management: 'Gestion',
    exit: 'Sortie',
  };

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-8">
      <h1 className="text-xl font-bold text-text-primary">Erreurs</h1>

      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Erreurs totales" value={String(analytics.totalErrors)} />
        <StatCard label="Catégories" value={String(analytics.byCategory.length)} />
        <StatCard
          label="Trades avec erreurs"
          value={
            analytics.totalTrades > 0
              ? `${((analytics.totalTradesWithErrors / analytics.totalTrades) * 100).toFixed(0)}%`
              : '—'
          }
        />
        <StatCard label="Total trades" value={String(analytics.totalTrades)} />
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface p-4">
        <h2 className="mb-3 font-bold text-text-primary">Par catégorie</h2>
        <ul className="space-y-1">
          {analytics.byCategory
            .sort((a, b) => b.count - a.count)
            .map((c) => (
              <li key={c.label} className="flex justify-between text-text-primary">
                <span>{c.label}</span>
                <span>{c.count}</span>
              </li>
            ))}
          {analytics.byCategory.length === 0 && <p className="text-text-muted">Aucune erreur enregistrée pour l'instant.</p>}
        </ul>
      </div>

      <div className="rounded-xl border border-border-subtle bg-surface p-4">
        <h2 className="mb-3 font-bold text-text-primary">Par phase du trade</h2>
        <table className="w-full text-sm text-text-primary">
          <thead className="text-text-muted">
            <tr>
              <th className="p-1 text-left">Catégorie</th>
              {(['pre_entry', 'entry', 'management', 'exit'] as ChecklistPhase[]).map((phase) => (
                <th key={phase} className="p-1">{phaseLabels[phase]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(analytics.byPhase).map(([label, counts]) => (
              <tr key={label}>
                <td className="p-1">{label}</td>
                {(['pre_entry', 'entry', 'management', 'exit'] as ChecklistPhase[]).map((phase) => (
                  <td key={phase} className="p-1 text-center">{counts[phase]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-bold text-text-primary">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Manually verify**

Run: `npm run dev`, visit `/fr/erreurs`, confirm the stat cards, category list, and phase table render using the checklist responses recorded on trades created in Task 17/18.
Expected: page renders without runtime errors; an empty state message shows if no errors have been checked yet.

- [ ] **Step 3: Commit**

```bash
git add "src/app/[locale]/(app)/erreurs"
git commit -m "feat: add erreurs analytics page (totals, by category, by phase)"
```

---

### Task 24: Settings page

**Files:**
- Create: `src/app/[locale]/(app)/settings/page.tsx`
- Create: `src/app/[locale]/(app)/settings/actions.ts`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `requireUser()`, `users` table.
- Produces: `updateSettings` server action — no downstream consumers.

- [ ] **Step 1: Create the server action**

`src/app/[locale]/(app)/settings/actions.ts`:

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { users } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';

function numberOrNull(value: FormDataEntryValue | null): number | null {
  if (!value || String(value) === '') return null;
  return Number(value);
}

export async function updateSettings(formData: FormData) {
  const user = await requireUser();

  await db
    .update(users)
    .set({
      accountBalance: Number(formData.get('accountBalance') ?? 0),
      defaultRiskPercent: numberOrNull(formData.get('defaultRiskPercent')),
      dailyLossLimit: numberOrNull(formData.get('dailyLossLimit')),
      weeklyLossLimit: numberOrNull(formData.get('weeklyLossLimit')),
      monthlyLossLimit: numberOrNull(formData.get('monthlyLossLimit')),
      locale: String(formData.get('locale')) === 'en' ? 'en' : 'fr',
    })
    .where(eq(users.id, user.id));

  revalidatePath('/[locale]/settings', 'page');
}
```

- [ ] **Step 2: Create the page**

`src/app/[locale]/(app)/settings/page.tsx`:

```tsx
import { useTranslations } from 'next-intl';
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
```

- [ ] **Step 3: Add translation keys**

Add to `messages/fr.json`:

```json
"settings": {
  "title": "Paramètres",
  "accountBalance": "Solde du compte",
  "defaultRiskPercent": "% de risque par défaut",
  "dailyLossLimit": "Limite de perte journalière",
  "weeklyLossLimit": "Limite de perte hebdomadaire",
  "monthlyLossLimit": "Limite de perte mensuelle",
  "locale": "Langue",
  "save": "Enregistrer"
}
```

Add to `messages/en.json`:

```json
"settings": {
  "title": "Settings",
  "accountBalance": "Account balance",
  "defaultRiskPercent": "Default risk %",
  "dailyLossLimit": "Daily loss limit",
  "weeklyLossLimit": "Weekly loss limit",
  "monthlyLossLimit": "Monthly loss limit",
  "locale": "Language",
  "save": "Save"
}
```

- [ ] **Step 4: Manually verify**

Run: `npm run dev`, visit `/fr/settings`, update the account balance and loss limits, submit, reload the page and confirm the new values persisted; check that `/fr/dashboard` now reflects the new loss limits in its bars.
Expected: values persist across reload; dashboard loss-limit bars use the updated limits.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/(app)/settings" messages/
git commit -m "feat: add settings page for account balance, risk %, loss limits, and locale"
```

---

### Task 25: App shell — sidebar navigation, theme/language/account controls

**Files:**
- Create: `src/app/[locale]/(app)/layout.tsx`
- Create: `src/app/[locale]/(app)/Sidebar.tsx`
- Create: `src/app/[locale]/(app)/TopBar.tsx`
- Create: `src/app/[locale]/(app)/ThemeToggle.tsx`
- Modify: `messages/fr.json`, `messages/en.json`

**Interfaces:**
- Consumes: `requireUser()` (Task 13), `calculateDailyLossStatus` + `LossLimitStatus` (Task 9), `trades` table (Task 4), the `--color-*` / `data-theme` mechanism and blocking init script (Task 1, Task 12).
- Produces: a shared layout applied automatically by Next.js to every existing page under `(app)/` (Tasks 14-24) — no changes needed in those pages' own files.

This is a retrofit: Tasks 14-24 were built and manually verified as bare pages before this task exists. Once this layout lands, all of them render inside the sidebar shell with no further edits, because Next.js applies `(app)/layout.tsx` to every nested route structurally, regardless of the order tasks were implemented in.

- [ ] **Step 1: Create `src/app/[locale]/(app)/ThemeToggle.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';

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
        className={`flex h-5 w-6 items-center justify-center rounded-full text-[10px] ${
          theme === 'dark' ? 'bg-accent-dim text-accent' : 'text-text-muted'
        }`}
      >
        ●
      </button>
      <button
        type="button"
        onClick={() => apply('light')}
        aria-label="Light theme"
        className={`flex h-5 w-6 items-center justify-center rounded-full text-[10px] ${
          theme === 'light' ? 'bg-accent-dim text-accent' : 'text-text-muted'
        }`}
      >
        ○
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create `src/app/[locale]/(app)/TopBar.tsx`**

```tsx
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
        className="flex h-6 w-6 items-center justify-center rounded-full border border-border-subtle bg-surface-2 text-[10px] text-text-muted"
        title={t('account')}
      >
        •
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Create `src/app/[locale]/(app)/Sidebar.tsx`**

```tsx
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
```

- [ ] **Step 4: Create `src/app/[locale]/(app)/layout.tsx`**

```tsx
import { eq, and, isNotNull } from 'drizzle-orm';
import { db } from '@/db/client';
import { trades } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { calculateDailyLossStatus } from '@/lib/loss-limits';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  const closedTrades = await db
    .select({ pnlAmount: trades.pnlAmount, exitedAt: trades.exitedAt })
    .from(trades)
    .where(and(eq(trades.userId, user.id), eq(trades.status, 'closed'), isNotNull(trades.exitedAt)));

  const records = closedTrades.map((t) => ({ pnlAmount: t.pnlAmount ?? 0, exitedAt: t.exitedAt! }));
  const now = new Date();
  const todayStatus = calculateDailyLossStatus(records, user.dailyLossLimit, now);
  const todayPnl = records
    .filter((t) => t.exitedAt.toDateString() === now.toDateString())
    .reduce((sum, t) => sum + t.pnlAmount, 0);

  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar todayPnl={todayPnl} todayStatus={todayStatus} />
      <div className="min-w-0 flex-1">
        <TopBar />
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add `nav` translation keys**

Add to `messages/fr.json`:

```json
"nav": {
  "overview": "Aperçu",
  "journal": "Journal",
  "configuration": "Configuration",
  "tools": "Outils",
  "dashboard": "Dashboard",
  "heatmaps": "Heatmaps",
  "erreurs": "Erreurs",
  "trades": "Trades",
  "strategies": "Stratégies",
  "instruments": "Instruments",
  "checklist": "Checklist",
  "calculator": "Calculateur",
  "today": "Aujourd'hui",
  "ofDailyLimit": "de la limite journalière",
  "account": "Compte"
}
```

Add to `messages/en.json`:

```json
"nav": {
  "overview": "Overview",
  "journal": "Journal",
  "configuration": "Configuration",
  "tools": "Tools",
  "dashboard": "Dashboard",
  "heatmaps": "Heatmaps",
  "erreurs": "Errors",
  "trades": "Trades",
  "strategies": "Strategies",
  "instruments": "Instruments",
  "checklist": "Checklist",
  "calculator": "Calculator",
  "today": "Today",
  "ofDailyLimit": "of daily limit",
  "account": "Account"
}
```

- [ ] **Step 6: Manually verify**

Run: `npm run dev`, log in, visit `/fr/instruments` — confirm the sidebar now wraps the page (grouped nav, logo, "Aujourd'hui" widget), and that visiting `/fr/dashboard` highlights "Dashboard" as active while the others don't. Click the theme toggle, confirm the whole page (sidebar included) repaints to the light palette, reload the page and confirm the light theme persisted (no flash of dark before it applies). Click "EN" in the top-right and confirm it navigates to the English version of the *same* page (e.g. `/fr/trades` → `/en/trades`, not back to the homepage).
Expected: sidebar present on every `(app)` page without editing them; active link highlight correct; theme persists across reload without flashing; language switch preserves the current path.

- [ ] **Step 7: Commit**

```bash
git add "src/app/[locale]/(app)/layout.tsx" "src/app/[locale]/(app)/Sidebar.tsx" "src/app/[locale]/(app)/TopBar.tsx" "src/app/[locale]/(app)/ThemeToggle.tsx" messages/
git commit -m "feat: add app shell with sidebar nav, theme toggle, and language switch"
```

---

## Self-Review Notes

- **Spec coverage:** §3 data model → Tasks 3-4. §4 calculations → Tasks 5-6. §5.1 auth → Task 13. §5.2 dashboard (incl. loss limits, heatmaps) → Tasks 21-22. §5.3 erreurs → Tasks 11, 23. §5.4-5.5 trades → Tasks 17-19. §5.6 management pages → Tasks 14-16, 20, 24. §2 i18n → Task 12 (infra) + every page task's translation-key steps. §6 visual identity (dark+light tokens) → Task 1, plus Task 25 for the toggle control and shared navigation chrome §6.1. §8 error handling (validation, blocked deletes, empty states, screenshot limits, division-by-zero) → covered in Tasks 5 (null risk), 9 (buildStatus), 14/15 (in-use delete guard), 18 (upload validation), 19 (empty state). §9 testing → every calculation task (5-11) is TDD with Vitest. Landing page (§7) is intentionally out of this plan per the brainstorming decision to split it into a second plan.
- **Placeholder scan:** no TBD/TODO markers; every step has complete, runnable code.
- **Type consistency:** `Direction` (`'long' | 'short'`) defined once in `calculations.ts` and reused via the schema's `text({enum})` columns. `ChecklistPhase` defined once in `errors-analytics.ts` and reused in the schema, the trade form, and the trade detail/erreurs pages. `Instrument`, `Strategy`, `ChecklistRule`, `Trade` types all sourced from `src/db/schema.ts` `$inferSelect`, never redefined ad hoc. `LossLimitStatus` defined once in `loss-limits.ts` (Task 9) and reused unmodified by both the dashboard page (Task 21) and the sidebar's "Aujourd'hui" widget (Task 25).
- **Sequencing note:** Task 25 (app shell) is placed after Task 24 rather than right after Task 13, deliberately — Next.js applies `(app)/layout.tsx` structurally to every nested route the moment it exists, so Tasks 14-24 do not need to be revisited once the shared sidebar lands. Their own "manually verify" steps will show bare, unstyled-chrome pages until Task 25 runs; that is expected, not a defect.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-21-trading-journal-app.md`.

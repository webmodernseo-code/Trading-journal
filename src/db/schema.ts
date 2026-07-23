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

export const checklistRules = pgTable('checklist_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  active: boolean('active').notNull().default(true),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

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
  isDemo: boolean('is_demo').notNull().default(false),
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

export type User = typeof users.$inferSelect;
export type Instrument = typeof instruments.$inferSelect;
export type Strategy = typeof strategies.$inferSelect;
export type ChecklistRule = typeof checklistRules.$inferSelect;
export type Trade = typeof trades.$inferSelect;
export type TradeChecklistResponse = typeof tradeChecklistResponses.$inferSelect;
export type TradeScreenshot = typeof tradeScreenshots.$inferSelect;

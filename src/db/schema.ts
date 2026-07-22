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

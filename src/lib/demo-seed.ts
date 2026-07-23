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

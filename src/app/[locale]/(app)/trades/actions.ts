'use server';

import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { trades, instruments, strategies, tradeChecklistResponses, checklistRules } from '@/db/schema';
import { requireUser } from '@/lib/auth-helpers';
import { calculatePnl, calculateRisk } from '@/lib/calculations';

export async function createTrade(formData: FormData) {
  const user = await requireUser();

  const instrumentId = String(formData.get('instrumentId'));
  const [instrument] = await db
    .select()
    .from(instruments)
    .where(and(eq(instruments.id, instrumentId), eq(instruments.userId, user.id)))
    .limit(1);
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
  let strategyId: string | null = null;
  if (strategyIdRaw) {
    const [strategy] = await db
      .select({ id: strategies.id })
      .from(strategies)
      .where(and(eq(strategies.id, String(strategyIdRaw)), eq(strategies.userId, user.id)))
      .limit(1);
    if (!strategy) throw new Error('Stratégie introuvable');
    strategyId = strategy.id;
  }
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

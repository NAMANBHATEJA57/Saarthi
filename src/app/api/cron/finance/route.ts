import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { financeRecurringRules, financeTransactions } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { createAllocationSnapshots } from '@/lib/finance/service';

// Basic protection (can be improved with Vercel Cron secrets)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    const rules = await db.select()
      .from(financeRecurringRules)
      .where(and(
        eq(financeRecurringRules.isActive, true),
        lte(financeRecurringRules.nextOccurrenceOn, todayStr) // Due today or earlier
      ));

    let processedCount = 0;

    for (const rule of rules) {
      // Check if we've already materialized this one to be idempotent
      // A robust way: check if a transaction exists with source=RECURRING, recurringRuleId=rule.id, and transactionDate=rule.nextOccurrenceOn
      const existing = await db.select()
        .from(financeTransactions)
        .where(and(
          eq(financeTransactions.recurringRuleId, rule.id),
          eq(financeTransactions.transactionDate, rule.nextOccurrenceOn!)
        ))
        .limit(1);

      if (existing.length === 0) {
        await db.transaction(async (tx) => {
          const [newTx] = await tx.insert(financeTransactions).values({
            userId: rule.userId,
            type: rule.type,
            amountMinor: rule.amountMinor,
            currencyCode: rule.currencyCode,
            transactionDate: rule.nextOccurrenceOn!,
            categoryId: rule.categoryId,
            remark: rule.remarkTemplate || null,
            source: 'RECURRING',
            recurringRuleId: rule.id,
          }).returning();

          if (rule.type === 'INCOME') {
            await createAllocationSnapshots(tx, rule.userId, newTx.id, rule.amountMinor, rule.nextOccurrenceOn!);
          }

          // Calculate next occurrence (simple +1 month)
          // Handle end of month issues (e.g. 31st of Feb -> 28th)
          const currentDate = new Date(rule.nextOccurrenceOn!);
          let nextMonth = currentDate.getMonth() + 1;
          let nextYear = currentDate.getFullYear();
          if (nextMonth > 11) {
            nextMonth = 0;
            nextYear += 1;
          }
          
          let nextDay = rule.dayOfMonth;
          const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
          if (nextDay > daysInNextMonth) {
            nextDay = daysInNextMonth;
          }

          const nextDateObj = new Date(nextYear, nextMonth, nextDay);
          const nextDateStr = nextDateObj.toISOString().split('T')[0];

          let isActive = true;
          if (rule.endsOn && nextDateStr > rule.endsOn) {
            isActive = false;
          }

          await tx.update(financeRecurringRules)
            .set({ nextOccurrenceOn: nextDateStr, isActive })
            .where(eq(financeRecurringRules.id, rule.id));
            
          processedCount++;
        });
      }
    }

    return NextResponse.json({ success: true, processedCount });
  } catch (error) {
    console.error('Cron error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeRecurringTransactions, financeTransactions } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { addDays, addMonths, addYears, format } from 'date-fns';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;
  
  try {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Find all active recurring transactions where nextDueDate <= today
    const dueTransactions = await db.query.financeRecurringTransactions.findMany({
      where: and(
        eq(financeRecurringTransactions.userId, userId),
        eq(financeRecurringTransactions.isActive, true),
        lte(financeRecurringTransactions.nextDueDate, today)
      )
    });
    
    if (dueTransactions.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No recurring transactions due' });
    }
    
    let processedCount = 0;
    
    for (const rt of dueTransactions) {
      // Create the transaction
      await db.insert(financeTransactions).values({
        id: crypto.randomUUID(),
        userId,
        type: rt.type,
        amount: rt.amount,
        accountId: rt.accountId,
        destinationAccountId: rt.destinationAccountId,
        categoryId: rt.categoryId,
        incomeTypeId: rt.incomeTypeId,
        savingsGoalId: rt.savingsGoalId,
        description: rt.description,
        merchant: rt.merchant,
        notes: rt.notes ? `[Auto-posted] ${rt.notes}` : '[Auto-posted via Recurring]',
        source: 'MANUAL', // Or we could add a 'RECURRING' enum value, but manual is fine for ledger
        transactionDate: rt.nextDueDate, // Post it on the date it was due
        currencyCode: 'INR',
      });
      
      // Calculate next due date
      const currentDueDate = new Date(rt.nextDueDate);
      let nextDate = currentDueDate;
      
      if (rt.frequency === 'DAILY') nextDate = addDays(currentDueDate, 1);
      else if (rt.frequency === 'WEEKLY') nextDate = addDays(currentDueDate, 7);
      else if (rt.frequency === 'MONTHLY') nextDate = addMonths(currentDueDate, 1);
      else if (rt.frequency === 'YEARLY') nextDate = addYears(currentDueDate, 1);
      
      // Update the template
      await db.update(financeRecurringTransactions)
        .set({ 
          nextDueDate: format(nextDate, 'yyyy-MM-dd'),
          updatedAt: new Date()
        })
        .where(eq(financeRecurringTransactions.id, rt.id));
        
      processedCount++;
    }
    
    return NextResponse.json({ success: true, count: processedCount });
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
    return NextResponse.json({ error: 'Failed to process recurring transactions' }, { status: 500 });
  }
}

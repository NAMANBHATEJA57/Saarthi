import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeRecurringTransactions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const transactions = await db.query.financeRecurringTransactions.findMany({
      where: and(
        eq(financeRecurringTransactions.userId, session.user.id),
        eq(financeRecurringTransactions.isActive, true)
      ),
      orderBy: [desc(financeRecurringTransactions.createdAt)]
    });
    
    return NextResponse.json({ recurringTransactions: transactions });
  } catch (error) {
    console.error('Error fetching recurring transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch recurring transactions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const data = await req.json();
    const userId = session.user.id;
    
    // Calculate first due date if not provided (default to today)
    let nextDueDate = data.nextDueDate;
    if (!nextDueDate) {
      const today = new Date();
      nextDueDate = today.toISOString().split('T')[0];
    }
    
    const [inserted] = await db.insert(financeRecurringTransactions).values({
      id: crypto.randomUUID(),
      userId,
      type: data.type,
      amount: Number(data.amount),
      accountId: data.accountId || null,
      destinationAccountId: data.destinationAccountId || null,
      categoryId: data.categoryId || null,
      incomeTypeId: data.incomeTypeId || null,
      savingsGoalId: data.savingsGoalId || null,
      description: data.description || 'Recurring Transaction',
      merchant: data.merchant || null,
      notes: data.notes || null,
      frequency: data.frequency,
      nextDueDate,
      currencyCode: 'INR',
      isActive: true,
    }).returning();
    
    return NextResponse.json({ success: true, recurringTransaction: inserted });
  } catch (error) {
    console.error('Error creating recurring transaction:', error);
    return NextResponse.json({ error: 'Failed to create recurring transaction' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    
    await db.update(financeRecurringTransactions)
      .set({ isActive: false })
      .where(and(
        eq(financeRecurringTransactions.id, id),
        eq(financeRecurringTransactions.userId, session.user.id)
      ));
      
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting recurring transaction:', error);
    return NextResponse.json({ error: 'Failed to delete recurring transaction' }, { status: 500 });
  }
}

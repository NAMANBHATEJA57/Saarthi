import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeTransactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const { id } = await params;
    const body = await req.json();
    const { type, amount, categoryId, incomeTypeId, savingsGoalId, accountId, destinationAccountId, externalRecipientName, description, merchant, notes, transactionDate } = body;

    if (!type || !amount || !transactionDate || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const existingTx = await db.select().from(financeTransactions).where(and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)));
    if (existingTx.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const currencyCode = 'INR';

    const [updatedTx] = await db
      .update(financeTransactions)
      .set({
        type,
        amount,
        currencyCode,
        transactionDate,
        accountId: accountId || null,
        destinationAccountId: destinationAccountId || null,
        externalRecipientName: externalRecipientName || null,
        categoryId: categoryId || null,
        incomeTypeId: incomeTypeId || null,
        savingsGoalId: savingsGoalId || null,
        description: description || null,
        merchant: merchant || null,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)))
      .returning();

    return NextResponse.json({ transaction: updatedTx });
  } catch (error) {
    console.error('Transaction PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const { id } = await params;
    const existingTx = await db.select().from(financeTransactions).where(and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)));
    if (existingTx.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db
      .update(financeTransactions)
      .set({ status: 'VOIDED', updatedAt: new Date() })
      .where(eq(financeTransactions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

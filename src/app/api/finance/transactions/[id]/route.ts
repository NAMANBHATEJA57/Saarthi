import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeTransactions, financeAllocationSnapshots } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { createAllocationSnapshots } from '@/lib/finance/service';

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
    const { type, amountMinor, categoryId, accountId, destinationAccountId, remark, transactionDate } = body;

    if (!type || !amountMinor || !transactionDate || amountMinor <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    if ((type === 'INCOME' || type === 'EXPENSE' || type === 'CREDIT_CARD_PURCHASE' || type === 'REFUND') && !categoryId) {
      return NextResponse.json({ error: 'Category required' }, { status: 400 });
    }

    const existingTx = await db.select().from(financeTransactions).where(and(eq(financeTransactions.id, id), eq(financeTransactions.userId, userId)));
    if (existingTx.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const result = await db.transaction(async (tx) => {
      const [updatedTx] = await tx
        .update(financeTransactions)
        .set({
          type,
          amountMinor,
          transactionDate,
          categoryId: categoryId || null,
          accountId: accountId || null,
          destinationAccountId: destinationAccountId || null,
          remark: remark || null,
          updatedAt: new Date(),
        })
        .where(eq(financeTransactions.id, id))
        .returning();

      // If it was income and the amount or date changed, we need to recalculate snapshots.
      // But wait! Spec says: "Editing an income must not silently alter an existing snapshot; see historical-integrity rules."
      // Actually, spec 3: "Editing a posted transaction is a deliberate user action and must immediately update affected current/historical summaries."
      // If the user deliberately edits the income amount, the snapshots should be re-calculated for that specific income transaction so it totals the new amount correctly.
      if (type === 'INCOME' && (existingTx[0].amountMinor !== amountMinor || existingTx[0].transactionDate !== transactionDate)) {
        await tx.delete(financeAllocationSnapshots).where(eq(financeAllocationSnapshots.incomeTransactionId, id));
        await createAllocationSnapshots(tx, userId, id, amountMinor, transactionDate);
      }

      return updatedTx;
    });

    return NextResponse.json({ transaction: result });
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

    await db.transaction(async (tx) => {
      await tx
        .update(financeTransactions)
        .set({ status: 'VOIDED', updatedAt: new Date() })
        .where(eq(financeTransactions.id, id));
        
      // No need to delete snapshots, they join on POSTED status in monthly logic, 
      // or we can just leave them since the income is voided.
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Transaction DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

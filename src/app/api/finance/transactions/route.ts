import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeTransactions, userPreferences } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { createAllocationSnapshots } from '@/lib/finance/service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam) : 50;

    const transactions = await db
      .select()
      .from(financeTransactions)
      .where(and(eq(financeTransactions.userId, userId), eq(financeTransactions.status, 'POSTED')))
      .orderBy(desc(financeTransactions.transactionDate), desc(financeTransactions.createdAt))
      .limit(limit);

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Transactions GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const body = await req.json();
    const { type, amountMinor, categoryId, accountId, destinationAccountId, remark, transactionDate } = body;

    // TRANSFER and CREDIT_CARD_PAYMENT do not require categoryId
    if (!type || !amountMinor || !transactionDate || amountMinor <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    
    if ((type === 'INCOME' || type === 'EXPENSE') && !categoryId) {
      return NextResponse.json({ error: 'Category required for income/expense' }, { status: 400 });
    }

    if ((type === 'TRANSFER' || type === 'CREDIT_CARD_PAYMENT') && (!accountId || !destinationAccountId)) {
      return NextResponse.json({ error: 'Both accounts required for transfer/payment' }, { status: 400 });
    }

    // Default to INR or from preferences
    const currencyCode = 'INR';

    const result = await db.transaction(async (tx) => {
      const [newTx] = await tx.insert(financeTransactions).values({
        userId,
        type,
        amountMinor,
        currencyCode,
        transactionDate,
        accountId: accountId || null,
        destinationAccountId: destinationAccountId || null,
        categoryId: categoryId || null,
        remark: remark || null,
        source: 'MANUAL',
      }).returning();

      if (type === 'INCOME') {
        await createAllocationSnapshots(tx, userId, newTx.id, amountMinor, transactionDate);
      }

      return newTx;
    });

    return NextResponse.json({ transaction: result });
  } catch (error) {
    console.error('Transactions POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

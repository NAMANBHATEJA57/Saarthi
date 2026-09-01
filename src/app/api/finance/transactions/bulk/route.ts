import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeTransactions } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { transactions } = await req.json();

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return NextResponse.json({ error: 'No transactions provided' }, { status: 400 });
    }

    const userId = session.user.id;

    const valuesToInsert = transactions.map((tx: any) => ({
      id: crypto.randomUUID(),
      userId,
      accountId: tx.accountId,
      type: tx.type,
      amount: Number(tx.amount),
      description: tx.description || 'Imported Transaction',
      transactionDate: tx.transactionDate,
      categoryId: tx.categoryId || null,
      source: 'MANUAL',
      currencyCode: 'INR',
    }));

    await db.insert(financeTransactions).values(valuesToInsert);

    return NextResponse.json({ success: true, count: valuesToInsert.length });
  } catch (error) {
    console.error('Bulk Import Error:', error);
    return NextResponse.json({ error: 'Failed to import transactions' }, { status: 500 });
  }
}

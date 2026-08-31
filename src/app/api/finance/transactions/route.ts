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
    const offsetParam = searchParams.get('offset');
    const accountIds = searchParams.get('accountId'); // Can be comma separated
    const categoryIds = searchParams.get('categoryId'); // Can be comma separated
    const typeParam = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    let condition = and(eq(financeTransactions.userId, userId), eq(financeTransactions.status, 'POSTED'));
    const { or, inArray, gte, lte, ilike } = require('drizzle-orm');
    
    if (accountIds) {
      const arr = accountIds.split(',');
      condition = and(
        condition,
        or(inArray(financeTransactions.accountId, arr), inArray(financeTransactions.destinationAccountId, arr))
      );
    }

    if (categoryIds) {
      const arr = categoryIds.split(',');
      condition = and(condition, inArray(financeTransactions.categoryId, arr));
    }

    if (typeParam && typeParam !== 'all') {
      condition = and(condition, eq(financeTransactions.type, typeParam.toUpperCase()));
    }

    if (startDate) {
      condition = and(condition, gte(financeTransactions.transactionDate, startDate));
    }

    if (endDate) {
      condition = and(condition, lte(financeTransactions.transactionDate, endDate));
    }

    if (search) {
      condition = and(
        condition,
        or(
          ilike(financeTransactions.remark, `%${search}%`),
          ilike(financeTransactions.originalDescription, `%${search}%`)
        )
      );
    }

    const transactions = await db
      .select()
      .from(financeTransactions)
      .where(condition)
      .orderBy(desc(financeTransactions.transactionDate), desc(financeTransactions.createdAt))
      .limit(limit)
      .offset(offset);

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
    
    if ((type === 'INCOME' || type === 'EXPENSE' || type === 'CREDIT_CARD_PURCHASE' || type === 'REFUND') && !categoryId) {
      return NextResponse.json({ error: 'Category required' }, { status: 400 });
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

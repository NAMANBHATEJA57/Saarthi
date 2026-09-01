import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeTransactions } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

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
    const incomeTypeIds = searchParams.get('incomeTypeId'); // Can be comma separated
    const typeParam = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    
    const limit = limitParam ? parseInt(limitParam) : 50;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    const { or, inArray, gte, lte, ilike } = require('drizzle-orm');
    let condition = and(eq(financeTransactions.userId, userId), eq(financeTransactions.status, 'POSTED'));
    
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
    
    if (incomeTypeIds) {
      const arr = incomeTypeIds.split(',');
      condition = and(condition, inArray(financeTransactions.incomeTypeId, arr));
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
          ilike(financeTransactions.description, `%${search}%`),
          ilike(financeTransactions.merchant, `%${search}%`)
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
    const { 
      type, amount, categoryId, incomeTypeId, accountId, destinationAccountId, 
      externalRecipientName, description, merchant, notes, transactionDate, source
    } = body;

    if (!type || !amount || !transactionDate || amount <= 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    
    if (type === 'EXPENSE' && !categoryId) {
      return NextResponse.json({ error: 'Category required for expense' }, { status: 400 });
    }
    
    if (type === 'INCOME' && !incomeTypeId) {
      return NextResponse.json({ error: 'Income Type required for income' }, { status: 400 });
    }

    if ((type === 'TRANSFER' || type === 'CREDIT_CARD_PAYMENT') && (!accountId)) {
      return NextResponse.json({ error: 'Source account required for transfer/payment' }, { status: 400 });
    }
    
    if (type === 'TRANSFER' && !destinationAccountId && !externalRecipientName) {
       return NextResponse.json({ error: 'Destination account or external recipient required for transfer' }, { status: 400 });
    }

    const currencyCode = 'INR';

    const [newTx] = await db.insert(financeTransactions).values({
      userId,
      type,
      amount,
      currencyCode,
      transactionDate,
      accountId: accountId || null,
      destinationAccountId: destinationAccountId || null,
      externalRecipientName: externalRecipientName || null,
      categoryId: categoryId || null,
      incomeTypeId: incomeTypeId || null,
      description: description || null,
      merchant: merchant || null,
      notes: notes || null,
      source: source || 'MANUAL',
    }).returning();

    return NextResponse.json({ transaction: newTx });
  } catch (error) {
    console.error('Transactions POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeAccounts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { financeTransactions } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const accounts = await db.select().from(financeAccounts).where(eq(financeAccounts.userId, session.user.id));
    return NextResponse.json({ accounts });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await req.json();
    const { name, type, creditLimitMinor, statementDay, dueDay } = body;
    if (!name || !type) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const [acc] = await db.insert(financeAccounts).values({
      userId: session.user.id,
      name,
      type,
      creditLimitMinor: creditLimitMinor || null,
      statementDay: statementDay || null,
      dueDay: dueDay || null,
    }).returning();
    
    if (body.initialBalanceMinor && body.initialBalanceMinor > 0) {
      await db.insert(financeTransactions).values({
        userId: session.user.id,
        type: type === 'CREDIT_CARD' ? 'EXPENSE' : 'INCOME',
        amountMinor: body.initialBalanceMinor,
        currencyCode: 'INR',
        transactionDate: new Date().toISOString().split('T')[0],
        accountId: acc.id,
        remark: 'Opening Balance',
        source: 'MANUAL',
        status: 'POSTED',
      });
    }
    
    return NextResponse.json({ account: acc });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

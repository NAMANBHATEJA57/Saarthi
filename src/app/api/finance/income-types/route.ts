import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeIncomeTypes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const incomeTypes = await db
      .select()
      .from(financeIncomeTypes)
      .where(and(eq(financeIncomeTypes.userId, userId), eq(financeIncomeTypes.isActive, true)))
      .orderBy(financeIncomeTypes.sortOrder);

    return NextResponse.json({ incomeTypes });
  } catch (error) {
    console.error('IncomeTypes GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const body = await req.json();
    const { name, expectedAmount } = body;

    if (!name) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const [newIncomeType] = await db.insert(financeIncomeTypes).values({
      userId,
      name,
      expectedAmount: expectedAmount ? parseFloat(expectedAmount) : null,
    }).returning();

    return NextResponse.json({ incomeType: newIncomeType });
  } catch (error) {
    console.error('IncomeTypes POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


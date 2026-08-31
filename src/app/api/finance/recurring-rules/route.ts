import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeRecurringRules } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const rules = await db.select()
      .from(financeRecurringRules)
      .where(and(eq(financeRecurringRules.userId, userId), eq(financeRecurringRules.isActive, true)));

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Recurring Rules GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const body = await req.json();
    const { type, amountMinor, categoryId, remarkTemplate, dayOfMonth, startsOn, endsOn } = body;

    if (!type || !amountMinor || !categoryId || !dayOfMonth) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const [rule] = await db.insert(financeRecurringRules).values({
      userId,
      type,
      amountMinor,
      currencyCode: 'INR',
      categoryId,
      remarkTemplate,
      frequency: 'MONTHLY',
      dayOfMonth,
      startsOn,
      endsOn,
      nextOccurrenceOn: startsOn || new Date().toISOString().split('T')[0],
      isActive: true,
      version: 1
    }).returning();

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Recurring Rules POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

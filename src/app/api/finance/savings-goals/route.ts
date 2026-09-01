import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeSavingsGoals } from '@/lib/db/schema';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  try {
    const { name, ultimateTargetAmount, incomeTypeId, targetPercentage } = await req.json();

    if (!name || !ultimateTargetAmount) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [goal] = await db.insert(financeSavingsGoals).values({
      userId,
      name,
      ultimateTargetAmount: parseFloat(ultimateTargetAmount),
      incomeTypeId: incomeTypeId || null,
      targetPercentage: targetPercentage ? parseFloat(targetPercentage) : null,
    }).returning();

    return NextResponse.json({ goal });
  } catch (error) {
    console.error('Savings Goal POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

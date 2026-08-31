import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getMonthlySummary, getAccumulatedBalances } from '@/lib/finance/service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().toISOString().substring(0, 7);

    const summary = await getMonthlySummary(userId, month);
    const balances = await getAccumulatedBalances(userId);

    return NextResponse.json({ summary, balances });
  } catch (error) {
    console.error('Summary GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getAccountBalances } from '@/lib/finance/service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const accounts = await getAccountBalances(session.user.id);
    return NextResponse.json({ accounts });
  } catch (err) {
    console.error('Error fetching account balances:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

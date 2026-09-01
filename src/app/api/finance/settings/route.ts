import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const body = await req.json();
    const { expectedMonthlyIncome } = body;

    if (expectedMonthlyIncome !== undefined) {
      await db.update(users).set({
        expectedMonthlyIncome,
        updatedAt: new Date(),
      }).where(eq(users.id, userId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

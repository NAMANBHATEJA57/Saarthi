import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeCategories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { ensureDefaultCategories } from '@/lib/finance/service';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    await ensureDefaultCategories(userId);

    const categories = await db
      .select()
      .from(financeCategories)
      .where(and(eq(financeCategories.userId, userId), eq(financeCategories.isActive, true)))
      .orderBy(financeCategories.sortOrder);

    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Categories GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

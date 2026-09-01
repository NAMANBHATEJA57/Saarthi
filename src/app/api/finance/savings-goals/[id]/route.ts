import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeSavingsGoals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id;

  try {
    const { id } = await params;

    const existing = await db.select().from(financeSavingsGoals).where(and(eq(financeSavingsGoals.id, id), eq(financeSavingsGoals.userId, userId)));
    if (existing.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await db.delete(financeSavingsGoals).where(eq(financeSavingsGoals.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Savings Goal DELETE Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

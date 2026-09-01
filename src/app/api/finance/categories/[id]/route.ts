import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeCategories } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await db.update(financeCategories)
      .set({ isActive: false })
      .where(and(eq(financeCategories.id, id), eq(financeCategories.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Categories DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

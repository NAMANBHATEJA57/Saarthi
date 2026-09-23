import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeIncomeTypes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { id } = await params;
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    await db.update(financeIncomeTypes)
      .set({ isActive: false })
      .where(and(eq(financeIncomeTypes.id, id), eq(financeIncomeTypes.userId, session.user.id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('IncomeTypes DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

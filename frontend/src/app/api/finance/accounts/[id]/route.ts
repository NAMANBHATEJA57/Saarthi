import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { id } = await context.params;
    const body = await req.json();
    const { name, creditLimitMinor, statementDay, dueDay, lastFour, notes, isActive } = body;
    
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (creditLimitMinor !== undefined) updateData.creditLimitMinor = creditLimitMinor;
    if (statementDay !== undefined) updateData.statementDay = statementDay;
    if (dueDay !== undefined) updateData.dueDay = dueDay;
    if (lastFour !== undefined) updateData.lastFour = lastFour;
    if (notes !== undefined) updateData.notes = notes;
    if (isActive !== undefined) updateData.isActive = isActive;
    
    updateData.updatedAt = new Date();

    const [acc] = await db.update(financeAccounts)
      .set(updateData)
      .where(and(eq(financeAccounts.id, id), eq(financeAccounts.userId, session.user.id)))
      .returning();
      
    if (!acc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ account: acc });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { id } = await context.params;
    // Soft delete
    const [acc] = await db.update(financeAccounts)
      .set({ deletedAt: new Date() })
      .where(and(eq(financeAccounts.id, id), eq(financeAccounts.userId, session.user.id)))
      .returning();
      
    if (!acc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

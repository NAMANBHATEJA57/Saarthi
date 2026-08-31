import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { weightEntries } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json();
    const { weight, note, unit } = body;

    // Verify ownership
    const existing = await db.select().from(weightEntries).where(and(eq(weightEntries.id, id), eq(weightEntries.userId, session.user.id), isNull(weightEntries.deletedAt)));
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updates: any = { updatedAt: new Date() };
    
    if (weight !== undefined) {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
        return NextResponse.json({ error: 'Invalid weight value' }, { status: 400 });
      }
      updates.weight = weightNum.toString();
    }
    
    if (unit !== undefined) {
      updates.unit = unit;
    }
    
    if (note !== undefined) {
      if (note && note.length > 500) return NextResponse.json({ error: 'Note too long' }, { status: 400 });
      updates.note = note || null;
    }

    const [updated] = await db.update(weightEntries).set(updates).where(eq(weightEntries.id, id)).returning();
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Weight PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;

    // Verify ownership
    const existing = await db.select().from(weightEntries).where(and(eq(weightEntries.id, id), eq(weightEntries.userId, session.user.id), isNull(weightEntries.deletedAt)));
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Soft delete
    await db.update(weightEntries).set({ deletedAt: new Date(), updatedAt: new Date() }).where(eq(weightEntries.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Weight DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

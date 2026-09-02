import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { mealItems, mealItemNutrients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const resolvedParams = await params;
  const id = resolvedParams.id;
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  try {
    // Delete nutrients first because of FK (if not cascading)
    await db.delete(mealItemNutrients).where(eq(mealItemNutrients.mealItemId, id));
    await db.delete(mealItems).where(eq(mealItems.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete food item error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { foodSourceRecords, foodNutrients, foodPortions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;

    const records = await db.select().from(foodSourceRecords).where(eq(foodSourceRecords.id, id)).limit(1);
    if (records.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const nutrients = await db.select().from(foodNutrients).where(eq(foodNutrients.recordId, id));
    const portions = await db.select().from(foodPortions).where(eq(foodPortions.recordId, id));

    return NextResponse.json({
      record: records[0],
      nutrients,
      portions
    });
  } catch (error: any) {
    console.error('Food record fetch error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

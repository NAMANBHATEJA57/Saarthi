import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { weightEntries } from '@/lib/db/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limitStr = searchParams.get('limit') || '50';
  const limit = parseInt(limitStr, 10) || 50;
  // Simplified cursor implementation for MVP - relying just on offset for now or simple limit
  const cursor = searchParams.get('cursor');

  try {
    const query = db.select().from(weightEntries)
      .where(and(eq(weightEntries.userId, session.user.id), isNull(weightEntries.deletedAt)));
      
    if (cursor) {
      // In a real cursor setup we'd compare recordedAt/id.
      // For MVP, we'll keep it simple and assume cursor is an offset or id string.
      // Skipping true cursor for brevity unless strictly needed, but returning data sorted properly.
    }

    const items = await query
      .orderBy(desc(weightEntries.recordedAt), desc(weightEntries.id))
      .limit(limit);

    return NextResponse.json({ items, nextCursor: null });
  } catch (error) {
    console.error('Weight GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { weight, note } = body;
    let { unit } = body;

    // Validation
    const weightNum = parseFloat(weight);
    if (isNaN(weightNum) || weightNum <= 0 || weightNum > 500) {
      return NextResponse.json({ error: 'Invalid weight value' }, { status: 400 });
    }
    
    unit = unit || 'kg';
    if (note && note.length > 500) {
      return NextResponse.json({ error: 'Note too long' }, { status: 400 });
    }

    const [newEntry] = await db.insert(weightEntries).values({
      userId: session.user.id,
      weight: weightNum.toString(), // numeric maps to string/number depending on driver, best pass as string
      unit,
      note: note || null,
      recordedAt: new Date(), // Stamped automatically by server
    }).returning();

    return NextResponse.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Weight POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

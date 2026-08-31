import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { workoutDisplayStates } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  const { searchParams } = new URL(req.url);
  const localDate = searchParams.get('localDate');

  if (!localDate) {
    return NextResponse.json({ error: 'localDate is required' }, { status: 400 });
  }

  try {
    const [displayState] = await db
      .select()
      .from(workoutDisplayStates)
      .where(and(
        eq(workoutDisplayStates.userId, userId),
        eq(workoutDisplayStates.localDate, localDate)
      ));

    return NextResponse.json({ displayState: displayState || null });
  } catch (error) {
    console.error('Display State GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const body = await req.json();
    const { routineId, localDate, checkedExerciseIds } = body;

    if (!routineId || !localDate || !Array.isArray(checkedExerciseIds)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // Upsert
      // Delete if exists
      await tx.delete(workoutDisplayStates).where(and(
        eq(workoutDisplayStates.userId, userId),
        eq(workoutDisplayStates.localDate, localDate)
      ));

      const [newState] = await tx.insert(workoutDisplayStates).values({
        userId,
        routineId,
        localDate,
        checkedExerciseIds,
      }).returning();

      return newState;
    });

    return NextResponse.json({ displayState: result });
  } catch (error) {
    console.error('Display State POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

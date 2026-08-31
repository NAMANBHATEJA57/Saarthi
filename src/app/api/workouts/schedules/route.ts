import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { workoutSchedules, workoutRoutines } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const schedules = await db
      .select({
        id: workoutSchedules.id,
        userId: workoutSchedules.userId,
        routineId: workoutSchedules.routineId,
        weekday: workoutSchedules.weekday,
        createdAt: workoutSchedules.createdAt,
        updatedAt: workoutSchedules.updatedAt,
      })
      .from(workoutSchedules)
      // Join to ensure the routine isn't deleted
      .innerJoin(workoutRoutines, eq(workoutSchedules.routineId, workoutRoutines.id))
      .where(and(eq(workoutSchedules.userId, userId), isNull(workoutRoutines.deletedAt)));

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Schedules GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const body = await req.json();
    const { routineId, weekday } = body; // If routineId is null, we clear the day

    if (weekday < 0 || weekday > 6) {
      return NextResponse.json({ error: 'Invalid weekday' }, { status: 400 });
    }

    if (!routineId) {
      // Clear schedule for this day
      await db.delete(workoutSchedules).where(and(eq(workoutSchedules.userId, userId), eq(workoutSchedules.weekday, weekday)));
      return NextResponse.json({ success: true });
    }

    // Verify routine belongs to user and is not deleted
    const existingRoutines = await db
      .select()
      .from(workoutRoutines)
      .where(and(eq(workoutRoutines.id, routineId), eq(workoutRoutines.userId, userId), isNull(workoutRoutines.deletedAt)));

    if (existingRoutines.length === 0) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    // Upsert schedule for this day (enforcing 1-routine-per-day rule)
    const result = await db.transaction(async (tx) => {
      // Remove any existing for this weekday
      await tx.delete(workoutSchedules).where(and(eq(workoutSchedules.userId, userId), eq(workoutSchedules.weekday, weekday)));
      
      const [newSchedule] = await tx.insert(workoutSchedules).values({
        userId,
        routineId,
        weekday,
      }).returning();
      
      return newSchedule;
    });

    return NextResponse.json({ schedule: result });
  } catch (error) {
    console.error('Schedules POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

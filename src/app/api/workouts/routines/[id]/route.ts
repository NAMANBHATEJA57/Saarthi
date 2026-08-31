import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { workoutRoutines, workoutExercises, workoutSchedules } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, remark, exercises } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Valid routine name is required' }, { status: 400 });
    }

    // Verify ownership
    const existingRoutines = await db
      .select()
      .from(workoutRoutines)
      .where(and(eq(workoutRoutines.id, id), eq(workoutRoutines.userId, userId), isNull(workoutRoutines.deletedAt)));
      
    if (existingRoutines.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Update Routine
      const [updatedRoutine] = await tx
        .update(workoutRoutines)
        .set({
          name: name.trim(),
          remark: remark?.trim() || null,
          updatedAt: new Date(),
        })
        .where(eq(workoutRoutines.id, id))
        .returning();

      // 2. Sync Exercises
      // For MVP, simplest approach to handle reorder, add, remove: delete all and recreate.
      await tx.delete(workoutExercises).where(eq(workoutExercises.routineId, id));

      const createdExercises = [];
      if (Array.isArray(exercises) && exercises.length > 0) {
        for (let i = 0; i < exercises.length; i++) {
          const exName = exercises[i]?.name?.trim();
          if (!exName) continue;
          
          const [newEx] = await tx.insert(workoutExercises).values({
            routineId: id,
            name: exName,
            position: i,
          }).returning();
          createdExercises.push(newEx);
        }
      }

      return {
        ...updatedRoutine,
        exercises: createdExercises,
      };
    });

    return NextResponse.json({ routine: result });
  } catch (error) {
    console.error('Routine PATCH error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const { id } = await params;
    
    // Verify ownership
    const existingRoutines = await db
      .select()
      .from(workoutRoutines)
      .where(and(eq(workoutRoutines.id, id), eq(workoutRoutines.userId, userId), isNull(workoutRoutines.deletedAt)));
      
    if (existingRoutines.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.transaction(async (tx) => {
      // 1. Soft delete the routine
      await tx
        .update(workoutRoutines)
        .set({ deletedAt: new Date() })
        .where(eq(workoutRoutines.id, id));
        
      // 2. Also delete any active schedules pointing to this routine
      await tx.delete(workoutSchedules).where(eq(workoutSchedules.routineId, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Routine DELETE error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

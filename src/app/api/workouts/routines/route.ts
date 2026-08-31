import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { workoutRoutines, workoutExercises, workoutExerciseLibrary } from '@/lib/db/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    // 1. Fetch routines
    const routines = await db
      .select()
      .from(workoutRoutines)
      .where(and(eq(workoutRoutines.userId, userId), isNull(workoutRoutines.deletedAt)))
      .orderBy(desc(workoutRoutines.createdAt));

    // 2. Fetch exercises for these routines
    const routineIds = routines.map((r) => r.id);
    let allExercises: any[] = [];
    
    if (routineIds.length > 0) {
      // In a real app we'd use `inArray` or relation queries, but let's do a simple loop 
      // or just fetch all for user if we joined, but doing it safely with loops for MVP since count is small.
      // Drizzle has `inArray` but let's just do it directly.
      for (const rId of routineIds) {
        const ex = await db
          .select()
          .from(workoutExercises)
          .where(eq(workoutExercises.routineId, rId))
          .orderBy(workoutExercises.position);
        allExercises = allExercises.concat(ex);
      }
    }

    // 3. Assemble response
    const data = routines.map(routine => ({
      ...routine,
      exercises: allExercises.filter(e => e.routineId === routine.id),
    }));

    return NextResponse.json({ routines: data });
  } catch (error) {
    console.error('Routines GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = session.user.id as string;

  try {
    const body = await req.json();
    const { name, remark, exercises } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Valid routine name is required' }, { status: 400 });
    }

    const result = await db.transaction(async (tx) => {
      // 1. Create Routine
      const [newRoutine] = await tx.insert(workoutRoutines).values({
        userId,
        name: name.trim(),
        remark: remark?.trim() || null,
      }).returning();

      // 2. Create Exercises
      const createdExercises = [];
      if (Array.isArray(exercises) && exercises.length > 0) {
        for (let i = 0; i < exercises.length; i++) {
          const exName = exercises[i]?.name?.trim();
          if (!exName) continue;
          
          // Check if it exists in library
          const existingLib = await tx.select().from(workoutExerciseLibrary).where(
            and(
              eq(sql`LOWER(${workoutExerciseLibrary.name})`, exName.toLowerCase()),
              sql`(${workoutExerciseLibrary.userId} IS NULL OR ${workoutExerciseLibrary.userId} = ${userId})`
            )
          ).limit(1);

          let libraryId = existingLib.length > 0 ? existingLib[0].id : null;

          // Auto-create custom exercise if not found
          if (!libraryId) {
            const [newLibEx] = await tx.insert(workoutExerciseLibrary).values({
              userId,
              name: exName,
              type: 'strength', // default
              source: 'custom',
            }).returning();
            libraryId = newLibEx.id;
          }

          const [newEx] = await tx.insert(workoutExercises).values({
            routineId: newRoutine.id,
            name: exName,
            position: i,
            libraryId,
          }).returning();
          createdExercises.push(newEx);
        }
      }

      return {
        ...newRoutine,
        exercises: createdExercises,
      };
    });

    return NextResponse.json({ routine: result });
  } catch (error) {
    console.error('Routines POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

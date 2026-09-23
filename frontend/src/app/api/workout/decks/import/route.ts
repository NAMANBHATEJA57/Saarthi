import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { workoutRoutines, workoutExercises, workoutExerciseLibrary } from '@/lib/db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { getAuthSession } from '@/lib/auth';
import { WORKOUT_DECKS } from '@/lib/workout/decks';

export async function POST(request: Request) {
  try {
    const session = await getAuthSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deckId } = await request.json();

    const deck = WORKOUT_DECKS.find((d) => d.id === deckId);
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    // Collect all exercise names across all routines in the deck
    const exerciseNames = new Set<string>();
    for (const routine of deck.routines) {
      for (const ex of routine.exercises) {
        exerciseNames.add(ex.name);
      }
    }

    // Lookup library IDs for these exercises
    const libraryExercises = await db
      .select({ id: workoutExerciseLibrary.id, name: workoutExerciseLibrary.name })
      .from(workoutExerciseLibrary)
      .where(inArray(workoutExerciseLibrary.name, Array.from(exerciseNames)));

    const libraryMap = new Map<string, string>();
    for (const le of libraryExercises) {
      libraryMap.set(le.name, le.id);
    }

    // We'll insert routines and their exercises
    // Run in a transaction to ensure all or nothing
    await db.transaction(async (tx) => {
      for (const routineData of deck.routines) {
        // Check if routine already exists to prevent duplicates
        const existingRoutines = await tx
          .select()
          .from(workoutRoutines)
          .where(
            and(
              eq(workoutRoutines.userId, session.user?.id as string),
              eq(workoutRoutines.name, routineData.name)
            )
          );

        // We use hard match on name. If it exists (even soft-deleted), we skip, 
        // but let's only skip if it's actively not soft-deleted.
        const activeExisting = existingRoutines.filter(r => r.deletedAt === null);

        if (activeExisting.length > 0) {
          continue; // Skip this routine since it already exists
        }

        // Create Routine
        const [insertedRoutine] = await tx
          .insert(workoutRoutines)
          .values({
            userId: session.user?.id as string,
            name: routineData.name,
            remark: routineData.description || null,
          })
          .returning({ id: workoutRoutines.id });

        const routineId = insertedRoutine.id;

        // Prepare Exercises
        const exercisesToInsert = routineData.exercises.map((ex, index) => {
          const libraryId = libraryMap.get(ex.name);
          if (!libraryId) {
            console.warn(`Could not find library exercise for: ${ex.name}`);
          }
          
          return {
            routineId,
            libraryId: libraryId || null, 
            name: ex.name,
            position: index,
          };
        });

        if (exercisesToInsert.length > 0) {
          await tx.insert(workoutExercises).values(exercisesToInsert);
        }
      }
    });

    return NextResponse.json({ success: true, message: `Imported deck ${deck.name}` });
  } catch (error) {
    console.error('Failed to import deck:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

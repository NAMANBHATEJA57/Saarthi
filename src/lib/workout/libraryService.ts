import { db } from '@/lib/db';
import { workoutExerciseLibrary } from '@/lib/db/schema';
import { ilike, or, and, isNull, eq } from 'drizzle-orm';

export class WorkoutLibraryService {
  /**
   * Search for exercises in the library.
   * Matches against name or muscle group.
   * Returns system exercises + the user's custom exercises.
   */
  static async search(query: string, userId: string, limit = 50) {
    const term = `%${query}%`;
    
    return db.query.workoutExerciseLibrary.findMany({
      where: and(
        // Must be a system exercise OR belong to the user
        or(
          isNull(workoutExerciseLibrary.userId),
          eq(workoutExerciseLibrary.userId, userId)
        ),
        // Must match the search query
        or(
          ilike(workoutExerciseLibrary.name, term),
          ilike(workoutExerciseLibrary.muscle, term)
        )
      ),
      limit,
    });
  }

  /**
   * Add a custom exercise to the user's personal library
   */
  static async addCustomExercise(userId: string, data: { name: string; type?: string; muscle?: string; equipment?: string; instructions?: string }) {
    const [exercise] = await db.insert(workoutExerciseLibrary).values({
      userId,
      name: data.name,
      type: data.type || 'strength',
      muscle: data.muscle,
      equipment: data.equipment,
      instructions: data.instructions,
      source: 'custom'
    }).returning();
    
    return exercise;
  }
}

import { db } from '@/lib/db';
import { workoutExerciseLibrary } from '@/lib/db/schema';
import { ilike, or, and, eq } from 'drizzle-orm';
import { searchOnlineExercises } from './onlineDataset';

export class WorkoutLibraryService {
  /**
   * Search for exercises in the library.
   * Matches against name or muscle group from the online dataset + user custom exercises.
   */
  static async search(query: string, userId: string, limit = 50) {
    const online = await searchOnlineExercises({ query, limit });
    
    // Also fetch user's custom exercises
    const term = `%${query}%`;
    const userCustom = await db.query.workoutExerciseLibrary.findMany({
      where: and(
        eq(workoutExerciseLibrary.userId, userId),
        or(
          ilike(workoutExerciseLibrary.name, term),
          ilike(workoutExerciseLibrary.muscle, term)
        )
      ),
      limit: 20,
    });
    
    return [...userCustom, ...online];
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

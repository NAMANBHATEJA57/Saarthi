import { db } from '@/lib/db';
import { workoutSessions, workoutSets, workoutExerciseLibrary, weightEntries } from '@/lib/db/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';

export interface LogSetPayload {
  sessionId: string;
  exerciseLibraryId: string;
  routineExerciseId?: string;
  setNumber: number;
  weight?: number;
  reps?: number;
  durationSeconds?: number;
}

export const WorkoutService = {
  async getExerciseLibrary(userId: string) {
    // Return system exercises (userId is null) + user custom exercises
    return await db.select().from(workoutExerciseLibrary).where(
      sql`${workoutExerciseLibrary.userId} IS NULL OR ${workoutExerciseLibrary.userId} = ${userId}`
    );
  },

  async startSession(userId: string, localDate: string, routineId?: string) {
    const [session] = await db.insert(workoutSessions).values({
      userId,
      localDate,
      routineId: routineId || null,
      status: 'in_progress',
    }).returning();
    return session;
  },

  async finishSession(sessionId: string) {
    const [session] = await db.update(workoutSessions)
      .set({ status: 'completed', endTime: new Date() })
      .where(eq(workoutSessions.id, sessionId))
      .returning();
    return session;
  },

  async logSet(payload: LogSetPayload) {
    const [set] = await db.insert(workoutSets).values({
      sessionId: payload.sessionId,
      exerciseLibraryId: payload.exerciseLibraryId,
      routineExerciseId: payload.routineExerciseId || null,
      setNumber: payload.setNumber,
      weight: payload.weight ? payload.weight.toString() : null,
      reps: payload.reps,
      durationSeconds: payload.durationSeconds,
      completedAt: new Date(),
    }).returning();
    return set;
  },

  async getPreviousPerformance(userId: string, exerciseLibraryId: string, limit: number = 3) {
    // Find the last N completed sessions for this user that contained this exercise
    // For MVP, we can just fetch the most recent sets for this exercise directly, 
    // grouped by session or just ordered by completion date.
    
    // We want the last N sessions. We'll find distinct session IDs first.
    const recentSessionsQuery = await db.execute(sql`
      SELECT DISTINCT s.id, s.start_time
      FROM ${workoutSessions} s
      JOIN ${workoutSets} ws ON s.id = ws.session_id
      WHERE s.user_id = ${userId} 
        AND ws.exercise_library_id = ${exerciseLibraryId}
        AND s.status = 'completed'
      ORDER BY s.start_time DESC
      LIMIT ${limit}
    `);

    const sessionIds = recentSessionsQuery.rows.map((r: any) => r.id);
    if (sessionIds.length === 0) return [];

    const setsQuery = await db.execute(sql`
      SELECT ws.*, s.start_time
      FROM ${workoutSets} ws
      JOIN ${workoutSessions} s ON ws.session_id = s.id
      WHERE ws.session_id IN (${sql.join(sessionIds, sql`, `)})
        AND ws.exercise_library_id = ${exerciseLibraryId}
      ORDER BY s.start_time DESC, ws.set_number ASC
    `);

    // Group by session
    const history: Record<string, { date: Date, sets: any[] }> = {};
    for (const row of setsQuery.rows as any[]) {
      if (!history[row.session_id]) {
        history[row.session_id] = { date: new Date(row.start_time), sets: [] };
      }
      history[row.session_id].sets.push(row);
    }

    return Object.values(history).sort((a, b) => b.date.getTime() - a.date.getTime());
  },

  async getLatestBodyweight(userId: string) {
    const entry = await db.select().from(weightEntries)
      .where(and(eq(weightEntries.userId, userId), isNull(weightEntries.deletedAt)))
      .orderBy(desc(weightEntries.recordedAt))
      .limit(1);
    
    return entry.length > 0 ? entry[0] : null;
  }
};

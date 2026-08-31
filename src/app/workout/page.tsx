import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { workoutRoutines, workoutSchedules, workoutExercises, workoutSessions, workoutSets } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { WorkoutClient } from "./WorkoutClient";

export const metadata = {
  title: "Workout",
};

export default async function WorkoutPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const userId = session.user.id as string;

  // 1. Fetch routines
  const rawRoutines = await db
    .select()
    .from(workoutRoutines)
    .where(and(eq(workoutRoutines.userId, userId), isNull(workoutRoutines.deletedAt)))
    .orderBy(workoutRoutines.createdAt);

  // 2. Fetch exercises for routines
  const routineIds = rawRoutines.map((r) => r.id);
  let allExercises: any[] = [];
  
  if (routineIds.length > 0) {
    for (const rId of routineIds) {
      const ex = await db
        .select()
        .from(workoutExercises)
        .where(eq(workoutExercises.routineId, rId))
        .orderBy(workoutExercises.position);
      allExercises = allExercises.concat(ex);
    }
  }

  const routines = rawRoutines.map(r => ({
    ...r,
    exercises: allExercises.filter(e => e.routineId === r.id),
  }));

  // 3. Fetch schedules
  const rawSchedules = await db
    .select()
    .from(workoutSchedules)
    .innerJoin(workoutRoutines, eq(workoutSchedules.routineId, workoutRoutines.id))
    .where(and(eq(workoutSchedules.userId, userId), isNull(workoutRoutines.deletedAt)));
    
  const schedules = rawSchedules.map(s => ({
    ...s.workout_schedules,
  }));

  // 4. Fetch recent sessions
  const recentSessionsQuery = await db.select().from(workoutSessions)
    .where(and(eq(workoutSessions.userId, userId), eq(workoutSessions.status, 'completed')))
    .orderBy(desc(workoutSessions.localDate))
    .limit(5);
  
  let recentSessions: any[] = [];
  if (recentSessionsQuery.length > 0) {
    const sessionIds = recentSessionsQuery.map(s => s.id);
    const sessionSets: any[] = [];
    for (const sId of sessionIds) {
      const sets = await db.select().from(workoutSets).where(eq(workoutSets.sessionId, sId));
      sessionSets.push(...sets);
    }
    recentSessions = recentSessionsQuery.map(s => {
      const sets = sessionSets.filter(set => set.sessionId === s.id);
      return {
        ...s,
        routine: routines.find(r => r.id === s.routineId),
        setsCount: sets.length,
        volume: sets.reduce((acc, set) => acc + (parseFloat(set.weight || '0') * (set.reps || 0)), 0)
      };
    });
  }

  return (
    <div className="flex flex-col min-h-[100dvh] pb-24">
      <div className="flex-1 px-4 py-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-[hsl(var(--ink))]">
          Workout
        </h1>
        
        <WorkoutClient 
          initialRoutines={routines} 
          initialSchedules={schedules} 
          recentSessions={recentSessions}
        />
      </div>
    </div>
  );
}

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { workoutSessions, workoutExerciseLibrary, workoutSets, workoutExercises, workoutRoutines } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { WorkoutSessionClient } from "../../../../components/workout/WorkoutSessionClient";
import { WorkoutService } from "@/lib/workouts/service";

export default async function WorkoutSessionPage(
  props: { params: Promise<{ sessionId: string }> }
) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const userId = session.user.id as string;
  const sessionId = params.sessionId;

  const wSessions = await db.select().from(workoutSessions).where(
    and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId))
  );

  if (wSessions.length === 0) {
    redirect("/workout");
  }

  const wSession = wSessions[0];

  let routine = null;
  let rExercises: any[] = [];

  if (wSession.routineId) {
    const routines = await db.select().from(workoutRoutines).where(eq(workoutRoutines.id, wSession.routineId));
    if (routines.length > 0) {
      routine = routines[0];
      rExercises = await db.select().from(workoutExercises)
        .where(eq(workoutExercises.routineId, routine.id))
        .orderBy(workoutExercises.position);
    }
  }

  const library = await WorkoutService.getExerciseLibrary(userId);
  const bwEntry = await WorkoutService.getLatestBodyweight(userId);
  
  // Fetch existing sets for this session
  const existingSets = await db.select().from(workoutSets).where(eq(workoutSets.sessionId, sessionId)).orderBy(workoutSets.setNumber);

  return (
    <div className="flex flex-col min-h-[100dvh] pb-24 bg-[hsl(var(--background))]">
      <div className="px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-[hsl(var(--ink))]">
          {routine ? routine.name : "Active Workout"}
        </h1>
        <p className="mb-6 text-sm text-[hsl(var(--ink-secondary))]">
          {new Date(wSession.localDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
        </p>

        <WorkoutSessionClient 
          workoutSession={wSession}
          routine={routine}
          routineExercises={rExercises}
          library={library}
          existingSets={existingSets}
          latestBodyweight={bwEntry?.weight || null}
        />
      </div>
    </div>
  );
}

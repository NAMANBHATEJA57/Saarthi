"use server";

import { auth } from "@/auth";
import { WorkoutService } from "@/lib/workouts/service";

export async function getPreviousPerformanceAction(exerciseLibraryId: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  
  return await WorkoutService.getPreviousPerformance(session.user.id, exerciseLibraryId, 3);
}

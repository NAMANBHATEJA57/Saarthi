import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { 
  userPreferences, tasks, notes, weightEntries, 
  userFoods, meals, financeTransactions, 
  workoutSessions, workoutRoutines 
} from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = session.user.id;

  try {
    const [
      prefs,
      userTasks,
      userNotes,
      userWeight,
      userFoodItems,
      userFoodLogs,
      userFinance,
      userWorkoutSessions,
      userWorkoutRoutines
    ] = await Promise.all([
      db.select().from(userPreferences).where(eq(userPreferences.userId, userId)),
      db.select().from(tasks).where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt))),
      db.select().from(notes).where(and(eq(notes.userId, userId), isNull(notes.deletedAt))),
      db.select().from(weightEntries).where(and(eq(weightEntries.userId, userId), isNull(weightEntries.deletedAt))),
      db.select().from(userFoods).where(eq(userFoods.userId, userId)),
      db.select().from(meals).where(and(eq(meals.userId, userId), isNull(meals.deletedAt))),
      db.select().from(financeTransactions).where(eq(financeTransactions.userId, userId)),
      db.select().from(workoutSessions).where(eq(workoutSessions.userId, userId)),
      db.select().from(workoutRoutines).where(and(eq(workoutRoutines.userId, userId), isNull(workoutRoutines.deletedAt))),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: {
        preferences: prefs[0] || null,
      },
      data: {
        tasks: userTasks,
        notes: userNotes,
        weight: userWeight,
        userFoods: userFoodItems,
        meals: userFoodLogs,
        finance: userFinance,
        workouts: {
          routines: userWorkoutRoutines,
          sessions: userWorkoutSessions,
        }
      }
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="personal-os-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });

  } catch (error) {
    console.error("Export error", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

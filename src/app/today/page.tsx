import { auth } from "@/auth";
import { Search, Apple, Scale } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { userPreferences, weightEntries, workoutSchedules, workoutRoutines, workoutExercises, workoutDisplayStates, notes } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { WorkoutTodayWidget } from "@/components/workout/WorkoutTodayWidget";
import { IndianRupee, CheckSquare, StickyNote } from "lucide-react";
import { getMonthlySummary } from "@/lib/finance/service";
import { getTodayTasksSummary } from "@/lib/tasks/service";
import { CalendarTodayWidget } from "@/components/calendar/CalendarTodayWidget";
import { RelationshipService } from "@/lib/relationships/service";
import { EmptyState } from "@/components/shared/EmptyState";

export default async function TodayPage() {
  const session = await auth();
  const userName = session?.user?.name || "there";
  const userId = session?.user?.id;

  let hasPreferences = false;
  let latestWeight = null;
  if (userId) {
    const prefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    hasPreferences = prefs.length > 0;
    
    const weights = await db.select().from(weightEntries)
      .where(and(eq(weightEntries.userId, userId), isNull(weightEntries.deletedAt)))
      .orderBy(desc(weightEntries.recordedAt))
      .limit(1);
    latestWeight = weights.length > 0 ? weights[0] : null;
  }

  // Format date natively
  const dateObj = new Date();
  const todayDateString = dateObj.toLocaleDateString('en-CA'); // YYYY-MM-DD
  const currentWeekday = dateObj.getDay(); // 0-6

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(dateObj);

  let todayRoutine = null;
  let todayDisplayState = null;
  let financeSummary = null;
  let todayTasks: any[] = [];
  let recentNotes: any[] = [];

  if (userId) {
    const currentMonthStr = todayDateString.substring(0, 7);
    financeSummary = await getMonthlySummary(userId, currentMonthStr);
    
    // Fetch tasks and their relationships
    const rawTasks = await getTodayTasksSummary(userId, todayDateString);
    todayTasks = await Promise.all(rawTasks.map(async (task) => {
      const related = await RelationshipService.getRelatedObjects(userId, 'task', task.id);
      return { ...task, related };
    }));
    recentNotes = await db.select().from(notes)
      .where(and(eq(notes.userId, userId), isNull(notes.deletedAt)))
      .orderBy(desc(notes.updatedAt))
      .limit(3);
    // Check for today's scheduled routine
    const schedules = await db
      .select()
      .from(workoutSchedules)
      .where(and(eq(workoutSchedules.userId, userId), eq(workoutSchedules.weekday, currentWeekday)))
      .limit(1);

    if (schedules.length > 0) {
      const routineId = schedules[0].routineId;
      
      const routines = await db
        .select()
        .from(workoutRoutines)
        .where(and(eq(workoutRoutines.id, routineId), isNull(workoutRoutines.deletedAt)))
        .limit(1);

      if (routines.length > 0) {
        const exercises = await db
          .select()
          .from(workoutExercises)
          .where(eq(workoutExercises.routineId, routineId))
          .orderBy(workoutExercises.position);
          
        const related = await RelationshipService.getRelatedObjects(userId, 'workout', routineId);

        todayRoutine = {
          ...routines[0],
          exercises,
          related,
        };

        const states = await db
          .select()
          .from(workoutDisplayStates)
          .where(and(
            eq(workoutDisplayStates.userId, userId),
            eq(workoutDisplayStates.localDate, todayDateString)
          ))
          .limit(1);

        if (states.length > 0) {
          todayDisplayState = {
            ...states[0],
            checkedExerciseIds: states[0].checkedExerciseIds as string[]
          };
        }
      }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <header className="space-y-1">
        <p className="text-sm font-medium text-[hsl(var(--ink-secondary))] uppercase tracking-wider">{today}</p>
        <h1 className="text-2xl font-bold tracking-tight">Good morning, {userName}</h1>
      </header>

      {/* OS Status Card */}
      <section className="bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-lg p-5">
        <h2 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider mb-4">SYSTEM STATUS</h2>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${hasPreferences ? 'bg-green-500' : 'bg-yellow-500'}`} />
            <span className="text-sm font-medium">Preferences {hasPreferences ? 'configured' : 'incomplete'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-sm font-medium">Food module: Pending</span>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider mb-4">QUICK ACTIONS</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button className="flex items-center gap-3 p-4 rounded-lg bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] text-left group">
            <div className="p-2 rounded-md bg-[hsl(var(--surface))] group-hover:bg-[hsl(var(--canvas))] transition-colors">
              <Search className="w-5 h-5 text-[hsl(var(--ink-secondary))]" />
            </div>
            <div>
              <div className="text-sm font-semibold">Open Command Menu</div>
              <div className="text-xs text-[hsl(var(--ink-muted))]">Search your entire OS</div>
            </div>
          </button>
          <Link href="/weight" className="flex items-center gap-3 p-4 rounded-lg bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] text-left group transition-colors hover:bg-[hsl(var(--surface))]">
            <div className="p-2 rounded-md bg-[hsl(var(--surface))] group-hover:bg-[hsl(var(--canvas))] transition-colors">
              <Scale className="w-5 h-5 text-[hsl(var(--ink-secondary))]" />
            </div>
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                Weight
                {latestWeight && <span className="text-[10px] font-semibold text-[hsl(var(--ink-secondary))] bg-[hsl(var(--surface))] px-1.5 py-0.5 rounded-full">{latestWeight.weight} {latestWeight.unit}</span>}
              </div>
              <div className="text-xs text-[hsl(var(--ink-muted))]">
                {latestWeight ? `Recorded ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(latestWeight.recordedAt)}` : 'No entries yet'}
              </div>
            </div>
          </Link>
          <Link href="/finance" className="flex items-center gap-3 p-4 rounded-lg bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] text-left group transition-colors hover:bg-[hsl(var(--surface))]">
            <div className="p-2 rounded-md bg-[hsl(var(--surface))] group-hover:bg-[hsl(var(--canvas))] transition-colors">
              <IndianRupee className="w-5 h-5 text-[hsl(var(--ink-secondary))]" />
            </div>
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                Finance
              </div>
              <div className="text-xs text-[hsl(var(--ink-muted))]">
                {financeSummary && (financeSummary.leftover < 0 ? 'Over budget' : 'On track')}
              </div>
            </div>
          </Link>
          
          <Link href="/food" className="flex items-center gap-3 p-4 rounded-lg bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] text-left opacity-70 hover:opacity-100 transition-opacity">
            <div className="p-2 rounded-md bg-[hsl(var(--canvas))]">
              <Apple className="w-5 h-5 text-[hsl(var(--ink-secondary))]" />
            </div>
            <div>
              <div className="text-sm font-semibold flex items-center gap-2">
                Log Food
                <span className="text-[10px] font-semibold text-[hsl(var(--ink-muted))] px-1.5 py-0.5 rounded-full bg-[hsl(var(--surface-elevated))]">Coming next</span>
              </div>
              <div className="text-xs text-[hsl(var(--ink-muted))]">Phase 2 feature</div>
            </div>
          </Link>
        </div>
      </section>

      {/* Calendar Today */}
      {userId && (
        <CalendarTodayWidget userId={userId} localDateStr={todayDateString} />
      )}

      {/* Workout Today */}
      {todayRoutine && (
        <section>
          <WorkoutTodayWidget 
            routine={todayRoutine} 
            localDate={todayDateString} 
            initialDisplayState={todayDisplayState} 
          />
        </section>
      )}

      {/* Tasks Today */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider">TASKS DUE TODAY</h2>
          <Link href="/tasks" className="text-xs font-medium text-[hsl(var(--primary))] hover:underline">View all</Link>
        </div>
        {todayTasks.length > 0 ? (
          <div className="space-y-2">
            {todayTasks.map(task => (
              <div key={task.id} className="flex items-start gap-3 p-3 bg-[hsl(var(--surface-elevated))] rounded-lg border border-[hsl(var(--hairline))]">
                <div className="mt-1 flex-shrink-0 w-5 h-5 rounded border border-[hsl(var(--ink-muted))]"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{task.title}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-[hsl(var(--ink-muted))]">
                    {task.priority !== 'normal' && (
                      <span className={`${task.priority === 'high' ? 'text-red-500' : 'text-blue-500'}`}>{task.priority.toUpperCase()}</span>
                    )}
                    {task.dueDate && task.dueDate < todayDateString && <span className="text-red-500 font-semibold">OVERDUE</span>}
                  </div>
                  {task.related && task.related.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[hsl(var(--hairline))] flex flex-wrap gap-2">
                      {task.related.map((rel: any) => (
                        <Link href={`/search?q=${encodeURIComponent(rel.title)}`} key={`${rel._type}-${rel.id}`} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[hsl(var(--surface))] rounded text-[10px] font-medium text-[hsl(var(--ink-secondary))]">
                          Related: {rel.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            icon={<CheckSquare className="w-5 h-5" />}
            title="No tasks due today"
            description="You're all caught up for the day!"
          />
        )}
      </section>

      {/* Recent Notes */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider">RECENT NOTES</h2>
          <Link href="/notes" className="text-xs font-medium text-[hsl(var(--primary))] hover:underline">View all</Link>
        </div>
        {recentNotes.length > 0 ? (
          <div className="space-y-2">
            {recentNotes.map(note => (
              <Link href="/notes" key={note.id} className="flex flex-col gap-1 p-3 bg-[hsl(var(--surface-elevated))] rounded-lg border border-[hsl(var(--hairline))] group hover:border-[hsl(var(--ink-tertiary))] transition-colors">
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium">{note.title}</p>
                </div>
                <p className="text-xs text-[hsl(var(--ink-secondary))] line-clamp-1">{note.content || "Empty note"}</p>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            compact
            icon={<StickyNote className="w-5 h-5" />}
            title="No recent notes"
            description="Jot down your thoughts and ideas."
          />
        )}
      </section>

      {/* Next Up */}
      <section>
        <h2 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider mb-4">NEXT UP</h2>
        <EmptyState
          icon={<Apple className="w-6 h-6" />}
          title="Food is pending refinement"
          description="Food module has been partially implemented. Check out the new Finance and Workout features in the meantime."
        />
      </section>
    </div>
  );
}

import { auth } from "@/auth";
import { Search, Apple, Scale, IndianRupee, CheckSquare, StickyNote, Activity, Target, Landmark } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { userPreferences, weightEntries, workoutSchedules, workoutRoutines, workoutExercises, workoutDisplayStates, notes, users } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { WorkoutTodayWidget } from "@/components/workout/WorkoutTodayWidget";
import { getMonthlySummary, getAccountBalances } from "@/lib/finance/service";
import { getTodayTasksSummary } from "@/lib/tasks/service";
import { CalendarTodayWidget } from "@/components/calendar/CalendarTodayWidget";
import { RelationshipService } from "@/lib/relationships/service";
import { EmptyState } from "@/components/shared/EmptyState";
import { TimezoneSync } from "@/components/shared/TimezoneSync";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default async function TodayPage() {
  const session = await auth();
  let userName = session?.user?.name || "there";
  const userId = session?.user?.id;
  let hasPreferences = false;
  let userTimezone = "UTC";
  let latestWeight = null;
  
  if (userId) {
    const userRec = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userRec.length > 0 && userRec[0].name) {
      userName = userRec[0].name;
    }

    const prefs = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
    if (prefs.length > 0) {
      hasPreferences = true;
      userTimezone = prefs[0].timezone;
    }
    
    const weights = await db.select().from(weightEntries)
      .where(and(eq(weightEntries.userId, userId), isNull(weightEntries.deletedAt)))
      .orderBy(desc(weightEntries.recordedAt))
      .limit(1);
    latestWeight = weights.length > 0 ? weights[0] : null;
  }

  const dateObj = new Date();
  
  const dateStrFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayDateString = dateStrFormatter.format(dateObj);

  const weekdayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: userTimezone, weekday: 'long' });
  const weekdayName = weekdayFormatter.format(dateObj);
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentWeekday = weekdays.indexOf(weekdayName);

  const displayFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: userTimezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  const today = displayFormatter.format(dateObj);

  let todayRoutine = null;
  let todayDisplayState = null;
  let financeSummary = null;
  let bankBalance = 0;
  let todayTasks: any[] = [];
  let recentNotes: any[] = [];

  if (userId) {
    const currentMonthStr = todayDateString.substring(0, 7);
    financeSummary = await getMonthlySummary(userId, currentMonthStr);
    
    const accounts = await getAccountBalances(userId);
    bankBalance = accounts.filter(a => a.type === 'BANK_ACCOUNT').reduce((sum, a) => sum + (a.balance || 0), 0);
    
    const rawTasks = await getTodayTasksSummary(userId, todayDateString);
    todayTasks = await Promise.all(rawTasks.map(async (task) => {
      const related = await RelationshipService.getRelatedObjects(userId, 'task', task.id);
      return { ...task, related };
    }));
    
    recentNotes = await db.select().from(notes)
      .where(and(eq(notes.userId, userId), isNull(notes.deletedAt)))
      .orderBy(desc(notes.updatedAt))
      .limit(3);
      
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
    <div className="animate-in fade-in duration-500">
      {userId && <TimezoneSync serverTimezone={userTimezone} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Header - spans full width */}
        <div className="col-span-full mb-2">
          <header className="space-y-1">
            <p className="text-xs font-semibold text-[hsl(var(--ink-secondary))] uppercase tracking-wider">{today}</p>
            <h1 className="text-3xl font-bold tracking-tight">Good morning, {userName}</h1>
          </header>
        </div>

        {/* Left Column: Primary Focus (Tasks, Calendar, Workout) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tasks Today */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-[hsl(var(--ink-muted))] tracking-wider">TASKS DUE TODAY</h2>
              <Link href="/tasks" className="text-[13px] font-medium text-[hsl(var(--primary))] hover:underline">View all</Link>
            </div>
            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-3 p-4 bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-elevated))] rounded-[var(--radius)] border border-[hsl(var(--hairline))] transition-colors shadow-sm">
                    <div className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 border-[hsl(var(--ink-muted))]"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-medium leading-tight">{task.title}</p>
                      <div className="flex flex-wrap gap-2 mt-1.5 text-[11px] text-[hsl(var(--ink-muted))] font-medium">
                        {task.priority !== 'normal' && (
                          <span className={`${task.priority === 'high' ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--info))]'}`}>{task.priority.toUpperCase()}</span>
                        )}
                        {task.dueDate && task.dueDate < todayDateString && <span className="text-[hsl(var(--destructive))]">OVERDUE</span>}
                      </div>
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

          {/* Calendar Today */}
          {userId && (
            <section>
               <CalendarTodayWidget userId={userId} localDateStr={todayDateString} />
            </section>
          )}

        </div>

        {/* Right Column: Secondary Focus (Status, Finance, Notes) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/finance" className="p-4 bg-[hsl(var(--surface))] rounded-[var(--radius)] border border-[hsl(var(--hairline))] hover:border-[hsl(var(--primary))] hover:shadow-sm transition-all group">
              <Landmark className="w-5 h-5 mb-2 text-[hsl(var(--ink-secondary))] group-hover:text-[hsl(var(--primary))]" />
              <div className="text-[11px] font-medium text-[hsl(var(--ink-muted))]">Bank Balance</div>
              <div className="text-[16px] font-bold">₹{bankBalance.toLocaleString()}</div>
            </Link>
            
            <Link href="/weight" className="p-4 bg-[hsl(var(--surface))] rounded-[var(--radius)] border border-[hsl(var(--hairline))] hover:border-[hsl(var(--primary))] hover:shadow-sm transition-all group">
              <Scale className="w-5 h-5 mb-2 text-[hsl(var(--ink-secondary))] group-hover:text-[hsl(var(--primary))]" />
              <div className="text-[11px] font-medium text-[hsl(var(--ink-muted))]">Latest Weight</div>
              <div className="text-[16px] font-bold">{latestWeight ? `${latestWeight.weight} ${latestWeight.unit}` : '--'}</div>
            </Link>
          </div>

          {/* OS Status Card */}
          <Card>
            <CardHeader className="p-4 pb-0 border-none">
              <CardTitle className="text-[13px] font-semibold text-[hsl(var(--ink-muted))] tracking-wider">SYSTEM STATUS</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${hasPreferences ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--warning))]'}`} />
                <span className="text-[14px] font-medium text-[hsl(var(--ink))]">Preferences {hasPreferences ? 'configured' : 'incomplete'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[hsl(var(--info))]" />
                <span className="text-[14px] font-medium text-[hsl(var(--ink))]">Food module: Pending</span>
              </div>
            </CardContent>
          </Card>

          {/* Recent Notes */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[13px] font-semibold text-[hsl(var(--ink-muted))] tracking-wider">RECENT NOTES</h2>
              <Link href="/notes" className="text-[13px] font-medium text-[hsl(var(--primary))] hover:underline">View all</Link>
            </div>
            {recentNotes.length > 0 ? (
              <div className="space-y-2">
                {recentNotes.map(note => (
                  <Link href="/notes" key={note.id} className="block p-3 bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-elevated))] rounded-[var(--radius)] border border-[hsl(var(--hairline))] transition-colors shadow-sm">
                    <p className="text-[14px] font-semibold truncate text-[hsl(var(--ink))]">{note.title}</p>
                    <p className="text-[12px] text-[hsl(var(--ink-secondary))] line-clamp-2 mt-1">{note.content || "Empty note"}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                compact
                icon={<StickyNote className="w-5 h-5" />}
                title="No recent notes"
                description="Jot down your thoughts."
              />
            )}
          </section>

        </div>
      </div>
    </div>
  );
}

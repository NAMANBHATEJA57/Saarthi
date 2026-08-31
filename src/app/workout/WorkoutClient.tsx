"use client";

import { useState } from "react";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoutineEditor, WorkoutRoutine } from "@/components/workout/RoutineEditor";
import { ScheduleEditor } from "@/components/workout/ScheduleEditor";
import { useRouter } from "next/navigation";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function WorkoutClient({ 
  initialRoutines, 
  initialSchedules,
  recentSessions = []
}: { 
  initialRoutines: WorkoutRoutine[];
  initialSchedules: any[];
  recentSessions?: any[];
}) {
  const router = useRouter();
  
  const [editingRoutine, setEditingRoutine] = useState<WorkoutRoutine | null>(null);
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [editingScheduleDay, setEditingScheduleDay] = useState<number | null>(null);

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleDeleteRoutine = async (id: string) => {
    if (!confirm("Delete this routine? This will also remove it from your schedule.")) return;
    
    setIsDeleting(id);
    try {
      await fetch(`/api/workouts/routines/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  if (isCreatingRoutine || editingRoutine) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-medium text-[hsl(var(--ink))]">
          {isCreatingRoutine ? "New Routine" : "Edit Routine"}
        </h2>
        <RoutineEditor 
          initialRoutine={editingRoutine || undefined}
          onSuccess={() => {
            setIsCreatingRoutine(false);
            setEditingRoutine(null);
          }}
          onCancel={() => {
            setIsCreatingRoutine(false);
            setEditingRoutine(null);
          }}
        />
      </div>
    );
  }

  if (editingScheduleDay !== null) {
    const currentSchedule = initialSchedules.find(s => s.weekday === editingScheduleDay);
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-medium text-[hsl(var(--ink))]">
          Edit Schedule
        </h2>
        <ScheduleEditor 
          weekday={editingScheduleDay}
          currentRoutineId={currentSchedule?.routineId}
          routines={initialRoutines.map(r => ({ id: r.id, name: r.name }))}
          onSuccess={() => setEditingScheduleDay(null)}
          onCancel={() => setEditingScheduleDay(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* SCHEDULE SECTION */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-[hsl(var(--ink))] tracking-tight">
          Weekly Schedule
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {WEEKDAYS.map((dayName, idx) => {
            const schedule = initialSchedules.find(s => s.weekday === idx);
            const routine = initialRoutines.find(r => r.id === schedule?.routineId);
            
            return (
              <button
                key={idx}
                onClick={() => setEditingScheduleDay(idx)}
                className="flex items-center justify-between p-4 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--canvas))] transition-colors text-left"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[hsl(var(--ink-secondary))] uppercase tracking-wider">
                    {dayName}
                  </span>
                  <span className={`text-base mt-1 ${routine ? 'text-[hsl(var(--ink))]' : 'text-[hsl(var(--ink-secondary))] opacity-60'}`}>
                    {routine ? routine.name : 'Rest'}
                  </span>
                </div>
                <Settings2 className="w-4 h-4 text-[hsl(var(--ink-secondary))] opacity-50" />
              </button>
            );
          })}
        </div>
      </section>

      {/* HISTORY SECTION */}
      <section className="space-y-4">
        <h2 className="text-xl font-medium text-[hsl(var(--ink))] tracking-tight">
          Recent Sessions
        </h2>
        
        {recentSessions.length === 0 ? (
          <div className="p-6 text-center text-sm text-[hsl(var(--ink-secondary))] border border-[hsl(var(--hairline))] rounded-xl">
            No completed workouts yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recentSessions.map((session) => (
              <div key={session.id} className="p-4 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--ink))]">
                      {session.routine ? session.routine.name : 'Ad-hoc Workout'}
                    </h3>
                    <p className="text-xs text-[hsl(var(--ink-secondary))] mt-0.5">
                      {new Date(session.localDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-[hsl(var(--ink))]">{session.setsCount} sets</div>
                    <div className="text-xs text-[hsl(var(--ink-muted))]">{session.volume} kg total</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ROUTINES SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-[hsl(var(--ink))] tracking-tight">
            Routines
          </h2>
          <Button 
            variant="secondary"
            className="h-9 px-3 gap-1 bg-[hsl(var(--surface))] border-[hsl(var(--hairline))]"
            onClick={() => setIsCreatingRoutine(true)}
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </Button>
        </div>

        {initialRoutines.length === 0 ? (
          <div className="p-8 text-center bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-xl">
            <p className="text-[hsl(var(--ink-secondary))] mb-4">No routines created yet.</p>
            <Button onClick={() => setIsCreatingRoutine(true)}>
              Create Routine
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {initialRoutines.map((routine) => (
              <div 
                key={routine.id}
                className="flex items-start justify-between p-4 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]"
              >
                <div className="flex flex-col flex-1 mr-4">
                  <span className="text-lg font-medium text-[hsl(var(--ink))]">
                    {routine.name}
                  </span>
                  {routine.remark && (
                    <span className="text-sm text-[hsl(var(--ink-secondary))] mt-1 italic">
                      {routine.remark}
                    </span>
                  )}
                  <div className="mt-3 text-sm text-[hsl(var(--ink-secondary))]">
                    {routine.exercises.length} exercises
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingRoutine(routine)}
                    className="p-2 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))] bg-[hsl(var(--canvas))] rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRoutine(routine.id)}
                    disabled={isDeleting === routine.id}
                    className="p-2 text-[hsl(var(--ink-secondary))] hover:text-red-500 bg-[hsl(var(--canvas))] rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Check, Play, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface RoutineExercise {
  id?: string;
  name: string;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
}

export interface WorkoutDisplayState {
  checkedExerciseIds: string[];
}

interface WorkoutTodayWidgetProps {
  routine: WorkoutRoutine;
  localDate: string;
  initialDisplayState: WorkoutDisplayState | null;
}

export function WorkoutTodayWidget({ routine, localDate, initialDisplayState }: WorkoutTodayWidgetProps) {
  const router = useRouter();
  const [starting, setStarting] = useState(false);
  const [checkedIds, setCheckedIds] = useState<string[]>(
    initialDisplayState?.checkedExerciseIds || []
  );

  const toggleCheck = async (exerciseName: string, index: number) => {
    // Generate a stable synthetic ID for toggling since items might not have strict IDs in MVP
    const syntheticId = `${index}-${exerciseName}`;
    
    let newCheckedIds = [...checkedIds];
    if (newCheckedIds.includes(syntheticId)) {
      newCheckedIds = newCheckedIds.filter(id => id !== syntheticId);
    } else {
      newCheckedIds.push(syntheticId);
    }
    
    setCheckedIds(newCheckedIds);

    try {
      await fetch('/api/workouts/display-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineId: routine.id,
          localDate,
          checkedExerciseIds: newCheckedIds,
        }),
      });
    } catch (error) {
      console.error("Failed to sync checkbox state", error);
      // Revert if we wanted to be perfectly strict, but for MVP display state, optimistic is fine
    }
  };

  if (!routine.exercises || routine.exercises.length === 0) {
    return (
      <div className="p-4 bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-[hsl(var(--ink))]">Workout: {routine.name}</h3>
            <p className="text-sm text-[hsl(var(--ink-secondary))]">No exercises added.</p>
          </div>
          <Link href="/workout" className="text-sm font-medium text-[hsl(var(--ink))] hover:underline">
            Manage
          </Link>
        </div>
      </div>
    );
  }

  const allChecked = routine.exercises.length > 0 && checkedIds.length === routine.exercises.length;

  return (
    <div className={`p-4 border rounded-xl transition-colors ${allChecked ? 'bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] opacity-80' : 'bg-[hsl(var(--surface))] border-[hsl(var(--hairline))]'}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] font-semibold text-[hsl(var(--ink-secondary))] uppercase tracking-wider">
            Today&apos;s Workout
          </span>
          <h3 className="font-semibold text-[hsl(var(--ink))] mt-0.5">{routine.name}</h3>
        </div>
        <Link href="/workout" className="text-sm font-medium text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))]">
          Edit
        </Link>
      </div>

      <div className="space-y-2">
        {routine.exercises.map((ex, i) => {
          const syntheticId = `${i}-${ex.name}`;
          const isChecked = checkedIds.includes(syntheticId);

          return (
            <button
              key={syntheticId}
              onClick={() => toggleCheck(ex.name, i)}
              className="flex items-center w-full gap-3 py-2 group text-left"
            >
              <div 
                className={`flex-shrink-0 flex items-center justify-center w-6 h-6 rounded border transition-colors ${
                  isChecked 
                    ? 'bg-[hsl(var(--ink))] border-[hsl(var(--ink))] text-[hsl(var(--surface))]' 
                    : 'bg-transparent border-[hsl(var(--ink-secondary))] group-hover:border-[hsl(var(--ink))]'
                }`}
              >
                {isChecked && <Check className="w-4 h-4" />}
              </div>
              <span className={`text-base transition-colors ${isChecked ? 'text-[hsl(var(--ink-secondary))] line-through' : 'text-[hsl(var(--ink))]'}`}>
                {ex.name}
              </span>
            </button>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-[hsl(var(--hairline))]">
        <button 
          disabled={starting}
          onClick={async () => {
            setStarting(true);
            try {
              const res = await fetch('/api/workouts/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ localDate, routineId: routine.id })
              });
              if (res.ok) {
                const session = await res.json();
                router.push(`/workout/session/${session.id}`);
              }
            } catch(e) {
              console.error(e);
            }
            setStarting(false);
          }}
          className="w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold bg-[hsl(var(--primary))] text-[hsl(var(--surface))] rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Start Guided Workout
        </button>
      </div>
    </div>
  );
}

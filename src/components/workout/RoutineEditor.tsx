"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { RelationshipManager } from "@/components/relationships/RelationshipManager";

export interface RoutineExercise {
  id?: string;
  name: string;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  remark?: string | null;
  exercises: RoutineExercise[];
}

interface RoutineEditorProps {
  initialRoutine?: WorkoutRoutine;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RoutineEditor({ initialRoutine, onSuccess, onCancel }: RoutineEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialRoutine?.name || "");
  const [remark, setRemark] = useState(initialRoutine?.remark || "");
  
  // Track exercises as a local list of objects
  const [exercises, setExercises] = useState<RoutineExercise[]>(
    initialRoutine?.exercises ? [...initialRoutine.exercises] : []
  );

  const [newExerciseName, setNewExerciseName] = useState("");

  const handleAddExercise = () => {
    if (!newExerciseName.trim()) return;
    setExercises([...exercises, { name: newExerciseName.trim() }]);
    setNewExerciseName("");
  };

  const handleRemoveExercise = (index: number) => {
    const updated = [...exercises];
    updated.splice(index, 1);
    setExercises(updated);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...exercises];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setExercises(updated);
  };

  const handleMoveDown = (index: number) => {
    if (index === exercises.length - 1) return;
    const updated = [...exercises];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Routine name is required");
      return;
    }

    if (exercises.length === 0) {
      setError("Please add at least one exercise");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        remark: remark.trim() || null,
        exercises: exercises.map(ex => ({ name: ex.name })),
      };

      const url = initialRoutine
        ? `/api/workouts/routines/${initialRoutine.id}`
        : `/api/workouts/routines`;
        
      const method = initialRoutine ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save routine");
      }

      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="routine-name" className="block text-sm font-medium text-[hsl(var(--ink-secondary))]">
              Routine Name
            </label>
            <input
              id="routine-name"
              placeholder="e.g. Push, Pull, Legs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
              className="flex h-12 w-full rounded-md border bg-[hsl(var(--surface))] px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 border-[hsl(var(--hairline))]"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="routine-remark" className="block text-sm font-medium text-[hsl(var(--ink-secondary))]">
              Remark (optional)
            </label>
            <textarea
              id="routine-remark"
              placeholder="e.g. Focus on form, keep it light..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              disabled={isSubmitting}
              className="flex min-h-[80px] w-full rounded-md border bg-[hsl(var(--surface))] px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none border-[hsl(var(--hairline))]"
            />
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-[hsl(var(--ink-secondary))]">Exercises</label>
          
          <div className="space-y-2">
            {exercises.map((ex, i) => (
              <div 
                key={i} 
                className="flex items-center gap-2 p-2 rounded-md bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))]"
              >
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => handleMoveUp(i)}
                    disabled={i === 0 || isSubmitting}
                    className="p-1 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))] disabled:opacity-30 disabled:hover:text-[hsl(var(--ink-secondary))]"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveDown(i)}
                    disabled={i === exercises.length - 1 || isSubmitting}
                    className="p-1 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))] disabled:opacity-30 disabled:hover:text-[hsl(var(--ink-secondary))]"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex-1 text-[hsl(var(--ink))] font-medium truncate">
                  {ex.name}
                </div>
                
                <button
                  type="button"
                  onClick={() => handleRemoveExercise(i)}
                  disabled={isSubmitting}
                  className="p-2 text-[hsl(var(--ink-secondary))] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            
            {exercises.length === 0 && (
              <div className="p-4 text-center text-sm text-[hsl(var(--ink-secondary))] bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-md">
                No exercises added yet.
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              placeholder="Exercise name"
              value={newExerciseName}
              onChange={(e) => setNewExerciseName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddExercise();
                }
              }}
              disabled={isSubmitting}
              className="flex h-12 w-full rounded-md border bg-[hsl(var(--surface))] px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 border-[hsl(var(--hairline))]"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddExercise}
              disabled={!newExerciseName.trim() || isSubmitting}
              className="h-12 px-4"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button 
            type="submit" 
            className="flex-1 h-12"
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (initialRoutine ? "Save Changes" : "Create Routine")}
          </Button>
          
          {onCancel && (
            <Button 
              type="button" 
              variant="secondary" 
              className="flex-1 h-12 bg-[hsl(var(--surface))] border-[hsl(var(--hairline))]"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      {initialRoutine?.id && (
        <div className="pt-6 border-t border-[hsl(var(--hairline))]">
          <RelationshipManager sourceType="workout" sourceId={initialRoutine.id} />
        </div>
      )}
    </div>
  );
}

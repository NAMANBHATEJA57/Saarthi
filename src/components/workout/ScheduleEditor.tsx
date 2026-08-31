"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Check } from "lucide-react";
import { useRouter } from "next/navigation";

export interface ScheduleEditorProps {
  weekday: number; // 0 (Sun) to 6 (Sat)
  currentRoutineId?: string;
  routines: { id: string; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function ScheduleEditor({ weekday, currentRoutineId, routines, onSuccess, onCancel }: ScheduleEditorProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (routineId: string | null) => {
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/workouts/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weekday,
          routineId,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save schedule");
      }

      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium text-[hsl(var(--ink))]">
          {WEEKDAYS[weekday]}
        </h3>
        <p className="text-sm text-[hsl(var(--ink-secondary))]">
          Assign a workout routine
        </p>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md">
          {error}
        </div>
      )}

      {isSubmitting ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--ink-secondary))]" />
        </div>
      ) : (
        <div className="space-y-3">
          {routines.length === 0 ? (
            <div className="p-4 text-center text-sm text-[hsl(var(--ink-secondary))] bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-md">
              No routines available. Create one first.
            </div>
          ) : (
            <div className="grid gap-2">
              {routines.map((r) => {
                const isActive = r.id === currentRoutineId;
                return (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r.id)}
                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-colors ${
                      isActive 
                        ? 'bg-[hsl(var(--ink))] text-[hsl(var(--surface))] border-[hsl(var(--ink))]'
                        : 'bg-[hsl(var(--surface))] border-[hsl(var(--hairline))] text-[hsl(var(--ink))] hover:bg-[hsl(var(--canvas))]'
                    }`}
                  >
                    <span className="font-medium text-base">{r.name}</span>
                    {isActive && <Check className="w-5 h-5 text-[hsl(var(--surface))]" />}
                  </button>
                );
              })}
            </div>
          )}

          {currentRoutineId && (
            <button
              onClick={() => handleSelect(null)}
              className="flex items-center justify-center w-full gap-2 p-4 mt-4 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))] text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="font-medium">Clear {WEEKDAYS[weekday]}</span>
            </button>
          )}
        </div>
      )}

      {onCancel && (
        <div className="pt-4">
          <Button 
            variant="secondary" 
            className="w-full h-12 bg-transparent border-[hsl(var(--hairline))]"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}

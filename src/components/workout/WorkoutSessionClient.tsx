"use client";

import { useState } from "react";
import { RestTimer } from "./RestTimer";
import { Check, Plus, History, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getPreviousPerformanceAction } from "@/app/workout/actions";

export function WorkoutSessionClient({ workoutSession, routine, routineExercises, library, existingSets, latestBodyweight }: any) {
  const router = useRouter();
  const [sets, setSets] = useState<any[]>(existingSets || []);
  const [loading, setLoading] = useState(false);

  const exercises = routineExercises.map((re: any) => {
    const lib = library.find((l: any) => l.id === re.libraryId) || library.find((l: any) => l.name.toLowerCase() === re.name.toLowerCase());
    return { ...re, libraryData: lib };
  });

  const [activeExercise, setActiveExercise] = useState<string | null>(exercises[0]?.id || null);
  const [performanceData, setPerformanceData] = useState<Record<string, any>>({});
  
  const [weight, setWeight] = useState<string>("");
  const [reps, setReps] = useState<string>("");

  const loadPerformance = async (libId: string) => {
    if (performanceData[libId]) return;
    const data = await getPreviousPerformanceAction(libId);
    setPerformanceData(prev => ({ ...prev, [libId]: data }));
  };

  const handleLogSet = async (exercise: any) => {
    if (!exercise.libraryData) return alert("Exercise must be linked to library");
    setLoading(true);
    
    const exSets = sets.filter(s => s.routineExerciseId === exercise.id);
    const setNum = exSets.length + 1;

    try {
      const res = await fetch(`/api/workouts/sessions/${workoutSession.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: workoutSession.id,
          action: 'logSet',
          setPayload: {
            exerciseLibraryId: exercise.libraryData.id,
            routineExerciseId: exercise.id,
            setNumber: setNum,
            weight: weight ? parseFloat(weight) : (exercise.libraryData.type === 'bodyweight' && latestBodyweight ? parseFloat(latestBodyweight) : null),
            reps: reps ? parseInt(reps, 10) : null
          }
        })
      });
      if (res.ok) {
        const newSet = await res.json();
        setSets([...sets, newSet]);
        setWeight("");
        setReps("");
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await fetch(`/api/workouts/sessions/${workoutSession.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: workoutSession.id, action: 'finish' })
      });
      router.push("/today");
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };
  
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {exercises.map((ex: any) => {
          const exSets = sets.filter(s => s.routineExerciseId === ex.id);
          const isActive = activeExercise === ex.id;

          return (
            <div key={ex.id} className={`border rounded-xl p-4 transition-colors ${isActive ? 'bg-[hsl(var(--surface-elevated))] border-[hsl(var(--primary))]' : 'bg-[hsl(var(--surface))] border-[hsl(var(--hairline))]'}`}>
              <div 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => {
                  setActiveExercise(isActive ? null : ex.id);
                  if (!isActive && ex.libraryData) {
                    loadPerformance(ex.libraryData.id);
                  }
                }}
              >
                <div>
                  <h3 className="font-semibold text-[hsl(var(--ink))]">{ex.name}</h3>
                  <p className="text-xs text-[hsl(var(--ink-muted))]">{exSets.length} sets completed</p>
                </div>
              </div>

              {isActive && (
                <div className="mt-6 space-y-4">
                  {exSets.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[10px] font-semibold text-[hsl(var(--ink-muted))] tracking-wider uppercase">Current Sets</div>
                      {exSets.map(s => (
                        <div key={s.id} className="flex justify-between p-2 text-sm bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-lg">
                          <span className="font-medium text-[hsl(var(--ink-secondary))]">Set {s.setNumber}</span>
                          <span className="text-[hsl(var(--ink))]">
                            {s.weight ? `${s.weight}kg` : ''} {s.weight && s.reps ? '×' : ''} {s.reps ? `${s.reps} reps` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-[hsl(var(--ink-muted))] tracking-wider uppercase">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={weight}
                        onChange={e => setWeight(e.target.value)}
                        placeholder={ex.libraryData?.type === 'bodyweight' && latestBodyweight ? `BW (${latestBodyweight})` : "e.g. 60"}
                        className="w-full mt-1 px-3 py-2 text-sm bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-lg focus:outline-none focus:border-[hsl(var(--primary))] placeholder-[hsl(var(--ink-muted))]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-[hsl(var(--ink-muted))] tracking-wider uppercase">Reps</label>
                      <input 
                        type="number" 
                        value={reps}
                        onChange={e => setReps(e.target.value)}
                        placeholder="e.g. 10"
                        className="w-full mt-1 px-3 py-2 text-sm bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded-lg focus:outline-none focus:border-[hsl(var(--primary))] placeholder-[hsl(var(--ink-muted))]"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => handleLogSet(ex)}
                    disabled={loading || !ex.libraryData}
                    className="w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold bg-[hsl(var(--primary))] text-[hsl(var(--surface))] rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Log Set
                  </button>

                  {!ex.libraryData && (
                    <p className="text-xs text-red-500">Exercise not found in local library. Cannot log sets.</p>
                  )}

                  {ex.libraryData && performanceData[ex.libraryData.id] && performanceData[ex.libraryData.id].length > 0 && (
                    <div className="mt-6">
                      <div className="flex items-center gap-2 text-[10px] font-semibold text-[hsl(var(--ink-muted))] tracking-wider uppercase mb-3">
                        <History className="w-3 h-3" />
                        Previous Performance
                      </div>
                      <div className="space-y-3">
                        {performanceData[ex.libraryData.id].map((sessionHistory: any, idx: number) => (
                          <div key={idx} className="text-sm border-l-2 border-[hsl(var(--hairline))] pl-3">
                            <div className="text-xs text-[hsl(var(--ink-secondary))] mb-1">
                              {new Date(sessionHistory.date).toLocaleDateString()}
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {sessionHistory.sets.map((s: any) => (
                                <span key={s.id} className="px-2 py-1 bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] rounded text-[hsl(var(--ink))]">
                                  {s.weight ? `${s.weight}kg` : ''} {s.weight && s.reps ? '×' : ''} {s.reps ? `${s.reps}` : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <RestTimer defaultSeconds={90} />

      <button 
        onClick={handleFinish}
        disabled={loading}
        className="w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold border-2 border-[hsl(var(--primary))] text-[hsl(var(--primary))] rounded-xl hover:bg-[hsl(var(--primary))] hover:text-[hsl(var(--surface))] transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
        Finish Workout
      </button>
    </div>
  );
}

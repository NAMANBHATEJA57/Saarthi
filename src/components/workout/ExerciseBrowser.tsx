'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Plus, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';

interface Exercise {
  id: string;
  name: string;
  type: string;
  muscle: string | null;
  equipment: string | null;
  instructions: string | null;
  mediaUrl: string | null;
}

interface ExerciseBrowserProps {
  selectedMuscle?: string | null;
  onAddExercise: (exercise: Exercise) => void;
}

export function ExerciseBrowser({ selectedMuscle, onAddExercise }: ExerciseBrowserProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchExercises() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedMuscle) params.append('muscle', selectedMuscle);
        if (search) params.append('search', search);

        const res = await fetch(`/api/workout/library?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch exercises');
        const data = await res.json();
        setExercises(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    // Debounce search
    const delayDebounceFn = setTimeout(() => {
      fetchExercises();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedMuscle, search]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={selectedMuscle ? `Search ${selectedMuscle} exercises...` : "Search all exercises..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pb-safe">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No exercises found.
          </div>
        ) : (
          exercises.map((ex) => (
            <Card key={ex.id} className="overflow-hidden border-border/50">
              <CardContent className="p-0 flex items-stretch">
                {ex.mediaUrl ? (
                  <div className="w-24 h-24 bg-muted relative shrink-0">
                    <img 
                      src={ex.mediaUrl} 
                      alt={ex.name} 
                      className="w-full h-full object-cover mix-blend-multiply" 
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-muted flex items-center justify-center shrink-0">
                    <span className="text-muted-foreground text-xs">No media</span>
                  </div>
                )}
                
                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <h4 className="font-semibold text-sm truncate capitalize">{ex.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {ex.muscle && <Badge variant="default" className="text-[10px] py-0">{ex.muscle}</Badge>}
                      {ex.equipment && <Badge variant="pill" className="text-[10px] py-0">{ex.equipment}</Badge>}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-2 mt-2">
                    {ex.instructions && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="icon" className="h-7 w-7">
                            <Info className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle className="capitalize">{ex.name}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4">
                            {ex.mediaUrl && (
                              <div className="w-full h-48 relative mb-4 rounded-md overflow-hidden bg-muted">
                                <img src={ex.mediaUrl} alt={ex.name} className="w-full h-full object-contain" />
                              </div>
                            )}
                            <h5 className="font-semibold mb-2">Instructions</h5>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {ex.instructions}
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button variant="secondary" className="h-7 px-3" onClick={() => onAddExercise(ex)}>
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

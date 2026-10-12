'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Plus, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { ExerciseMedia } from './ExerciseMedia';

interface Exercise {
  id: string;
  name: string;
  type: string;
  muscle: string | null;
  equipment: string | null;
  instructions: string | null;
  animationUrl?: string | null;
  mediaUrl?: string | null;
  thumbnailUrl?: string | null;
}

interface ExerciseBrowserProps {
  selectedMuscle?: string | null;
  onAddExercise: (exercise: Exercise) => void;
}

const EQUIPMENT_OPTIONS = [
  { label: 'All Equipment', value: '' },
  { label: 'Bodyweight', value: 'body weight' },
  { label: 'Dumbbell', value: 'dumbbell' },
  { label: 'Barbell', value: 'barbell' },
  { label: 'Cable', value: 'cable' },
  { label: 'Machine', value: 'leverage machine' },
  { label: 'Band', value: 'band' },
];

export function ExerciseBrowser({ selectedMuscle, onAddExercise }: ExerciseBrowserProps) {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');

  useEffect(() => {
    async function fetchExercises() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedMuscle) params.append('muscle', selectedMuscle);
        if (selectedEquipment) params.append('equipment', selectedEquipment);
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
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedMuscle, selectedEquipment, search]);

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={selectedMuscle ? `Search ${selectedMuscle} exercises...` : "Search 1,300+ exercises..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-background/50 h-9 text-sm"
        />
      </div>

      {/* Equipment filter chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
        {EQUIPMENT_OPTIONS.map((item) => {
          const isActive = selectedEquipment === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setSelectedEquipment(item.value)}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-colors border text-xs font-medium ${
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                  : 'bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pb-safe">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No exercises found.
          </div>
        ) : (
          exercises.map((ex) => (
            <Card key={ex.id} className="overflow-hidden border-border/50">
              <CardContent className="p-0 flex items-stretch">
                <ExerciseMedia
                  animationUrl={ex.animationUrl}
                  mediaUrl={ex.mediaUrl}
                  thumbnailUrl={ex.thumbnailUrl}
                  alt={ex.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 bg-muted/20"
                />
                
                <div className="flex-1 p-2.5 sm:p-3 flex flex-col justify-between min-w-0">
                  <div>
                    <h4 className="font-semibold text-xs sm:text-sm truncate capitalize">{ex.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {ex.muscle && <Badge variant="default" className="text-[10px] py-0 capitalize">{ex.muscle}</Badge>}
                      {ex.equipment && <Badge variant="pill" className="text-[10px] py-0 capitalize">{ex.equipment}</Badge>}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end gap-1.5 mt-2">
                    {ex.instructions && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                            <Info className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
                          <DialogHeader>
                            <DialogTitle className="capitalize text-base">{ex.name}</DialogTitle>
                          </DialogHeader>
                          <div className="mt-2 space-y-3 overflow-y-auto pr-1">
                            {(ex.animationUrl || ex.mediaUrl || ex.thumbnailUrl) && (
                              <div className="w-full h-48 bg-muted/20 rounded-md overflow-hidden flex items-center justify-center">
                                <ExerciseMedia
                                  animationUrl={ex.animationUrl}
                                  mediaUrl={ex.mediaUrl}
                                  thumbnailUrl={ex.thumbnailUrl}
                                  alt={ex.name}
                                  className="w-full h-full object-contain"
                                  expandable={false}
                                />
                              </div>
                            )}
                            <div>
                              <h5 className="font-medium text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Instructions</h5>
                              <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
                                {ex.instructions}
                              </p>
                            </div>
                            <p className="text-[11px] text-muted-foreground/80 border-t pt-2">
                              Demonstrations © <a href="https://gymvisual.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Gym visual</a>
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button variant="secondary" className="h-7 px-2.5 text-xs font-medium" onClick={() => onAddExercise(ex)}>
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

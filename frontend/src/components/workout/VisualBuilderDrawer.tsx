'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BodyMuscleMap, MuscleName } from './BodyMuscleMap';
import { ExerciseBrowser } from './ExerciseBrowser';
import { FlipHorizontal } from 'lucide-react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { DialogDescription } from '@radix-ui/react-dialog';

interface VisualBuilderDrawerProps {
  onAddExercise: (name: string) => void;
  trigger: React.ReactNode;
}

export function VisualBuilderDrawer({ onAddExercise, trigger }: VisualBuilderDrawerProps) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const toggleView = () => {
    setView(v => v === 'front' ? 'back' : 'front');
    setSelectedMuscle(null); // Reset selection on flip
  };

  const handleAdd = (exercise: { name: string }) => {
    onAddExercise(exercise.name);
    // Optionally close or stay open to add more
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b shrink-0">
          <DialogTitle>Visual Builder</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Browse and add exercises visually.</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Top half: Body Map */}
          <div className="relative h-2/5 shrink-0 bg-muted/20 border-b p-4 flex flex-col items-center">
            <Button 
              variant="secondary" 
              className="absolute top-4 right-4 z-10 rounded-full px-3 py-1 text-xs"
              onClick={toggleView}
            >
              <FlipHorizontal className="h-4 w-4 mr-2" />
              {view === 'front' ? 'Back' : 'Front'} View
            </Button>

            <BodyMuscleMap 
              view={view}
              selectedMuscle={selectedMuscle}
              onMuscleClick={(muscle) => setSelectedMuscle(muscle)}
              className="h-full"
            />
            {selectedMuscle && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur px-4 py-1.5 rounded-full shadow-sm border text-sm font-medium capitalize z-10">
                {selectedMuscle}
              </div>
            )}
          </div>

          {/* Bottom half: Exercise Browser */}
          <div className="flex-1 p-4 min-h-0 overflow-y-auto">
            <ExerciseBrowser 
              selectedMuscle={selectedMuscle}
              onAddExercise={handleAdd}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

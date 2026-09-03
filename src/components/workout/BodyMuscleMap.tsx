'use client';

import React from 'react';
import BODY_PATHS from '@/lib/workout/body-paths';
import { cn } from '@/lib/utils';

export type MuscleName = 
  | 'chest' | 'abs' | 'biceps' | 'triceps' | 'deltoids' | 'obliques' | 'quadriceps' 
  | 'calves' | 'adductors' | 'trapezius' | 'forearm' | 'gluteal' | 'hamstring' 
  | 'upper-back' | 'lower-back' | 'serratus' | 'hip-flexors' | 'tibialis';

interface BodyMuscleMapProps {
  gender?: 'male' | 'female';
  view?: 'front' | 'back';
  selectedMuscle?: string | null;
  onMuscleClick?: (muscle: string) => void;
  className?: string;
}

export function BodyMuscleMap({
  gender = 'male',
  view = 'front',
  selectedMuscle = null,
  onMuscleClick,
  className,
}: BodyMuscleMapProps) {
  const data = BODY_PATHS[gender][view];
  
  if (!data) return null;

  const viewBox = data.vb;
  const paths = data.p;

  // Inert parts that shouldn't be clickable or highlighted
  const INERT_PARTS = ['head', 'hair', 'neck', 'hands', 'feet', 'knees', 'ankles'];

  return (
    <div className={cn("relative w-full max-w-sm mx-auto aspect-[1/2]", className)}>
      <svg
        viewBox={viewBox}
        className="w-full h-full drop-shadow-md"
        preserveAspectRatio="xMidYMid meet"
      >
        {Object.entries(paths).map(([part, pathList]) => {
          const isSelected = selectedMuscle === part;
          const isInert = INERT_PARTS.includes(part);
          const isClickable = !isInert && !!onMuscleClick;

          return (
            <g key={part} className={cn({ 'cursor-pointer': isClickable })}>
              {(pathList as string[]).map((d, i) => (
                <path
                  key={i}
                  d={d}
                  onClick={() => {
                    if (isClickable) {
                      onMuscleClick(selectedMuscle === part ? '' : part); // toggle
                    }
                  }}
                  className={cn(
                    "transition-colors duration-300 ease-in-out",
                    isInert
                      ? "fill-muted stroke-muted-foreground/20"
                      : isSelected
                      ? "fill-primary stroke-primary-foreground"
                      : "fill-muted/50 stroke-muted-foreground/30 hover:fill-primary/50"
                  )}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

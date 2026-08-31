"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Apple, Scale, ChevronLeft, Dumbbell, IndianRupee, CheckSquare, StickyNote } from "lucide-react";
import { WeightCaptureForm } from "../weight/WeightCaptureForm";
import { RoutineEditor } from "../workout/RoutineEditor";
import { TransactionCaptureForm } from "../finance/TransactionCaptureForm";
import { TaskCaptureForm } from "../tasks/TaskCaptureForm";
import { NoteCaptureForm } from "../notes/NoteCaptureForm";

type CaptureType = "menu" | "weight" | "food" | "workout" | "finance" | "task" | "note";

interface GlobalCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalCaptureModal({ open, onOpenChange }: GlobalCaptureModalProps) {
  const [activeType, setActiveType] = useState<CaptureType>("menu");

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTimeout(() => setActiveType("menu"), 200); // reset after animation
    }
    onOpenChange(newOpen);
  };

  const handleSuccess = () => {
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] p-0 gap-0 bg-[hsl(var(--canvas))] border-[hsl(var(--hairline))] overflow-hidden rounded-xl shadow-2xl backdrop-blur-md">
        <DialogHeader className="sr-only">
          <DialogTitle>Quick Capture</DialogTitle>
        </DialogHeader>
        {activeType === "menu" ? (
          <div className="p-6">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-semibold">Log New Entry</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="secondary"
                className="justify-start h-14 px-4 text-base font-medium bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] hover:bg-[hsl(var(--surface-elevated))] hover:border-[hsl(var(--primary))] transition-all duration-200 active:scale-[0.98] shadow-sm"
                onClick={() => setActiveType("note")}
              >
                <StickyNote className="w-5 h-5 mr-3 text-[hsl(var(--ink-secondary))]" />
                Note
              </Button>
              <Button
                variant="secondary"
                className="justify-start h-14 px-4 text-base font-medium bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] hover:bg-[hsl(var(--surface-elevated))] hover:border-[hsl(var(--primary))] transition-all duration-200 active:scale-[0.98] shadow-sm"
                onClick={() => setActiveType("task")}
              >
                <CheckSquare className="w-5 h-5 mr-3 text-[hsl(var(--ink-secondary))]" />
                Task
              </Button>
              <Button
                variant="secondary"
                className="justify-start h-14 px-4 text-base font-medium bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] hover:bg-[hsl(var(--surface-elevated))] hover:border-[hsl(var(--primary))] transition-all duration-200 active:scale-[0.98] shadow-sm"
                onClick={() => setActiveType("weight")}
              >
                <Scale className="w-5 h-5 mr-3 text-[hsl(var(--ink-secondary))]" />
                Weight
              </Button>
              <Button
                variant="secondary"
                className="justify-start h-14 px-4 text-base font-medium bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] hover:bg-[hsl(var(--surface-elevated))] hover:border-[hsl(var(--primary))] transition-all duration-200 active:scale-[0.98] shadow-sm"
                onClick={() => setActiveType("workout")}
              >
                <Dumbbell className="w-5 h-5 mr-3 text-[hsl(var(--ink-secondary))]" />
                Workout Routine
              </Button>
              <Button
                variant="secondary"
                className="justify-start h-14 px-4 text-base font-medium bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] hover:bg-[hsl(var(--surface-elevated))] hover:border-[hsl(var(--primary))] transition-all duration-200 active:scale-[0.98] shadow-sm"
                onClick={() => setActiveType("finance")}
              >
                <IndianRupee className="w-5 h-5 mr-3 text-[hsl(var(--ink-secondary))]" />
                Finance
              </Button>
              <Button
                variant="secondary"
                className="justify-start h-14 px-4 text-base font-medium bg-[hsl(var(--surface))] border-[hsl(var(--hairline))] hover:bg-[hsl(var(--canvas))] opacity-70"
                disabled
              >
                <Apple className="w-5 h-5 mr-3 text-[hsl(var(--ink-secondary))]" />
                Food (Coming soon)
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full max-h-[85vh]">
            <div className="flex items-center px-4 py-3 border-b border-[hsl(var(--hairline))]">
              <button 
                onClick={() => setActiveType("menu")}
                className="p-2 -ml-2 rounded-full hover:bg-[hsl(var(--surface))] transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-semibold ml-2">
                {activeType === "note" && "New Note"}
                {activeType === "task" && "New Task"}
                {activeType === "weight" && "Log Weight"}
                {activeType === "workout" && "New Workout Routine"}
                {activeType === "finance" && "Log Transaction"}
              </h2>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {activeType === "weight" && (
                <WeightCaptureForm onSuccess={handleSuccess} onCancel={() => handleOpenChange(false)} />
              )}
              {activeType === "workout" && (
                <RoutineEditor onSuccess={handleSuccess} onCancel={() => handleOpenChange(false)} />
              )}
              {activeType === "finance" && (
                <TransactionCaptureForm onSuccess={handleSuccess} onCancel={() => handleOpenChange(false)} />
              )}
              {activeType === "task" && (
                <TaskCaptureForm onSuccess={handleSuccess} onCancel={() => handleOpenChange(false)} />
              )}
              {activeType === "note" && (
                <div className="h-[400px]">
                  <NoteCaptureForm onSuccess={handleSuccess} onCancel={() => handleOpenChange(false)} />
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

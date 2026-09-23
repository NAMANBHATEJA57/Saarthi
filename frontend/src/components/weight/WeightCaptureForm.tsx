"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface WeightCaptureFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function WeightCaptureForm({ onSuccess, onCancel }: WeightCaptureFormProps) {
  const router = useRouter();
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || isNaN(parseFloat(weight))) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const res = await fetch("/api/weight-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight, unit: "kg", note }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to save weight");
      }
      
      router.refresh();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || "Couldn't save weight. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="space-y-4">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-[hsl(var(--ink-secondary))] mb-2">
            Weight (kg)
          </label>
          <input
            id="weight"
            type="number"
            step="0.1"
            min="1"
            max="500"
            inputMode="decimal"
            autoFocus
            required
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="w-full text-4xl font-semibold bg-transparent border-b-2 border-[hsl(var(--hairline))] focus:border-[hsl(var(--primary))] outline-none py-2 transition-colors"
            placeholder="0.0"
          />
        </div>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-[hsl(var(--ink-secondary))] mb-2">
            Note <span className="text-[hsl(var(--ink-muted))] font-normal">(Optional)</span>
          </label>
          <input
            id="note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full text-base bg-[hsl(var(--canvas))] border border-[hsl(var(--hairline))] focus:border-[hsl(var(--primary))] outline-none rounded-md px-4 py-3 transition-colors"
            placeholder="e.g. Morning, After gym"
            maxLength={500}
          />
        </div>
        
        {error && (
          <div className="text-sm text-red-500 font-medium p-3 bg-red-500/10 rounded-md">
            {error}
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-4 border-t border-[hsl(var(--hairline))] mt-auto">
        {onCancel && (
          <Button 
            type="button" 
            variant="secondary" 
            className="flex-1 bg-[hsl(var(--surface))] border-[hsl(var(--hairline))]"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          className="flex-1"
          disabled={!weight || isSubmitting}
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Weight
        </Button>
      </div>
    </form>
  );
}

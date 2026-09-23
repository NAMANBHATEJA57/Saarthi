"use client";

import { useState, useEffect } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";

export function RestTimer({ defaultSeconds = 90 }: { defaultSeconds?: number }) {
  const [timeLeft, setTimeLeft] = useState(defaultSeconds);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsActive(false);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setIsActive(false);
    setTimeLeft(defaultSeconds);
  };
  const addTime = (secs: number) => setTimeLeft((t) => t + secs);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center p-4 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded-xl">
      <div className="text-xs font-semibold text-[hsl(var(--ink-secondary))] tracking-wider mb-2 uppercase">Rest Timer</div>
      <div className="text-4xl font-light tabular-nums text-[hsl(var(--ink))]">{formatTime(timeLeft)}</div>
      
      <div className="flex items-center gap-3 mt-4">
        <button onClick={toggle} className="w-10 h-10 flex items-center justify-center rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--surface))] hover:opacity-90">
          {isActive ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>
        <button onClick={reset} className="w-10 h-10 flex items-center justify-center rounded-full border border-[hsl(var(--hairline))] text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))]">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      <div className="flex gap-2 mt-4">
        <button onClick={() => addTime(30)} className="px-3 py-1 text-xs rounded-md bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] hover:border-[hsl(var(--ink-tertiary))]">+30s</button>
        <button onClick={() => addTime(60)} className="px-3 py-1 text-xs rounded-md bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))] hover:border-[hsl(var(--ink-tertiary))]">+60s</button>
      </div>
    </div>
  );
}

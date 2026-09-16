"use client";

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Globe, Clock } from 'lucide-react';

export function CalendarClient({ initialTasks }: { initialTasks: any[] }) {
  const [tasks] = useState(initialTasks);
  const [currentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const renderEvent = (task: any) => {
    const timeDisplay = task.startTime ? format(parseISO(task.startTime), 'h:mm a') : null;
    return (
      <div key={task.id} className="text-xs p-1.5 mb-1 bg-[hsl(var(--primary))] text-primary-foreground rounded truncate shadow-sm flex items-center justify-between group cursor-pointer hover:opacity-90">
        <div className="truncate">
          <span className="font-semibold mr-1">{timeDisplay}</span>
          {task.title}
        </div>
        {task.externalProvider && <Globe className="w-3 h-3 flex-shrink-0 opacity-70" />}
      </div>
    );
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      {/* Week View Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{format(currentDate, 'MMMM yyyy')}</h2>
        <div className="flex bg-[hsl(var(--surface))] rounded-lg p-1 border border-[hsl(var(--hairline))]">
          <button className="px-3 py-1 text-sm font-medium rounded-md bg-[hsl(var(--canvas))] shadow-sm">Week</button>
          <button className="px-3 py-1 text-sm font-medium text-[hsl(var(--ink-secondary))]">Month</button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-[hsl(var(--hairline))] border border-[hsl(var(--hairline))] rounded-xl overflow-hidden">
        {weekDays.map(day => (
          <div key={day.toISOString()} className="bg-[hsl(var(--canvas))] p-2 min-h-[120px]">
            <div className="text-center mb-2">
              <div className="text-[10px] font-semibold text-[hsl(var(--ink-secondary))] uppercase">{format(day, 'EEE')}</div>
              <div className={`text-lg font-medium w-8 h-8 mx-auto flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-[hsl(var(--primary))] text-primary-foreground' : ''}`}>
                {format(day, 'd')}
              </div>
            </div>
            
            <div className="space-y-1 mt-2">
              {tasks
                .filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), day))
                .sort((a, b) => {
                  if (a.startTime && b.startTime) return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
                  return 0;
                })
                .map(t => renderEvent(t))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

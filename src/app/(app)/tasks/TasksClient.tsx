"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, CheckSquare, Edit, Trash2, Calendar as CalendarIcon, Clock, Globe } from 'lucide-react';
import { RelationshipManager } from '@/components/relationships/RelationshipManager';
import { EmptyState } from '@/components/shared/EmptyState';
import { isToday, isTomorrow, format, parseISO } from 'date-fns';

export function TasksClient({ initialOpenTasks, initialCompletedTasks }: { initialOpenTasks: any[], initialCompletedTasks: any[] }) {
  const [openTasks, setOpenTasks] = useState(initialOpenTasks);
  const [completedTasks, setCompletedTasks] = useState(initialCompletedTasks);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleComplete = async (task: any) => {
    if (loading) return;
    setLoading(true);
    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    
    // Optimistic UI update
    if (newStatus === 'completed') {
      setOpenTasks(prev => prev.filter(t => t.id !== task.id));
      setCompletedTasks(prev => [{ ...task, status: 'completed' }, ...prev]);
    } else {
      setCompletedTasks(prev => prev.filter(t => t.id !== task.id));
      setOpenTasks(prev => [...prev, { ...task, status: 'todo' }]); 
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed');
      
      const refetchRes = await fetch(`/api/tasks`);
      if (refetchRes.ok) {
        const d = await refetchRes.json();
        setOpenTasks(d.tasks);
      }
      const refetchCompRes = await fetch(`/api/tasks?type=completed`);
      if (refetchCompRes.ok) {
        const d = await refetchCompRes.json();
        setCompletedTasks(d.tasks);
      }
    } catch (e) {
      window.location.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId: string, isOpen: boolean) => {
    if (!confirm('Move to trash?')) return;
    
    if (isOpen) setOpenTasks(prev => prev.filter(t => t.id !== taskId));
    else setCompletedTasks(prev => prev.filter(t => t.id !== taskId));

    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
  };

  const renderTask = (task: any, isOpen: boolean) => {
    const timeDisplay = task.startTime ? format(parseISO(task.startTime), 'h:mm a') : null;
    
    return (
      <div key={task.id} className="flex items-start gap-3 p-4 bg-[hsl(var(--surface))] rounded-xl border border-[hsl(var(--hairline))] shadow-sm group hover:border-[hsl(var(--primary))] transition-all">
        <button 
          onClick={() => handleToggleComplete(task)}
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 ${task.status === 'completed' ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))]' : 'border-[hsl(var(--ink-muted))]'} flex items-center justify-center transition-colors`}
        >
          {task.status === 'completed' && <CheckSquare className="w-4 h-4 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-base font-medium ${task.status === 'completed' ? 'line-through text-[hsl(var(--ink-secondary))]' : 'text-[hsl(var(--ink))]'}`}>
            {task.title}
          </p>
          
          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[hsl(var(--ink-secondary))]">
            {timeDisplay && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {timeDisplay}
              </span>
            )}
            
            {task.externalProvider && (
              <span className="flex items-center gap-1 bg-[hsl(var(--surface-elevated))] px-1.5 py-0.5 rounded capitalize">
                <Globe className="w-3 h-3" />
                {task.externalProvider}
              </span>
            )}
            
            {task.priority !== 'normal' && (
              <span className={`px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold ${task.priority === 'high' ? 'bg-[hsl(var(--destructive-muted))] text-[hsl(var(--destructive))]' : 'bg-blue-500/10 text-blue-500'}`}>
                {task.priority}
              </span>
            )}
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
          <button className="text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))] p-1"><Edit className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(task.id, isOpen)} className="text-[hsl(var(--ink-secondary))] hover:text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  // Grouping
  const todayTasks = openTasks.filter(t => t.dueDate && isToday(parseISO(t.dueDate)));
  const tomorrowTasks = openTasks.filter(t => t.dueDate && isTomorrow(parseISO(t.dueDate)));
  const upcomingTasks = openTasks.filter(t => t.dueDate && !isToday(parseISO(t.dueDate)) && !isTomorrow(parseISO(t.dueDate)));
  const noDateTasks = openTasks.filter(t => !t.dueDate);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {openTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8" />}
          title="You're all caught up!"
          description="Enjoy your day or create a new task when you're ready."
        />
      ) : (
        <div className="space-y-8">
          
          {todayTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--ink-secondary))]">Today</h2>
              <div className="space-y-2">{todayTasks.map(t => renderTask(t, true))}</div>
            </div>
          )}

          {tomorrowTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--ink-secondary))]">Tomorrow</h2>
              <div className="space-y-2">{tomorrowTasks.map(t => renderTask(t, true))}</div>
            </div>
          )}

          {upcomingTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--ink-secondary))]">Upcoming</h2>
              <div className="space-y-2">{upcomingTasks.map(t => renderTask(t, true))}</div>
            </div>
          )}

          {noDateTasks.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--ink-secondary))]">Someday</h2>
              <div className="space-y-2">{noDateTasks.map(t => renderTask(t, true))}</div>
            </div>
          )}

        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="pt-6 border-t border-[hsl(var(--hairline))]">
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--ink-secondary))]"
          >
            {showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Completed ({completedTasks.length})
          </button>
          
          {showCompleted && (
            <div className="space-y-2 mt-4 opacity-60">
              {completedTasks.map(t => renderTask(t, false))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

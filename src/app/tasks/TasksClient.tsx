"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, CheckSquare, Edit, Trash2 } from 'lucide-react';
import { RelationshipManager } from '@/components/relationships/RelationshipManager';

export function TasksClient({ initialOpenTasks, initialCompletedTasks }: { initialOpenTasks: any[], initialCompletedTasks: any[] }) {
  const [openTasks, setOpenTasks] = useState(initialOpenTasks);
  const [completedTasks, setCompletedTasks] = useState(initialCompletedTasks);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggleComplete = async (task: any) => {
    if (loading) return;
    setLoading(true);
    const newStatus = task.completedAt ? 'open' : 'completed';
    
    // Optimistic UI update
    if (newStatus === 'completed') {
      setOpenTasks(prev => prev.filter(t => t.id !== task.id));
      setCompletedTasks(prev => [{ ...task, completedAt: new Date().toISOString() }, ...prev]);
    } else {
      setCompletedTasks(prev => prev.filter(t => t.id !== task.id));
      setOpenTasks(prev => [...prev, { ...task, completedAt: null }]); // Server will sort
    }

    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed');
      
      // Re-fetch to guarantee sort
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
      // Revert optimism if failed (simplified for MVP: just reload)
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

  const renderTask = (task: any, isOpen: boolean) => (
    <div key={task.id} className="flex items-start gap-3 p-3 bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--hairline))] group">
      <button 
        onClick={() => handleToggleComplete(task)}
        className={`mt-1 flex-shrink-0 w-6 h-6 rounded border ${task.completedAt ? 'bg-[hsl(var(--primary))] border-[hsl(var(--primary))]' : 'border-[hsl(var(--ink-muted))]'} flex items-center justify-center`}
      >
        {task.completedAt && <CheckSquare className="w-4 h-4 text-white" />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${task.completedAt ? 'line-through text-[hsl(var(--ink-secondary))]' : ''}`}>
          {task.title}
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[hsl(var(--ink-muted))]">
          {task.priority !== 'normal' && (
            <span className={`px-1.5 py-0.5 rounded-sm ${task.priority === 'high' ? 'bg-red-500/20 text-red-500' : 'bg-blue-500/20 text-blue-500'}`}>
              {task.priority}
            </span>
          )}
          {task.dueDate && <span>Due: {task.dueDate}</span>}
          {task.remark && <span className="truncate max-w-[200px] block">{task.remark}</span>}
        </div>
        <div className="mt-3 pt-3 border-t border-[hsl(var(--hairline))]">
          <RelationshipManager sourceType="task" sourceId={task.id} />
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
        <button className="text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))]"><Edit className="w-4 h-4" /></button>
        <button onClick={() => handleDelete(task.id, isOpen)} className="text-[hsl(var(--ink-secondary))] hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {openTasks.length === 0 ? (
        <div className="p-8 text-center text-[hsl(var(--ink-secondary))] bg-[hsl(var(--surface))] rounded-lg border border-[hsl(var(--hairline))]">
          Nothing open right now.
        </div>
      ) : (
        <div className="space-y-2">
          {openTasks.map(t => renderTask(t, true))}
        </div>
      )}

      {completedTasks.length > 0 && (
        <div className="pt-6">
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--ink-secondary))]"
          >
            {showCompleted ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            Completed ({completedTasks.length})
          </button>
          
          {showCompleted && (
            <div className="space-y-2 mt-4 opacity-70">
              {completedTasks.map(t => renderTask(t, false))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

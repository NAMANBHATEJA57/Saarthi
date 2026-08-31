"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TaskCaptureForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [remark, setRemark] = useState('');
  const [priority, setPriority] = useState<'low'|'normal'|'high'>('normal');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          remark,
          priority,
          dueDate: dueDate || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save task');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Task Title</Label>
        <Input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="What do you need to do?" 
          required 
          autoFocus 
          className="text-lg h-12"
        />
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <div className="flex gap-2 p-1 bg-[hsl(var(--surface))] rounded-lg">
          <Button type="button" variant={priority === 'low' ? 'primary' : 'utility'} className="flex-1 text-xs px-2" onClick={() => setPriority('low')}>Low</Button>
          <Button type="button" variant={priority === 'normal' ? 'primary' : 'utility'} className="flex-1 text-xs px-2" onClick={() => setPriority('normal')}>Normal</Button>
          <Button type="button" variant={priority === 'high' ? 'primary' : 'utility'} className="flex-1 text-xs px-2" onClick={() => setPriority('high')}>High</Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Due Date (Optional)</Label>
        <Input 
          type="date" 
          value={dueDate} 
          onChange={(e) => setDueDate(e.target.value)} 
        />
      </div>

      <div className="space-y-2">
        <Label>Remark (Optional)</Label>
        <Input 
          type="text" 
          value={remark} 
          onChange={(e) => setRemark(e.target.value)} 
          placeholder="Any extra context?" 
        />
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="utility" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}

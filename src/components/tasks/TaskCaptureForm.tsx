"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addDays } from 'date-fns';

export function TaskCaptureForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<'low'|'normal'|'high'>('normal');
  const [dateType, setDateType] = useState<'today'|'tomorrow'|'custom'>('today');
  const [customDate, setCustomDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [calendarId, setCalendarId] = useState('saarthi_local');
  const [reminder, setReminder] = useState('none');
  
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/calendar/accounts')
      .then(res => res.json())
      .then(data => {
        if (data.accounts) setAccounts(data.accounts);
      })
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    setError('');
    setLoading(true);

    try {
      let finalDate = null;
      if (dateType === 'today') finalDate = format(new Date(), 'yyyy-MM-dd');
      if (dateType === 'tomorrow') finalDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
      if (dateType === 'custom' && customDate) finalDate = customDate;

      let startIso = null;
      let endIso = null;

      if (finalDate && startTime) {
        startIso = new Date(`${finalDate}T${startTime}:00`).toISOString();
      }
      if (finalDate && endTime) {
        endIso = new Date(`${finalDate}T${endTime}:00`).toISOString();
      }

      const payload: any = {
        title,
        priority,
        dueDate: finalDate,
        startTime: startIso,
        endTime: endIso,
        reminderMinutes: reminder === 'none' ? null : parseInt(reminder, 10),
      };

      if (calendarId !== 'saarthi_local') {
        const acc = accounts.find(a => a.id === calendarId);
        if (acc) {
          payload.externalProvider = acc.provider;
          payload.externalAccountId = acc.id;
        }
      }

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save task');

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">What needs to be done?</Label>
        <Input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="e.g. Call mom tomorrow at 7pm" 
          required 
          autoFocus 
          className="text-lg h-12 bg-[hsl(var(--surface))] border-none shadow-sm ring-1 ring-[hsl(var(--hairline))] focus-visible:ring-[hsl(var(--primary))]"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">When?</Label>
        <div className="flex gap-2">
          <Button type="button" variant={dateType === 'today' ? 'primary' : 'secondary'} className="flex-1" onClick={() => setDateType('today')}>Today</Button>
          <Button type="button" variant={dateType === 'tomorrow' ? 'primary' : 'secondary'} className="flex-1" onClick={() => setDateType('tomorrow')}>Tomorrow</Button>
          <Button type="button" variant={dateType === 'custom' ? 'primary' : 'secondary'} className="flex-1" onClick={() => setDateType('custom')}>Pick date</Button>
        </div>
        {dateType === 'custom' && (
          <Input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="mt-2" />
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Start Time</Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">End Time</Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Calendar</Label>
          <Select value={calendarId} onValueChange={setCalendarId}>
            <SelectTrigger>
              <SelectValue placeholder="Select calendar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="saarthi_local">Saarthi</SelectItem>
              {accounts.map(acc => (
                <SelectItem key={acc.id} value={acc.id} className="capitalize">
                  {acc.provider} ({acc.email || 'Connected'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Reminder</Label>
          <Select value={reminder} onValueChange={setReminder}>
            <SelectTrigger>
              <SelectValue placeholder="No reminder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="10">10 mins before</SelectItem>
              <SelectItem value="30">30 mins before</SelectItem>
              <SelectItem value="60">1 hour before</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <div className="text-destructive text-sm font-medium bg-[hsl(var(--destructive-muted))] p-3 rounded-md">{error}</div>}

      <div className="flex gap-3 pt-4 border-t border-[hsl(var(--hairline))]">
        <Button type="button" variant="secondary" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
          {loading ? 'Adding...' : 'Add Task'}
        </Button>
      </div>
    </form>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WeightPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/weight');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line
    fetchHistory();
  }, []);

  const addWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: parseFloat(weight), note })
      });
      if (res.ok) {
        setWeight('');
        setNote('');
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteEntry = async (id: string) => {
    try {
      const res = await fetch(`/api/weight/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchHistory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const chartData = [...history].reverse().map(entry => ({
    ...entry,
    dateStr: new Date(entry.recordedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weightNum: parseFloat(entry.weight)
  }));

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Weight Tracking</h1>
        <p className="text-muted-foreground mt-2">Log and monitor your body weight over time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Log Weight</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={addWeight} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Weight (kg)</label>
                <Input 
                  type="number" 
                  step="0.1" 
                  value={weight} 
                  onChange={e => setWeight(e.target.value)} 
                  placeholder="e.g. 75.5" 
                  required 
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note (optional)</label>
                <Input 
                  value={note} 
                  onChange={e => setNote(e.target.value)} 
                  placeholder="e.g. Morning, fasted" 
                />
              </div>
              <Button type="submit" className="w-full">Save Entry</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">Loading...</div>
            ) : chartData.length > 0 ? (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis 
                      dataKey="dateStr" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      domain={['auto', 'auto']}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}kg`}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weightNum" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">No data yet. Log your first weight!</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.length === 0 && !loading && (
              <p className="text-muted-foreground">No entries found.</p>
            )}
            {history.map(entry => (
              <div key={entry.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                <div>
                  <div className="font-semibold text-lg">{entry.weight} {entry.unit}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{new Date(entry.recordedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
                    {entry.note && (
                      <>
                        <span>•</span>
                        <span>{entry.note}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button variant="icon" onClick={() => deleteEntry(entry.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

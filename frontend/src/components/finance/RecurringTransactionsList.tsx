"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Repeat, Trash2, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import { format } from 'date-fns';

export function RecurringTransactionsList() {
  const [recurringTxs, setRecurringTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecurring();
  }, []);

  const fetchRecurring = async () => {
    try {
      const res = await fetch('/api/finance/recurring');
      if (res.ok) {
        const data = await res.json();
        setRecurringTxs(data.recurringTransactions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to stop this recurring transaction?')) return;
    
    try {
      const res = await fetch(`/api/finance/recurring?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecurringTxs(prev => prev.filter(t => t.id !== id));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete recurring transaction');
    }
  };

  if (loading) {
    return <div className="text-sm text-[hsl(var(--ink-secondary))] animate-pulse p-4">Loading recurring transactions...</div>;
  }

  if (recurringTxs.length === 0) {
    return (
      <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--hairline))] overflow-hidden">
        <CardContent className="p-8 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-[hsl(var(--surface-elevated))] flex items-center justify-center mb-4">
            <Repeat className="w-6 h-6 text-[hsl(var(--ink-muted))]" />
          </div>
          <p className="text-[hsl(var(--ink-secondary))] text-sm">No active recurring transactions.</p>
          <p className="text-[hsl(var(--ink-muted))] text-xs mt-1">
            You can create one by checking "Make this a recurring transaction" when adding a new transaction.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wider uppercase text-[hsl(var(--ink-secondary))]">Active Subscriptions & Bills</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recurringTxs.map(tx => {
          let Icon = ArrowUpRight;
          let color = 'text-[hsl(var(--destructive))]';
          let prefix = '-';
          
          if (tx.type === 'INCOME') {
            Icon = ArrowDownRight;
            color = 'text-[hsl(var(--success))]';
            prefix = '+';
          } else if (tx.type === 'TRANSFER') {
            Icon = ArrowRightLeft;
            color = 'text-[hsl(var(--primary))]';
            prefix = '';
          }
          
          return (
            <Card key={tx.id} className="bg-[hsl(var(--surface))] border-[hsl(var(--hairline))] overflow-hidden flex flex-col">
              <CardContent className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-md bg-[hsl(var(--surface-elevated))]`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <span className="font-semibold text-sm line-clamp-1">{tx.merchant || tx.description}</span>
                    </div>
                    <Button variant="icon" className="h-6 w-6 shrink-0 text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--destructive))]" onClick={() => handleDelete(tx.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="text-2xl font-bold mb-1 mt-3">
                    <span className="text-[hsl(var(--ink-secondary))] font-normal">{prefix}₹</span>
                    {tx.amount.toLocaleString()}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4 text-xs font-medium bg-[hsl(var(--surface-elevated))] px-2.5 py-1 rounded-full w-max">
                    <Repeat className="w-3 h-3 text-[hsl(var(--ink-secondary))]" />
                    <span className="text-[hsl(var(--ink-secondary))]">{tx.frequency}</span>
                  </div>
                </div>
                
                <div className="mt-5 pt-4 border-t border-[hsl(var(--hairline))] flex justify-between items-center text-xs">
                  <span className="text-[hsl(var(--ink-muted))]">Next Due:</span>
                  <span className="font-medium text-[hsl(var(--ink))]">
                    {format(new Date(tx.nextDueDate), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

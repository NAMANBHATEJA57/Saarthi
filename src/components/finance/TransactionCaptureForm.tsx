"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TransactionCaptureForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetch('/api/finance/categories')
      .then(r => r.json())
      .then(d => {
        if (d.categories) setCategories(d.categories);
      })
      .catch(e => console.error("Failed to load categories", e));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (!categoryId) {
      setError('Select a category');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const amountMinor = Math.round(Number(amount)); // Since we treat INR as integer for simplicity in MVP

      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amountMinor,
          categoryId,
          remark,
          transactionDate: date,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to save transaction');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter(c => c.kind === type || c.kind === 'BOTH');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 p-1 bg-secondary rounded-lg">
        <Button
          type="button"
          variant={type === 'EXPENSE' ? 'primary' : 'utility'}
          className="flex-1"
          onClick={() => setType('EXPENSE')}
        >
          Expense
        </Button>
        <Button
          type="button"
          variant={type === 'INCOME' ? 'primary' : 'utility'}
          className="flex-1"
          onClick={() => setType('INCOME')}
        >
          Income
        </Button>
      </div>

      <div className="space-y-2">
        <Label>Amount (₹)</Label>
        <Input 
          type="number" 
          value={amount} 
          onChange={(e) => setAmount(e.target.value)} 
          placeholder="0.00" 
          step="1"
          required 
          autoFocus 
          className="text-2xl h-12"
        />
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <div className="grid grid-cols-3 gap-2">
          {filteredCategories.map(cat => (
            <div
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              className={`p-2 border rounded-md text-center text-sm cursor-pointer transition-colors ${categoryId === cat.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
            >
              {cat.name}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label>Remark (Optional)</Label>
        <Input 
          type="text" 
          value={remark} 
          onChange={(e) => setRemark(e.target.value)} 
          placeholder="What was this for?" 
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

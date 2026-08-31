"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function TransactionCaptureForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER' | 'CREDIT_CARD_PAYMENT'>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [remark, setRemark] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetch('/api/finance/categories')
      .then(r => r.json())
      .then(d => { if (d.categories) setCategories(d.categories); })
      .catch(e => console.error("Failed to load categories", e));
      
    fetch('/api/finance/accounts')
      .then(r => r.json())
      .then(d => { 
        if (d.accounts) {
          setAccounts(d.accounts);
          if (d.accounts.length > 0) setAccountId(d.accounts[0].id);
        }
      })
      .catch(e => console.error("Failed to load accounts", e));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if ((type === 'EXPENSE' || type === 'INCOME') && !categoryId) {
      setError('Select a category');
      return;
    }
    if ((type === 'TRANSFER' || type === 'CREDIT_CARD_PAYMENT') && (!accountId || !destinationAccountId)) {
      setError('Select both source and destination accounts');
      return;
    }
    if (accountId === destinationAccountId && (type === 'TRANSFER' || type === 'CREDIT_CARD_PAYMENT')) {
      setError('Source and destination cannot be the same');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const amountMinor = Math.round(Number(amount));

      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amountMinor,
          categoryId: (type === 'EXPENSE' || type === 'INCOME') ? categoryId : undefined,
          accountId,
          destinationAccountId: (type === 'TRANSFER' || type === 'CREDIT_CARD_PAYMENT') ? destinationAccountId : undefined,
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
  
  // Account filters
  const sourceAccounts = type === 'CREDIT_CARD_PAYMENT' 
    ? accounts.filter(a => a.type === 'BANK_ACCOUNT') 
    : accounts;
    
  const destAccounts = type === 'CREDIT_CARD_PAYMENT'
    ? accounts.filter(a => a.type === 'CREDIT_CARD')
    : accounts;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 p-1 bg-secondary rounded-lg overflow-x-auto text-xs sm:text-sm">
        {(['EXPENSE', 'INCOME', 'TRANSFER', 'CREDIT_CARD_PAYMENT'] as const).map(t => (
          <Button
            key={t}
            type="button"
            variant={type === t ? 'primary' : 'utility'}
            className="flex-1 whitespace-nowrap px-2"
            onClick={() => { setType(t); setError(''); }}
          >
            {t === 'CREDIT_CARD_PAYMENT' ? 'CC Pay' : t.charAt(0) + t.slice(1).toLowerCase()}
          </Button>
        ))}
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
        <Label>{type === 'INCOME' ? 'Received Into' : 'Paid From'}</Label>
        <select 
          className="w-full h-10 px-3 py-2 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] text-sm"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
        >
          <option value="" disabled>Select account</option>
          {sourceAccounts.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </div>

      {(type === 'TRANSFER' || type === 'CREDIT_CARD_PAYMENT') && (
        <div className="space-y-2">
          <Label>To Account</Label>
          <select 
            className="w-full h-10 px-3 py-2 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] text-sm"
            value={destinationAccountId}
            onChange={(e) => setDestinationAccountId(e.target.value)}
            required
          >
            <option value="" disabled>Select account</option>
            {destAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {(type === 'EXPENSE' || type === 'INCOME') && (
        <div className="space-y-2">
          <Label>Category</Label>
          <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto p-1">
            {filteredCategories.map(cat => (
              <div
                key={cat.id}
                onClick={() => setCategoryId(cat.id)}
                className={`p-2 border rounded-md text-center text-xs cursor-pointer transition-colors ${categoryId === cat.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'}`}
              >
                {cat.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Remark</Label>
          <Input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      {error && <div className="text-destructive text-sm">{error}</div>}

      <div className="flex gap-2 pt-4 border-t border-[hsl(var(--hairline))] mt-4 pt-4">
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

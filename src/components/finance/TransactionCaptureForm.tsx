"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2 } from 'lucide-react';

export function TransactionCaptureForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER' | 'CREDIT_CARD_PURCHASE' | 'CREDIT_CARD_PAYMENT'>('EXPENSE');
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

  // Inline Category Creation State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCatLoading, setCreatingCatLoading] = useState(false);
  
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
          const bankAccounts = d.accounts.filter((a: any) => a.type === 'BANK_ACCOUNT');
          if (bankAccounts.length > 0) setAccountId(bankAccounts[0].id);
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
    const needsCategory = type === 'EXPENSE' || type === 'INCOME' || type === 'CREDIT_CARD_PURCHASE';
    if (needsCategory && !categoryId) {
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
    if ((type === 'EXPENSE' || type === 'INCOME' || type === 'CREDIT_CARD_PURCHASE') && !accountId) {
      setError('Select an account');
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
          categoryId: needsCategory ? categoryId : undefined,
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setCreatingCatLoading(true);
    try {
      const kind = type === 'INCOME' ? 'INCOME' : 'EXPENSE';
      const res = await fetch('/api/finance/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName, kind })
      });
      if (!res.ok) throw new Error("Failed to create category");
      const data = await res.json();
      setCategories([...categories, data.category]);
      setCategoryId(data.category.id);
      setIsCreatingCategory(false);
      setNewCategoryName('');
    } catch (e) {
      console.error(e);
      setError("Failed to create category");
    } finally {
      setCreatingCatLoading(false);
    }
  };

  const categoryKind = type === 'INCOME' ? 'INCOME' : 'EXPENSE';
  const filteredCategories = categories.filter(c => c.kind === categoryKind || c.kind === 'BOTH');
  
  // Account filters based on type
  let sourceAccounts = accounts;
  let destAccounts = accounts;

  if (type === 'CREDIT_CARD_PURCHASE') {
    sourceAccounts = accounts.filter(a => a.type === 'CREDIT_CARD');
  } else if (type === 'CREDIT_CARD_PAYMENT') {
    sourceAccounts = accounts.filter(a => a.type === 'BANK_ACCOUNT');
    destAccounts = accounts.filter(a => a.type === 'CREDIT_CARD');
  } else if (type === 'INCOME' || type === 'EXPENSE') {
    // For normal expense/income, prefer bank accounts or cash, though users could use CC for expense. 
    // We created CREDIT_CARD_PURCHASE explicitly, so EXPENSE might just be bank/cash.
    // Let's allow all just in case, but usually EXPENSE is from bank.
    sourceAccounts = accounts.filter(a => a.type === 'BANK_ACCOUNT');
  }

  // Pre-select logic when changing types
  useEffect(() => {
    if (type === 'CREDIT_CARD_PURCHASE' && sourceAccounts.length > 0) {
      setAccountId(sourceAccounts[0].id);
    } else if (type === 'CREDIT_CARD_PAYMENT') {
      if (sourceAccounts.length > 0) setAccountId(sourceAccounts[0].id);
      if (destAccounts.length > 0) setDestinationAccountId(destAccounts[0].id);
    } else if (type === 'EXPENSE' || type === 'INCOME' || type === 'TRANSFER') {
      if (sourceAccounts.length > 0 && !sourceAccounts.find(a => a.id === accountId)) {
        setAccountId(sourceAccounts[0].id);
      }
    }
  }, [type, accounts]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 p-1 bg-secondary rounded-lg overflow-x-auto text-xs sm:text-sm custom-scrollbar pb-2">
        {(['EXPENSE', 'INCOME', 'TRANSFER', 'CREDIT_CARD_PURCHASE', 'CREDIT_CARD_PAYMENT'] as const).map(t => (
          <Button
            key={t}
            type="button"
            variant={type === t ? 'primary' : 'utility'}
            className="flex-shrink-0 px-3 whitespace-nowrap"
            onClick={() => { setType(t); setError(''); setIsCreatingCategory(false); }}
          >
            {t === 'CREDIT_CARD_PURCHASE' ? 'CC Purchase' : t === 'CREDIT_CARD_PAYMENT' ? 'CC Payment' : t.charAt(0) + t.slice(1).toLowerCase()}
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
          className="text-2xl h-12 bg-[hsl(var(--canvas))]"
        />
      </div>

      <div className="space-y-2">
        <Label>
          {type === 'INCOME' ? 'Received Into' : 
           type === 'CREDIT_CARD_PURCHASE' ? 'Paid with Card' : 
           type === 'CREDIT_CARD_PAYMENT' ? 'Pay From (Bank)' : 'Paid From'}
        </Label>
        <select 
          className="w-full h-10 px-3 py-2 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] text-sm"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          required
        >
          <option value="" disabled>Select account</option>
          {sourceAccounts.map(a => (
            <option key={a.id} value={a.id}>{a.name} (₹{a.balanceMinor.toLocaleString()})</option>
          ))}
        </select>
      </div>

      {(type === 'TRANSFER' || type === 'CREDIT_CARD_PAYMENT') && (
        <div className="space-y-2">
          <Label>{type === 'CREDIT_CARD_PAYMENT' ? 'To Credit Card' : 'To Account'}</Label>
          <select 
            className="w-full h-10 px-3 py-2 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] text-sm"
            value={destinationAccountId}
            onChange={(e) => setDestinationAccountId(e.target.value)}
            required
          >
            <option value="" disabled>Select destination</option>
            {destAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} (₹{a.balanceMinor.toLocaleString()})</option>
            ))}
          </select>
        </div>
      )}

      {(type === 'EXPENSE' || type === 'INCOME' || type === 'CREDIT_CARD_PURCHASE') && (
        <div className="space-y-2">
          <Label>Category</Label>
          
          {isCreatingCategory ? (
            <div className="flex gap-2 p-2 border border-[hsl(var(--hairline))] rounded-lg bg-[hsl(var(--canvas))]">
              <Input 
                autoFocus
                placeholder="New category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="h-8"
              />
              <Button type="button" variant="primary" className="h-8 px-3 text-xs" onClick={handleCreateCategory} disabled={creatingCatLoading}>
                {creatingCatLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
              </Button>
              <Button type="button" variant="utility" className="h-8 px-3 text-xs" onClick={() => setIsCreatingCategory(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
              {filteredCategories.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => setCategoryId(cat.id)}
                  className={`p-2 border border-[hsl(var(--hairline))] rounded-md text-center text-xs cursor-pointer transition-colors ${categoryId === cat.id ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' : 'bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-elevated))]'}`}
                >
                  {cat.name}
                </div>
              ))}
              <div
                onClick={() => setIsCreatingCategory(true)}
                className="p-2 border border-dashed border-[hsl(var(--ink-muted))] rounded-md text-center text-xs cursor-pointer text-[hsl(var(--ink-secondary))] hover:bg-[hsl(var(--surface))] flex items-center justify-center gap-1 transition-colors"
              >
                <Plus className="w-3 h-3" /> Create
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-10 bg-[hsl(var(--canvas))]" />
        </div>
        <div className="space-y-2">
          <Label>Remark / Merchant</Label>
          <Input type="text" value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Optional" className="h-10 bg-[hsl(var(--canvas))]" />
        </div>
      </div>

      {error && <div className="text-destructive text-sm font-medium">{error}</div>}

      <div className="flex gap-2 pt-4 border-t border-[hsl(var(--hairline))] mt-4">
        <Button type="button" variant="utility" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1" disabled={loading}>
          {loading ? 'Recording...' : 'Record Transaction'}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, ArrowDownRight, ArrowUpRight, ArrowRightLeft, Landmark, X } from 'lucide-react';
import { format } from 'date-fns';

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string; prefix: string }> = {
  INCOME:              { label: 'Income',       icon: ArrowDownRight, color: 'text-[hsl(var(--success))]', bgColor: 'bg-[hsl(var(--success))]/10', prefix: '+' },
  EXPENSE:             { label: 'Expense',      icon: ArrowUpRight,   color: 'text-[hsl(var(--destructive))]',     bgColor: 'bg-[hsl(var(--destructive))]/10',     prefix: '-' },
  TRANSFER:            { label: 'Transfer',     icon: ArrowRightLeft, color: 'text-[hsl(var(--primary))]',  bgColor: 'bg-[hsl(var(--primary))]/10',  prefix: '' },
  CREDIT_CARD_PAYMENT: { label: 'CC Payment',   icon: Landmark,       color: 'text-[hsl(var(--info))]',    bgColor: 'bg-[hsl(var(--info))]/10',    prefix: '' },
};

export function TransactionCaptureForm({ 
  onSuccess, 
  onCancel,
  defaultType = 'EXPENSE'
}: { 
  onSuccess: () => void; 
  onCancel: () => void;
  defaultType?: 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'CREDIT_CARD_PAYMENT';
}) {
  const [type, setType] = useState<'EXPENSE' | 'INCOME' | 'TRANSFER' | 'CREDIT_CARD_PAYMENT'>(defaultType);
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [incomeTypeId, setIncomeTypeId] = useState<string>('');
  const [savingsGoalId, setSavingsGoalId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [destinationAccountId, setDestinationAccountId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Inline Category Creation State
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingCatLoading, setCreatingCatLoading] = useState(false);
  
  useEffect(() => {
    fetch('/api/finance/categories').then(r => r.json()).then(d => { if (d.categories) setCategories(d.categories); });
    fetch('/api/finance/income-types').then(r => r.json()).then(d => { if (d.incomeTypes) setIncomeTypes(d.incomeTypes); });
    fetch('/api/finance/savings-goals').then(r => r.json()).then(d => { if (d.savingsGoals) setSavingsGoals(d.savingsGoals); });
      
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
    
    if (type === 'EXPENSE' && !categoryId) {
      setError('Select a category');
      return;
    }
    
    if (type === 'INCOME' && !incomeTypeId) {
      setError('Select an income type');
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
    if ((type === 'EXPENSE' || type === 'INCOME') && !accountId) {
      setError('Select an account');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const amountParsed = Number(amount);

      const res = await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: amountParsed,
          categoryId: type === 'EXPENSE' ? categoryId : undefined,
          incomeTypeId: type === 'INCOME' ? incomeTypeId : undefined,
          savingsGoalId: type === 'EXPENSE' ? (savingsGoalId || undefined) : undefined,
          accountId,
          destinationAccountId: (type === 'TRANSFER' || type === 'CREDIT_CARD_PAYMENT') ? destinationAccountId : undefined,
          description,
          merchant,
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
      const endpoint = type === 'INCOME' ? '/api/finance/income-types' : '/api/finance/categories';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (!res.ok) throw new Error("Failed to create category");
      const data = await res.json();
      
      if (type === 'INCOME') {
        setIncomeTypes([...incomeTypes, data.incomeType]);
        setIncomeTypeId(data.incomeType.id);
      } else {
        setCategories([...categories, data.category]);
        setCategoryId(data.category.id);
      }
      
      setIsCreatingCategory(false);
      setNewCategoryName('');
    } catch (e) {
      console.error(e);
      setError("Failed to create category");
    } finally {
      setCreatingCatLoading(false);
    }
  };

  // Account filters based on type
  let sourceAccounts = accounts;
  let destAccounts = accounts;

  if (type === 'CREDIT_CARD_PAYMENT') {
    sourceAccounts = accounts.filter(a => a.type === 'BANK_ACCOUNT');
    destAccounts = accounts.filter(a => a.type === 'CREDIT_CARD');
  }

  // Pre-select logic when changing types
  useEffect(() => {
    if (type === 'CREDIT_CARD_PAYMENT') {
      if (sourceAccounts.length > 0) setAccountId(sourceAccounts[0].id);
      if (destAccounts.length > 0) setDestinationAccountId(destAccounts[0].id);
    } else if (type === 'EXPENSE' || type === 'INCOME' || type === 'TRANSFER') {
      if (sourceAccounts.length > 0 && !sourceAccounts.find(a => a.id === accountId)) {
        setAccountId(sourceAccounts[0].id);
      }
    }
  }, [type, accounts]);

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.EXPENSE;
  const Icon = cfg.icon;

  return (
    <div className="relative">
      {/* Type switcher pills on top of the hero */}
      <div className={`relative p-6 pb-5 ${cfg.bgColor}`}>
        <button onClick={onCancel} className="absolute top-4 right-4 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))] transition-colors z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-2 mb-6">
          {(['EXPENSE', 'INCOME', 'TRANSFER', 'CREDIT_CARD_PAYMENT'] as const).map(t => (
            <button
              key={t}
              type="button"
              className={`px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider uppercase transition-colors ${type === t ? 'bg-[hsl(var(--ink))] text-[hsl(var(--surface))]' : 'bg-black/5 dark:bg-white/5 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))]'}`}
              onClick={() => { setType(t); setError(''); setIsCreatingCategory(false); }}
            >
              {t === 'CREDIT_CARD_PAYMENT' ? 'CC Pay' : t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bgColor} border border-white/10`}>
            <Icon className={`w-5 h-5 ${cfg.color}`} />
          </div>
          <div>
            <p className={`text-xs font-semibold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</p>
            <p className="text-[hsl(var(--ink-secondary))] text-xs">
              {date ? format(new Date(date), 'd MMM yyyy') : 'No date'}
            </p>
          </div>
        </div>

        {/* Editable big amount */}
        <div className="flex items-baseline gap-1">
          <span className="text-2xl text-[hsl(var(--ink-secondary))] font-light shrink-0 whitespace-nowrap">{cfg.prefix}₹</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="text-4xl font-bold bg-transparent border-none outline-none text-[hsl(var(--ink))] w-full min-w-0 placeholder:text-[hsl(var(--ink-muted))]"
            placeholder="0.00"
            autoFocus
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
        
        <div className="space-y-1.5">
          <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">
            {type === 'INCOME' ? 'Received Into' : type === 'CREDIT_CARD_PAYMENT' ? 'Pay From (Bank)' : 'Paid From'}
          </Label>
          <select 
            className="w-full h-11 px-3 py-2 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-elevated))] text-sm appearance-none"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            required
          >
            <option value="" disabled>Select account</option>
            {sourceAccounts.map(a => (
              <option key={a.id} value={a.id}>{a.name}{a.lastFour ? ` (••••${a.lastFour})` : ''}</option>
            ))}
          </select>
        </div>

        {(type === 'TRANSFER' || type === 'CREDIT_CARD_PAYMENT') && (
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">
              {type === 'CREDIT_CARD_PAYMENT' ? 'To Credit Card' : 'To Account'}
            </Label>
            <select 
              className="w-full h-11 px-3 py-2 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-elevated))] text-sm appearance-none"
              value={destinationAccountId}
              onChange={(e) => setDestinationAccountId(e.target.value)}
              required
            >
              <option value="" disabled>Select destination</option>
              {destAccounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}{a.lastFour ? ` (••••${a.lastFour})` : ''}</option>
              ))}
            </select>
          </div>
        )}

        {(type === 'EXPENSE' || type === 'INCOME') && (
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">{type === 'INCOME' ? 'Income Type' : 'Category'}</Label>
            
            {isCreatingCategory ? (
              <div className="flex gap-2 p-2 border border-[hsl(var(--hairline))] rounded-xl bg-[hsl(var(--surface-elevated))]">
                <Input 
                  autoFocus
                  placeholder="New name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="h-9 border-none bg-transparent"
                />
                <Button type="button" variant="primary" className="h-9 px-4 text-xs" onClick={handleCreateCategory} disabled={creatingCatLoading}>
                  {creatingCatLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
                </Button>
                <Button type="button" variant="utility" className="h-9 px-4 text-xs" onClick={() => setIsCreatingCategory(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                {(type === 'INCOME' ? incomeTypes : categories).map(cat => (
                  <div
                    key={cat.id}
                    onClick={() => type === 'INCOME' ? setIncomeTypeId(cat.id) : setCategoryId(cat.id)}
                    className={`p-2 border border-[hsl(var(--hairline))] rounded-lg text-center text-xs cursor-pointer transition-colors ${(type === 'INCOME' ? incomeTypeId : categoryId) === cat.id ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' : 'bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-elevated))]'}`}
                  >
                    {cat.name}
                  </div>
                ))}
                <div
                  onClick={() => setIsCreatingCategory(true)}
                  className="p-2 border border-dashed border-[hsl(var(--ink-muted))] rounded-lg text-center text-xs cursor-pointer text-[hsl(var(--ink-secondary))] hover:bg-[hsl(var(--surface))] flex items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Create
                </div>
              </div>
            )}
          </div>
        )}

        {type === 'EXPENSE' && savingsGoals.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold flex justify-between">
              <span>Spend from Fund <span className="font-normal">(Optional)</span></span>
              {savingsGoalId && (
                <span className="text-[hsl(var(--destructive))] font-normal cursor-pointer capitalize" onClick={() => setSavingsGoalId('')}>Clear</span>
              )}
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
              {savingsGoals.map(sg => (
                <div
                  key={sg.id}
                  onClick={() => {
                    if (savingsGoalId === sg.id) {
                      setSavingsGoalId('');
                    } else {
                      if (window.confirm(`Are you sure you want to spend from the ${sg.name} fund?`)) {
                        setSavingsGoalId(sg.id);
                      }
                    }
                  }}
                  className={`p-2 border border-[hsl(var(--hairline))] rounded-lg text-center text-xs cursor-pointer transition-colors ${savingsGoalId === sg.id ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' : 'bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-elevated))]'}`}
                >
                  {sg.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Merchant</Label>
            <Input type="text" value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="e.g. Swiggy" className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11 rounded-xl" />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Description / Note</Label>
          <Input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Salary, Amazon" className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11 rounded-xl" />
        </div>

        {error && <div className="text-[hsl(var(--destructive))] text-sm font-medium">{error}</div>}

        <div className="flex gap-3 pt-2 border-t border-[hsl(var(--hairline))] mt-4">
          <Button type="button" variant="utility" className="flex-1 h-11" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1 h-11 gap-2" disabled={loading}>
            {loading ? 'Recording...' : 'Record Transaction'}
          </Button>
        </div>
      </form>
    </div>
  );
}

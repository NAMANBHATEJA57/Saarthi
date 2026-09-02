"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, ArrowDownRight, ArrowUpRight, ArrowRightLeft, Landmark } from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string; prefix: string }> = {
  INCOME:              { label: 'Income',       icon: ArrowDownRight, color: 'text-[hsl(var(--success))]', bgColor: 'bg-[hsl(var(--success))]/10', prefix: '+' },
  EXPENSE:             { label: 'Expense',      icon: ArrowUpRight,   color: 'text-[hsl(var(--destructive))]',     bgColor: 'bg-[hsl(var(--destructive))]/10',     prefix: '-' },
  TRANSFER:            { label: 'Transfer',     icon: ArrowRightLeft, color: 'text-[hsl(var(--primary))]',  bgColor: 'bg-[hsl(var(--primary))]/10',  prefix: '' },
  CREDIT_CARD_PAYMENT: { label: 'CC Payment',   icon: Landmark,       color: 'text-[hsl(var(--info))]',    bgColor: 'bg-[hsl(var(--info))]/10',    prefix: '' },
};

export function EditableTransactionForm({ 
  transaction, 
  onChange,
  accounts,
  categories,
  incomeTypes,
  savingsGoals,
}: { 
  transaction: any; 
  onChange: (updates: any) => void;
  accounts: any[];
  categories: any[];
  incomeTypes: any[];
  savingsGoals: any[];
}) {
  const type = transaction.type === 'UNSUPPORTED' ? 'EXPENSE' : transaction.type;
  
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.EXPENSE;
  const Icon = cfg.icon;

  const sourceAccounts = accounts;
  let destAccounts = accounts;
  if (type === 'CREDIT_CARD_PAYMENT') {
    destAccounts = accounts.filter(a => a.type === 'CREDIT_CARD');
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
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
        onChange({ incomeTypeId: data.incomeType.id });
      } else {
        onChange({ categoryId: data.category.id });
      }
      setIsCreatingCategory(false);
      setNewCategoryName('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className={`p-6 pb-5 ${cfg.bgColor}`}>
        <div className="flex gap-2 mb-6 overflow-x-auto custom-scrollbar pb-1">
          {(['EXPENSE', 'INCOME', 'TRANSFER', 'CREDIT_CARD_PAYMENT'] as const).map(t => (
            <button
              key={t}
              type="button"
              className={`px-3 py-1.5 shrink-0 rounded-full text-[10px] sm:text-xs font-semibold tracking-wider uppercase transition-colors ${type === t ? 'bg-[hsl(var(--ink))] text-[hsl(var(--surface))]' : 'bg-black/5 dark:bg-white/5 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))]'}`}
              onClick={() => onChange({ type: t })}
            >
              {t === 'CREDIT_CARD_PAYMENT' ? 'CC Pay' : t}
            </button>
          ))}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl text-[hsl(var(--ink-secondary))] font-light shrink-0">{cfg.prefix}₹</span>
          <input
            type="number"
            step="1"
            value={transaction.amount || ''}
            onChange={e => onChange({ amount: e.target.value ? Number(e.target.value) : null })}
            className="text-4xl font-bold bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-[hsl(var(--ink))] w-full min-w-0 placeholder:text-[hsl(var(--ink-muted))]"
            placeholder="0"
          />
        </div>
      </div>

      <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
        <div className="space-y-1.5">
          <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">
            {type === 'INCOME' ? 'Received Into' : type === 'CREDIT_CARD_PAYMENT' ? 'Pay From (Bank)' : 'Paid From'}
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sourceAccounts.map((a: any) => (
              <div
                key={a.id}
                onClick={() => onChange({ accountId: a.id })}
                className={`p-2 border border-[hsl(var(--hairline))] rounded-lg text-center text-xs cursor-pointer transition-colors ${transaction.accountId === a.id ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' : 'bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-elevated))]'}`}
              >
                {a.name}{a.lastFour ? ` (••••${a.lastFour})` : ''}
              </div>
            ))}
          </div>
        </div>

        {(type === 'TRANSFER' || type === 'CREDIT_CARD_PAYMENT') && (
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">
              {type === 'CREDIT_CARD_PAYMENT' ? 'To Credit Card' : 'To Account'}
            </Label>
            <select 
              className="w-full h-11 px-3 py-2 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-elevated))] text-sm appearance-none"
              value={transaction.destinationAccountId || ''}
              onChange={(e) => onChange({ destinationAccountId: e.target.value })}
            >
              <option value="" disabled>Select destination</option>
              {destAccounts.map((a: any) => (
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
                <Button type="button" variant="primary" className="h-9 px-4 text-xs" onClick={handleCreateCategory}>
                  Save
                </Button>
                <Button type="button" variant="utility" className="h-9 px-4 text-xs" onClick={() => setIsCreatingCategory(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                {(type === 'INCOME' ? incomeTypes : categories).map((cat: any) => (
                  <div
                    key={cat.id}
                    onClick={() => onChange(type === 'INCOME' ? { incomeTypeId: cat.id } : { categoryId: cat.id })}
                    className={`p-2 border border-[hsl(var(--hairline))] rounded-lg text-center text-xs cursor-pointer transition-colors ${(type === 'INCOME' ? transaction.incomeTypeId : transaction.categoryId) === cat.id ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' : 'bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-elevated))]'}`}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Merchant</Label>
            <Input type="text" value={transaction.merchant || ''} onChange={(e) => onChange({ merchant: e.target.value })} placeholder="e.g. Swiggy" className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11 rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Date</Label>
            <Input type="date" value={transaction.date || transaction.transactionDate || ''} onChange={(e) => onChange({ transactionDate: e.target.value, date: e.target.value })} className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11 rounded-xl" />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Notes / Ref</Label>
          <Input type="text" value={transaction.notes || transaction.reference || ''} onChange={(e) => onChange({ notes: e.target.value })} placeholder="e.g. UPI Ref" className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Filter } from 'lucide-react';

export function TransactionFilters({ accounts, categories, filters, setFilters }: { accounts: any[], categories: any[], filters: any, setFilters: any }) {
  const [open, setOpen] = useState(false);

  const toggleAccount = (id: string) => {
    setFilters((prev: any) => ({
      ...prev,
      accountIds: prev.accountIds.includes(id) 
        ? prev.accountIds.filter((i: string) => i !== id) 
        : [...prev.accountIds, id]
    }));
  };

  const toggleCategory = (id: string) => {
    setFilters((prev: any) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id) 
        ? prev.categoryIds.filter((i: string) => i !== id) 
        : [...prev.categoryIds, id]
    }));
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="secondary" className="h-11 px-4 gap-2 border border-[hsl(var(--hairline))]">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-[hsl(var(--surface))] border-l border-[hsl(var(--hairline))] p-6 space-y-8 overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Filter Transactions</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--ink-secondary))]">Type</h4>
          <div className="grid grid-cols-2 gap-2">
            {['all', 'income', 'expense', 'transfer', 'credit_card_payment', 'refund'].map(type => (
              <Button 
                key={type} 
                variant={filters.type === type ? 'primary' : 'utility'} 
                className="justify-start capitalize text-xs h-8"
                onClick={() => setFilters((p: any) => ({ ...p, type }))}
              >
                {type.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--ink-secondary))]">Accounts</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
            {accounts.map(acc => (
              <label key={acc.id} className="flex items-center gap-2 p-1.5 hover:bg-[hsl(var(--surface-elevated))] rounded cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] text-[hsl(var(--primary))]" 
                  checked={filters.accountIds.includes(acc.id)}
                  onChange={() => toggleAccount(acc.id)}
                />
                <span className="text-sm truncate">{acc.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--ink-secondary))]">Categories</h4>
          <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
            {categories.map(cat => (
              <label key={cat.id} className="flex items-center gap-2 p-1.5 hover:bg-[hsl(var(--surface-elevated))] rounded cursor-pointer">
                <input 
                  type="checkbox" 
                  className="rounded border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] text-[hsl(var(--primary))]" 
                  checked={filters.categoryIds.includes(cat.id)}
                  onChange={() => toggleCategory(cat.id)}
                />
                <span className="text-sm truncate">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

      </SheetContent>
    </Sheet>
  );
}

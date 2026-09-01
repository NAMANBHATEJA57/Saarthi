"use client";

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, X } from 'lucide-react';
import { TransactionFilters } from '@/components/finance/TransactionFilters';
import { TransactionHistory } from '@/components/finance/TransactionHistory';
import { TransactionEditDrawer } from '@/components/finance/TransactionEditDrawer';

export function TransactionsClient({ accounts, categories, incomeTypes }: { accounts: any[], categories: any[], incomeTypes: any[] }) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    accountIds: [] as string[],
    categoryIds: [] as string[],
    startDate: '',
    endDate: ''
  });
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchTransactions = async (reset = false) => {
    setLoading(true);
    const offset = reset ? 0 : page * 50;
    
    let url = `/api/finance/transactions?limit=50&offset=${offset}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (filters.type !== 'all') url += `&type=${filters.type}`;
    if (filters.accountIds.length > 0) url += `&accountId=${filters.accountIds.join(',')}`;
    if (filters.categoryIds.length > 0) url += `&categoryId=${filters.categoryIds.join(',')}`;
    
    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (reset) {
          setTransactions(data.transactions);
        } else {
          setTransactions(prev => [...prev, ...data.transactions]);
        }
        setHasMore(data.transactions.length === 50);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    fetchTransactions(true);
  }, [search, filters]);

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--ink-secondary))]" />
          <Input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search merchants, notes..." 
            className="pl-9 h-11 bg-[hsl(var(--surface))] border-[hsl(var(--hairline))]"
          />
        </div>
        <TransactionFilters 
          accounts={accounts} 
          categories={categories} 
          filters={filters} 
          setFilters={setFilters} 
        />
      </div>

      {/* Active Filters Chips */}
      {(filters.type !== 'all' || filters.accountIds.length > 0 || filters.categoryIds.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {filters.type !== 'all' && (
            <div className="px-2.5 py-1 text-xs bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded flex items-center gap-2">
              <span className="capitalize">{filters.type.replace('_', ' ')}</span>
              <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(f => ({ ...f, type: 'all' }))} />
            </div>
          )}
          {filters.accountIds.map(id => {
            const acc = accounts.find(a => a.id === id);
            return acc ? (
              <div key={id} className="px-2.5 py-1 text-xs bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded flex items-center gap-2">
                <span>{acc.name}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(f => ({ ...f, accountIds: f.accountIds.filter(i => i !== id) }))} />
              </div>
            ) : null;
          })}
          {filters.categoryIds.map(id => {
            const cat = categories.find(c => c.id === id);
            return cat ? (
              <div key={id} className="px-2.5 py-1 text-xs bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded flex items-center gap-2">
                <span>{cat.name}</span>
                <X className="w-3 h-3 cursor-pointer" onClick={() => setFilters(f => ({ ...f, categoryIds: f.categoryIds.filter(i => i !== id) }))} />
              </div>
            ) : null;
          })}
          <Button variant="utility" className="h-6 text-xs px-2 text-[hsl(var(--primary))]" onClick={() => setFilters({ type: 'all', accountIds: [], categoryIds: [], startDate: '', endDate: '' })}>Clear all</Button>
        </div>
      )}

      {/* Transaction List */}
      <div className="pt-4">
        <TransactionHistory 
          limit={100} 
          customTransactions={transactions} 
          loading={loading} 
          onRowClick={(tx) => {
            setSelectedTx(tx);
            setIsDrawerOpen(true);
          }}
        />
      </div>

      {hasMore && !loading && (
        <Button 
          variant="utility" 
          className="w-full mt-4" 
          onClick={() => { setPage(p => p + 1); fetchTransactions(false); }}
        >
          Load More
        </Button>
      )}

      <TransactionEditDrawer 
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        transaction={selectedTx}
        accounts={accounts}
        categories={categories}
        incomeTypes={incomeTypes}
        onSaved={() => fetchTransactions(true)}
      />
    </div>
  );
}

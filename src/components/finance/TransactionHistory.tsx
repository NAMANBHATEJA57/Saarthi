"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, CreditCard, Landmark, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import { format } from "date-fns";

export function TransactionHistory({ 
  limit = 10, 
  accountId,
  customTransactions,
  loading: externalLoading,
  onRowClick
}: { 
  limit?: number, 
  accountId?: string,
  customTransactions?: any[],
  loading?: boolean,
  onRowClick?: (tx: any) => void
}) {
  const [internalTransactions, setInternalTransactions] = useState<any[]>([]);
  const [internalLoading, setInternalLoading] = useState(true);

  // Reference data for resolving IDs to names
  const [categories, setCategories] = useState<any[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);

  useEffect(() => {
    // Fetch reference data once
    fetch('/api/finance/categories').then(r => r.json()).then(d => { if (d.categories) setCategories(d.categories); });
    fetch('/api/finance/income-types').then(r => r.json()).then(d => { if (d.incomeTypes) setIncomeTypes(d.incomeTypes); });
    fetch('/api/finance/savings-goals').then(r => r.json()).then(d => { if (d.savingsGoals) setSavingsGoals(d.savingsGoals); });
  }, []);

  useEffect(() => {
    if (customTransactions !== undefined) return;
    
    let url = `/api/finance/transactions?limit=${limit}`;
    if (accountId) url += `&accountId=${accountId}`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.transactions) setInternalTransactions(data.transactions);
      })
      .catch(err => console.error(err))
      .finally(() => setInternalLoading(false));
  }, [limit, accountId, customTransactions]);

  const loading = customTransactions !== undefined ? externalLoading : internalLoading;
  const transactions = customTransactions !== undefined ? customTransactions : internalTransactions;

  if (loading && transactions.length === 0) {
    return <div className="text-sm text-[hsl(var(--ink-secondary))] p-4 text-center">Loading transactions...</div>;
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-[hsl(var(--ink-secondary))]">
          No transactions found.
        </CardContent>
      </Card>
    );
  }

  // Group by date
  const grouped = transactions.reduce((acc, tx) => {
    const d = tx.transactionDate;
    if (!acc[d]) acc[d] = [];
    acc[d].push(tx);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const renderTx = (tx: any) => {
    let icon = <Wallet className="w-4 h-4" />;
    let colorClass = "text-[hsl(var(--ink))]";
    let prefix = "";
    let subtitle = "";

    if (tx.type === "INCOME") {
      icon = <ArrowDownRight className="w-4 h-4 text-[hsl(var(--success))]" />;
      colorClass = "text-[hsl(var(--success))]";
      prefix = "+";
      subtitle = "Income";
    } else if (tx.type === "EXPENSE") {
      icon = <ArrowUpRight className="w-4 h-4 text-[hsl(var(--ink-secondary))]" />;
      prefix = "-";
      subtitle = "Expense";
    } else if (tx.type === "CREDIT_CARD_PURCHASE") {
      icon = <CreditCard className="w-4 h-4 text-[hsl(var(--destructive))]" />;
      colorClass = "text-[hsl(var(--destructive))]";
      prefix = "-";
      subtitle = "CC Purchase";
    } else if (tx.type === "CREDIT_CARD_PAYMENT") {
      icon = <Landmark className="w-4 h-4 text-[hsl(var(--success))]" />;
      colorClass = "text-[hsl(var(--success))]";
      subtitle = "CC Settlement";
    } else if (tx.type === "TRANSFER") {
      icon = <ArrowRightLeft className="w-4 h-4 text-[hsl(var(--ink-secondary))]" />;
      subtitle = "Transfer";
    } else if (tx.type === "REFUND") {
      icon = <ArrowDownRight className="w-4 h-4 text-[hsl(var(--success))]" />;
      colorClass = "text-[hsl(var(--success))]";
      prefix = "+";
      subtitle = "Refund";
    }

    return (
      <div 
        key={tx.id} 
        onClick={() => onRowClick && onRowClick(tx)}
        className="p-4 flex items-center justify-between hover:bg-[hsl(var(--surface-elevated))] transition-colors cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] flex items-center justify-center shrink-0">
            {icon}
          </div>
          <div>
            <p className="font-medium text-[15px] leading-tight text-[hsl(var(--ink))]">
              {tx.merchant || tx.description || 'Unknown'}
            </p>
            <p className="text-[11px] text-[hsl(var(--ink-secondary))] mt-0.5 uppercase tracking-wider font-semibold">
              {subtitle}
              {tx.categoryId && categories.find(c => c.id === tx.categoryId)?.name && ` • ${categories.find(c => c.id === tx.categoryId)?.name}`}
              {tx.incomeTypeId && incomeTypes.find(c => c.id === tx.incomeTypeId)?.name && ` • ${incomeTypes.find(c => c.id === tx.incomeTypeId)?.name}`}
              {tx.savingsGoalId && savingsGoals.find(c => c.id === tx.savingsGoalId)?.name && ` • 🎯 ${savingsGoals.find(c => c.id === tx.savingsGoalId)?.name}`}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-semibold text-[15px] ${colorClass}`}>
            {prefix}₹{(tx.amount || 0).toLocaleString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {sortedDates.map(date => {
        const dateObj = new Date(date);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        let displayDate = format(dateObj, 'd MMMM yyyy');
        if (date === format(today, 'yyyy-MM-dd')) displayDate = 'Today';
        else if (date === format(yesterday, 'yyyy-MM-dd')) displayDate = 'Yesterday';

        return (
          <div key={date}>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--ink-secondary))] mb-2 px-2">
              {displayDate}
            </h3>
            <Card className="overflow-hidden bg-[hsl(var(--surface))]">
              <CardContent className="p-0 divide-y divide-[hsl(var(--hairline))]">
                {grouped[date].map(renderTx)}
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCcw, Receipt } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { useRouter } from 'next/navigation';

export default function FinanceClient({ initialSummary, initialBalances, currentMonth }: any) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [balances, setBalances] = useState(initialBalances);

  const prevMonth = () => {
    const d = new Date(currentMonth + '-01');
    d.setMonth(d.getMonth() - 1);
    router.push(`/finance?month=${d.toISOString().substring(0, 7)}`);
  };

  const nextMonth = () => {
    const d = new Date(currentMonth + '-01');
    d.setMonth(d.getMonth() + 1);
    router.push(`/finance?month=${d.toISOString().substring(0, 7)}`);
  };

  const remainingBudget = summary.plannedSpendingAllocation - summary.totalExpense;
  const isOverBudget = remainingBudget < 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Finance</h1>
        <div className="flex items-center gap-4">
          <Button variant="utility" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-medium">{new Date(currentMonth + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
          <Button variant="utility" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Income</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-500">₹{summary.totalIncome.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Spent</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₹{summary.totalExpense.toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Leftover Cash</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₹{summary.leftover.toLocaleString()}</p></CardContent>
        </Card>
        <Card className={isOverBudget ? 'border-destructive' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Remaining Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-destructive' : ''}`}>
              ₹{remainingBudget.toLocaleString()}
            </p>
            {isOverBudget && <p className="text-xs text-destructive mt-1">Over budget by ₹{Math.abs(remainingBudget).toLocaleString()}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Accumulated Plans</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Savings</span>
              <span className="text-xl font-bold">₹{balances.savings.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span className="font-medium">Emergency Fund</span>
              <span className="text-xl font-bold">₹{balances.emergency.toLocaleString()}</span>
            </div>
            <p className="text-xs text-muted-foreground">These represent planned cumulative allocations, not necessarily live bank balances.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Category Spending</CardTitle></CardHeader>
          <CardContent>
            {Object.keys(summary.categorySpending).length === 0 ? (
              <EmptyState
                compact
                icon={<Receipt className="w-5 h-5" />}
                title="No expenses"
                description="No spending recorded this month."
              />
            ) : (
              <div className="space-y-2">
                {Object.entries(summary.categorySpending).map(([catName, amount]: [string, any]) => (
                  <div key={catName} className="flex justify-between border-b pb-1">
                    <span className="text-sm">{catName}</span>
                    <span className="font-medium">₹{amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="flex gap-4">
        <Button variant="utility" className="w-full" onClick={() => router.push('/finance/rules')}>Manage Rules</Button>
        <Button variant="utility" className="w-full" onClick={() => router.push('/finance/recurring')}>Manage Recurring</Button>
      </div>
    </div>
  );
}

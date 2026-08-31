"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCcw, Receipt } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { useRouter } from 'next/navigation';
import { Landmark, CreditCard } from 'lucide-react';

export default function FinanceClient({ initialSummary, initialBalances, initialAccountBalances, currentMonth }: any) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [balances, setBalances] = useState(initialBalances);
  const [accounts, setAccounts] = useState(initialAccountBalances || []);

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:border-[hsl(var(--ink-muted))] transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-[13px] text-[hsl(var(--ink-muted))] font-semibold tracking-wider">INCOME</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-[hsl(var(--success))]">₹{summary.totalIncome.toLocaleString()}</p></CardContent>
        </Card>
        <Card className="hover:border-[hsl(var(--ink-muted))] transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-[13px] text-[hsl(var(--ink-muted))] font-semibold tracking-wider">SPENT</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-[hsl(var(--ink))]">₹{summary.totalExpense.toLocaleString()}</p></CardContent>
        </Card>
        <Card className="hover:border-[hsl(var(--ink-muted))] transition-colors">
          <CardHeader className="pb-2"><CardTitle className="text-[13px] text-[hsl(var(--ink-muted))] font-semibold tracking-wider">LEFTOVER CASH</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-[hsl(var(--ink))]">₹{summary.leftover.toLocaleString()}</p></CardContent>
        </Card>
        <Card className={cn("hover:border-[hsl(var(--ink-muted))] transition-colors", isOverBudget ? 'border-[hsl(var(--destructive))]' : '')}>
          <CardHeader className="pb-2">
            <CardTitle className="text-[13px] text-[hsl(var(--ink-muted))] font-semibold tracking-wider">REMAINING BUDGET</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${isOverBudget ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--ink))]'}`}>
              ₹{remainingBudget.toLocaleString()}
            </p>
            {isOverBudget && <p className="text-[12px] text-[hsl(var(--destructive))] mt-1 font-medium">Over budget by ₹{Math.abs(remainingBudget).toLocaleString()}</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="w-5 h-5" /> Bank Accounts</CardTitle></CardHeader>
          <CardContent>
            {accounts.filter((a: any) => a.type === 'BANK_ACCOUNT').length === 0 ? (
              <EmptyState compact icon={<Landmark className="w-5 h-5" />} title="No bank accounts" description="Create an account to track your money." />
            ) : (
              <div className="space-y-4">
                {accounts.filter((a: any) => a.type === 'BANK_ACCOUNT').map((acc: any) => (
                  <div key={acc.id} className="flex justify-between border-b pb-2">
                    <span className="font-medium">{acc.name}</span>
                    <span className="text-xl font-bold">₹{acc.balanceMinor.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="w-5 h-5 text-[hsl(var(--ink-secondary))]" /> Credit Cards</CardTitle></CardHeader>
          <CardContent>
            {accounts.filter((a: any) => a.type === 'CREDIT_CARD').length === 0 ? (
              <EmptyState compact icon={<CreditCard className="w-5 h-5" />} title="No credit cards" description="Link your credit cards here." />
            ) : (
              <div className="space-y-4">
                {accounts.filter((a: any) => a.type === 'CREDIT_CARD').map((acc: any) => (
                  <div key={acc.id} className="border-b border-[hsl(var(--hairline))] pb-2 last:border-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-[15px]">{acc.name}</span>
                      <span className="text-[18px] font-bold text-[hsl(var(--destructive))]">₹{acc.balanceMinor.toLocaleString()} <span className="text-[12px] font-normal text-[hsl(var(--ink-muted))] uppercase">owed</span></span>
                    </div>
                    {acc.creditLimitMinor && (
                      <div className="flex justify-between text-[12px] text-[hsl(var(--ink-secondary))]">
                        <span>Limit: ₹{acc.creditLimitMinor.toLocaleString()}</span>
                        <span>Available: <span className="font-medium text-[hsl(var(--ink))]">₹{(acc.creditLimitMinor - acc.balanceMinor).toLocaleString()}</span></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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
        <Button variant="utility" className="w-full" onClick={() => router.push('/finance/ocr')}>Import Statement</Button>
      </div>
    </div>
  );
}

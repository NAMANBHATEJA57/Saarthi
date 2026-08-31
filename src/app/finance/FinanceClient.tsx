"use client";

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, RefreshCcw, Receipt, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { useRouter } from 'next/navigation';
import { Landmark, CreditCard, Plus } from 'lucide-react';
import { AddAccountDialog } from '@/components/finance/AddAccountDialog';
import { TransactionHistory } from '@/components/finance/TransactionHistory';

export default function FinanceClient({ initialSummary, initialBalances, initialAccountBalances, currentMonth }: any) {
  const router = useRouter();
  const [summary, setSummary] = useState(initialSummary);
  const [balances, setBalances] = useState(initialBalances);
  const [accounts, setAccounts] = useState(initialAccountBalances || []);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

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

  // Derive Ledger Metrics
  const bankAccounts = accounts.filter((a: any) => a.type === 'BANK_ACCOUNT');
  const creditCards = accounts.filter((a: any) => a.type === 'CREDIT_CARD');

  const totalBankBalance = bankAccounts.reduce((sum: number, a: any) => sum + Number(a.balanceMinor), 0) / 100;
  const totalCreditDebt = creditCards.reduce((sum: number, a: any) => sum + Number(a.balanceMinor), 0) / 100;
  const netAvailable = totalBankBalance - totalCreditDebt;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Ledger</h1>
        <div className="flex items-center gap-4">
          <Button variant="utility" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="font-medium text-sm">{new Date(currentMonth + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
          <Button variant="utility" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {accounts.length === 0 && summary.totalIncome === 0 && summary.totalExpense === 0 ? (
        <EmptyState 
          icon={<Landmark className="w-8 h-8" />}
          title="Start tracking your money"
          description="Add your bank accounts and credit cards to see your balances, spending, and upcoming payments in one place."
          action={<Button variant="primary" onClick={() => setIsAddAccountOpen(true)} className="gap-2"><Plus className="w-4 h-4" /> Add account</Button>}
        />
      ) : (
        <>
          {/* MONEY OVERVIEW */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="hover:border-[hsl(var(--ink-muted))] transition-colors bg-[hsl(var(--surface))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[12px] text-[hsl(var(--ink-secondary))] font-semibold tracking-wider uppercase">Bank Accounts</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xl sm:text-2xl font-bold text-[hsl(var(--success))]">₹{totalBankBalance.toLocaleString()}</p></CardContent>
            </Card>
            <Card className="hover:border-[hsl(var(--ink-muted))] transition-colors bg-[hsl(var(--surface))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[12px] text-[hsl(var(--ink-secondary))] font-semibold tracking-wider uppercase">Credit Debt</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xl sm:text-2xl font-bold text-[hsl(var(--destructive))]">₹{totalCreditDebt.toLocaleString()}</p></CardContent>
            </Card>
            <Card className="hover:border-[hsl(var(--ink-muted))] transition-colors bg-[hsl(var(--surface))]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[12px] text-[hsl(var(--ink-secondary))] font-semibold tracking-wider uppercase">Net Available</CardTitle>
              </CardHeader>
              <CardContent><p className="text-xl sm:text-2xl font-bold text-[hsl(var(--ink))]">₹{netAvailable.toLocaleString()}</p></CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* BANK ACCOUNTS */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-[hsl(var(--surface))] rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-base"><Landmark className="w-5 h-5" /> Bank Accounts</CardTitle>
                  <Button variant="utility" onClick={() => setIsAddAccountOpen(true)} className="h-7 px-2 text-xs"><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </CardHeader>
                <CardContent className="p-0">
                  {bankAccounts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[hsl(var(--ink-secondary))]">No bank accounts yet.</div>
                  ) : (
                    <div className="divide-y divide-[hsl(var(--hairline))]">
                      {bankAccounts.map((acc: any) => (
                        <div key={acc.id} onClick={() => router.push(`/finance/accounts/${acc.id}`)} className="p-4 flex items-center justify-between hover:bg-[hsl(var(--surface-elevated))] transition-colors cursor-pointer group">
                          <div>
                            <span className="font-medium">{acc.name}</span>
                            <p className="text-xs text-[hsl(var(--ink-secondary))] mt-0.5">{acc.lastFour ? `•••• ${acc.lastFour}` : 'Account'}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-bold text-[hsl(var(--success))]">₹{(acc.balanceMinor / 100).toLocaleString()}</span>
                            <ArrowRight className="w-4 h-4 text-[hsl(var(--ink-muted))] opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* CREDIT CARDS */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-[hsl(var(--surface))] rounded-t-lg">
                  <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="w-5 h-5 text-[hsl(var(--ink-secondary))]" /> Credit Cards</CardTitle>
                  <Button variant="utility" onClick={() => setIsAddAccountOpen(true)} className="h-7 px-2 text-xs"><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </CardHeader>
                <CardContent className="p-0">
                  {creditCards.length === 0 ? (
                    <div className="p-4 text-center text-sm text-[hsl(var(--ink-secondary))]">No credit cards yet.</div>
                  ) : (
                    <div className="divide-y divide-[hsl(var(--hairline))]">
                      {creditCards.map((acc: any) => (
                        <div key={acc.id} onClick={() => router.push(`/finance/accounts/${acc.id}`)} className="p-4 flex items-center justify-between hover:bg-[hsl(var(--surface-elevated))] transition-colors cursor-pointer group">
                          <div>
                            <span className="font-medium text-[15px]">{acc.name}</span>
                            <p className="text-xs text-[hsl(var(--ink-secondary))] mt-0.5">{acc.lastFour ? `•••• ${acc.lastFour}` : 'Card'}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-lg font-bold text-[hsl(var(--destructive))]">₹{(acc.balanceMinor / 100).toLocaleString()} <span className="text-[10px] font-normal uppercase text-[hsl(var(--ink-muted))]">owed</span></span>
                            {acc.creditLimitMinor && (
                              <span className="text-[11px] text-[hsl(var(--ink-secondary))]">Avail: ₹{((acc.creditLimitMinor - acc.balanceMinor) / 100).toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* MONTHLY SUMMARY & LEDGER */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-2 bg-[hsl(var(--surface))] rounded-t-lg"><CardTitle className="text-base">Monthly Activity</CardTitle></CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[hsl(var(--ink-secondary))]">Income</span>
                    <span className="font-medium text-[hsl(var(--success))]">+₹{(summary.totalIncome / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[hsl(var(--ink-secondary))]">Spending</span>
                    <span className="font-medium text-[hsl(var(--destructive))]">-₹{(summary.totalExpense / 100).toLocaleString()}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-[hsl(var(--hairline))] flex justify-between items-center text-sm">
                    <span className="font-medium">Leftover</span>
                    <span className="font-bold">₹{((summary.totalIncome - summary.totalExpense) / 100).toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1 bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))]" onClick={() => router.push('/finance/rules')}>Rules</Button>
                <Button variant="secondary" className="flex-1 bg-[hsl(var(--surface))] border border-[hsl(var(--hairline))]" onClick={() => router.push('/finance/recurring')}>Recurring</Button>
              </div>

              {/* RECENT TRANSACTIONS COMPONENT */}
              <div>
                <TransactionHistory limit={10} />
                <Button 
                  variant="utility" 
                  className="w-full mt-2 text-sm text-[hsl(var(--primary))]"
                  onClick={() => router.push('/finance/transactions')}
                >
                  View all transactions <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <AddAccountDialog 
        open={isAddAccountOpen} 
        onOpenChange={setIsAddAccountOpen} 
        onSuccess={() => window.location.reload()} 
      />
    </div>
  );
}

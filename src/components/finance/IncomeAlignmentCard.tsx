import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Wallet } from 'lucide-react';

export function IncomeAlignmentCard({ expectedMonthlyIncome, savingsGoals, currentMonth }: { expectedMonthlyIncome: number, savingsGoals: any[], currentMonth: string }) {
  const [spentByGoal, setSpentByGoal] = useState<Record<string, number>>({});

  useEffect(() => {
    // Fetch expenses for the month to calculate fund spending
    const startDate = `${currentMonth}-01`;
    const lastDay = new Date(new Date(currentMonth + '-01').getFullYear(), new Date(currentMonth + '-01').getMonth() + 1, 0).getDate();
    const endDate = `${currentMonth}-${lastDay.toString().padStart(2, '0')}`;
    
    fetch(`/api/finance/transactions?type=EXPENSE&startDate=${startDate}&endDate=${endDate}&limit=1000`)
      .then(r => r.json())
      .then(d => {
        if (d.transactions) {
          const sums: Record<string, number> = {};
          d.transactions.forEach((tx: any) => {
            if (tx.savingsGoalId) {
              sums[tx.savingsGoalId] = (sums[tx.savingsGoalId] || 0) + tx.amount;
            }
          });
          setSpentByGoal(sums);
        }
      });
  }, [currentMonth]);

  if (expectedMonthlyIncome <= 0) return null;

  const totalPlannedSavings = savingsGoals.reduce((sum, g) => {
    if (g.targetPercentage) {
      return sum + (expectedMonthlyIncome * (g.targetPercentage / 100));
    }
    return sum + (g.ultimateTargetAmount || 0);
  }, 0);
  
  const leftoverBudget = expectedMonthlyIncome - totalPlannedSavings;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wider uppercase text-[hsl(var(--ink-secondary))]">Income & Savings Alignment</h3>
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--hairline))] overflow-hidden">
          <CardHeader className="bg-[hsl(var(--surface-elevated))] pb-3 border-b border-[hsl(var(--hairline))]">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-base">Expected Income</CardTitle>
                <p className="text-sm text-[hsl(var(--ink-secondary))] mt-1">Global Base Income</p>
              </div>
              <span className="text-lg font-bold text-[hsl(var(--success))]">₹{expectedMonthlyIncome.toLocaleString()}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-[hsl(var(--hairline))]">
              {savingsGoals.map(g => {
                const target = g.targetPercentage ? (expectedMonthlyIncome * (g.targetPercentage / 100)) : (g.ultimateTargetAmount || 0);
                const spent = spentByGoal[g.id] || 0;
                const remaining = target - spent;
                
                return (
                  <div key={g.id} className="p-4 flex items-center justify-between text-sm hover:bg-[hsl(var(--surface-elevated))] transition-colors">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
                      <span>{g.name}</span>
                      {g.targetPercentage && <span className="text-xs text-[hsl(var(--ink-secondary))] bg-[hsl(var(--surface-elevated))] px-2 py-0.5 rounded-full">{g.targetPercentage}%</span>}
                    </div>
                    <div className="text-right">
                      <span className="font-medium block">₹{target.toLocaleString()}</span>
                      <span className={`text-[10px] uppercase font-semibold tracking-wider ${remaining < 0 ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--ink-secondary))]'}`}>
                        Spent: ₹{spent.toLocaleString()} / Avail: ₹{remaining.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {savingsGoals.length === 0 && (
                <div className="p-4 text-sm text-[hsl(var(--ink-secondary))] italic text-center">
                  No linked savings goals
                </div>
              )}
              
              <div className="p-4 bg-[hsl(var(--surface-elevated))] flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
                  <span>Leftover for Spending</span>
                </div>
                <span>₹{leftoverBudget.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

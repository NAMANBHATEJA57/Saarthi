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
      
      <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--hairline))] overflow-hidden">
        <CardHeader className="bg-[hsl(var(--surface-elevated))] pb-4 border-b border-[hsl(var(--hairline))]">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">Expected Income</CardTitle>
              <p className="text-sm text-[hsl(var(--ink-secondary))] mt-1">Global Base Income</p>
            </div>
            <span className="text-2xl font-bold text-[hsl(var(--success))]">₹{expectedMonthlyIncome.toLocaleString()}</span>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savingsGoals.map(g => {
              const target = Math.round(g.targetPercentage ? (expectedMonthlyIncome * (g.targetPercentage / 100)) : (g.ultimateTargetAmount || 0));
              const spent = Math.round(spentByGoal[g.id] || 0);
              const remaining = target - spent;
              
              return (
                <div key={g.id} className="p-4 rounded-xl border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] hover:border-[hsl(var(--ink-muted))] transition-colors flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
                      <span className="font-medium text-sm">{g.name}</span>
                    </div>
                    {g.targetPercentage && (
                      <span className="text-[10px] font-semibold text-[hsl(var(--ink-secondary))] bg-[hsl(var(--surface-elevated))] px-2 py-0.5 rounded-full">
                        {g.targetPercentage}%
                      </span>
                    )}
                  </div>
                  
                  <div>
                    <div className="text-xl font-bold mb-1">₹{target.toLocaleString()}</div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[hsl(var(--ink-secondary))]">Spent: ₹{spent.toLocaleString()}</span>
                      <span className={`font-medium ${remaining < 0 ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--success))]'}`}>
                        Avail: ₹{remaining.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="p-4 rounded-xl border border-[hsl(var(--hairline))] border-dashed bg-[hsl(var(--surface-elevated))] flex flex-col justify-between space-y-3">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
                <span className="font-medium text-sm text-[hsl(var(--ink-secondary))]">Leftover for Spending</span>
              </div>
              <div className="text-xl font-bold text-[hsl(var(--ink-muted))]">
                ₹{Math.round(leftoverBudget).toLocaleString()}
              </div>
            </div>
            
          </div>
          
          {savingsGoals.length === 0 && (
            <div className="p-4 text-sm text-[hsl(var(--ink-secondary))] italic text-center">
              No linked savings goals
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

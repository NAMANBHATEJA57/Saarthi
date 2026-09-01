import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Wallet, ArrowRight } from 'lucide-react';

export function IncomeAlignmentCard({ incomeTypes, savingsGoals }: { incomeTypes: any[], savingsGoals: any[] }) {
  // Only show income types that have an expected amount
  const recurringIncomes = incomeTypes.filter(inc => inc.expectedAmount && inc.expectedAmount > 0);

  if (recurringIncomes.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wider uppercase text-[hsl(var(--ink-secondary))]">Income & Savings Alignment</h3>
      <div className="grid md:grid-cols-2 gap-4">
        {recurringIncomes.map(inc => {
          const linkedGoals = savingsGoals.filter(g => g.incomeTypeId === inc.id);
          const totalPlannedSavings = linkedGoals.reduce((sum, g) => sum + (g.ultimateTargetAmount || 0), 0);
          const leftoverBudget = inc.expectedAmount - totalPlannedSavings;

          return (
            <Card key={inc.id} className="bg-[hsl(var(--surface))] border-[hsl(var(--hairline))] overflow-hidden">
              <CardHeader className="bg-[hsl(var(--surface-elevated))] pb-3 border-b border-[hsl(var(--hairline))]">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base">{inc.name}</CardTitle>
                    <p className="text-sm text-[hsl(var(--ink-secondary))] mt-1">Expected Income</p>
                  </div>
                  <span className="text-lg font-bold text-[hsl(var(--success))]">₹{inc.expectedAmount.toLocaleString()}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-[hsl(var(--hairline))]">
                  {linkedGoals.map(g => (
                    <div key={g.id} className="p-4 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-[hsl(var(--ink-muted))]" />
                        <span>{g.name}</span>
                        {g.targetPercentage && <span className="text-xs text-[hsl(var(--ink-secondary))] bg-[hsl(var(--surface-elevated))] px-2 py-0.5 rounded-full">{g.targetPercentage}%</span>}
                      </div>
                      <span className="font-medium">₹{(g.ultimateTargetAmount || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  
                  {linkedGoals.length === 0 && (
                    <div className="p-4 text-sm text-[hsl(var(--ink-secondary))] italic text-center">
                      No savings goals linked to this income.
                    </div>
                  )}

                  <div className="p-4 bg-[hsl(var(--surface))] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[hsl(var(--ink))]" />
                      <span className="font-semibold text-sm">Leftover for Spending</span>
                    </div>
                    <span className="font-bold text-[hsl(var(--ink))]">₹{leftoverBudget.toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

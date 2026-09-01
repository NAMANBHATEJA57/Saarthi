"use client";

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function SettingsClient({ 
  initialCategories, 
  initialIncomeTypes, 
  initialSavingsGoals 
}: { 
  initialCategories: any[], 
  initialIncomeTypes: any[], 
  initialSavingsGoals: any[] 
}) {
  const router = useRouter();

  const [categories, setCategories] = useState(initialCategories);
  const [incomeTypes, setIncomeTypes] = useState(initialIncomeTypes);
  const [savingsGoals, setSavingsGoals] = useState(initialSavingsGoals);

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isIncomeTypeOpen, setIsIncomeTypeOpen] = useState(false);
  const [isSavingsGoalOpen, setIsSavingsGoalOpen] = useState(false);

  const [newName, setNewName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  
  const [linkedIncomeId, setLinkedIncomeId] = useState<string>('');
  const [targetPercentage, setTargetPercentage] = useState('');
  
  const [loading, setLoading] = useState(false);

  // Bi-directional sync logic
  const handleAmountChange = (val: string) => {
    setTargetAmount(val);
    if (linkedIncomeId && val) {
      const inc = incomeTypes.find(i => i.id === linkedIncomeId);
      if (inc && inc.expectedAmount) {
        const perc = (parseFloat(val) / inc.expectedAmount) * 100;
        setTargetPercentage(perc.toFixed(2));
      }
    } else {
      setTargetPercentage('');
    }
  };

  const handlePercentageChange = (val: string) => {
    setTargetPercentage(val);
    if (linkedIncomeId && val) {
      const inc = incomeTypes.find(i => i.id === linkedIncomeId);
      if (inc && inc.expectedAmount) {
        const amt = (parseFloat(val) / 100) * inc.expectedAmount;
        setTargetAmount(amt.toFixed(0));
      }
    } else {
      setTargetAmount('');
    }
  };

  const handleIncomeSelect = (val: string) => {
    setLinkedIncomeId(val);
    // Recalculate amount or percentage if one exists
    if (val) {
      const inc = incomeTypes.find(i => i.id === val);
      if (inc && inc.expectedAmount && targetPercentage) {
        const amt = (parseFloat(targetPercentage) / 100) * inc.expectedAmount;
        setTargetAmount(amt.toFixed(0));
      }
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/finance/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        const data = await res.json();
        setCategories([...categories, data.category]);
        setIsCategoryOpen(false);
        setNewName('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIncomeType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/finance/income-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName,
          expectedAmount: expectedAmount ? parseFloat(expectedAmount) : null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setIncomeTypes([...incomeTypes, data.incomeType]);
        setIsIncomeTypeOpen(false);
        setNewName('');
        setExpectedAmount('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSavingsGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !targetAmount) return;
    setLoading(true);
    try {
      const res = await fetch('/api/finance/savings-goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newName, 
          ultimateTargetAmount: parseFloat(targetAmount),
          incomeTypeId: linkedIncomeId || null,
          targetPercentage: targetPercentage ? parseFloat(targetPercentage) : null
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSavingsGoals([...savingsGoals, data.goal]);
        setIsSavingsGoalOpen(false);
        setNewName('');
        setTargetAmount('');
        setTargetPercentage('');
        setLinkedIncomeId('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: 'category' | 'incomeType' | 'savingsGoal') => {
    if (!confirm('Are you sure you want to delete this?')) return;
    
    let endpoint = '';
    if (type === 'category') endpoint = `/api/finance/categories/${id}`;
    if (type === 'incomeType') endpoint = `/api/finance/income-types/${id}`;
    if (type === 'savingsGoal') endpoint = `/api/finance/savings-goals/${id}`;

    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        if (type === 'category') setCategories(categories.filter(c => c.id !== id));
        if (type === 'incomeType') setIncomeTypes(incomeTypes.filter(c => c.id !== id));
        if (type === 'savingsGoal') setSavingsGoals(savingsGoals.filter(c => c.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Expense Categories */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Expense Categories</CardTitle>
            <Button variant="icon" onClick={() => { setNewName(''); setIsCategoryOpen(true); }}><Plus className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <div key={c.id} className="px-3 py-1 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded-full text-sm flex items-center gap-2 group">
                  {c.name}
                  <button onClick={() => handleDelete(c.id, 'category')} className="text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--destructive))] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Income Types */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Income Types</CardTitle>
            <Button variant="icon" onClick={() => { setNewName(''); setIsIncomeTypeOpen(true); }}><Plus className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {incomeTypes.map(c => (
                <div key={c.id} className="px-3 py-1 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded-full text-sm flex items-center gap-2 group">
                  {c.name} {c.expectedAmount ? <span className="text-[hsl(var(--ink-muted))] text-xs">(₹{c.expectedAmount})</span> : null}
                  <button onClick={() => handleDelete(c.id, 'incomeType')} className="text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--destructive))] opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Savings Goals */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Savings Goals</CardTitle>
            <Button variant="icon" onClick={() => { setNewName(''); setTargetAmount(''); setIsSavingsGoalOpen(true); }}><Plus className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent>
            {savingsGoals.length === 0 ? (
              <p className="text-sm text-[hsl(var(--ink-secondary))] pb-4">You haven't set up any savings goals yet.</p>
            ) : (
              <div className="space-y-2 pb-4">
                {savingsGoals.map(g => {
                  const linkedIncome = incomeTypes.find(i => i.id === g.incomeTypeId);
                  return (
                    <div key={g.id} className="flex justify-between items-center p-3 border border-[hsl(var(--hairline))] rounded-lg group">
                      <div className="flex flex-col">
                        <span className="font-medium">{g.name}</span>
                        {linkedIncome && <span className="text-xs text-[hsl(var(--ink-secondary))]">Linked to {linkedIncome.name} ({g.targetPercentage}%)</span>}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[hsl(var(--ink-muted))]">₹{(g.ultimateTargetAmount || 0).toLocaleString()} target</span>
                        <button onClick={() => handleDelete(g.id, 'savingsGoal')} className="text-[hsl(var(--ink-muted))] hover:text-[hsl(var(--destructive))] opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category Dialog */}
      <Dialog open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input autoFocus value={newName} onChange={e => setNewName(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="utility" onClick={() => setIsCategoryOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Income Type Dialog */}
      <Dialog open={isIncomeTypeOpen} onOpenChange={setIsIncomeTypeOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Income Type</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateIncomeType} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input autoFocus value={newName} onChange={e => setNewName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Expected Monthly Amount (₹, optional)</Label>
              <Input type="number" step="0.01" value={expectedAmount} onChange={e => setExpectedAmount(e.target.value)} placeholder="e.g. 50000" />
            </div>
            <DialogFooter>
              <Button type="button" variant="utility" onClick={() => setIsIncomeTypeOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Savings Goal Dialog */}
      <Dialog open={isSavingsGoalOpen} onOpenChange={setIsSavingsGoalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New Savings Goal</DialogTitle></DialogHeader>
          <form onSubmit={handleCreateSavingsGoal} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input autoFocus value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Emergency Fund" required />
            </div>
            <div className="space-y-2">
              <Label>Link Income Source (optional)</Label>
              <select 
                className="w-full p-2 rounded-md border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] text-sm"
                value={linkedIncomeId} 
                onChange={e => handleIncomeSelect(e.target.value)}
              >
                <option value="">-- No linked income --</option>
                {incomeTypes.map(inc => (
                  <option key={inc.id} value={inc.id}>{inc.name} {inc.expectedAmount ? `(₹${inc.expectedAmount})` : '(No expected amount)'}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <Label>Target Amount (₹)</Label>
                <Input type="number" step="0.01" value={targetAmount} onChange={e => handleAmountChange(e.target.value)} placeholder="50000" required />
              </div>
              {linkedIncomeId && incomeTypes.find(i => i.id === linkedIncomeId)?.expectedAmount && (
                <div className="space-y-2 flex-1">
                  <Label>Percentage (%)</Label>
                  <Input type="number" step="0.01" value={targetPercentage} onChange={e => handlePercentageChange(e.target.value)} placeholder="20" />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="utility" onClick={() => setIsSavingsGoalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

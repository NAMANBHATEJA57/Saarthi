"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2 } from 'lucide-react';

export default function RulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/finance/allocation-rules')
      .then(r => r.json())
      .then(d => {
        if (d.rules && d.rules.length > 0) {
          setRules(d.rules);
        } else {
          // Default empty rule to start
          setRules([{ id: Date.now(), label: '', purpose: 'SPENDING', percentageBasisPoints: 0 }]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const addRule = () => {
    setRules([...rules, { id: Date.now(), label: '', purpose: 'SPENDING', percentageBasisPoints: 0 }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, field: string, value: any) => {
    const newRules = [...rules];
    newRules[index] = { ...newRules[index], [field]: value };
    setRules(newRules);
  };

  const totalBasisPoints = rules.reduce((acc, r) => acc + Number(r.percentageBasisPoints || 0), 0);
  const totalPercentage = totalBasisPoints / 100;

  const saveRules = async () => {
    if (totalBasisPoints !== 10000) {
      setError('Total allocation must be exactly 100%');
      return;
    }
    
    // Check missing fields
    if (rules.some(r => !r.label || !r.purpose)) {
      setError('All rules must have a label and purpose');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/finance/allocation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules, effectiveFrom: new Date().toISOString().split('T')[0] })
      });
      
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save rules');
      }
      
      router.push('/finance');
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading rules...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="icon" onClick={() => router.push('/finance')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Allocation Rules</h1>
      </div>
      
      <p className="text-muted-foreground text-sm">
        Whenever you log Income, these rules determine how that money is split into your planned budgets, savings, or emergency fund.
      </p>

      <div className="space-y-4">
        {rules.map((rule, index) => (
          <Card key={rule.id || index}>
            <CardContent className="p-4 flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1 space-y-2 w-full md:w-auto">
                <Label>Label</Label>
                <Input value={rule.label} onChange={e => updateRule(index, 'label', e.target.value)} placeholder="e.g. Needs, Wants, Savings" />
              </div>
              <div className="flex-1 space-y-2 w-full md:w-auto">
                <Label>Purpose</Label>
                <Select value={rule.purpose} onValueChange={v => updateRule(index, 'purpose', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPENDING">Spending Budget</SelectItem>
                    <SelectItem value="SAVINGS">Savings</SelectItem>
                    <SelectItem value="EMERGENCY_FUND">Emergency Fund</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-4 w-full md:w-auto">
                <div className="flex-1 md:w-24 space-y-2">
                  <Label>%</Label>
                  <Input type="number" min="0" max="100" step="0.01" value={Number(rule.percentageBasisPoints || 0) / 100} onChange={e => updateRule(index, 'percentageBasisPoints', Math.round(Number(e.target.value) * 100))} />
                </div>
                <Button variant="icon" onClick={() => removeRule(index)} className="text-destructive shrink-0">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="utility" className="w-full flex gap-2" onClick={addRule}>
        <Plus className="w-4 h-4" /> Add Rule
      </Button>
      
      <div className="pt-6 border-t flex flex-col gap-4">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total Allocated:</span>
          <span className={totalBasisPoints === 10000 ? 'text-green-500' : 'text-destructive'}>
            {totalPercentage.toFixed(2)}%
          </span>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        
        <Button variant="primary" onClick={saveRules} disabled={saving || totalBasisPoints !== 10000}>
          {saving ? 'Saving...' : 'Activate New Rules'}
        </Button>
        <p className="text-xs text-center text-muted-foreground">Activating a new ruleset only affects future income.</p>
      </div>
    </div>
  );
}

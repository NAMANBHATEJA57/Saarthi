"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus } from 'lucide-react';

export default function RecurringRulesPage() {
  const router = useRouter();
  const [rules, setRules] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for new rule
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<'EXPENSE'|'INCOME'>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [remark, setRemark] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/finance/recurring-rules').then(r => r.json()),
      fetch('/api/finance/categories').then(r => r.json())
    ]).then(([rulesData, catData]) => {
      if (rulesData.rules) setRules(rulesData.rules);
      if (catData.categories) setCategories(catData.categories);
      setLoading(false);
    });
  }, []);

  const saveRule = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/finance/recurring-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amountMinor: Math.round(Number(amount)),
          categoryId,
          dayOfMonth: Number(dayOfMonth),
          remarkTemplate: remark,
          startsOn: new Date().toISOString().split('T')[0]
        })
      });
      if (res.ok) {
        const d = await res.json();
        setRules([...rules, d.rule]);
        setShowForm(false);
        setAmount('');
        setRemark('');
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredCategories = categories.filter(c => c.kind === type || c.kind === 'BOTH');

  if (loading) return <div className="p-8">Loading recurring rules...</div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="icon" onClick={() => router.push('/finance')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Recurring Transactions</h1>
      </div>

      <div className="space-y-4">
        {rules.length === 0 && !showForm && (
          <p className="text-muted-foreground">No active recurring rules.</p>
        )}
        
        {rules.map(rule => (
          <Card key={rule.id}>
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="font-bold">{rule.type === 'INCOME' ? 'Income' : 'Expense'}</p>
                <p className="text-sm text-muted-foreground">Day {rule.dayOfMonth} of month</p>
                <p className="text-sm">{rule.remarkTemplate}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">₹{rule.amountMinor}</p>
                <p className="text-xs text-muted-foreground">Next: {rule.nextOccurrenceOn}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!showForm ? (
        <Button variant="utility" onClick={() => setShowForm(true)} className="w-full flex gap-2">
          <Plus className="w-4 h-4" /> Add Recurring Transaction
        </Button>
      ) : (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h2 className="font-bold text-lg">New Rule</h2>
            
            <div className="flex gap-2 p-1 bg-secondary rounded-lg">
              <Button type="button" variant={type === 'EXPENSE' ? 'primary' : 'utility'} className="flex-1" onClick={() => setType('EXPENSE')}>Expense</Button>
              <Button type="button" variant={type === 'INCOME' ? 'primary' : 'utility'} className="flex-1" onClick={() => setType('INCOME')}>Income</Button>
            </div>

            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Day of Month</Label>
              <Input type="number" min="1" max="31" value={dayOfMonth} onChange={e => setDayOfMonth(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Remark Template</Label>
              <Input value={remark} onChange={e => setRemark(e.target.value)} placeholder="e.g. Salary, Netflix" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="utility" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
              <Button variant="primary" className="flex-1" onClick={saveRule} disabled={saving || !amount || !categoryId || !dayOfMonth}>Save</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

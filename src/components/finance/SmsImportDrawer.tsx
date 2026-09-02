"use client";

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { EditableTransactionForm } from './EditableTransactionForm';

export function SmsImportDrawer({
  open,
  onOpenChange,
  onSuccess
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState<'INPUT' | 'LIST' | 'DETAIL'>('INPUT');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [incomeTypes, setIncomeTypes] = useState<any[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<any[]>([]);

  useEffect(() => {
    if (open && step === 'INPUT') {
      fetch('/api/finance/accounts').then(r => r.json()).then(d => { if (d.accounts) setAccounts(d.accounts); });
      fetch('/api/finance/categories').then(r => r.json()).then(d => { if (d.categories) setCategories(d.categories); });
      fetch('/api/finance/income-types').then(r => r.json()).then(d => { if (d.incomeTypes) setIncomeTypes(d.incomeTypes); });
      fetch('/api/finance/savings-goals').then(r => r.json()).then(d => { if (d.savingsGoals) setSavingsGoals(d.savingsGoals); });
    }
  }, [open, step]);

  const handleParse = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/finance/sms/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse');
      }

      const txs = data.parsed.map((tx: any, idx: number) => ({ ...tx, tempId: String(idx) }));
      setTransactions(txs);
      setSelectedIds(new Set(txs.map((t: any) => t.tempId)));
      setStep('LIST');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const selectedTxs = transactions.filter(t => selectedIds.has(t.tempId));
    if (selectedTxs.length === 0) return;
    
    // Check for invalid selected transactions
    const invalid = selectedTxs.filter(tx => 
      !tx.accountId || 
      !tx.amount || 
      tx.type === 'UNSUPPORTED' ||
      (tx.type === 'EXPENSE' && !tx.categoryId) ||
      (tx.type === 'INCOME' && !tx.incomeTypeId) ||
      ((tx.type === 'TRANSFER' || tx.type === 'CREDIT_CARD_PAYMENT') && !tx.destinationAccountId)
    );

    if (invalid.length > 0) {
      setError(`${invalid.length} selected transaction(s) need attention.`);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const payloadTxs = selectedTxs.map(tx => ({
        type: tx.type,
        amount: tx.amount,
        transactionDate: tx.date || tx.transactionDate,
        accountId: tx.accountId,
        destinationAccountId: tx.destinationAccountId,
        categoryId: tx.categoryId,
        incomeTypeId: tx.incomeTypeId,
        savingsGoalId: tx.savingsGoalId,
        merchant: tx.merchant,
        notes: tx.notes || tx.reference,
        source: 'SMS'
      }));

      const res = await fetch('/api/finance/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: payloadTxs })
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to save');
      }

      onSuccess();
      handleClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTransaction = (idx: number, updates: any) => {
    const newTxs = [...transactions];
    newTxs[idx] = { ...newTxs[idx], ...updates };
    setTransactions(newTxs);
  };

  const toggleSelection = (tempId: string) => {
    const newIds = new Set(selectedIds);
    if (newIds.has(tempId)) newIds.delete(tempId);
    else newIds.add(tempId);
    setSelectedIds(newIds);
  };

  const handleClose = () => {
    setStep('INPUT');
    setText('');
    setTransactions([]);
    setSelectedIds(new Set());
    setEditingIndex(null);
    setError('');
    onOpenChange(false);
  };

  const totalAmount = transactions.filter(t => selectedIds.has(t.tempId)).reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen && transactions.length > 0 && step !== 'INPUT') {
        if (window.confirm("Discard these parsed transactions?")) {
          handleClose();
        }
      } else if (!isOpen) {
        handleClose();
      } else {
        onOpenChange(isOpen);
      }
    }}>
      <SheetContent side="bottom" className="h-[90vh] p-0 flex flex-col bg-[hsl(var(--surface))] rounded-t-xl border-t border-[hsl(var(--hairline))]">
        {step === 'INPUT' && (
          <div className="flex flex-col h-full">
            <SheetHeader className="p-6 pb-4 border-b border-[hsl(var(--hairline))]">
              <SheetTitle>Add from SMS</SheetTitle>
              <p className="text-sm text-[hsl(var(--ink-secondary))]">
                Paste your bank transaction messages and we'll extract the details for you. Paste up to 10 messages. Separate each message with a blank line.
              </p>
            </SheetHeader>
            <div className="p-6 flex-1">
              <Textarea
                placeholder="Paste SMS messages here..."
                className="h-64 bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] rounded-xl text-sm leading-relaxed"
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <div className="mt-2 flex justify-between items-center text-xs text-[hsl(var(--ink-secondary))]">
                <span>{text.split(/\n\s*\n/).filter(x => x.trim().length > 0).length} / 10 messages</span>
              </div>
              {error && <p className="mt-4 text-sm text-[hsl(var(--destructive))] font-medium">{error}</p>}
            </div>
            <div className="p-6 pt-4 border-t border-[hsl(var(--hairline))]">
              <Button onClick={handleParse} disabled={!text.trim() || loading} variant="primary" className="w-full h-12 text-base font-semibold">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Parse SMS'}
              </Button>
            </div>
          </div>
        )}

        {step === 'LIST' && (
          <div className="flex flex-col h-full bg-[hsl(var(--background))]">
            <SheetHeader className="p-6 pb-4 bg-[hsl(var(--surface))] border-b border-[hsl(var(--hairline))]">
              <SheetTitle>Review {transactions.length === 1 ? 'Transaction' : 'Transactions'}</SheetTitle>
              <p className="text-sm text-[hsl(var(--ink-secondary))]">Review everything before adding it.</p>
              
              <div className="flex gap-4 mt-4 pt-4 border-t border-[hsl(var(--hairline))] text-sm">
                <div className="flex-1">
                  <p className="font-semibold">{transactions.length} transactions</p>
                  <p className="text-[hsl(var(--ink-muted))]">₹{transactions.reduce((sum, t) => sum + (t.amount || 0), 0).toLocaleString()} total</p>
                </div>
                <div className="flex-1 text-right">
                  <p className="text-[hsl(var(--success))] font-medium text-xs flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3" /> {transactions.filter(t => t.accountId && t.type !== 'UNSUPPORTED' && t.amount).length} ready</p>
                  <p className="text-[hsl(var(--warning))] font-medium text-xs flex items-center justify-end gap-1 mt-1"><AlertTriangle className="w-3 h-3" /> {transactions.filter(t => !t.accountId || t.type === 'UNSUPPORTED' || !t.amount).length} need review</p>
                </div>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {transactions.map((tx, idx) => {
                const needsReview = !tx.accountId || !tx.amount || tx.type === 'UNSUPPORTED' || (tx.type === 'EXPENSE' && !tx.categoryId) || (tx.type === 'INCOME' && !tx.incomeTypeId);
                const isDup = tx.duplicateOf;

                return (
                  <div key={tx.tempId} className={`relative flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer ${needsReview ? 'bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]/20' : 'bg-[hsl(var(--surface))] border-[hsl(var(--hairline))] hover:border-[hsl(var(--ink-muted))]'}`}>
                    <div className="pt-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(tx.tempId)} 
                        onChange={() => toggleSelection(tx.tempId)}
                        className="w-4 h-4 rounded border-[hsl(var(--hairline))] text-[hsl(var(--primary))] focus:ring-[hsl(var(--primary))]"
                      />
                    </div>
                    <div className="flex-1" onClick={() => { setEditingIndex(idx); setStep('DETAIL'); setError(''); }}>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-base">₹{(tx.amount || 0).toLocaleString()}</span>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--ink-secondary))]">{tx.type === 'UNSUPPORTED' ? 'N/A' : tx.type}</span>
                      </div>
                      <p className="text-sm font-medium">{tx.merchant || 'Unknown Merchant'}</p>
                      <p className="text-xs text-[hsl(var(--ink-secondary))] mt-1 flex gap-2">
                        <span>{tx.date}</span>
                        <span>•</span>
                        <span>{tx.accountName || (tx.accountLast4 ? `••••${tx.accountLast4}` : 'No Account')}</span>
                      </p>

                      {isDup && (
                        <div className="mt-2 text-xs font-medium text-[hsl(var(--warning))] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Possible duplicate
                        </div>
                      )}
                      {needsReview && !isDup && (
                        <div className="mt-2 text-xs font-medium text-[hsl(var(--destructive))] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Needs review
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-6 pt-4 bg-[hsl(var(--surface))] border-t border-[hsl(var(--hairline))]">
              {error && <p className="mb-4 text-sm text-[hsl(var(--destructive))] font-medium">{error}</p>}
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium">{selectedIds.size} selected</span>
                <span className="text-sm font-bold">₹{totalAmount.toLocaleString()} total</span>
              </div>
              <Button onClick={handleSave} disabled={selectedIds.size === 0 || loading} variant="primary" className="w-full h-12 text-base font-semibold">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Add ${selectedIds.size} Transaction${selectedIds.size !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}

        {step === 'DETAIL' && editingIndex !== null && (
          <div className="flex flex-col h-full bg-[hsl(var(--surface))]">
            <div className="p-4 border-b border-[hsl(var(--hairline))] flex items-center justify-between">
              <Button variant="utility" onClick={() => setStep('LIST')} className="gap-1 pl-1 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))]">
                <ArrowLeft className="w-4 h-4" /> All Transactions
              </Button>
              <div className="flex items-center gap-2 text-xs font-medium">
                <Button 
                  variant="utility" 
                  className="h-7 px-2"
                  disabled={editingIndex === 0}
                  onClick={() => setEditingIndex(editingIndex - 1)}
                >Prev</Button>
                <span className="text-[hsl(var(--ink-secondary))]">{editingIndex + 1} of {transactions.length}</span>
                <Button 
                  variant="utility" 
                  className="h-7 px-2"
                  disabled={editingIndex === transactions.length - 1}
                  onClick={() => setEditingIndex(editingIndex + 1)}
                >Next</Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <EditableTransactionForm
                transaction={transactions[editingIndex]}
                accounts={accounts}
                categories={categories}
                incomeTypes={incomeTypes}
                savingsGoals={savingsGoals}
                onChange={(updates) => updateTransaction(editingIndex, updates)}
              />
            </div>
            <div className="p-4 border-t border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]">
              <Button 
                variant="primary" 
                className="w-full h-11"
                onClick={() => {
                  if (editingIndex < transactions.length - 1) {
                    setEditingIndex(editingIndex + 1);
                  } else {
                    setStep('LIST');
                  }
                }}
              >
                {editingIndex < transactions.length - 1 ? 'Save & Next' : 'Save & Back to List'}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PUBLIC_INSTITUTIONS, Institution } from "@/lib/constants/institutions";
import { Landmark, CreditCard, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddAccountDialog({ open, onOpenChange, onSuccess }: AddAccountDialogProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<'BANK_ACCOUNT' | 'CREDIT_CARD'>('BANK_ACCOUNT');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInst, setSelectedInst] = useState<Institution | null>(null);

  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [notes, setNotes] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [statementDay, setStatementDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset state when opened
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setStep(1);
      setType('BANK_ACCOUNT');
      setSearchQuery('');
      setSelectedInst(null);
      setName('');
      setInitialBalance('');
      setLastFour('');
      setNotes('');
      setCreditLimit('');
      setStatementDay('');
      setDueDay('');
    }
    onOpenChange(isOpen);
  };

  const handleInstSelect = (inst: Institution) => {
    setSelectedInst(inst);
    setName(inst.name);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const payload = {
        name,
        type,
        institutionId: selectedInst?.id || null,
        initialBalanceMinor: initialBalance ? Math.round(parseFloat(initialBalance) * 100) : null,
        lastFour: lastFour.trim() || null,
        notes: notes.trim() || null,
        creditLimitMinor: type === 'CREDIT_CARD' && creditLimit ? Math.round(parseFloat(creditLimit) * 100) : null,
        statementDay: type === 'CREDIT_CARD' && statementDay ? parseInt(statementDay) : null,
        dueDay: type === 'CREDIT_CARD' && dueDay ? parseInt(dueDay) : null,
      };

      const res = await fetch('/api/finance/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess?.();
        handleOpenChange(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredInstitutions = useMemo(() => {
    const base = PUBLIC_INSTITUTIONS.filter(i => i.type === type);
    const q = searchQuery.toLowerCase().trim();
    if (!q) return base;
    return base.filter(i => 
      i.name.toLowerCase().includes(q) || 
      i.aliases.some(a => a.toLowerCase().includes(q))
    );
  }, [type, searchQuery]);

  const popularInstitutions = useMemo(() => filteredInstitutions.filter(i => i.isPopular), [filteredInstitutions]);
  const otherInstitutions = useMemo(() => filteredInstitutions.filter(i => !i.isPopular), [filteredInstitutions]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-[hsl(var(--surface))] max-h-[85vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-[hsl(var(--hairline))] bg-[hsl(var(--surface-elevated))] shrink-0">
          <DialogTitle>Add Account</DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <div className="p-6 flex-1 overflow-y-auto space-y-6">
            <div className="flex gap-2 p-1 bg-[hsl(var(--canvas))] rounded-lg border border-[hsl(var(--hairline))]">
              <button
                className={cn(
                  "flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                  type === 'BANK_ACCOUNT' ? "bg-[hsl(var(--surface-elevated))] shadow-sm" : "text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))]"
                )}
                onClick={() => setType('BANK_ACCOUNT')}
              >
                <Landmark className="w-4 h-4" /> Bank
              </button>
              <button
                className={cn(
                  "flex-1 py-1.5 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                  type === 'CREDIT_CARD' ? "bg-[hsl(var(--surface-elevated))] shadow-sm" : "text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))]"
                )}
                onClick={() => setType('CREDIT_CARD')}
              >
                <CreditCard className="w-4 h-4" /> Credit Card
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--ink-muted))]" />
              <Input 
                placeholder={`Search ${type === 'BANK_ACCOUNT' ? 'banks' : 'credit cards'}...`}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-[hsl(var(--surface-elevated))]"
              />
            </div>

            <div>
              {!searchQuery && popularInstitutions.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider mb-3">POPULAR {type === 'BANK_ACCOUNT' ? 'BANKS' : 'CARDS'}</p>
                  <div className="grid grid-cols-2 gap-3">
                    {popularInstitutions.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => handleInstSelect(inst)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-elevated))] hover:border-[hsl(var(--ink-muted))] transition-colors text-left"
                      >
                        <div className={cn("shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-white font-bold bg-gradient-to-br", inst.gradient)}>
                          {inst.initial}
                        </div>
                        <span className="text-sm font-medium truncate">{inst.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider mb-3">
                  {searchQuery ? 'SEARCH RESULTS' : `ALL ${type === 'BANK_ACCOUNT' ? 'BANKS' : 'CARDS'}`}
                </p>
                {filteredInstitutions.length === 0 ? (
                  <p className="text-sm text-[hsl(var(--ink-secondary))] py-4 text-center">No institutions found.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {(searchQuery ? filteredInstitutions : otherInstitutions).map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => handleInstSelect(inst)}
                        className="flex items-center gap-3 p-3 rounded-lg border border-[hsl(var(--hairline))] bg-[hsl(var(--surface-elevated))] hover:border-[hsl(var(--ink-muted))] transition-colors text-left"
                      >
                        <div className={cn("shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-white font-bold bg-gradient-to-br", inst.gradient)}>
                          {inst.initial}
                        </div>
                        <span className="text-sm font-medium truncate">{inst.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto space-y-4">
            <div className="flex items-center gap-3 mb-6 p-4 rounded-lg bg-[hsl(var(--canvas))] border border-[hsl(var(--hairline))]">
              {selectedInst && (
                <div className={cn("w-10 h-10 rounded-md flex items-center justify-center text-white font-bold bg-gradient-to-br", selectedInst.gradient)}>
                  {selectedInst.initial}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold">{type === 'BANK_ACCOUNT' ? 'Bank Account' : 'Credit Card'}</p>
                <p className="text-xs text-[hsl(var(--ink-secondary))]">{selectedInst?.name}</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Account Name</label>
              <Input 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
                placeholder="e.g. Primary Checking"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">{type === 'BANK_ACCOUNT' ? 'Current Balance (₹)' : 'Outstanding (₹)'}</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={initialBalance} 
                  onChange={e => setInitialBalance(e.target.value)} 
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Last 4 Digits <span className="text-[hsl(var(--ink-secondary))] font-normal">(Optional)</span></label>
                <Input 
                  value={lastFour} 
                  onChange={e => setLastFour(e.target.value)} 
                  maxLength={4}
                  placeholder="e.g. 1234"
                />
              </div>
            </div>

            {type === 'CREDIT_CARD' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Credit Limit (₹)</label>
                  <Input 
                    type="number" 
                    value={creditLimit} 
                    onChange={e => setCreditLimit(e.target.value)} 
                    placeholder="e.g. 500000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Statement Day</label>
                    <Input 
                      type="number" 
                      min="1" max="31" 
                      value={statementDay} 
                      onChange={e => setStatementDay(e.target.value)} 
                      placeholder="e.g. 15"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Due Day</label>
                    <Input 
                      type="number" 
                      min="1" max="31" 
                      value={dueDay} 
                      onChange={e => setDueDay(e.target.value)} 
                      placeholder="e.g. 5"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium">Notes <span className="text-[hsl(var(--ink-secondary))] font-normal">(Optional)</span></label>
              <Input 
                value={notes} 
                onChange={e => setNotes(e.target.value)} 
                placeholder="Any additional notes..."
              />
            </div>

            <div className="bg-[hsl(var(--canvas))] p-3 rounded-md border border-[hsl(var(--hairline))]">
              <p className="text-xs text-[hsl(var(--ink-secondary))] leading-relaxed text-center">
                <strong>Privacy Note:</strong> Saarthi will never ask for your full card number, CVV, OTP, internet banking password, or PIN.
              </p>
            </div>

            <DialogFooter className="pt-4 border-t border-[hsl(var(--hairline))] mt-6 shrink-0">
              <Button type="button" variant="utility" onClick={() => setStep(1)}>Back</Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? 'Adding...' : 'Add Account'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Landmark, X, Check } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useMediaQuery } from "@/lib/hooks/use-media-query";

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string; prefix: string }> = {
  INCOME:              { label: 'Income',       icon: ArrowDownRight, color: 'text-[hsl(var(--success))]', bgColor: 'bg-[hsl(var(--success))]/10', prefix: '+' },
  EXPENSE:             { label: 'Expense',      icon: ArrowUpRight,   color: 'text-[hsl(var(--destructive))]',     bgColor: 'bg-[hsl(var(--destructive))]/10',     prefix: '-' },
  TRANSFER:            { label: 'Transfer',     icon: ArrowRightLeft, color: 'text-[hsl(var(--primary))]',  bgColor: 'bg-[hsl(var(--primary))]/10',  prefix: '' },
  CREDIT_CARD_PAYMENT: { label: 'CC Payment',   icon: Landmark,       color: 'text-[hsl(var(--info))]',    bgColor: 'bg-[hsl(var(--info))]/10',    prefix: '' },
};

export function TransactionEditDrawer({ 
  open, 
  onOpenChange, 
  transaction, 
  accounts, 
  categories,
  incomeTypes,
  savingsGoals = [],
  onSaved
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  transaction: any;
  accounts: any[];
  categories: any[];
  incomeTypes: any[];
  savingsGoals?: any[];
  onSaved: () => void;
}) {
  const [description, setDescription] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [categoryId, setCategoryId] = useState("none");
  const [incomeTypeId, setIncomeTypeId] = useState("none");
  const [savingsGoalId, setSavingsGoalId] = useState("none");
  const [accountId, setAccountId] = useState("none");
  const [destinationAccountId, setDestinationAccountId] = useState("none");
  const [type, setType] = useState("EXPENSE");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Sync state whenever transaction changes (fixes empty form bug)
  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || "");
      setMerchant(transaction.merchant || "");
      setAmount(transaction.amount ? (transaction.amount).toString() : "");
      setDate(transaction.transactionDate || "");
      setCategoryId(transaction.categoryId || "none");
      setIncomeTypeId(transaction.incomeTypeId || "none");
      setSavingsGoalId(transaction.savingsGoalId || "none");
      setAccountId(transaction.accountId || "none");
      setDestinationAccountId(transaction.destinationAccountId || "none");
      setType(transaction.type || "EXPENSE");
      setSaved(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.EXPENSE;
  const Icon = cfg.icon;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          merchant,
          amount: parseFloat(amount),
          transactionDate: date,
          categoryId: categoryId === 'none' ? null : categoryId,
          incomeTypeId: incomeTypeId === 'none' ? null : incomeTypeId,
          savingsGoalId: savingsGoalId === 'none' ? null : savingsGoalId,
          accountId: accountId === 'none' ? null : accountId,
          destinationAccountId: destinationAccountId === 'none' ? null : destinationAccountId,
          type,
        })
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          onSaved();
          onOpenChange(false);
          setSaved(false);
        }, 700);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/finance/transactions/${transaction.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => {
          onSaved();
          onOpenChange(false);
          setSaved(false);
        }, 700);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={isDesktop ? "right" : "bottom"} className="sm:max-w-[460px] mx-auto sm:mx-0 h-[90vh] sm:h-full p-0 flex flex-col overflow-hidden bg-[hsl(var(--surface))] rounded-t-xl sm:rounded-none sm:rounded-l-xl border-t sm:border-t-0 sm:border-l border-[hsl(var(--hairline))]">
        
        {/* Color-coded hero header */}
        <div className={`relative p-6 pb-5 ${cfg.bgColor}`}>
          <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))] transition-colors">
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.bgColor} border border-white/10`}>
              <Icon className={`w-5 h-5 ${cfg.color}`} />
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-widest ${cfg.color}`}>{cfg.label}</p>
              <p className="text-[hsl(var(--ink-secondary))] text-xs">
                {date ? format(parseISO(date), 'd MMM yyyy') : 'No date'}
              </p>
            </div>
          </div>

          {/* Editable big amount */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl text-[hsl(var(--ink-secondary))] font-light shrink-0 whitespace-nowrap">{cfg.prefix}₹</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="text-4xl font-bold bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-[hsl(var(--ink))] w-full min-w-0 placeholder:text-[hsl(var(--ink-muted))]"
              placeholder="0"
            />
          </div>
        </div>

        {/* Form body */}
        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Merchant</Label>
              <Input value={merchant} onChange={e => setMerchant(e.target.value)} placeholder="e.g. Swiggy" className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11" />
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Salary, Amazon" className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11" />
          </div>

          {/* Type selector grid */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Transaction Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, c]) => {
                const TIcon = c.icon;
                const active = type === key;
                return (
                  <button key={key} type="button" onClick={() => setType(key)}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border text-[10px] font-medium transition-all ${
                      active ? `${c.bgColor} border-white/20 ${c.color}` : 'bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] text-[hsl(var(--ink-secondary))] hover:border-[hsl(var(--ink-muted))]'
                    }`}
                  >
                    <TIcon className="w-4 h-4" />
                    <span className="leading-tight text-center whitespace-nowrap">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">From Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11">
                <SelectValue placeholder="No account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No account</SelectItem>
                {accounts.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(type === 'TRANSFER' || type === 'CREDIT_CARD_PAYMENT') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">To Account</Label>
              <Select value={destinationAccountId} onValueChange={setDestinationAccountId}>
                <SelectTrigger className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11">
                  <SelectValue placeholder="No account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No account</SelectItem>
                  {accounts.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(type === 'EXPENSE' || type === 'INCOME') && (
            <div className="space-y-1.5">
              <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">{type === 'INCOME' ? 'Income Type' : 'Category'}</Label>
              <Select value={type === 'INCOME' ? incomeTypeId : categoryId} onValueChange={type === 'INCOME' ? setIncomeTypeId : setCategoryId}>
                <SelectTrigger className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11">
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {(type === 'INCOME' ? incomeTypes : categories).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'EXPENSE' && savingsGoals.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold flex justify-between">
                <span>Spend from Fund <span className="font-normal">(Optional)</span></span>
                {savingsGoalId && (
                  <span className="text-[hsl(var(--destructive))] font-normal cursor-pointer capitalize" onClick={() => setSavingsGoalId('')}>Clear</span>
                )}
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
                {savingsGoals.map((sg: any) => (
                  <div
                    key={sg.id}
                    onClick={() => {
                      if (savingsGoalId === sg.id) {
                        setSavingsGoalId('');
                      } else {
                        if (sg.name.toLowerCase() === 'savings') {
                          if (window.confirm(`Are you sure you want to spend from the ${sg.name} fund?`)) {
                            setSavingsGoalId(sg.id);
                          }
                        } else {
                          setSavingsGoalId(sg.id);
                        }
                      }
                    }}
                    className={`p-2 border border-[hsl(var(--hairline))] rounded-md text-center text-xs cursor-pointer transition-colors ${savingsGoalId === sg.id ? 'bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]' : 'bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-elevated))]'}`}
                  >
                    {sg.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t border-[hsl(var(--hairline))] mt-4">
            <Button type="button" variant="utility" className="h-11 px-4 text-[hsl(var(--destructive))] hover:border-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10" onClick={handleDelete} disabled={loading || saved}>Delete</Button>
            <Button type="button" variant="utility" className="flex-1 h-11" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1 h-11 gap-2" disabled={loading || saved}>
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : loading ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

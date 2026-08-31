"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, CreditCard, Landmark, RotateCcw, X, Check } from "lucide-react";
import { format, parseISO } from "date-fns";

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string; prefix: string }> = {
  INCOME:              { label: 'Income',       icon: ArrowDownRight, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10', prefix: '+' },
  EXPENSE:             { label: 'Expense',      icon: ArrowUpRight,   color: 'text-red-400',     bgColor: 'bg-red-500/10',     prefix: '-' },
  CREDIT_CARD_PURCHASE:{ label: 'CC Purchase',  icon: CreditCard,     color: 'text-orange-400',  bgColor: 'bg-orange-500/10',  prefix: '-' },
  CREDIT_CARD_PAYMENT: { label: 'CC Payment',   icon: Landmark,       color: 'text-blue-400',    bgColor: 'bg-blue-500/10',    prefix: '' },
  TRANSFER:            { label: 'Transfer',     icon: ArrowRightLeft, color: 'text-purple-400',  bgColor: 'bg-purple-500/10',  prefix: '' },
  REFUND:              { label: 'Refund',       icon: RotateCcw,      color: 'text-cyan-400',    bgColor: 'bg-cyan-500/10',    prefix: '+' },
};

export function TransactionEditDrawer({ 
  open, 
  onOpenChange, 
  transaction, 
  accounts, 
  categories,
  onSaved
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  transaction: any;
  accounts: any[];
  categories: any[];
  onSaved: () => void;
}) {
  const [remark, setRemark] = useState(transaction?.remark || transaction?.originalDescription || "");
  const [amount, setAmount] = useState(transaction?.amountMinor ? transaction.amountMinor.toString() : "");
  const [date, setDate] = useState(transaction?.transactionDate || "");
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || "none");
  const [type, setType] = useState(transaction?.type || "EXPENSE");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

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
          remark,
          amountMinor: parseInt(amount, 10),
          transactionDate: date,
          categoryId: categoryId === 'none' ? null : categoryId,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]">
        
        {/* Header Hero */}
        <div className={`relative p-6 pb-5 ${cfg.bgColor}`}>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))] transition-colors"
          >
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

          {/* Big amount display */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl text-[hsl(var(--ink-secondary))] font-light">{cfg.prefix}₹</span>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="text-4xl font-bold bg-transparent border-none outline-none text-[hsl(var(--ink))] w-full min-w-0 placeholder:text-[hsl(var(--ink-muted))]"
              placeholder="0"
            />
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Merchant */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Merchant / Description</Label>
            <Input
              value={remark}
              onChange={e => setRemark(e.target.value)}
              placeholder="e.g. Swiggy, Salary, Amazon"
              className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Date</Label>
            <Input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11"
            />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Transaction Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(TYPE_CONFIG).map(([key, c]) => {
                const TIcon = c.icon;
                const active = type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      active
                        ? `${c.bgColor} border-white/20 ${c.color}`
                        : 'bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] text-[hsl(var(--ink-secondary))] hover:border-[hsl(var(--ink-muted))]'
                    }`}
                  >
                    <TIcon className="w-4 h-4" />
                    <span className="leading-tight text-center">{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11">
                <SelectValue placeholder="No category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Import badge */}
          {transaction.originalDescription && (
            <div className="flex items-start gap-2 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] p-3 rounded-lg">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--ink-muted))] mt-0.5 shrink-0">Imported</span>
              <span className="text-xs text-[hsl(var(--ink-secondary))] truncate">{transaction.originalDescription}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="utility"
              className="flex-1 h-11"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="flex-1 h-11 gap-2"
              disabled={loading || saved}
            >
              {saved ? (
                <><Check className="w-4 h-4" /> Saved!</>
              ) : loading ? (
                'Saving...'
              ) : (
                'Save changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

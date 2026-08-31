"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  const [type, setType] = useState(transaction?.type || "");
  
  const [loading, setLoading] = useState(false);
  
  if (!transaction) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        remark,
        amountMinor: parseInt(amount, 10),
        transactionDate: date,
        categoryId: categoryId === 'none' ? null : categoryId,
        type
      };

      const res = await fetch(`/api/finance/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onSaved();
        onOpenChange(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4">
          
          <div className="space-y-2">
            <Label>Description / Merchant</Label>
            <Input value={remark} onChange={e => setRemark(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="CREDIT_CARD_PURCHASE">CC Purchase</SelectItem>
                  <SelectItem value="CREDIT_CARD_PAYMENT">CC Payment</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                  <SelectItem value="REFUND">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="No category" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {transaction.originalDescription && (
            <div className="bg-[hsl(var(--surface-elevated))] p-3 rounded text-xs text-[hsl(var(--ink-secondary))]">
              <strong>Imported data:</strong> {transaction.originalDescription}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="utility" className="flex-1" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1" disabled={loading}>Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

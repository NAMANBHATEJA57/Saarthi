"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Archive, Trash2, Landmark, CreditCard, RefreshCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AddAccountDialog } from "@/components/finance/AddAccountDialog";
import { PUBLIC_INSTITUTIONS } from "@/lib/constants/institutions";
import { cn } from "@/lib/utils";

function EditAccountDialog({ account, open, onOpenChange, onSaved }: { account: any; open: boolean; onOpenChange: (v: boolean) => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // Populate form whenever account changes
  useEffect(() => {
    if (account) {
      setName(account.name || "");
      setLastFour(account.lastFour || "");
      setCreditLimit(account.creditLimitMinor ? account.creditLimitMinor.toString() : "");
      setSaved(false);
    }
  }, [account]);

  if (!account) return null;

  const isCard = account.type === 'CREDIT_CARD';
  const accentColor = isCard ? 'bg-purple-500/10' : 'bg-blue-500/10';
  const iconColor = isCard ? 'text-purple-400' : 'text-blue-400';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { name };
      if (lastFour) payload.lastFour = lastFour;
      if (isCard && creditLimit) payload.creditLimitMinor = parseInt(creditLimit, 10);

      const res = await fetch(`/api/finance/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]">

        {/* Hero header */}
        <div className={`relative p-6 pb-5 ${accentColor}`}>
          <button onClick={() => onOpenChange(false)} className="absolute top-4 right-4 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--ink))] transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${accentColor} border border-white/10`}>
              {isCard ? <CreditCard className={`w-5 h-5 ${iconColor}`} /> : <Landmark className={`w-5 h-5 ${iconColor}`} />}
            </div>
            <div>
              <p className={`text-xs font-semibold uppercase tracking-widest ${iconColor}`}>
                {isCard ? 'Credit Card' : 'Bank Account'}
              </p>
              <p className="text-xl font-bold text-[hsl(var(--ink))] mt-0.5">{account.name}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Display Name</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. HDFC Savings, ICICI Amazon Pay"
              className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Last 4 Digits</Label>
            <Input
              value={lastFour}
              onChange={e => setLastFour(e.target.value.slice(0, 4))}
              placeholder="e.g. 4242"
              maxLength={4}
              className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11 font-mono tracking-widest"
            />
          </div>

          {isCard && (
            <div className="space-y-1.5">
              <Label className="text-xs text-[hsl(var(--ink-secondary))] uppercase tracking-wider font-semibold">Credit Limit</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--ink-secondary))] text-sm">₹</span>
                <Input
                  type="number"
                  value={creditLimit}
                  onChange={e => setCreditLimit(e.target.value)}
                  placeholder="e.g. 200000"
                  className="bg-[hsl(var(--surface-elevated))] border-[hsl(var(--hairline))] h-11 pl-7"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="utility" className="flex-1 h-11" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="flex-1 h-11 gap-2" disabled={loading || saved}>
              {saved ? <><Check className="w-4 h-4" /> Saved!</> : loading ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function SettingsFinanceSection({ accounts = [] }: { accounts?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editAccount, setEditAccount] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const activeAccounts = accounts.filter(a => a.isActive);
  const archivedAccounts = accounts.filter(a => !a.isActive);

  const banks = activeAccounts.filter(a => a.type === 'BANK_ACCOUNT');
  const cards = activeAccounts.filter(a => a.type === 'CREDIT_CARD');

  const getInstitutionDetails = (instId: string, type: string) => {
    return PUBLIC_INSTITUTIONS.find(i => i.id === instId) || PUBLIC_INSTITUTIONS.find(i => i.id === (type === 'BANK_ACCOUNT' ? 'bank-other' : 'card-other'));
  };

  const handleArchive = async (id: string, archive: boolean) => {
    setIsRefreshing(true);
    await fetch(`/api/finance/accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !archive }),
    });
    window.location.reload();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this account? Your transaction history will be preserved, but the account will no longer appear.")) return;
    setIsRefreshing(true);
    await fetch(`/api/finance/accounts/${id}`, { method: 'DELETE' });
    window.location.reload();
  };

  const renderAccount = (acc: any) => {
    const inst = getInstitutionDetails(acc.institutionId, acc.type);
    return (
      <div key={acc.id} className="flex items-center justify-between p-4 bg-[hsl(var(--canvas))] border border-[hsl(var(--hairline))] rounded-lg group hover:border-[hsl(var(--ink-muted))] transition-colors">
        <div className="flex items-center gap-4">
          {inst && (
            <div className={cn("shrink-0 w-10 h-10 rounded-md flex items-center justify-center text-white font-bold bg-gradient-to-br", inst.gradient, !acc.isActive && "opacity-50 grayscale")}>
              {inst.initial}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className={cn("font-medium", !acc.isActive && "text-[hsl(var(--ink-secondary))] line-through")}>{acc.name}</span>
              {acc.lastFour && (
                <span className="text-xs px-1.5 py-0.5 bg-[hsl(var(--surface-elevated))] text-[hsl(var(--ink-secondary))] border border-[hsl(var(--hairline))] rounded font-mono">
                  •••• {acc.lastFour}
                </span>
              )}
            </div>
            <div className="text-xs text-[hsl(var(--ink-secondary))] mt-0.5 flex gap-3">
              <span>{inst?.name}</span>
              {acc.type === 'CREDIT_CARD' && acc.creditLimitMinor ? (
                <span>Limit: ₹{acc.creditLimitMinor.toLocaleString()}</span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* EDIT */}
          <Button
            variant="icon"
            className="h-8 w-8 text-[hsl(var(--ink-secondary))] hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/10"
            onClick={() => setEditAccount(acc)}
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </Button>

          {/* ARCHIVE / RESTORE */}
          {acc.isActive ? (
            <Button variant="icon" className="h-8 w-8 text-[hsl(var(--ink-secondary))]" onClick={() => handleArchive(acc.id, true)} title="Archive">
              <Archive className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="icon" className="h-8 w-8 text-[hsl(var(--ink-secondary))]" onClick={() => handleArchive(acc.id, false)} title="Restore">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          )}

          {/* DELETE */}
          <Button
            variant="icon"
            className="h-8 w-8 text-[hsl(var(--destructive))] hover:text-white hover:bg-[hsl(var(--destructive))]"
            onClick={() => handleDelete(acc.id)}
            title="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 bg-[hsl(var(--surface))] p-5 rounded-lg border border-[hsl(var(--hairline))]">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold">Finance Integration</h3>
          <p className="text-xs text-[hsl(var(--ink-secondary))] max-w-md">
            Manage your connected bank accounts and credit cards. Removing an account hides it but preserves past transaction history.
          </p>
        </div>
        <Button variant="secondary" onClick={() => setIsOpen(true)} className="gap-2 shrink-0" disabled={isRefreshing}>
          <Plus className="w-4 h-4" /> Add Account
        </Button>
      </div>

      <div className="mt-6 space-y-6">
        {banks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider flex items-center gap-2">
              <Landmark className="w-3.5 h-3.5" /> BANK ACCOUNTS
            </h4>
            <div className="grid gap-2">{banks.map(renderAccount)}</div>
          </div>
        )}

        {cards.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5" /> CREDIT CARDS
            </h4>
            <div className="grid gap-2">{cards.map(renderAccount)}</div>
          </div>
        )}

        {archivedAccounts.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-[hsl(var(--hairline))]">
            <h4 className="text-xs font-semibold text-[hsl(var(--ink-muted))] tracking-wider flex items-center gap-2">
              <Archive className="w-3.5 h-3.5" /> ARCHIVED ACCOUNTS
            </h4>
            <div className="grid gap-2 opacity-80">{archivedAccounts.map(renderAccount)}</div>
          </div>
        )}

        {accounts.length === 0 && (
          <div className="py-6 text-center text-sm text-[hsl(var(--ink-secondary))] bg-[hsl(var(--canvas))] border border-dashed border-[hsl(var(--hairline))] rounded-lg">
            No accounts linked yet.
          </div>
        )}
      </div>

      <AddAccountDialog open={isOpen} onOpenChange={setIsOpen} onSuccess={() => window.location.reload()} />

      <EditAccountDialog
        account={editAccount}
        open={!!editAccount}
        onOpenChange={(v) => !v && setEditAccount(null)}
        onSaved={() => window.location.reload()}
      />
    </div>
  );
}

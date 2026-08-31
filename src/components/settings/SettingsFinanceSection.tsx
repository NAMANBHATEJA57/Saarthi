"use client";

import { useState } from "react";
import { Plus, Edit2, Archive, Trash2, Landmark, CreditCard, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddAccountDialog } from "@/components/finance/AddAccountDialog";
import { PUBLIC_INSTITUTIONS } from "@/lib/constants/institutions";
import { cn } from "@/lib/utils";

export function SettingsFinanceSection({ accounts = [] }: { accounts?: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
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
      <div key={acc.id} className="flex items-center justify-between p-4 bg-[hsl(var(--canvas))] border border-[hsl(var(--hairline))] rounded-lg">
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
                <span className="text-xs px-1.5 py-0.5 bg-[hsl(var(--surface-elevated))] text-[hsl(var(--ink-secondary))] border border-[hsl(var(--hairline))] rounded">
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
        
        <div className="flex items-center gap-2">
          {/* Note: Balance display would normally be computed from transactions. 
              Here we just provide actions for settings. */}
          {acc.isActive ? (
            <Button variant="icon" className="h-8 w-8 text-[hsl(var(--ink-secondary))]" onClick={() => handleArchive(acc.id, true)} title="Archive">
              <Archive className="w-4 h-4" />
            </Button>
          ) : (
            <Button variant="icon" className="h-8 w-8 text-[hsl(var(--ink-secondary))]" onClick={() => handleArchive(acc.id, false)} title="Restore">
              <RefreshCcw className="w-4 h-4" />
            </Button>
          )}
          <Button variant="icon" className="h-8 w-8 text-[hsl(var(--destructive))] hover:text-white hover:bg-[hsl(var(--destructive))]" onClick={() => handleDelete(acc.id)} title="Remove">
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
        <Button 
          variant="secondary" 
          onClick={() => setIsOpen(true)}
          className="gap-2 shrink-0"
          disabled={isRefreshing}
        >
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

      <AddAccountDialog 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        onSuccess={() => window.location.reload()} 
      />
    </div>
  );
}

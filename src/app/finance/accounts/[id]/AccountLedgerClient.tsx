"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Landmark, CreditCard } from 'lucide-react';
import { TransactionHistory } from '@/components/finance/TransactionHistory';

export function AccountLedgerClient({ account }: { account: any }) {
  const router = useRouter();

  const isCC = account.type === 'CREDIT_CARD';

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="utility" onClick={() => router.back()} className="h-8 w-8 p-0 rounded-full">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{account.name}</h1>
          <p className="text-xs text-[hsl(var(--ink-secondary))]">{account.lastFour ? `•••• ${account.lastFour}` : 'Account Ledger'}</p>
        </div>
      </div>

      <Card className="bg-[hsl(var(--surface))] overflow-hidden border-none shadow-sm ring-1 ring-[hsl(var(--hairline))]">
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${isCC ? 'bg-[hsl(var(--destructive-muted))] text-[hsl(var(--destructive))]' : 'bg-[hsl(var(--success-muted))] text-[hsl(var(--success))]'}`}>
              {isCC ? <CreditCard className="w-6 h-6" /> : <Landmark className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-[12px] font-semibold text-[hsl(var(--ink-secondary))] uppercase tracking-wider mb-1">
                {isCC ? 'Current Outstanding' : 'Available Balance'}
              </p>
              <p className={`text-3xl font-bold ${isCC ? 'text-[hsl(var(--destructive))]' : 'text-[hsl(var(--success))]'}`}>
                ₹{account.balanceMinor.toLocaleString()}
              </p>
            </div>
          </div>
          
          {isCC && account.creditLimitMinor && (
            <div className="bg-[hsl(var(--canvas))] p-4 rounded-lg border border-[hsl(var(--hairline))]">
              <p className="text-[11px] font-semibold text-[hsl(var(--ink-secondary))] uppercase tracking-wider mb-1">Credit Limit</p>
              <p className="text-lg font-medium">₹{account.creditLimitMinor.toLocaleString()}</p>
              <div className="h-1.5 w-full bg-[hsl(var(--surface-elevated))] rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-[hsl(var(--destructive))]" 
                  style={{ width: `${Math.min(100, (account.balanceMinor / account.creditLimitMinor) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4">Transaction Ledger</h2>
        <TransactionHistory limit={100} accountId={account.id} />
      </div>
    </div>
  );
}

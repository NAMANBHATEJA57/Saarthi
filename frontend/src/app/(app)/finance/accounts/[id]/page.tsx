import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { AccountLedgerClient } from './AccountLedgerClient';
import { getAccountBalances } from '@/lib/finance/service';

export default async function AccountLedgerPage(context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const { id } = await context.params;

  // We fetch account details and its balance
  const balances = await getAccountBalances(session.user.id);
  const account = balances.find(a => a.id === id);

  if (!account) {
    redirect('/finance');
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      <AccountLedgerClient account={account} />
    </div>
  );
}

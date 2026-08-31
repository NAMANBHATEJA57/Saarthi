import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { TransactionsClient } from './TransactionsClient';
import { db } from '@/lib/db';
import { financeAccounts, financeCategories } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  
  const userId = session.user.id;

  const [accounts, categories] = await Promise.all([
    db.select().from(financeAccounts).where(eq(financeAccounts.userId, userId)),
    db.select().from(financeCategories).where(eq(financeCategories.userId, userId)).orderBy(desc(financeCategories.sortOrder))
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
      </header>
      <TransactionsClient accounts={accounts} categories={categories} />
    </div>
  );
}

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { TransactionsClient } from './TransactionsClient';
import { db } from '@/lib/db';
import { financeAccounts, financeCategories, financeIncomeTypes, financeSavingsGoals } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  
  const userId = session.user.id;

  const [accounts, categories, incomeTypes, savingsGoals] = await Promise.all([
    db.select().from(financeAccounts).where(eq(financeAccounts.userId, userId)),
    db.select().from(financeCategories).where(and(eq(financeCategories.userId, userId), eq(financeCategories.isActive, true))).orderBy(desc(financeCategories.sortOrder)),
    db.select().from(financeIncomeTypes).where(and(eq(financeIncomeTypes.userId, userId), eq(financeIncomeTypes.isActive, true))).orderBy(desc(financeIncomeTypes.sortOrder)),
    db.select().from(financeSavingsGoals).where(and(eq(financeSavingsGoals.userId, userId), eq(financeSavingsGoals.isActive, true))).orderBy(desc(financeSavingsGoals.createdAt))
  ]);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
      </header>
      <TransactionsClient accounts={accounts} categories={categories} incomeTypes={incomeTypes} savingsGoals={savingsGoals} />
    </div>
  );
}

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { financeCategories, financeIncomeTypes, financeSavingsGoals } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const [categories, incomeTypes, savingsGoals] = await Promise.all([
    db.select().from(financeCategories).where(eq(financeCategories.userId, userId)).orderBy(desc(financeCategories.sortOrder)),
    db.select().from(financeIncomeTypes).where(eq(financeIncomeTypes.userId, userId)).orderBy(desc(financeIncomeTypes.sortOrder)),
    db.select().from(financeSavingsGoals).where(eq(financeSavingsGoals.userId, userId)).orderBy(desc(financeSavingsGoals.createdAt)),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Finance Settings</h1>
        <p className="text-[hsl(var(--ink-secondary))] mt-1">Manage categories, income types, and savings goals.</p>
      </header>
      
      <SettingsClient 
        initialCategories={categories}
        initialIncomeTypes={incomeTypes}
        initialSavingsGoals={savingsGoals}
      />
    </div>
  );
}

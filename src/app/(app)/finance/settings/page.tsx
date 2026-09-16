import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { financeCategories, financeIncomeTypes, financeSavingsGoals, users } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const [categories, incomeTypes, savingsGoals, userRecord] = await Promise.all([
    db.select().from(financeCategories).where(and(eq(financeCategories.userId, userId), eq(financeCategories.isActive, true))).orderBy(desc(financeCategories.sortOrder)),
    db.select().from(financeIncomeTypes).where(and(eq(financeIncomeTypes.userId, userId), eq(financeIncomeTypes.isActive, true))).orderBy(desc(financeIncomeTypes.sortOrder)),
    db.select().from(financeSavingsGoals).where(and(eq(financeSavingsGoals.userId, userId), eq(financeSavingsGoals.isActive, true))).orderBy(desc(financeSavingsGoals.createdAt)),
    db.select().from(users).where(eq(users.id, userId)).limit(1),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Finance Settings</h1>
        <p className="text-[hsl(var(--ink-secondary))] mt-1">Manage categories, income types, and savings goals.</p>
      </header>
      
      <SettingsClient 
        initialExpectedIncome={userRecord[0]?.expectedMonthlyIncome || 0}
        initialCategories={categories}
        initialIncomeTypes={incomeTypes}
        initialSavingsGoals={savingsGoals}
      />
    </div>
  );
}

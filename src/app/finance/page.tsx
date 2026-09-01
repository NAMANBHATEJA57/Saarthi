import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getMonthlySummary, getAccountBalances } from '@/lib/finance/service';
import { db } from '@/lib/db';
import { financeIncomeTypes, financeSavingsGoals } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import FinanceClient from './FinanceClient';

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  
  const sp = await searchParams;
  const month = sp.month || new Date().toISOString().substring(0, 7);

  const summary = await getMonthlySummary(session.user.id, month);
  const accountBalances = await getAccountBalances(session.user.id);
  
  const incomeTypes = await db.select().from(financeIncomeTypes).where(and(eq(financeIncomeTypes.userId, session.user.id), eq(financeIncomeTypes.isActive, true))).orderBy(financeIncomeTypes.sortOrder);
  const savingsGoals = await db.select().from(financeSavingsGoals).where(and(eq(financeSavingsGoals.userId, session.user.id), eq(financeSavingsGoals.isActive, true)));

  return <FinanceClient initialSummary={summary} initialAccountBalances={accountBalances} currentMonth={month} incomeTypes={incomeTypes} savingsGoals={savingsGoals} />;
}

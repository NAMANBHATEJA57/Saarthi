import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getMonthlySummary, getAccountBalances } from '@/lib/finance/service';
import FinanceClient from './FinanceClient';

export default async function FinancePage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  
  const sp = await searchParams;
  const month = sp.month || new Date().toISOString().substring(0, 7);

  const summary = await getMonthlySummary(session.user.id, month);
  const accountBalances = await getAccountBalances(session.user.id);

  return <FinanceClient initialSummary={summary} initialAccountBalances={accountBalances} currentMonth={month} />;
}

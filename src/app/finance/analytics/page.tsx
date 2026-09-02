import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { financeTransactions, financeCategories } from '@/lib/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BackButton } from '@/components/shared/BackButton';
import { CategoryPieChart } from '@/components/finance/charts/CategoryPieChart';
import { IncomeExpenseBarChart } from '@/components/finance/charts/IncomeExpenseBarChart';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/sign-in');
  const userId = session.user.id;

  // 1. Fetch Categories for mapping
  const categories = await db.query.financeCategories.findMany({
    where: eq(financeCategories.userId, userId)
  });
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));

  // 2. Data for Category Pie Chart (Current Month)
  const today = new Date();
  const currentMonthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const currentMonthEnd = format(endOfMonth(today), 'yyyy-MM-dd');

  const currentMonthExpenses = await db.query.financeTransactions.findMany({
    where: and(
      eq(financeTransactions.userId, userId),
      eq(financeTransactions.type, 'EXPENSE'),
      gte(financeTransactions.transactionDate, currentMonthStart),
      lte(financeTransactions.transactionDate, currentMonthEnd)
    )
  });

  const categoryTotals: Record<string, number> = {};
  currentMonthExpenses.forEach(tx => {
    const catName = tx.categoryId ? (categoryMap.get(tx.categoryId) || 'Uncategorized') : 'Uncategorized';
    categoryTotals[catName] = (categoryTotals[catName] || 0) + tx.amount;
  });

  const pieChartData = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // Sort largest first

  // 3. Data for Income vs Expense Bar Chart (Last 6 Months)
  const sixMonthsAgo = startOfMonth(subMonths(today, 5));
  const sixMonthsAgoStr = format(sixMonthsAgo, 'yyyy-MM-dd');

  const trailingTransactions = await db.query.financeTransactions.findMany({
    where: and(
      eq(financeTransactions.userId, userId),
      gte(financeTransactions.transactionDate, sixMonthsAgoStr)
    )
  });

  // Group by month
  const monthlyDataMap: Record<string, { income: number, expense: number }> = {};
  
  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(today, i);
    const monthKey = format(monthDate, 'MMM yyyy');
    const sortKey = format(monthDate, 'yyyy-MM');
    monthlyDataMap[sortKey] = { income: 0, expense: 0, month: monthKey } as any;
  }

  trailingTransactions.forEach(tx => {
    const dateStr = tx.transactionDate; // yyyy-MM-dd
    const sortKey = dateStr.substring(0, 7); // yyyy-MM
    
    if (monthlyDataMap[sortKey]) {
      if (tx.type === 'INCOME') {
        monthlyDataMap[sortKey].income += tx.amount;
      } else if (tx.type === 'EXPENSE') {
        monthlyDataMap[sortKey].expense += tx.amount;
      }
    }
  });

  // Sort chronologically
  const barChartData = Object.keys(monthlyDataMap)
    .sort()
    .map(key => ({
      month: (monthlyDataMap[key] as any).month,
      income: monthlyDataMap[key].income,
      expense: monthlyDataMap[key].expense
    }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-4">
        <BackButton fallbackHref="/finance" />
        <div>
          <h1 className="text-2xl font-bold">Financial Analytics</h1>
          <p className="text-[hsl(var(--ink-secondary))] text-sm">Insights into your spending and income trends.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--hairline))]">
          <CardHeader>
            <CardTitle className="text-lg">This Month's Spending</CardTitle>
            <CardDescription>Breakdown by category for {format(today, 'MMMM yyyy')}</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryPieChart data={pieChartData} />
          </CardContent>
        </Card>

        <Card className="bg-[hsl(var(--surface))] border-[hsl(var(--hairline))]">
          <CardHeader>
            <CardTitle className="text-lg">Income vs Expense</CardTitle>
            <CardDescription>Cash flow trend over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <IncomeExpenseBarChart data={barChartData} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

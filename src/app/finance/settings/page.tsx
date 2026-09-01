import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, CreditCard, PieChart } from 'lucide-react';
import { db } from '@/lib/db';
import { financeCategories, financeIncomeTypes, financeSavingsGoals } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const [categories, incomeTypes, savingsGoals] = await Promise.all([
    db.select().from(financeCategories).where(eq(financeCategories.userId, userId)),
    db.select().from(financeIncomeTypes).where(eq(financeIncomeTypes.userId, userId)),
    db.select().from(financeSavingsGoals).where(eq(financeSavingsGoals.userId, userId)),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Finance Settings</h1>
        <p className="text-[hsl(var(--ink-secondary))] mt-1">Manage categories, income types, and savings goals.</p>
      </header>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Expense Categories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {categories.map(c => (
                <div key={c.id} className="px-3 py-1 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded-full text-sm">
                  {c.name}
                </div>
              ))}
            </div>
            <Button variant="utility" className="w-full">Manage Categories</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Income Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {incomeTypes.map(c => (
                <div key={c.id} className="px-3 py-1 bg-[hsl(var(--surface-elevated))] border border-[hsl(var(--hairline))] rounded-full text-sm">
                  {c.name}
                </div>
              ))}
            </div>
            <Button variant="utility" className="w-full">Manage Income Types</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Savings Goals</CardTitle>
          </CardHeader>
          <CardContent>
            {savingsGoals.length === 0 ? (
              <p className="text-sm text-[hsl(var(--ink-secondary))] pb-4">You haven't set up any savings goals yet.</p>
            ) : (
              <div className="space-y-2 pb-4">
                {savingsGoals.map(g => (
                  <div key={g.id} className="flex justify-between items-center p-3 border border-[hsl(var(--hairline))] rounded-lg">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-[hsl(var(--ink-muted))]">₹{g.targetAmount.toLocaleString()} target</span>
                  </div>
                ))}
              </div>
            )}
            <Button variant="utility">Create Savings Goal</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

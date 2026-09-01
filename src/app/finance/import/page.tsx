import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { financeAccounts, financeCategories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { CSVImportFlow } from '@/components/finance/CSVImportFlow';

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [accounts, categories] = await Promise.all([
    db.select().from(financeAccounts).where(eq(financeAccounts.userId, session.user.id)),
    db.select().from(financeCategories).where(eq(financeCategories.userId, session.user.id))
  ]);

  return <CSVImportFlow accounts={accounts} categories={categories} />;
}

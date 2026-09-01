import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Table } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function ImportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Bulk Import</h1>
        <p className="text-[hsl(var(--ink-secondary))] mt-1">Import transactions from a CSV or Excel file.</p>
      </header>

      <Card className="border-dashed border-2 border-[hsl(var(--hairline))] bg-transparent">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-[hsl(var(--surface-elevated))] rounded-full flex items-center justify-center">
            <Table className="w-8 h-8 text-[hsl(var(--ink-muted))]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-lg">Upload CSV/Excel</h3>
            <p className="text-sm text-[hsl(var(--ink-secondary))] max-w-sm">
              Upload your bank statement. You'll be able to map columns and review transactions before importing.
            </p>
          </div>
          <Button variant="primary" className="mt-4 gap-2">
            <Upload className="w-4 h-4" /> Select File
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

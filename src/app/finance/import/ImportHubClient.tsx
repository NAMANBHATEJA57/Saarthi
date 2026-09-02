"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileSpreadsheet, MessageSquareText, Receipt, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CSVImportFlow } from '@/components/finance/CSVImportFlow';
import { OCRClient } from '../ocr/OCRClient';
import { SmsImportDrawer } from '@/components/finance/SmsImportDrawer';

export function ImportHubClient({ accounts, categories }: { accounts: any[], categories: any[] }) {
  const router = useRouter();
  const [method, setMethod] = useState<'NONE' | 'CSV' | 'OCR' | 'SMS'>('NONE');

  if (method === 'CSV') {
    return (
      <div className="space-y-4">
        <Button variant="utility" onClick={() => setMethod('NONE')} className="gap-2 -ml-3"><ArrowLeft className="w-4 h-4" /> Back to Import Options</Button>
        <CSVImportFlow accounts={accounts} categories={categories} />
      </div>
    );
  }

  if (method === 'OCR') {
    return (
      <div className="space-y-4">
        <Button variant="utility" onClick={() => setMethod('NONE')} className="gap-2 -ml-3"><ArrowLeft className="w-4 h-4" /> Back to Import Options</Button>
        <OCRClient accounts={accounts} categories={categories} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="utility" onClick={() => router.push('/finance')} className="gap-2 -ml-3"><ArrowLeft className="w-4 h-4" /> Back to Ledger</Button>
      </div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Transactions</h1>
        <p className="text-[hsl(var(--ink-secondary))] mt-2">Choose how you want to add multiple transactions to your ledger.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 pt-4">
        <Card className="hover:border-[hsl(var(--ink-muted))] transition-colors cursor-pointer group bg-[hsl(var(--surface))]" onClick={() => setMethod('SMS')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <CardTitle>Paste SMS</CardTitle>
            <CardDescription>Paste up to 10 bank transaction messages at once.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:border-[hsl(var(--ink-muted))] transition-colors cursor-pointer group bg-[hsl(var(--surface))]" onClick={() => setMethod('OCR')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Receipt className="w-6 h-6" />
            </div>
            <CardTitle>Scan Receipt</CardTitle>
            <CardDescription>Upload a screenshot or photo of a receipt or bill.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:border-[hsl(var(--ink-muted))] transition-colors cursor-pointer group bg-[hsl(var(--surface))]" onClick={() => setMethod('CSV')}>
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>Import bank statements via CSV format.</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <SmsImportDrawer 
        open={method === 'SMS'} 
        onOpenChange={(open) => { if (!open) setMethod('NONE'); }} 
        onSuccess={() => { router.push('/finance'); router.refresh(); }} 
      />
    </div>
  );
}

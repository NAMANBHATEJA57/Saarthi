"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Upload, Trash, FileText } from 'lucide-react';
import { BackButton } from '@/components/shared/BackButton';

export function OCRClient({ accounts, categories }: { accounts: any[], categories: any[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedTxs, setParsedTxs] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/finance/ocr', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.transactions) {
        setParsedTxs(data.transactions);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveSelected = async () => {
    const toSave = parsedTxs.filter(t => t.selected);
    setLoading(true);
    
    for (const tx of toSave) {
      // Find a default category or just leave it blank
      const defaultCategory = categories.find(c => c.name.toLowerCase() === 'uncategorized') || categories[0];
      
      await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tx.type,
          amount: tx.amount,
          categoryId: defaultCategory?.id || null,
          accountId: selectedAccountId,
          description: tx.description,
          transactionDate: tx.date,
        }),
      });
    }
    
    setLoading(false);
    router.push('/finance');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <BackButton fallbackHref="/finance" />
        <div>
          <h1 className="text-2xl font-bold">Receipt Scanner</h1>
          <p className="text-[hsl(var(--ink-secondary))] text-sm">Upload a PDF statement to extract transactions automatically.</p>
        </div>
      </div>
      
      {parsedTxs.length === 0 ? (
        <Card className="border-dashed border-2 border-[hsl(var(--hairline))] bg-transparent">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className="w-16 h-16 bg-[hsl(var(--surface-elevated))] rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-[hsl(var(--ink-muted))]" />
            </div>
            <form onSubmit={handleUpload} className="space-y-4 flex flex-col items-center">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">Upload PDF Statement</h3>
                <p className="text-sm text-[hsl(var(--ink-secondary))] max-w-sm">
                  Currently only PDF bank statements are supported. AI will extract merchant names, amounts, and dates.
                </p>
              </div>
              <Label htmlFor="file" className="cursor-pointer">
                <div className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[hsl(var(--ink))] text-[hsl(var(--canvas))] shadow hover:bg-[hsl(var(--ink-muted))] h-10 px-4 py-2 mt-4 gap-2">
                  <Upload className="w-4 h-4" /> Select PDF
                </div>
              </Label>
              <Input id="file" type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
              {file && <p className="text-sm font-medium mt-2 text-[hsl(var(--success))]">{file.name} selected</p>}
              
              <Button type="submit" variant="utility" className="w-full mt-4" disabled={!file || loading}>
                {loading ? 'Processing...' : 'Extract Transactions'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[hsl(var(--surface-elevated))] p-4 rounded-lg gap-4 border border-[hsl(var(--hairline))]">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Label className="whitespace-nowrap">Import Into:</Label>
              <select className="p-2 rounded border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] flex-1 sm:flex-none text-sm" value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <Button variant="primary" onClick={saveSelected} disabled={loading || !selectedAccountId} className="w-full sm:w-auto">
              {loading ? 'Saving...' : `Save ${parsedTxs.filter(t => t.selected).length} Transactions`}
            </Button>
          </div>
          
          <div className="space-y-2">
            {parsedTxs.map((tx, idx) => (
              <div key={idx} className={`flex items-center justify-between p-4 border rounded-lg ${tx.selected ? 'border-[hsl(var(--ink))] bg-[hsl(var(--surface-elevated))]' : 'border-[hsl(var(--hairline))]'}`}>
                <div className="flex items-center gap-4">
                  <input type="checkbox" checked={tx.selected} onChange={() => {
                    const newTxs = [...parsedTxs];
                    newTxs[idx].selected = !newTxs[idx].selected;
                    setParsedTxs(newTxs);
                  }} className="w-5 h-5 accent-[hsl(var(--ink))]" />
                  <div>
                    <p className="font-medium text-sm sm:text-base line-clamp-1">{tx.description}</p>
                    <p className="text-xs sm:text-sm text-[hsl(var(--ink-secondary))]">{tx.originalDateString} • {tx.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${tx.type === 'INCOME' ? 'text-[hsl(var(--success))]' : ''}`}>₹{tx.amount.toLocaleString()}</span>
                  <Button variant="utility" className="p-2" onClick={() => {
                    setParsedTxs(parsedTxs.filter((_, i) => i !== idx));
                  }}><Trash className="w-4 h-4 text-[hsl(var(--destructive))]" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

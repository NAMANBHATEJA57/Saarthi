"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, Trash } from 'lucide-react';

export default function OCRPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedTxs, setParsedTxs] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  
  useEffect(() => {
    fetch('/api/finance/accounts').then(r => r.json()).then(d => {
      if (d.accounts) {
        setAccounts(d.accounts);
        if (d.accounts.length > 0) setSelectedAccountId(d.accounts[0].id);
      }
    });
    fetch('/api/finance/categories').then(r => r.json()).then(d => {
      if (d.categories) setCategories(d.categories);
    });
  }, []);

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
      const categoryId = categories.find(c => c.kind === tx.type)?.id;
      if (!categoryId) continue; // Skip if no category found to prevent error

      await fetch('/api/finance/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: tx.type,
          amountMinor: tx.amountMinor,
          categoryId,
          accountId: selectedAccountId,
          remark: tx.remark,
          transactionDate: tx.date,
        }),
      });
    }
    
    setLoading(false);
    router.push('/finance');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex items-center gap-4 mb-4">
        <Button variant="utility" className="p-2" onClick={() => router.push('/finance')}><ArrowLeft className="w-5 h-5" /></Button>
        <h1 className="text-2xl font-bold">Import Statement</h1>
      </div>
      
      {parsedTxs.length === 0 ? (
        <Card>
          <CardHeader><CardTitle>Upload PDF Statement</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="border-2 border-dashed border-[hsl(var(--hairline))] p-10 rounded-xl text-center flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50">
                <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                <Label htmlFor="file" className="cursor-pointer font-medium text-lg">Select Statement PDF</Label>
                <Input id="file" type="file" accept=".pdf,.csv,.txt" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                <p className="text-sm text-muted-foreground mt-2">{file ? file.name : 'No file chosen'}</p>
              </div>
              <Button type="submit" variant="primary" className="w-full" disabled={!file || loading}>
                {loading ? 'Processing...' : 'Extract Transactions'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-secondary p-4 rounded-lg gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Label>Import Into</Label>
              <select className="p-2 rounded border border-[hsl(var(--hairline))] bg-background flex-1 sm:flex-none" value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <Button variant="primary" onClick={saveSelected} disabled={loading || !selectedAccountId} className="w-full sm:w-auto">
              {loading ? 'Saving...' : `Save ${parsedTxs.filter(t => t.selected).length} Transactions`}
            </Button>
          </div>
          
          <div className="space-y-2">
            {parsedTxs.map((tx, idx) => (
              <div key={idx} className={`flex items-center justify-between p-4 border rounded-lg ${tx.selected ? 'border-primary bg-primary/5' : 'border-[hsl(var(--hairline))]'}`}>
                <div className="flex items-center gap-4">
                  <input type="checkbox" checked={tx.selected} onChange={() => {
                    const newTxs = [...parsedTxs];
                    newTxs[idx].selected = !newTxs[idx].selected;
                    setParsedTxs(newTxs);
                  }} className="w-5 h-5 accent-primary" />
                  <div>
                    <p className="font-medium text-sm sm:text-base line-clamp-1">{tx.remark}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{tx.originalDateString} • {tx.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`font-bold ${tx.type === 'INCOME' ? 'text-green-500' : ''}`}>₹{tx.amountMinor}</span>
                  <Button variant="utility" className="p-2" onClick={() => {
                    setParsedTxs(parsedTxs.filter((_, i) => i !== idx));
                  }}><Trash className="w-4 h-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

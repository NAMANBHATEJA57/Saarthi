"use client";

import { useState } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Upload, ArrowRight, Save, Table as TableIcon } from 'lucide-react';
import { BackButton } from '@/components/shared/BackButton';
import { useRouter } from 'next/navigation';

export function CSVImportFlow({ accounts, categories }: { accounts: any[], categories: any[] }) {
  const router = useRouter();
  
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Parsed raw data
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  
  // Mapping state
  const [mapDate, setMapDate] = useState<string>('');
  const [mapAmount, setMapAmount] = useState<string>('');
  const [mapDescription, setMapDescription] = useState<string>('');
  const [mapType, setMapType] = useState<string>(''); // Optional, we can infer from negative amounts
  
  // Review state
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [loading, setLoading] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    processFile(uploadedFile);
  };

  const processFile = async (uploadedFile: File) => {
    setFile(uploadedFile);
    
    if (uploadedFile.name.toLowerCase().endsWith('.csv')) {
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.meta.fields) {
            setupHeadersAndRows(results.meta.fields, results.data);
          }
        },
        error: (err) => {
          console.error("CSV Parse Error:", err);
          alert("Failed to parse CSV file.");
        }
      });
    } else if (uploadedFile.name.match(/\.xlsx?$/i)) {
      try {
        const buffer = await uploadedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // Get raw array of arrays to find the actual header row
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        let headerRowIndex = 0;
        let maxScore = -1;

        // Scan first 30 rows for common bank statement header keywords
        for (let i = 0; i < Math.min(rawRows.length, 30); i++) {
          const row = rawRows[i];
          if (!row || !Array.isArray(row)) continue;
          
          const rowString = row.join(' ').toLowerCase();
          let score = 0;
          if (rowString.includes('date')) score++;
          if (rowString.includes('amount') || rowString.includes('withdrawal') || rowString.includes('deposit') || rowString.includes('credit') || rowString.includes('debit')) score++;
          if (rowString.includes('description') || rowString.includes('particulars') || rowString.includes('narration') || rowString.includes('remarks')) score++;
          if (rowString.includes('balance')) score++;
          
          if (score > maxScore && score > 0) {
            maxScore = score;
            headerRowIndex = i;
          }
        }

        if (maxScore === -1) {
          headerRowIndex = rawRows.findIndex(row => row && row.filter(cell => cell != null && cell !== '').length > 2) || 0;
          if (headerRowIndex < 0) headerRowIndex = 0;
        }

        const rawHeaders = rawRows[headerRowIndex] || [];
        const excelHeaders = rawHeaders.map((h, i) => {
          const str = String(h || '').trim();
          return str || `Column_${i + 1}`;
        });

        const jsonData = [];
        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
          const rowArray = rawRows[i];
          if (!rowArray || rowArray.length === 0 || rowArray.every(c => c === '' || c == null)) continue;
          
          const rowObj: any = {};
          for (let j = 0; j < excelHeaders.length; j++) {
            rowObj[excelHeaders[j]] = rowArray[j] !== undefined ? rowArray[j] : "";
          }
          jsonData.push(rowObj);
        }
        
        if (jsonData.length > 0) {
          setupHeadersAndRows(excelHeaders, jsonData);
        } else {
          alert("Excel file appears to be empty.");
        }
      } catch (err) {
        console.error("Excel Parse Error:", err);
        alert("Failed to parse Excel file.");
      }
    } else {
      alert("Unsupported file format. Please upload a .csv, .xls, or .xlsx file.");
    }
  };

  const setupHeadersAndRows = (fields: string[], data: any[]) => {
    setHeaders(fields);
    
    // Auto-guess columns
    const guessField = (keywords: string[]) => {
      return fields.find(f => keywords.some(k => f.toLowerCase().includes(k))) || '';
    };
    
    setMapDate(guessField(['date', 'time', 'txn date']));
    setMapAmount(guessField(['amount', 'value', 'price', 'withdrawal', 'deposit']));
    setMapDescription(guessField(['description', 'merchant', 'details', 'payee', 'name', 'particulars', 'narration']));
    setMapType(guessField(['type', 'cr/dr', 'category']));
    
    setRows(data.slice(0, 500)); // Limit to first 500 for safety
    setStep(2);
  };

  const parseAmount = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/,/g, '').replace(/[^0-9.-]+/g, '');
    return parseFloat(clean) || 0;
  };

  const processMapping = () => {
    if (!mapDate || !mapAmount) {
      alert("Please map at least Date and Amount columns.");
      return;
    }

    const mappedTxs = rows.map((row, idx) => {
      let amount = parseAmount(row[mapAmount]);
      let type = 'EXPENSE';
      
      // Determine Type based on 'Type' column or negative amount
      if (mapType && row[mapType]) {
        const typeStr = row[mapType].toLowerCase();
        if (typeStr.includes('cr') || typeStr.includes('income') || typeStr.includes('deposit')) {
          type = 'INCOME';
        }
      } else if (amount < 0) {
        amount = Math.abs(amount);
        type = 'EXPENSE';
      } else {
        type = 'INCOME'; // Positive amounts without explicit type are income
      }

      // Try to parse Date
      let txDate = new Date().toISOString().split('T')[0];
      if (row[mapDate]) {
        const parsedDate = new Date(row[mapDate]);
        if (!isNaN(parsedDate.getTime())) {
          txDate = parsedDate.toISOString().split('T')[0];
        }
      }

      return {
        id: `row-${idx}`,
        transactionDate: txDate,
        amount: amount,
        description: mapDescription ? (row[mapDescription] || 'Unknown') : 'Unknown',
        type: type,
        selected: true
      };
    });

    setTransactions(mappedTxs);
    setStep(3);
  };

  const handleSave = async () => {
    if (!selectedAccountId) {
      alert("Please select an account to import into.");
      return;
    }

    setLoading(true);
    const toSave = transactions.filter(t => t.selected).map(t => ({
      ...t,
      accountId: selectedAccountId
    }));

    try {
      const res = await fetch('/api/finance/transactions/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: toSave })
      });
      
      if (res.ok) {
        router.push('/finance');
      } else {
        const err = await res.json();
        alert(err.error || "Failed to import");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during import.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <BackButton fallbackHref="/finance" />
          <div>
            <h1 className="text-2xl font-bold">Bulk Import</h1>
            <p className="text-[hsl(var(--ink-secondary))] text-sm">Step {step} of 3</p>
          </div>
        </div>
      </div>

      {step === 1 && (
        <Card 
          className={`border-dashed border-2 bg-transparent transition-colors ${isDragging ? 'border-[hsl(var(--ink))] bg-[hsl(var(--ink-muted))]' : 'border-[hsl(var(--hairline))]'}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center p-12 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-[hsl(var(--ink))]' : 'bg-[hsl(var(--surface-elevated))]'}`}>
              <TableIcon className={`w-8 h-8 ${isDragging ? 'text-[hsl(var(--canvas))]' : 'text-[hsl(var(--ink-muted))]'}`} />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">Upload CSV or Excel</h3>
              <p className="text-sm text-[hsl(var(--ink-secondary))] max-w-sm">
                Drag and drop your bank statement here, or click below. Supports .csv, .xls, and .xlsx files.
              </p>
            </div>
            <Label htmlFor="csv-upload" className="cursor-pointer">
              <div className="inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[hsl(var(--ink))] text-[hsl(var(--canvas))] shadow hover:bg-[hsl(var(--ink-muted))] h-10 px-4 py-2 mt-4 gap-2">
                <Upload className="w-4 h-4" /> Select File
              </div>
            </Label>
            <input id="csv-upload" type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={handleFileUpload} />
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-[hsl(var(--ink-secondary))]">
              We found {headers.length} columns in {file?.name}. Please match them to the required fields.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date <span className="text-[hsl(var(--destructive))]">*</span></Label>
                <select className="w-full p-2 rounded border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]" value={mapDate} onChange={e => setMapDate(e.target.value)}>
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Amount <span className="text-[hsl(var(--destructive))]">*</span></Label>
                <select className="w-full p-2 rounded border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]" value={mapAmount} onChange={e => setMapAmount(e.target.value)}>
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <select className="w-full p-2 rounded border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]" value={mapDescription} onChange={e => setMapDescription(e.target.value)}>
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Type (Cr/Dr, optional)</Label>
                <select className="w-full p-2 rounded border border-[hsl(var(--hairline))] bg-[hsl(var(--surface))]" value={mapType} onChange={e => setMapType(e.target.value)}>
                  <option value="">-- Select Column --</option>
                  {headers.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-[hsl(var(--hairline))] flex justify-end gap-3">
              <Button variant="utility" onClick={() => setStep(1)}>Back</Button>
              <Button variant="primary" onClick={processMapping} disabled={!mapDate || !mapAmount}>Continue <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[hsl(var(--surface-elevated))] p-4 rounded-lg gap-4 border border-[hsl(var(--hairline))]">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <Label className="whitespace-nowrap">Import Into:</Label>
              <select className="p-2 rounded border border-[hsl(var(--hairline))] bg-[hsl(var(--canvas))] flex-1 sm:flex-none text-sm" value={selectedAccountId} onChange={e => setSelectedAccountId(e.target.value)}>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="utility" onClick={() => setStep(2)}>Back</Button>
              <Button variant="primary" onClick={handleSave} disabled={loading || !selectedAccountId || transactions.filter(t => t.selected).length === 0}>
                {loading ? 'Saving...' : `Import ${transactions.filter(t => t.selected).length} Transactions`}
              </Button>
            </div>
          </div>
          
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-[hsl(var(--ink-secondary))] uppercase bg-[hsl(var(--surface-elevated))] border-b border-[hsl(var(--hairline))]">
                  <tr>
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[hsl(var(--hairline))]">
                  {transactions.map((tx, idx) => (
                    <tr key={idx} className={tx.selected ? 'bg-transparent' : 'opacity-40'}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={tx.selected} onChange={() => {
                          const newTxs = [...transactions];
                          newTxs[idx].selected = !newTxs[idx].selected;
                          setTransactions(newTxs);
                        }} className="accent-[hsl(var(--ink))]" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{tx.transactionDate}</td>
                      <td className="px-4 py-3 truncate max-w-[200px]" title={tx.description}>{tx.description}</td>
                      <td className="px-4 py-3">{tx.type}</td>
                      <td className={`px-4 py-3 text-right font-medium ${tx.type === 'INCOME' ? 'text-[hsl(var(--success))]' : ''}`}>
                        ₹{tx.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

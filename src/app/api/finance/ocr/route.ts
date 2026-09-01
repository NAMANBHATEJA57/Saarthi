import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { PDFParse } from 'pdf-parse';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    
    let text = '';
    
    if (file.type === 'application/pdf') {
      const buffer = await file.arrayBuffer();
      const parser = new PDFParse({ data: Buffer.from(buffer) });
      const pdfData = await parser.getText();
      text = pdfData.text;
    } else if (file.name.endsWith('.xls') || file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.type.includes('spreadsheet') || file.type.includes('excel') || file.type.includes('csv')) {
      const buffer = await file.arrayBuffer();
      const xlsx = require('xlsx');
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      // Convert to space-separated text to closely match PDF output
      text = xlsx.utils.sheet_to_csv(worksheet, { FS: ' ' });
    } else {
      text = await file.text();
    }
    
    // Deterministic parsing heuristic (MVP)
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const transactions = [];
    
    // More permissive regex that doesn't strictly require date to be the VERY first char,
    // and amount doesn't strictly need to be the VERY last char (sometimes CSVs have trailing empty cols).
    const dateRegex = /(?:\b|^)(\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?|\d{1,2}\s+[a-zA-Z]{3})\b/;
    const amountRegex = /([\d,]+\.\d{2}|\d+)\s*(Cr|Dr)?\s*$/i;
    
    for (const rawLine of lines) {
      // Clean up multiple spaces that might come from empty CSV columns
      const line = rawLine.replace(/\s{2,}/g, ' ').trim();
      
      const dateMatch = line.match(dateRegex);
      const amountMatch = line.match(amountRegex);
      
      if (dateMatch && amountMatch) {
        const dateStr = dateMatch[0];
        const amountStr = amountMatch[1].replace(/,/g, '');
        const type = (amountMatch[2] && amountMatch[2].toLowerCase() === 'cr') ? 'INCOME' : 'EXPENSE';
        
        // Correctly extract the description between the date and the amount
        const startIndex = (dateMatch.index || 0) + dateMatch[0].length;
        const endIndex = line.lastIndexOf(amountMatch[0]);
        const description = line.substring(startIndex, endIndex).trim();
        
        transactions.push({
          id: Math.random().toString(36).substring(7),
          date: new Date().toISOString().split('T')[0], // Use current date as fallback or parse dateStr ideally
          originalDateString: dateStr,
          description,
          amount: parseFloat(amountStr),
          type,
          selected: true
        });
      }
    }
    
    return NextResponse.json({ transactions, parsedLinesCount: transactions.length });
  } catch (err: any) {
    console.error('OCR Error:', err);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}

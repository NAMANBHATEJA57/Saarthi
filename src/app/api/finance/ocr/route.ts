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
    } else {
      text = await file.text();
    }
    
    // Deterministic parsing heuristic (MVP)
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const transactions = [];
    
    const dateRegex = /^(\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?|\d{1,2}\s+[a-zA-Z]{3})/;
    const amountRegex = /([\d,]+\.\d{2}|\d+)\s*(Cr|Dr)?$/i;
    
    for (const line of lines) {
      const dateMatch = line.match(dateRegex);
      const amountMatch = line.match(amountRegex);
      
      if (dateMatch && amountMatch) {
        const dateStr = dateMatch[0];
        const amountStr = amountMatch[1].replace(/,/g, '');
        const type = (amountMatch[2] && amountMatch[2].toLowerCase() === 'cr') ? 'INCOME' : 'EXPENSE';
        
        const remark = line.substring(dateMatch[0].length, line.lastIndexOf(amountMatch[0])).trim();
        
        transactions.push({
          id: Math.random().toString(36).substring(7),
          date: new Date().toISOString().split('T')[0], // Use current date as fallback or parse dateStr ideally
          originalDateString: dateStr,
          remark,
          amountMinor: Math.round(parseFloat(amountStr)),
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

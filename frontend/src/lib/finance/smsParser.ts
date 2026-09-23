export type SmsTransactionType = 'EXPENSE' | 'INCOME' | 'TRANSFER' | 'CREDIT_CARD_PAYMENT' | 'UNSUPPORTED';
export type ConfidenceState = 'detected' | 'missing' | 'uncertain';

export interface ParsedSmsTransaction {
  type: SmsTransactionType;
  amount: number | null;
  date: string | null; // YYYY-MM-DD
  bank: string | null;
  accountLast4: string | null;
  merchant: string | null; // Also acts as recipient/person
  paymentMethod: string | null;
  reference: string | null;
  source: 'SMS';
  isCreditCard: boolean;
  
  confidence: {
    type: ConfidenceState;
    amount: ConfidenceState;
    date: ConfidenceState;
    account: ConfidenceState;
    merchant: ConfidenceState;
  };
  
  originalMessage: string;
}

export function splitSmsMessages(text: string): string[] {
  // First, if there are double newlines, use them as the primary delimiter
  if (/\n\s*\n/.test(text)) {
    return text.split(/\n\s*\n/).map(m => m.trim()).filter(m => m.length > 0).slice(0, 10);
  }
  
  // Otherwise, split by single newline and merge lines that belong together
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const messages: string[] = [];
  
  for (const line of lines) {
    const hasKeyword = /(?:Rs\.?|INR|₹|debited|credited|withdrawn)/i.test(line);
    if (messages.length === 0) {
      messages.push(line);
    } else {
      if (hasKeyword) {
        messages.push(line);
      } else {
        messages[messages.length - 1] += ' ' + line;
      }
    }
  }
  
  return messages.slice(0, 10);
}

export function parseSingleSms(message: string): ParsedSmsTransaction {
  const result: ParsedSmsTransaction = {
    type: 'UNSUPPORTED', // Default
    amount: null,
    date: null,
    bank: null,
    accountLast4: null,
    merchant: null,
    paymentMethod: null,
    reference: null,
    source: 'SMS',
    isCreditCard: false,
    
    confidence: {
      type: 'missing',
      amount: 'missing',
      date: 'missing',
      account: 'missing',
      merchant: 'missing',
    },
    
    originalMessage: message
  };

  const cleanMessage = message.replace(/\n/g, ' ').replace(/\s+/g, ' ');

  // 1. Amount Extraction
  // Matches Rs 900.00, Rs.1,250.00, INR 10,000, ₹1,500
  // Do NOT match "credit limit Rs 97,501" - handled by lookbehind if possible or careful matching
  const amountRegex = /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d+)?)/gi;
  let amountMatch;
  const amounts = [];
  while ((amountMatch = amountRegex.exec(cleanMessage)) !== null) {
    amounts.push({
      value: Math.floor(parseFloat(amountMatch[1].replace(/,/g, ''))), // Whole INR integer
      index: amountMatch.index,
      raw: amountMatch[0]
    });
  }

  if (amounts.length > 0) {
    result.amount = amounts[0].value;
    result.confidence.amount = 'detected';
  }

  // 2. Transaction Type
  const msgLower = cleanMessage.toLowerCase();
  const isDebit = /debited|debit|withdrawn|used for/i.test(cleanMessage);
  
  const checkMsg = cleanMessage.replace(/credit card/ig, 'CC').replace(/credit limit/ig, 'limit');
  const isCredit = /credited|credit|received/i.test(checkMsg);
  
  if (isDebit) {
    result.type = 'EXPENSE';
    result.confidence.type = 'detected';
  } else if (isCredit) {
    result.type = 'INCOME';
    result.confidence.type = 'detected';
  } else {
    result.confidence.type = 'uncertain';
  }
  
  // 3. Date Extraction
  const dateRegex = /(\d{2})[-/]([a-zA-Z]{3}|\d{2})[-/](\d{2,4})/i;
  const dateMatch = cleanMessage.match(dateRegex);
  if (dateMatch) {
    const day = dateMatch[1];
    let monthStr = dateMatch[2];
    const yearStr = dateMatch[3];
    
    const year = yearStr.length === 2 ? `20${yearStr}` : yearStr;
    let month = monthStr;
    
    if (isNaN(Number(monthStr))) {
      const months: Record<string, string> = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
      month = months[monthStr.toLowerCase()] || '01';
    }
    
    result.date = `${year}-${month}-${day}`;
    result.confidence.date = 'detected';
  }

  // 4. Account/Card Last 4 & Bank
  const accountRegex = /(?:Acct|A\/c|Card)\s*[X\*]*(\d{3,4})/i;
  const accMatch = cleanMessage.match(accountRegex);
  if (accMatch) {
    result.accountLast4 = accMatch[1];
    result.confidence.account = 'detected';
  }
  
  if (/Credit Card/i.test(cleanMessage)) {
    result.isCreditCard = true;
    result.paymentMethod = 'CREDIT_CARD';
  }

  const bankRegex = /([A-Za-z]+ Bank)/i;
  const bankMatch = cleanMessage.match(bankRegex);
  if (bankMatch) {
    result.bank = bankMatch[1];
  }

  // 5. Payment Method
  if (/UPI/i.test(cleanMessage)) {
    result.paymentMethod = 'UPI';
  } else if (/ATM/i.test(cleanMessage)) {
    result.paymentMethod = 'ATM';
    if (result.type === 'EXPENSE') {
      result.type = 'UNSUPPORTED';
    }
  } else if (!result.paymentMethod) {
    if (/POS|swipe/i.test(cleanMessage)) {
      result.paymentMethod = 'POS';
    }
  }

  // 6. Reference Number
  const refRegex = /(?:UPI Ref No|UPI Ref|UPI Reference|UPI:|Ref:|Ref No:?|Ref)\s*[:]?\s*(\d{8,14})/i;
  const refMatch = cleanMessage.match(refRegex);
  if (refMatch) {
    result.reference = refMatch[1];
  }

  // 7. Merchant/Person
  let merchant = null;
  const atMatch = cleanMessage.match(/at\s+([A-Z0-9\s]+?)(?:\s+on|\s+via|\.|$)/);
  const toMatch = cleanMessage.match(/to\s+([A-Z0-9\s]+?)(?:\.|\s+UPI|\s+on|$)/);
  const creditedMatch = cleanMessage.match(/;\s*([^;]+)\s+credited/i);
  
  if (atMatch && atMatch[1] && !atMatch[1].match(/atm/i)) {
    merchant = atMatch[1].trim();
  } else if (creditedMatch && creditedMatch[1]) {
    merchant = creditedMatch[1].trim();
  } else if (toMatch && toMatch[1] && !toMatch[1].match(/your a\/c/i)) {
    merchant = toMatch[1].trim();
  }

  if (merchant) {
    result.merchant = merchant;
    result.confidence.merchant = 'detected';
  }

  return result;
}
